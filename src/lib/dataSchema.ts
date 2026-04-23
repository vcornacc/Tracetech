/**
 * Source of Truth — Normalized Data Schema
 *
 * Philosophy: Every computed metric has ONE canonical derivation path.
 * Raw data lives in Supabase/mock, but all downstream consumers
 * read through these normalized interfaces. No redundant fields,
 * no ambiguous naming, no scattered calculations.
 *
 * This layer:
 * 1. Normalizes heterogeneous sources into canonical types
 * 2. Pre-computes derived metrics once (memoizable)
 * 3. Provides typed accessors that enforce consistent semantics
 */

import type { CriticalMaterial } from "@/data/materialsData";
import type { ECU, CircularTrigger } from "@/data/ecuData";
import { computeMaterialRiskFactor } from "@/lib/materialRiskFactor";

// ============================================================
// RISK DIMENSION ENUM (replaces fragile string arrays)
// ============================================================

export const RISK_DIMENSIONS = [
  "Supply Risk",
  "Geopolitical",
  "Price Vol.",
  "Recycling Gap",
  "ESG Risk",
  "HHI Concentration",
] as const;

export type RiskDimension = typeof RISK_DIMENSIONS[number];

export const RISK_WEIGHTS: Record<RiskDimension, number> = {
  "Supply Risk": 0.25,
  "Geopolitical": 0.20,
  "Price Vol.": 0.15,
  "Recycling Gap": 0.15,
  "ESG Risk": 0.10,
  "HHI Concentration": 0.15,
};

// ============================================================
// NORMALIZED MATERIAL
// ============================================================

export interface NormalizedMaterial {
  id: string;                  // name-based slug for stable keying
  name: string;
  cluster: "systemic" | "product" | "sectoral" | "operational";
  yaleScore: number;
  euSRxEI: number;
  hhi: number;
  recycleRate: number;
  gramsPerCircuit: number;
  topProducers: string[];
  riskVector: Record<RiskDimension, number>;  // typed map, not position-dependent array
  compositeRisk: number;       // single weighted score 0-100
  riskTier: "critical" | "high" | "medium" | "low";
  recycleGapSeverity: "severe" | "moderate" | "acceptable";
  geopoliticalExposure: number; // composite of geopolitical + HHI
  // Material Risk Factor (MRF) extended fields
  materialRiskFactor: number;  // 0-100 MRF score (10-factor model)
  resilienceDistance: number;  // distance to resilience threshold (35)
  priceVolatility30d: number;
  priceVolatility1y: number;
  reservesYears: number;
  gprScore: number;
  supplyCentralityScore: number;
  substitutabilityScore: number;
  esgScore: number;
  tradeRestrictionScore: number;
  productionByCountry: Array<{ country: string; sharePercent: number }>;
}

// ============================================================
// NORMALIZED ECU
// ============================================================

export interface NormalizedECU {
  id: string;
  model: string;
  vehicleModel: string;
  status: ECU["status"];
  circularPath: ECU["circularPath"];
  riskScore: number;
  healthScore: number;
  remainingLifeMonths: number;
  crmValueEuro: number;
  crmContentGrams: number;
  totalWeightGrams: number;
  recoveryRate: number;
  materialCount: number;
  crmDensity: number;          // crmContentGrams / totalWeightGrams — how "valuable" per gram
  urgency: "immediate" | "soon" | "stable" | "long-term";
}

// ============================================================
// PORTFOLIO SNAPSHOT — single computed aggregate
// ============================================================

export interface PortfolioSnapshot {
  totalMaterials: number;
  totalECUs: number;
  activeTriggers: number;

  // Risk distribution
  criticalMaterials: number;
  highRiskMaterials: number;
  systemicCount: number;
  productCount: number;
  sectoralCount: number;
  operationalCount: number;

  // Aggregate scores
  avgCompositeRisk: number;
  maxCompositeRisk: number;
  avgRecoveryRate: number;
  avgGeopoliticalExposure: number;

  // ECU health
  ecusByStatus: Record<ECU["status"], number>;
  avgHealthScore: number;
  totalCrmValue: number;
  ecuNeedingAction: number;     // EOL + maintenance

  // Portfolio risk posture
  riskPosture: "critical" | "elevated" | "moderate" | "stable";
  riskTrend: "worsening" | "stable" | "improving";

  // Top concerns (pre-sorted for UI)
  topRiskMaterials: NormalizedMaterial[];
  urgentECUs: NormalizedECU[];
  activeAlerts: CircularTrigger[];
}

// ============================================================
// NORMALIZATION FUNCTIONS
// ============================================================

export function normalizeMaterial(m: CriticalMaterial): NormalizedMaterial {
  const riskVector: Record<RiskDimension, number> = {} as any;
  for (const dim of RISK_DIMENSIONS) {
    const entry = m.riskProfile.find((r) => r.subject === dim);
    riskVector[dim] = entry?.value ?? 0;
  }

  const compositeRisk = Math.round(
    RISK_DIMENSIONS.reduce((sum, dim) => sum + riskVector[dim] * RISK_WEIGHTS[dim], 0) * 10
  ) / 10;

  const riskTier: NormalizedMaterial["riskTier"] =
    compositeRisk >= 75 ? "critical" :
    compositeRisk >= 55 ? "high" :
    compositeRisk >= 35 ? "medium" : "low";

  const recycleGapSeverity: NormalizedMaterial["recycleGapSeverity"] =
    m.recycleRate < 15 ? "severe" :
    m.recycleRate < 35 ? "moderate" : "acceptable";

  const geopoliticalExposure = Math.round(
    (riskVector["Geopolitical"] * 0.6 + riskVector["HHI Concentration"] * 0.4) * 10
  ) / 10;

  // Compute Material Risk Factor (MRF) using extended 10-factor model
  const mrfResult = computeMaterialRiskFactor(m);

  return {
    id: m.name.toLowerCase().replace(/\s+/g, "-"),
    name: m.name,
    cluster: m.cluster,
    yaleScore: m.yaleScore,
    euSRxEI: m.euSRxEI,
    hhi: m.hhi,
    recycleRate: m.recycleRate,
    gramsPerCircuit: m.gramsPerCircuit,
    topProducers: m.topProducers,
    riskVector,
    compositeRisk,
    riskTier,
    recycleGapSeverity,
    geopoliticalExposure,
    // MRF extended fields
    materialRiskFactor: mrfResult.materialRiskFactor,
    resilienceDistance: mrfResult.resilienceDistance,
    priceVolatility30d: m.priceVolatility30d ?? 15.0,
    priceVolatility1y: m.priceVolatility1y ?? 20.0,
    reservesYears: m.reservesYears ?? 50,
    gprScore: m.gprScore ?? 50,
    supplyCentralityScore: m.supplyCentralityScore ?? 50,
    substitutabilityScore: m.substitutabilityScore ?? 0.5,
    esgScore: m.esgScore ?? 50,
    tradeRestrictionScore: m.tradeRestrictionScore ?? 20,
    productionByCountry: m.productionByCountry ?? [],
  };
}

export function normalizeECU(e: ECU): NormalizedECU {
  const crmDensity = e.totalWeightGrams > 0
    ? Math.round((e.crmContentGrams / e.totalWeightGrams) * 10000) / 10000
    : 0;

  const urgency: NormalizedECU["urgency"] =
    e.status === "eol" || e.remainingLifeMonths === 0 ? "immediate" :
    e.status === "maintenance" || e.remainingLifeMonths < 6 ? "soon" :
    e.remainingLifeMonths < 24 ? "stable" : "long-term";

  return {
    id: e.id,
    model: e.model,
    vehicleModel: e.vehicleModel,
    status: e.status,
    circularPath: e.circularPath,
    riskScore: e.riskScore,
    healthScore: e.healthScore,
    remainingLifeMonths: e.remainingLifeMonths,
    crmValueEuro: e.crmValueEuro,
    crmContentGrams: e.crmContentGrams,
    totalWeightGrams: e.totalWeightGrams,
    recoveryRate: e.recoveryRate,
    materialCount: e.materials.length,
    crmDensity,
    urgency,
  };
}

// ============================================================
// PORTFOLIO SNAPSHOT BUILDER
// ============================================================

export function buildPortfolioSnapshot(
  materials: CriticalMaterial[],
  ecus: ECU[],
  triggers: CircularTrigger[]
): PortfolioSnapshot {
  const normalizedMaterials = materials.map(normalizeMaterial);
  const normalizedECUs = ecus.map(normalizeECU);

  // Material aggregates
  const avgCompositeRisk = normalizedMaterials.length > 0
    ? Math.round(normalizedMaterials.reduce((s, m) => s + m.compositeRisk, 0) / normalizedMaterials.length * 10) / 10
    : 0;

  const maxCompositeRisk = normalizedMaterials.length > 0
    ? Math.max(...normalizedMaterials.map((m) => m.compositeRisk))
    : 0;

  const avgRecoveryRate = normalizedMaterials.length > 0
    ? Math.round(normalizedMaterials.reduce((s, m) => s + m.recycleRate, 0) / normalizedMaterials.length)
    : 0;

  const avgGeopoliticalExposure = normalizedMaterials.length > 0
    ? Math.round(normalizedMaterials.reduce((s, m) => s + m.geopoliticalExposure, 0) / normalizedMaterials.length * 10) / 10
    : 0;

  // ECU aggregates
  const ecusByStatus: Record<ECU["status"], number> = {
    active: 0, maintenance: 0, eol: 0, recovered: 0, in_recovery: 0,
  };
  let totalCrmValue = 0;
  let totalHealthScore = 0;
  for (const e of normalizedECUs) {
    ecusByStatus[e.status]++;
    totalCrmValue += e.crmValueEuro;
    totalHealthScore += e.healthScore;
  }

  const avgHealthScore = normalizedECUs.length > 0
    ? Math.round(totalHealthScore / normalizedECUs.length)
    : 0;

  const ecuNeedingAction = ecusByStatus.eol + ecusByStatus.maintenance;

  // Risk posture
  const criticalMaterials = normalizedMaterials.filter((m) => m.riskTier === "critical").length;
  const highRiskMaterials = normalizedMaterials.filter((m) => m.riskTier === "high").length;
  const activeTriggers = triggers.filter((t) => t.status === "active").length;

  const riskPosture: PortfolioSnapshot["riskPosture"] =
    criticalMaterials >= 3 || activeTriggers >= 3 ? "critical" :
    criticalMaterials >= 1 || activeTriggers >= 2 ? "elevated" :
    highRiskMaterials >= 3 ? "moderate" : "stable";

  // Cluster distribution
  const clusterCounts = { systemic: 0, product: 0, sectoral: 0, operational: 0 };
  for (const m of normalizedMaterials) clusterCounts[m.cluster]++;

  // Pre-sorted for UI
  const topRiskMaterials = [...normalizedMaterials]
    .sort((a, b) => b.compositeRisk - a.compositeRisk)
    .slice(0, 5);

  const urgentECUs = normalizedECUs
    .filter((e) => e.urgency === "immediate" || e.urgency === "soon")
    .sort((a, b) => a.remainingLifeMonths - b.remainingLifeMonths)
    .slice(0, 5);

  const activeAlerts = triggers
    .filter((t) => t.status === "active")
    .sort((a, b) => {
      const sev = { critical: 4, high: 3, medium: 2, low: 1 };
      return (sev[b.severity] ?? 0) - (sev[a.severity] ?? 0);
    });

  return {
    totalMaterials: normalizedMaterials.length,
    totalECUs: normalizedECUs.length,
    activeTriggers,
    criticalMaterials,
    highRiskMaterials,
    systemicCount: clusterCounts.systemic,
    productCount: clusterCounts.product,
    sectoralCount: clusterCounts.sectoral,
    operationalCount: clusterCounts.operational,
    avgCompositeRisk,
    maxCompositeRisk,
    avgRecoveryRate,
    avgGeopoliticalExposure,
    ecusByStatus,
    avgHealthScore,
    totalCrmValue: Math.round(totalCrmValue * 100) / 100,
    ecuNeedingAction,
    riskPosture,
    riskTrend: "stable", // baseline — predictive engine overrides this
    topRiskMaterials,
    urgentECUs,
    activeAlerts,
  };
}
