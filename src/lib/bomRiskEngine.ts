/**
 * BOM Risk Engine — Material Risk Factor aggregation and scenario analysis
 *
 * Transforms parsed BOM + materials catalog → Resilience Risk Report
 * Includes scenario modeling (optimistic/base/pessimistic)
 */

import type { NormalizedMaterial } from "@/lib/dataSchema";
import type { ParsedBOM, BOMRow } from "@/lib/bomParser";
import {
  computeMaterialRiskFactor,
  applyScenario,
  BOM_SCENARIOS,
  getResiliencyRecommendations,
  type BOMScenario,
} from "@/lib/materialRiskFactor";

// ============================================================
// TYPES
// ============================================================

export interface BOMRiskMaterial {
  material_id: string;
  material_name: string;
  matched_score: number;       // 0-100 matching confidence
  quantity_grams: number;
  share_of_bom_percent: number;
  mrfScore: number;            // Material Risk Factor 0-100
  resilienceDistance: number;  // Distance to threshold 35
  riskLevel: "critical" | "high" | "medium" | "low";
  drivers: string[];          // Top 3 risk factors for this material
  recommendations: string[];
}

export interface BOMRiskScenarioResult {
  scenario: BOMScenario;
  totalRiskScore: number;     // 0-100 weighted by grams
  avgRiskScore: number;       // Simple average
  resilienceDistance: number;
  criticalMaterialCount: number;
  materialsFailing: BOMRiskMaterial[]; // Materials where MRF > 35
}

export interface ResilienceRiskReport {
  // Metadata
  timestamp: string;
  total_materials: number;
  matched_materials: number;
  unmatched_materials: number;
  total_bom_grams: number;
  total_bom_value_eur: number;

  // Base case
  totalRiskScore: number;      // Base case MRF aggregation
  avgRiskScore: number;
  resilienceDistance: number;  // How far above resilience threshold
  resilientBOM: boolean;       // totalRiskScore < 35

  // Risk distribution
  criticalMaterialsCount: number;
  highRiskMaterialsCount: number;
  resilientMaterialsCount: number;

  // Detailed breakdown
  materials: BOMRiskMaterial[];
  topRiskDrivers: Array<{     // Top 5 risk drivers across all materials
    driver: string;
    affectedMaterials: BOMRiskMaterial[];
    mitigation: string;
  }>;

  // Scenarios
  scenarios: BOMRiskScenarioResult[];

  // Warnings & insights
  warnings: string[];
  insights: string[];
}

// ============================================================
// CORE ANALYSIS
// ============================================================

export function analyzeBOM(
  bom: ParsedBOM,
  catalogMaterials: NormalizedMaterial[]
): ResilienceRiskReport {
  // Map BOM rows to catalog materials
  const bomMaterials: BOMRiskMaterial[] = [];
  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const bomRow of bom.rows) {
    const catalogMat = catalogMaterials.find(
      (m) => m.id === bomRow.matched_material_id
    );

    if (!catalogMat) {
      unmatchedCount++;
      continue;
    }

    matchedCount++;

    // Get MRF for this material (already computed in NormalizedMaterial)
    const mrfScore = catalogMat.materialRiskFactor;
    const resilienceDistance = catalogMat.resilienceDistance;

    // Get recommendations
    const mrf_result = computeMaterialRiskFactor(catalogMat as any); // Convert back for MRF processing
    const recommendations = getResiliencyRecommendations(mrf_result);

    const share = (bomRow.quantity_grams / bom.total_grams) * 100;

    bomMaterials.push({
      material_id: catalogMat.id,
      material_name: catalogMat.name,
      matched_score: bomRow.match_score ?? 100,
      quantity_grams: bomRow.quantity_grams,
      share_of_bom_percent: Math.round(share * 10) / 10,
      mrfScore,
      resilienceDistance,
      riskLevel: 
        mrfScore >= 75 ? "critical" :
        mrfScore >= 55 ? "high" :
        mrfScore >= 35 ? "medium" : "low",
      drivers: mrf_result.factors
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((f) => `${f.name}: ${f.score.toFixed(0)}`),
      recommendations,
    });
  }

  // Aggregated risk score (weighted by grams)
  let totalWeightedRisk = 0;
  for (const mat of bomMaterials) {
    const weight = mat.quantity_grams / bom.total_grams;
    totalWeightedRisk += mat.mrfScore * weight;
  }
  const totalRiskScore = Math.round(totalWeightedRisk * 10) / 10;

  // Simple average
  const avgRiskScore = bomMaterials.length > 0
    ? Math.round(bomMaterials.reduce((s, m) => s + m.mrfScore, 0) / bomMaterials.length * 10) / 10
    : 0;

  // Resilience distance
  const RESILIENCE_THRESHOLD = 35;
  const resilienceDistance = Math.max(0, totalRiskScore - RESILIENCE_THRESHOLD);

  // Risk counts
  const criticalCount = bomMaterials.filter((m) => m.riskLevel === "critical").length;
  const highCount = bomMaterials.filter((m) => m.riskLevel === "high").length;
  const resilientCount = bomMaterials.filter((m) => m.riskLevel === "low").length;

  // Top risk drivers
  const driverMap = new Map<string, BOMRiskMaterial[]>();
  for (const mat of bomMaterials) {
    for (const driver of mat.drivers) {
      const key = driver.split(":")[0]; // Extract driver name
      if (!driverMap.has(key)) driverMap.set(key, []);
      driverMap.get(key)!.push(mat);
    }
  }
  const topRiskDrivers = Array.from(driverMap.entries())
    .map(([driver, mats]) => ({
      driver,
      affectedMaterials: mats,
      mitigation: getMitigationForDriver(driver),
    }))
    .sort((a, b) => b.affectedMaterials.length - a.affectedMaterials.length)
    .slice(0, 5);

  // Scenarios
  const scenarios = generateScenarios(bomMaterials, totalRiskScore);

  // Warnings
  const warnings: string[] = [];
  if (unmatchedCount > 0) {
    warnings.push(
      `${unmatchedCount} material(s) not matched to catalog — actual risk may be higher`
    );
  }
  if (bomMaterials.length === 0) {
    warnings.push("No matched materials in BOM — cannot generate risk analysis");
  }
  if (criticalCount >= 2) {
    warnings.push(`⚠️ ${criticalCount} critical materials detected — urgent action required`);
  }

  // Insights
  const insights: string[] = [];
  if (totalRiskScore >= 75) {
    insights.push("🔴 BOM resilience is CRITICAL — immediate mitigation required");
  } else if (totalRiskScore >= 55) {
    insights.push("🟠 BOM resilience is HIGH — significant intervention needed");
  } else if (totalRiskScore >= 35) {
    insights.push("🟡 BOM resilience is MEDIUM — monitoring and gradual improvements");
  } else {
    insights.push("🟢 BOM resilience is STRONG — maintain current strategy");
  }

  // Top material by volume vs risk
  const topByVolume = bomMaterials.sort((a, b) => b.quantity_grams - a.quantity_grams)[0];
  const topByRisk = bomMaterials.sort((a, b) => b.mrfScore - a.mrfScore)[0];
  insights.push(
    `Top material by volume: ${topByVolume.material_name} (${topByVolume.share_of_bom_percent}%)`
  );
  insights.push(
    `Highest risk material: ${topByRisk.material_name} (MRF: ${topByRisk.mrfScore})`
  );

  return {
    timestamp: new Date().toISOString(),
    total_materials: bom.rows.length,
    matched_materials: matchedCount,
    unmatched_materials: unmatchedCount,
    total_bom_grams: bom.total_grams,
    total_bom_value_eur: bom.total_value_eur,
    totalRiskScore,
    avgRiskScore,
    resilienceDistance,
    resilientBOM: totalRiskScore < RESILIENCE_THRESHOLD,
    criticalMaterialsCount: criticalCount,
    highRiskMaterialsCount: highCount,
    resilientMaterialsCount: resilientCount,
    materials: bomMaterials.sort((a, b) => b.mrfScore - a.mrfScore),
    topRiskDrivers,
    scenarios,
    warnings,
    insights,
  };
}

// ============================================================
// SCENARIO MODELING
// ============================================================

function generateScenarios(
  materials: BOMRiskMaterial[],
  baseTotalScore: number
): BOMRiskScenarioResult[] {
  const results: BOMRiskScenarioResult[] = [];

  for (const [key, scenario] of Object.entries(BOM_SCENARIOS)) {
    const adjustedScore = applyScenario(baseTotalScore, scenario);

    // Count materials failing resilience in this scenario
    const failingMaterials = materials
      .map((m) => ({
        ...m,
        mrfScore: applyScenario(m.mrfScore, scenario),
      }))
      .filter((m) => m.mrfScore >= 35); // Not resilient

    results.push({
      scenario,
      totalRiskScore: adjustedScore,
      avgRiskScore: Math.round(
        failingMaterials.reduce((s, m) => s + m.mrfScore, 0) /
          Math.max(1, materials.length) *
          10
      ) / 10,
      resilienceDistance: Math.max(0, adjustedScore - 35),
      criticalMaterialCount: failingMaterials.filter((m) => m.mrfScore >= 75).length,
      materialsFailing: failingMaterials.slice(0, 10), // Top 10
    });
  }

  return results;
}

// ============================================================
// MITIGATION GUIDANCE
// ============================================================

function getMitigationForDriver(driver: string): string {
  const mitigations: Record<string, string> = {
    "Supply Disruption": "Diversify supplier base; develop strategic reserves",
    "Geopolitical Risk": "Monitor political developments; build alternative sourcing",
    "Price Volatility": "Implement hedging; negotiate long-term contracts",
    "Reserve Depletion": "Accelerate recycling & circular economy initiatives",
    "Export Concentration": "Develop relationships with non-concentrated producers",
    "Supply Chain Centrality": "Build redundancy; invest in dual-source strategy",
    "Substitutability": "R&D into material alternatives; technology transition planning",
    "ESG Regulatory": "Improve supply chain transparency; ESG compliance investment",
    "Trade Restrictions": "Monitor trade policy; explore non-restricted producers",
  };
  return mitigations[driver] || "Review risk factors and develop mitigation plan";
}
