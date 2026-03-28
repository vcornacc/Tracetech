/**
 * What-If Simulation Engine — Phase 4
 *
 * Allows users to simulate scenarios such as:
 * - Price spikes on specific materials (e.g., Palladium +25%)
 * - Geopolitical disruptions blocking a country's supply
 * - Regulatory changes affecting recycling requirements
 * - Supply chain interruptions
 *
 * The engine recalculates impacts on costs and risk in real-time.
 */

import type { Material } from "@/hooks/useSupabaseData";
import {
  computeCompositeRisk,
  type ClusterType,
  CLUSTER_INFO,
} from "./riskEngine";

// ============================================================
// SCENARIO TYPES
// ============================================================

export type ScenarioType =
  | "price_change"
  | "supply_disruption"
  | "geopolitical_crisis"
  | "regulatory_change"
  | "demand_surge";

export interface ScenarioParameter {
  type: ScenarioType;
  // For price_change
  materialName?: string;
  priceChangePct?: number;
  // For supply_disruption / geopolitical_crisis
  country?: string;
  supplyReductionPct?: number;
  durationMonths?: number;
  // For regulatory_change
  minRecycledContentPct?: number;
  affectedMaterials?: string[];
  // For demand_surge
  demandIncreasePct?: number;
}

export interface SimulationResult {
  scenarioName: string;
  type: ScenarioType;
  impactSummary: {
    totalCostImpactEuro: number;
    costChangePct: number;
    riskScoreChange: number;
    affectedEcusCount: number;
    affectedMaterialsCount: number;
    supplyChainInterruptionRisk: number; // 0-100
  };
  materialImpacts: MaterialImpact[];
  recommendations: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface MaterialImpact {
  name: string;
  cluster: ClusterType;
  originalPrice: number;
  newPrice: number;
  priceChangePct: number;
  originalRisk: number;
  newRisk: number;
  riskChangePct: number;
  costImpactEuro: number;
  affectedEcus: number;
}

// ============================================================
// PRE-BUILT SCENARIO TEMPLATES
// ============================================================

export const SCENARIO_TEMPLATES: { id: string; name: string; description: string; params: ScenarioParameter }[] = [
  {
    id: "palladium-spike",
    name: "Picco Prezzo Palladio +25%",
    description: "Aumento del 25% del prezzo del Palladio dovuto a tensioni in Russia",
    params: { type: "price_change", materialName: "Palladium", priceChangePct: 25 },
  },
  {
    id: "drc-crisis",
    name: "Crisi DRC — Blocco Cobalto",
    description: "Instabilità politica in Congo (DRC) blocca il 40% della supply mondiale di Cobalto",
    params: { type: "geopolitical_crisis", country: "Congo (DRC)", supplyReductionPct: 40, durationMonths: 6 },
  },
  {
    id: "china-germanium-ban",
    name: "Blocco Export Cina — Germanio",
    description: "La Cina blocca l'export di Germanio, Indio e Tungsteno (- 30% supply globale)",
    params: {
      type: "geopolitical_crisis",
      country: "China",
      supplyReductionPct: 30,
      durationMonths: 12,
      affectedMaterials: ["Germanium", "Indium", "Tungsten"],
    },
  },
  {
    id: "eu-battery-reg",
    name: "EU Battery Regulation 2027",
    description: "Nuovi requisiti di contenuto riciclato minimo: Cobalto 16%, Nickel 6%, Manganese 6%",
    params: {
      type: "regulatory_change",
      minRecycledContentPct: 16,
      affectedMaterials: ["Cobalt", "Nickel", "Manganese"],
    },
  },
  {
    id: "ev-demand-surge",
    name: "Boom Domanda EV +40%",
    description: "Aumento improvviso della domanda di veicoli elettrici del 40%, pressione su tutti i materiali per batterie",
    params: { type: "demand_surge", demandIncreasePct: 40 },
  },
  {
    id: "copper-price-drop",
    name: "Crollo Prezzo Rame -15%",
    description: "Rallentamento economico globale causa un calo del 15% nel prezzo del rame",
    params: { type: "price_change", materialName: "Copper", priceChangePct: -15 },
  },
];

// ============================================================
// SIMULATION ENGINE
// ============================================================

/**
 * Run a what-if simulation against the current materials database
 */
export function runSimulation(
  params: ScenarioParameter,
  materials: Material[],
  ecuMaterialCounts: Map<string, number>, // materialId -> number of ECUs using it
  ecuMaterialGrams: Map<string, number>,  // materialId -> total grams across fleet
): SimulationResult {
  const materialMap = new Map(materials.map((m) => [m.name, m]));
  const materialIdMap = new Map(materials.map((m) => [m.id, m]));

  let scenarioName = "";
  const materialImpacts: MaterialImpact[] = [];
  let totalCostImpact = 0;
  let totalAffectedEcus = new Set<string>();
  const recommendations: string[] = [];

  switch (params.type) {
    case "price_change": {
      scenarioName = `Variazione prezzo ${params.materialName} ${params.priceChangePct! > 0 ? "+" : ""}${params.priceChangePct}%`;
      const mat = materialMap.get(params.materialName!);
      if (mat) {
        const impact = calculatePriceImpact(
          mat,
          params.priceChangePct!,
          ecuMaterialCounts.get(mat.id) ?? 0,
          ecuMaterialGrams.get(mat.id) ?? 0
        );
        materialImpacts.push(impact);
        totalCostImpact += impact.costImpactEuro;

        if (params.priceChangePct! > 20) {
          recommendations.push(`Attivare protocollo hedging per ${params.materialName}`);
          recommendations.push(`Valutare fornitori alternativi o sostituzione materiale`);
        }
        if (params.priceChangePct! > 0) {
          recommendations.push(`Accelerare programmi di recovery e riciclo per ${params.materialName}`);
        }
      }
      break;
    }
    case "geopolitical_crisis":
    case "supply_disruption": {
      scenarioName = `Crisi geopolitica: ${params.country} (supply -${params.supplyReductionPct}%)`;
      const affectedMats = params.affectedMaterials
        ? materials.filter((m) => params.affectedMaterials!.includes(m.name))
        : materials.filter((m) =>
            m.top_producers.some((p) => p.toLowerCase().includes(params.country!.toLowerCase()))
          );

      for (const mat of affectedMats) {
        // Price increase proportional to supply reduction and concentration
        const priceIncrease = params.supplyReductionPct! * (mat.hhi / 5000) * 1.5;
        const impact = calculatePriceImpact(
          mat,
          priceIncrease,
          ecuMaterialCounts.get(mat.id) ?? 0,
          ecuMaterialGrams.get(mat.id) ?? 0
        );
        // Also increase supply and geopolitical risk
        impact.newRisk = Math.min(100, impact.originalRisk + params.supplyReductionPct! * 0.5);
        impact.riskChangePct = Math.round(((impact.newRisk - impact.originalRisk) / impact.originalRisk) * 100);
        materialImpacts.push(impact);
        totalCostImpact += impact.costImpactEuro;
      }

      recommendations.push(`Attivare scorte strategiche per materiali provenienti da ${params.country}`);
      recommendations.push(`Diversificare la base fornitori al di fuori di ${params.country}`);
      if (params.durationMonths && params.durationMonths > 3) {
        recommendations.push(`Valutare sostituzione a medio termine dei materiali più critici`);
      }
      recommendations.push(`Monitorare bollettini geopolitici per aggiornamenti sulla situazione`);
      break;
    }
    case "regulatory_change": {
      scenarioName = `Cambio normativo: contenuto riciclato minimo ${params.minRecycledContentPct}%`;
      const affectedMats = params.affectedMaterials
        ? materials.filter((m) => params.affectedMaterials!.includes(m.name))
        : materials.filter((m) => m.recycle_rate < (params.minRecycledContentPct ?? 16));

      for (const mat of affectedMats) {
        const complianceGap = Math.max(0, (params.minRecycledContentPct ?? 16) - mat.recycle_rate);
        const costPenalty = complianceGap * 2; // 2% cost increase per % gap
        const impact = calculatePriceImpact(
          mat,
          costPenalty,
          ecuMaterialCounts.get(mat.id) ?? 0,
          ecuMaterialGrams.get(mat.id) ?? 0
        );
        impact.newRisk = Math.min(100, impact.originalRisk + complianceGap * 0.3);
        impact.riskChangePct = Math.round(((impact.newRisk - impact.originalRisk) / impact.originalRisk) * 100);
        materialImpacts.push(impact);
        totalCostImpact += impact.costImpactEuro;
      }

      recommendations.push(`Investire in infrastruttura di riciclo per raggiungere soglia ${params.minRecycledContentPct}%`);
      recommendations.push(`Stipulare contratti con impianti di riciclo certificati`);
      recommendations.push(`Avviare programmi di take-back per componenti a fine vita`);
      break;
    }
    case "demand_surge": {
      scenarioName = `Aumento domanda +${params.demandIncreasePct}%`;
      // Battery-critical materials affected disproportionately
      const batteryMats = ["Cobalt", "Nickel", "Manganese", "Indium", "Germanium"];
      for (const mat of materials) {
        const isBattery = batteryMats.includes(mat.name);
        const priceImpactPct = isBattery
          ? params.demandIncreasePct! * 0.6
          : params.demandIncreasePct! * 0.2;
        if (priceImpactPct > 2) {
          const impact = calculatePriceImpact(
            mat,
            priceImpactPct,
            ecuMaterialCounts.get(mat.id) ?? 0,
            ecuMaterialGrams.get(mat.id) ?? 0
          );
          materialImpacts.push(impact);
          totalCostImpact += impact.costImpactEuro;
        }
      }

      recommendations.push(`Assicurare contratti a lungo termine per materiali chiave`);
      recommendations.push(`Accelerare processi di recovery per ridurre dipendenza da approvvigionamento primario`);
      break;
    }
  }

  // Calculate aggregate metrics
  const affectedMaterialsCount = materialImpacts.length;
  const avgOriginalRisk = materialImpacts.length > 0
    ? materialImpacts.reduce((s, m) => s + m.originalRisk, 0) / materialImpacts.length
    : 0;
  const avgNewRisk = materialImpacts.length > 0
    ? materialImpacts.reduce((s, m) => s + m.newRisk, 0) / materialImpacts.length
    : 0;

  // Supply chain interruption risk (0-100)
  const maxNewRisk = materialImpacts.length > 0
    ? Math.max(...materialImpacts.map((m) => m.newRisk))
    : 0;
  const supplyChainInterruptionRisk = Math.min(100, maxNewRisk * 1.1);

  // Severity classification
  let severity: SimulationResult["severity"] = "low";
  if (totalCostImpact > 100000 || maxNewRisk > 85) severity = "critical";
  else if (totalCostImpact > 50000 || maxNewRisk > 70) severity = "high";
  else if (totalCostImpact > 10000 || maxNewRisk > 55) severity = "medium";

  // Calculate base cost for percentage
  const baseTotalCost = materialImpacts.reduce((s, m) => {
    const basePrice = m.originalPrice;
    const grams = ecuMaterialGrams.get(
      materials.find((mat) => mat.name === m.name)?.id ?? ""
    ) ?? 0;
    return s + (grams * basePrice) / 1000;
  }, 0);

  return {
    scenarioName,
    type: params.type,
    impactSummary: {
      totalCostImpactEuro: Math.round(totalCostImpact * 100) / 100,
      costChangePct: baseTotalCost > 0 ? Math.round((totalCostImpact / baseTotalCost) * 10000) / 100 : 0,
      riskScoreChange: Math.round((avgNewRisk - avgOriginalRisk) * 10) / 10,
      affectedEcusCount: Math.max(...materialImpacts.map((m) => m.affectedEcus), 0),
      affectedMaterialsCount,
      supplyChainInterruptionRisk: Math.round(supplyChainInterruptionRisk),
    },
    materialImpacts: materialImpacts.sort((a, b) => Math.abs(b.costImpactEuro) - Math.abs(a.costImpactEuro)),
    recommendations,
    severity,
  };
}

// ============================================================
// HELPERS
// ============================================================

function calculatePriceImpact(
  mat: Material,
  priceChangePct: number,
  ecuCount: number,
  totalGrams: number
): MaterialImpact {
  const originalPrice = mat.price_per_kg ?? 0;
  const newPrice = originalPrice * (1 + priceChangePct / 100);
  const originalRisk = computeCompositeRisk(mat);
  const riskIncrease = priceChangePct > 0 ? priceChangePct * 0.3 : priceChangePct * 0.1;
  const newRisk = Math.min(100, Math.max(0, originalRisk + riskIncrease));
  const costImpactEuro = (totalGrams * (newPrice - originalPrice)) / 1000;

  return {
    name: mat.name,
    cluster: mat.cluster as ClusterType,
    originalPrice,
    newPrice: Math.round(newPrice * 100) / 100,
    priceChangePct: Math.round(priceChangePct * 10) / 10,
    originalRisk,
    newRisk: Math.round(newRisk * 10) / 10,
    riskChangePct: originalRisk > 0 ? Math.round(((newRisk - originalRisk) / originalRisk) * 100) : 0,
    costImpactEuro: Math.round(costImpactEuro * 100) / 100,
    affectedEcus: ecuCount,
  };
}

/**
 * Build ECU material aggregation maps from raw ecu_materials rows
 */
export function buildEcuMaterialMaps(
  ecuMaterials: { material_id: string; ecu_id: string; weight_grams: number }[]
): {
  ecuMaterialCounts: Map<string, number>;
  ecuMaterialGrams: Map<string, number>;
} {
  const ecuMaterialCounts = new Map<string, number>();
  const ecuMaterialGrams = new Map<string, number>();
  const ecuPerMaterial = new Map<string, Set<string>>();

  for (const em of ecuMaterials) {
    const prev = ecuMaterialGrams.get(em.material_id) ?? 0;
    ecuMaterialGrams.set(em.material_id, prev + em.weight_grams);

    if (!ecuPerMaterial.has(em.material_id)) {
      ecuPerMaterial.set(em.material_id, new Set());
    }
    ecuPerMaterial.get(em.material_id)!.add(em.ecu_id);
  }

  for (const [matId, ecus] of ecuPerMaterial) {
    ecuMaterialCounts.set(matId, ecus.size);
  }

  return { ecuMaterialCounts, ecuMaterialGrams };
}
