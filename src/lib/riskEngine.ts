/**
 * Risk Calculation Engine — Phase 2 & 3
 *
 * Implements Yale Criticality and EU CRM classification methodologies
 * to classify materials into 4 risk clusters and compute composite scores.
 */

import type { Material } from "@/hooks/useSupabaseData";

// ============================================================
// TYPES
// ============================================================

export type ClusterType = "systemic" | "product" | "sectoral" | "operational";

export interface ClusterInfo {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  emoji: string;
}

export interface MaterialRiskProfile {
  subject: string;
  value: number;
}

export interface RiskAssessment {
  compositeRisk: number;       // 0-100 weighted aggregate
  supplyRisk: number;
  geopoliticalRisk: number;
  priceVolatility: number;
  recycleGap: number;
  esgRisk: number;
  concentrationRisk: number;
  cluster: ClusterType;
  economicExposure: number;    // € value at risk
}

export interface FleetExposure {
  totalCrmValueEuro: number;
  totalCrmGrams: number;
  materialBreakdown: {
    name: string;
    cluster: ClusterType;
    totalGrams: number;
    totalValue: number;
    riskScore: number;
  }[];
  clusterDistribution: Record<ClusterType, number>;
  topRiskMaterials: Material[];
}

// ============================================================
// CLUSTER DEFINITIONS
// ============================================================

export const CLUSTER_INFO: Record<ClusterType, ClusterInfo> = {
  systemic: {
    label: "Systemic Dual Exposure",
    color: "hsl(0, 72%, 55%)",
    bgColor: "hsl(0, 72%, 95%)",
    description: "Alto Yale Score + EU Critical Quadrant. Rischio fornitura e importanza economica elevati.",
    emoji: "🔴",
  },
  product: {
    label: "Product-Embedded Criticality",
    color: "hsl(38, 92%, 55%)",
    bgColor: "hsl(38, 92%, 95%)",
    description: "Fondamentali per l'elettronica con alto impatto ambientale.",
    emoji: "🟠",
  },
  sectoral: {
    label: "Sectoral Strategic Exposure",
    color: "hsl(190, 85%, 50%)",
    bgColor: "hsl(190, 85%, 95%)",
    description: "Critici per le politiche UE e la transizione verde.",
    emoji: "🟡",
  },
  operational: {
    label: "Operational Backbone",
    color: "hsl(160, 70%, 45%)",
    bgColor: "hsl(160, 70%, 95%)",
    description: "Materiali comuni con basso rischio, alta dipendenza operativa.",
    emoji: "🟢",
  },
};

// ============================================================
// CLUSTER CLASSIFICATION (Yale + EU methodology)
// ============================================================

/**
 * Classifies a material into one of 4 clusters based on Yale Score and EU SR×EI
 *
 * Cluster I (Systemic):   Yale ≥ 68 AND EU SR×EI ≥ 3.3
 * Cluster II (Product):   Yale ≥ 55 AND EU SR×EI ≥ 2.9 AND NOT Systemic
 * Cluster III (Sectoral): Yale ≥ 55 AND EU SR×EI ≥ 2.5 AND NOT above
 * Cluster IV (Operational): everything else
 */
export function classifyCluster(yaleScore: number, euSrXEi: number): ClusterType {
  if (yaleScore >= 68 && euSrXEi >= 3.3) return "systemic";
  if (yaleScore >= 55 && euSrXEi >= 2.9) return "product";
  if (yaleScore >= 55 && euSrXEi >= 2.5) return "sectoral";
  return "operational";
}

// ============================================================
// COMPOSITE RISK SCORE
// ============================================================

/** Weights for risk dimensions (sum = 1.0) */
const RISK_WEIGHTS = {
  supply: 0.25,
  geopolitical: 0.20,
  priceVolatility: 0.15,
  recycleGap: 0.15,
  esg: 0.10,
  concentration: 0.15,
};

export function computeCompositeRisk(material: Material): number {
  const score =
    material.risk_supply * RISK_WEIGHTS.supply +
    material.risk_geopolitical * RISK_WEIGHTS.geopolitical +
    material.risk_price_volatility * RISK_WEIGHTS.priceVolatility +
    material.risk_recycle_gap * RISK_WEIGHTS.recycleGap +
    material.risk_esg * RISK_WEIGHTS.esg +
    material.risk_concentration_hhi * RISK_WEIGHTS.concentration;
  return Math.round(score * 10) / 10;
}

/**
 * Full risk assessment for a material
 */
export function assessMaterialRisk(material: Material, totalGramsInFleet: number = 0): RiskAssessment {
  const compositeRisk = computeCompositeRisk(material);
  const pricePerGram = (material.price_per_kg ?? 0) / 1000;
  const economicExposure = totalGramsInFleet * pricePerGram;

  return {
    compositeRisk,
    supplyRisk: material.risk_supply,
    geopoliticalRisk: material.risk_geopolitical,
    priceVolatility: material.risk_price_volatility,
    recycleGap: material.risk_recycle_gap,
    esgRisk: material.risk_esg,
    concentrationRisk: material.risk_concentration_hhi,
    cluster: material.cluster as ClusterType,
    economicExposure: Math.round(economicExposure * 100) / 100,
  };
}

/**
 * Get radar chart data for a material
 */
export function getMaterialRiskProfile(material: Material): MaterialRiskProfile[] {
  return [
    { subject: "Supply Risk", value: material.risk_supply },
    { subject: "Geopolitica", value: material.risk_geopolitical },
    { subject: "Prezzo Vol.", value: material.risk_price_volatility },
    { subject: "Riciclo Gap", value: material.risk_recycle_gap },
    { subject: "ESG Risk", value: material.risk_esg },
    { subject: "Concentr. HHI", value: material.risk_concentration_hhi },
  ];
}

// ============================================================
// CRITICALITY MATRIX (2D scatter plot data)
// ============================================================

export interface CriticalityPoint {
  name: string;
  x: number;          // Economic Importance (EU SR×EI normalized)
  y: number;          // Supply Risk (Yale normalized)
  cluster: ClusterType;
  compositeRisk: number;
  economicExposure: number;
}

export function buildCriticalityMatrix(materials: Material[]): CriticalityPoint[] {
  return materials.map((m) => ({
    name: m.name,
    x: m.eu_sr_x_ei,
    y: m.yale_score,
    cluster: m.cluster as ClusterType,
    compositeRisk: computeCompositeRisk(m),
    economicExposure: 0, // to be filled with fleet data
  }));
}

// ============================================================
// FLEET EXPOSURE CALCULATION
// ============================================================

export function calculateFleetExposure(
  materials: Material[],
  ecuMaterials: { material_id: string; weight_grams: number; value_per_kg: number | null }[]
): FleetExposure {
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  // Aggregate by material
  const aggregated = new Map<string, { totalGrams: number; totalValue: number }>();
  for (const em of ecuMaterials) {
    const prev = aggregated.get(em.material_id) ?? { totalGrams: 0, totalValue: 0 };
    prev.totalGrams += em.weight_grams;
    prev.totalValue += (em.weight_grams * (em.value_per_kg ?? 0)) / 1000;
    aggregated.set(em.material_id, prev);
  }

  let totalCrmValueEuro = 0;
  let totalCrmGrams = 0;
  const materialBreakdown: FleetExposure["materialBreakdown"] = [];
  const clusterDistribution: Record<ClusterType, number> = {
    systemic: 0,
    product: 0,
    sectoral: 0,
    operational: 0,
  };

  for (const [matId, agg] of aggregated) {
    const mat = materialMap.get(matId);
    if (!mat) continue;
    totalCrmGrams += agg.totalGrams;
    totalCrmValueEuro += agg.totalValue;
    clusterDistribution[mat.cluster as ClusterType]++;
    materialBreakdown.push({
      name: mat.name,
      cluster: mat.cluster as ClusterType,
      totalGrams: Math.round(agg.totalGrams * 1000) / 1000,
      totalValue: Math.round(agg.totalValue * 100) / 100,
      riskScore: computeCompositeRisk(mat),
    });
  }

  // Sort by risk descending
  materialBreakdown.sort((a, b) => b.riskScore - a.riskScore);

  const topRiskMaterials = materials
    .filter((m) => m.cluster === "systemic" || m.cluster === "product")
    .sort((a, b) => computeCompositeRisk(b) - computeCompositeRisk(a))
    .slice(0, 10);

  return {
    totalCrmValueEuro: Math.round(totalCrmValueEuro * 100) / 100,
    totalCrmGrams: Math.round(totalCrmGrams * 1000) / 1000,
    materialBreakdown,
    clusterDistribution,
    topRiskMaterials,
  };
}

// ============================================================
// FINANCIAL CALCULATION ENGINE
// ============================================================

export interface FinancialResult {
  npv: number;
  irr: number;
  paybackYears: number;
  yearlyCashFlows: { year: number; cashFlow: number; cumulative: number }[];
  avoidedProcurementValue: number;
}

export function calculateFinancials(params: {
  capex: number;
  opex: number;
  annualCapacity: number;
  crmValuePerUnit: number;
  discountRate: number;
  years: number;
}): FinancialResult {
  const { capex, opex, annualCapacity, crmValuePerUnit, discountRate, years } = params;

  const annualRevenue = annualCapacity * crmValuePerUnit;
  const annualNetCashFlow = annualRevenue - opex;

  const yearlyCashFlows: FinancialResult["yearlyCashFlows"] = [];
  let npv = -capex;
  let cumulative = -capex;
  let paybackYears = years;

  for (let y = 1; y <= years; y++) {
    const discountedCF = annualNetCashFlow / Math.pow(1 + discountRate, y);
    npv += discountedCF;
    cumulative += annualNetCashFlow;
    yearlyCashFlows.push({
      year: y,
      cashFlow: Math.round(annualNetCashFlow),
      cumulative: Math.round(cumulative),
    });
    if (cumulative >= 0 && paybackYears === years) {
      // Linear interpolation for precise payback
      const prevCum = cumulative - annualNetCashFlow;
      paybackYears = y - 1 + Math.abs(prevCum) / annualNetCashFlow;
    }
  }

  // IRR calculation (Newton's method approximation)
  const irr = calculateIRR(-capex, annualNetCashFlow, years);

  return {
    npv: Math.round(npv),
    irr: Math.round(irr * 1000) / 1000,
    paybackYears: Math.round(paybackYears * 10) / 10,
    yearlyCashFlows,
    avoidedProcurementValue: Math.round(annualRevenue * years),
  };
}

function calculateIRR(initialInvestment: number, annualCF: number, years: number): number {
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = initialInvestment;
    let dnpv = 0;
    for (let y = 1; y <= years; y++) {
      const factor = Math.pow(1 + rate, y);
      npv += annualCF / factor;
      dnpv -= (y * annualCF) / (factor * (1 + rate));
    }
    if (Math.abs(npv) < 1) break;
    if (dnpv === 0) break;
    rate -= npv / dnpv;
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  return rate;
}

// ============================================================
// SENSITIVITY ANALYSIS
// ============================================================

export interface SensitivityPoint {
  variationPct: number;
  npv: number;
  irr: number;
}

export function runSensitivityAnalysis(
  baseParams: Parameters<typeof calculateFinancials>[0],
  variationRange: number[] = [-30, -20, -10, 0, 10, 20, 30]
): SensitivityPoint[] {
  return variationRange.map((pct) => {
    const adjustedParams = {
      ...baseParams,
      crmValuePerUnit: baseParams.crmValuePerUnit * (1 + pct / 100),
    };
    const result = calculateFinancials(adjustedParams);
    return {
      variationPct: pct,
      npv: result.npv,
      irr: result.irr,
    };
  });
}
