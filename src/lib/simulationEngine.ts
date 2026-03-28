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
  | "demand_surge"
  | "recycling_improvement"
  | "supplier_diversification"
  | "blockchain_traceability"
  | "recovery_hub"
  | "robotic_disassembly";

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
  // For recycling_improvement
  recycleRateBoostPct?: number;
  // For supplier_diversification
  hhiReductionPct?: number;
  // For blockchain_traceability
  transparencyBoostPct?: number;
  // For recovery_hub
  recoveryCapacityIncreasePct?: number;
  // For robotic_disassembly
  disassemblyEfficiencyPct?: number;
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
    name: "Palladium Price Spike +25%",
    description: "25% increase in Palladium price due to geopolitical tensions in Russia",
    params: { type: "price_change", materialName: "Palladium", priceChangePct: 25 },
  },
  {
    id: "drc-crisis",
    name: "DRC Crisis — Cobalt Supply Block",
    description: "Political instability in Congo (DRC) blocks 40% of global Cobalt supply",
    params: { type: "geopolitical_crisis", country: "Congo (DRC)", supplyReductionPct: 40, durationMonths: 6 },
  },
  {
    id: "china-germanium-ban",
    name: "China Export Ban — Germanium",
    description: "China blocks export of Germanium, Indium and Tungsten (−30% global supply)",
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
    description: "New minimum recycled content requirements: Cobalt 16%, Nickel 6%, Manganese 6%",
    params: {
      type: "regulatory_change",
      minRecycledContentPct: 16,
      affectedMaterials: ["Cobalt", "Nickel", "Manganese"],
    },
  },
  {
    id: "ev-demand-surge",
    name: "EV Demand Surge +40%",
    description: "Sudden 40% increase in electric vehicle demand, pressure on all battery materials",
    params: { type: "demand_surge", demandIncreasePct: 40 },
  },
  {
    id: "copper-price-drop",
    name: "Copper Price Drop -15%",
    description: "Global economic slowdown causes a 15% drop in copper price",
    params: { type: "price_change", materialName: "Copper", priceChangePct: -15 },
  },
  {
    id: "recycling-boost",
    name: "Recycling Rate +30%",
    description: "Investment in hydrometallurgy and pyrometallurgy infrastructure increases recycling rate by 30% across all materials",
    params: { type: "recycling_improvement", recycleRateBoostPct: 30 },
  },
  {
    id: "supplier-diversification",
    name: "Supplier Diversification — HHI -25%",
    description: "Strategic supplier diversification reduces HHI concentration index by 25% via new partnerships",
    params: { type: "supplier_diversification", hhiReductionPct: 25 },
  },
  {
    id: "blockchain-traceability",
    name: "Blockchain Traceability Integration",
    description: "Deploy blockchain-based supply chain traceability improving ESG transparency and supplier accountability by 20%",
    params: { type: "blockchain_traceability", transparencyBoostPct: 20 },
  },
  {
    id: "recovery-hub",
    name: "Regional Recovery Hub Co-Investment",
    description: "Co-investment in 3 regional recovery hubs increases recovery capacity by 40%, reducing primary extraction dependency",
    params: { type: "recovery_hub", recoveryCapacityIncreasePct: 40 },
  },
  {
    id: "robotic-disassembly",
    name: "Robotic Disassembly Systems",
    description: "Introduction of automated robotic disassembly increases selective recovery efficiency by 35%",
    params: { type: "robotic_disassembly", disassemblyEfficiencyPct: 35 },
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
      scenarioName = `Price change ${params.materialName} ${params.priceChangePct! > 0 ? "+" : ""}${params.priceChangePct}%`;
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
          recommendations.push(`Activate hedging protocol for ${params.materialName}`);
          recommendations.push(`Evaluate alternative suppliers or material substitution`);
        }
        if (params.priceChangePct! > 0) {
          recommendations.push(`Accelerate recovery and recycling programs for ${params.materialName}`);
        }
      }
      break;
    }
    case "geopolitical_crisis":
    case "supply_disruption": {
      scenarioName = `Geopolitical crisis: ${params.country} (supply -${params.supplyReductionPct}%)`;
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

      recommendations.push(`Activate strategic stock for materials sourced from ${params.country}`);
      recommendations.push(`Diversify supplier base outside ${params.country}`);
      if (params.durationMonths && params.durationMonths > 3) {
        recommendations.push(`Evaluate medium-term substitution of the most critical materials`);
      }
      recommendations.push(`Monitor geopolitical bulletins for situation updates`);
      break;
    }
    case "regulatory_change": {
      scenarioName = `Regulatory change: minimum recycled content ${params.minRecycledContentPct}%`;
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

      recommendations.push(`Invest in recycling infrastructure to reach threshold ${params.minRecycledContentPct}%`);
      recommendations.push(`Sign agreements with certified recycling facilities`);
      recommendations.push(`Start take-back programs for end-of-life components`);
      break;
    }
    case "demand_surge": {
      scenarioName = `Increase in demand +${params.demandIncreasePct}%`;
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

      recommendations.push(`Secure long-term contracts for key materials`);
      recommendations.push(`Accelerate recovery processes to reduce dependence on primary sourcing`);
      break;
    }
    case "recycling_improvement": {
      const boostPct = params.recycleRateBoostPct ?? 30;
      scenarioName = `Recycling rate improvement +${boostPct}%`;
      for (const mat of materials) {
        const currentRate = mat.recycle_rate;
        const newRate = Math.min(100, currentRate * (1 + boostPct / 100));
        const rateImprovement = newRate - currentRate;
        // Higher recycling rate reduces supply risk and price by reducing primary extraction dependency
        const priceReduction = -(rateImprovement * 0.8); // Negative = cost savings
        const impact = calculatePriceImpact(
          mat,
          priceReduction,
          ecuMaterialCounts.get(mat.id) ?? 0,
          ecuMaterialGrams.get(mat.id) ?? 0
        );
        impact.newRisk = Math.max(0, impact.originalRisk - rateImprovement * 0.4);
        impact.riskChangePct = impact.originalRisk > 0 ? Math.round(((impact.newRisk - impact.originalRisk) / impact.originalRisk) * 100) : 0;
        materialImpacts.push(impact);
        totalCostImpact += impact.costImpactEuro;
      }
      recommendations.push(`Invest in hydrometallurgy and pyrometallurgy facilities`);
      recommendations.push(`Partner with certified recycling operators across EU`);
      recommendations.push(`Implement take-back logistics for end-of-life ECUs`);
      recommendations.push(`Target materials with lowest current recycling rates first`);
      break;
    }
    case "supplier_diversification": {
      const hhiReduction = params.hhiReductionPct ?? 25;
      scenarioName = `Supplier diversification — HHI -${hhiReduction}%`;
      const highConcentrationMats = materials.filter((m) => m.hhi > 2000);
      for (const mat of highConcentrationMats) {
        const hhiDrop = mat.hhi * (hhiReduction / 100);
        const riskReduction = (hhiDrop / mat.hhi) * 15;
        const priceStabilization = -(hhiDrop / mat.hhi) * 5;
        const impact = calculatePriceImpact(
          mat,
          priceStabilization,
          ecuMaterialCounts.get(mat.id) ?? 0,
          ecuMaterialGrams.get(mat.id) ?? 0
        );
        impact.newRisk = Math.max(0, impact.originalRisk - riskReduction);
        impact.riskChangePct = impact.originalRisk > 0 ? Math.round(((impact.newRisk - impact.originalRisk) / impact.originalRisk) * 100) : 0;
        materialImpacts.push(impact);
        totalCostImpact += impact.costImpactEuro;
      }
      recommendations.push(`Onboard new suppliers from ASEAN and South America regions`);
      recommendations.push(`Establish strategic reserves for systemic-cluster materials`);
      recommendations.push(`Negotiate multi-source framework agreements`);
      break;
    }
    case "blockchain_traceability": {
      const transparencyBoost = params.transparencyBoostPct ?? 20;
      scenarioName = `Blockchain traceability — ESG transparency +${transparencyBoost}%`;
      for (const mat of materials) {
        const esgImprovement = transparencyBoost * 0.5;
        const riskReduction = esgImprovement * 0.3;
        const impact = calculatePriceImpact(
          mat,
          -1, // Small cost reduction via fraud/waste elimination
          ecuMaterialCounts.get(mat.id) ?? 0,
          ecuMaterialGrams.get(mat.id) ?? 0
        );
        impact.newRisk = Math.max(0, impact.originalRisk - riskReduction);
        impact.riskChangePct = impact.originalRisk > 0 ? Math.round(((impact.newRisk - impact.originalRisk) / impact.originalRisk) * 100) : 0;
        materialImpacts.push(impact);
        totalCostImpact += impact.costImpactEuro;
      }
      recommendations.push(`Deploy distributed ledger for supply chain provenance tracking`);
      recommendations.push(`Integrate blockchain with existing DPP infrastructure`);
      recommendations.push(`Require blockchain verification for conflict mineral suppliers`);
      recommendations.push(`ESG scoring improvement enables premium market positioning`);
      break;
    }
    case "recovery_hub": {
      const capacityIncrease = params.recoveryCapacityIncreasePct ?? 40;
      scenarioName = `Regional recovery hub co-investment — capacity +${capacityIncrease}%`;
      const recoverableMats = materials.filter((m) => m.recycle_rate > 0);
      for (const mat of recoverableMats) {
        const recoveryBoost = capacityIncrease * (mat.recycle_rate / 100);
        const priceReduction = -(recoveryBoost * 0.6);
        const impact = calculatePriceImpact(
          mat,
          priceReduction,
          ecuMaterialCounts.get(mat.id) ?? 0,
          ecuMaterialGrams.get(mat.id) ?? 0
        );
        impact.newRisk = Math.max(0, impact.originalRisk - recoveryBoost * 0.5);
        impact.riskChangePct = impact.originalRisk > 0 ? Math.round(((impact.newRisk - impact.originalRisk) / impact.originalRisk) * 100) : 0;
        materialImpacts.push(impact);
        totalCostImpact += impact.costImpactEuro;
      }
      recommendations.push(`Establish recovery hubs in Germany, Italy, and France for EU coverage`);
      recommendations.push(`Co-invest with OEM partners to share CAPEX burden`);
      recommendations.push(`Focus recovery hub specialization by material cluster`);
      recommendations.push(`Reduction in primary extraction dependency estimated at ${Math.round(capacityIncrease * 0.3)}%`);
      break;
    }
    case "robotic_disassembly": {
      const efficiencyPct = params.disassemblyEfficiencyPct ?? 35;
      scenarioName = `Robotic disassembly systems — efficiency +${efficiencyPct}%`;
      for (const mat of materials) {
        const recoveryImpact = efficiencyPct * (mat.recycle_rate / 100) * 0.8;
        const priceReduction = -(recoveryImpact * 0.5);
        const impact = calculatePriceImpact(
          mat,
          priceReduction,
          ecuMaterialCounts.get(mat.id) ?? 0,
          ecuMaterialGrams.get(mat.id) ?? 0
        );
        impact.newRisk = Math.max(0, impact.originalRisk - recoveryImpact * 0.3);
        impact.riskChangePct = impact.originalRisk > 0 ? Math.round(((impact.newRisk - impact.originalRisk) / impact.originalRisk) * 100) : 0;
        materialImpacts.push(impact);
        totalCostImpact += impact.costImpactEuro;
      }
      recommendations.push(`Deploy robotic disassembly lines for ECU selective recovery`);
      recommendations.push(`Target high-value PGM and REE extraction first`);
      recommendations.push(`Integrate with AI-powered sorting for maximum yield`);
      recommendations.push(`Expected OPEX reduction: ${Math.round(efficiencyPct * 0.4)}% on recovery operations`);
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
