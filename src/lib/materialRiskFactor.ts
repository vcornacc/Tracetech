/**
 * Material Risk Factor (MRF) Engine
 *
 * 10-factor quantitative model for comprehensive material resilience assessment.
 * Each factor weighted by economic and supply chain impact.
 *
 * Sources:
 * - USGS Mineral Commodity Summaries 2024
 * - GPR Index (caldarariacoviello.com)
 * - LME price data
 * - IEA Critical Minerals 2023
 * - EU CRM Acts, Bloomberg
 */

import type { CriticalMaterial } from "@/data/materialsData";

// ============================================================
// TYPES
// ============================================================

export const MRF_FACTORS = [
  "Supply Disruption",      // 20% — production concentration + HHI
  "Geopolitical Risk",      // 15% — GPR score of top producers
  "Price Volatility",       // 12% — historical price swings
  "Reserve Depletion",      // 10% — years of reserves left
  "Export Concentration",   // 10% — share by top 3 exporters
  "Supply Chain Centrality",// 10% — criticality in material network
  "Substitutability",       // 10% — inverse of tech replacement options
  "ESG Regulatory",         // 8%  — ESG score + regulatory exposure
  "Trade Restrictions",     // 5%  — active bans, tariffs, sanctions
] as const;

export type MRFFactor = typeof MRF_FACTORS[number];

export const MRF_WEIGHTS: Record<MRFFactor, number> = {
  "Supply Disruption": 0.20,
  "Geopolitical Risk": 0.15,
  "Price Volatility": 0.12,
  "Reserve Depletion": 0.10,
  "Export Concentration": 0.10,
  "Supply Chain Centrality": 0.10,
  "Substitutability": 0.10,
  "ESG Regulatory": 0.08,
  "Trade Restrictions": 0.05,
};

export interface MRFFactorScore {
  name: MRFFactor;
  score: number;           // 0-100
  weight: number;
  drivers: string[];       // explanation of score
}

export interface MaterialRiskFactorResult {
  materialRiskFactor: number;    // 0-100 composite score
  resilienceDistance: number;    // distance to resilience threshold (35)
  riskLevel: "critical" | "high" | "medium" | "low"; // MRF-based classification
  factors: MRFFactorScore[];
  resilient: boolean;            // MRF < 35
}

export interface BOMScenario {
  name: "optimistic" | "base" | "pessimistic";
  label: string;
  description: string;
  mrfAdjustment: number;     // % delta to MRF (e.g., +35% in pessimistic)
  keyAssumptions: string[];
}

// ============================================================
// CORE MRF CALCULATION
// ============================================================

/**
 * Compute Material Risk Factor (MRF) for a single material
 *
 * Integrates 9 risk dimensions + forward-looking scenarios.
 * Each factor normalized to 0-100 scale independently.
 */
export function computeMaterialRiskFactor(material: CriticalMaterial): MaterialRiskFactorResult {
  const factors: MRFFactorScore[] = [];

  // Factor 1: Supply Disruption (HHI-based concentration)
  const supplyDisruptionScore = computeSupplyDisruption(material);
  factors.push({
    name: "Supply Disruption",
    score: supplyDisruptionScore,
    weight: MRF_WEIGHTS["Supply Disruption"],
    drivers: [
      `HHI Index: ${material.hhi}`,
      `Top producers: ${material.topProducers.slice(0, 3).join(", ")}`,
    ],
  });

  // Factor 2: Geopolitical Risk
  const geopoliticalScore = material.gprScore ?? 50; // fallback if not in schema
  factors.push({
    name: "Geopolitical Risk",
    score: geopoliticalScore,
    weight: MRF_WEIGHTS["Geopolitical Risk"],
    drivers: [
      `GPR Score: ${geopoliticalScore}`,
      `Top producer risk concentration`,
    ],
  });

  // Factor 3: Price Volatility
  const priceVolScore = computePriceVolatility(material);
  factors.push({
    name: "Price Volatility",
    score: priceVolScore,
    weight: MRF_WEIGHTS["Price Volatility"],
    drivers: [
      `30d volatility: ${material.priceVolatility30d ?? "N/A"}%`,
      `1y volatility: ${material.priceVolatility1y ?? "N/A"}%`,
    ],
  });

  // Factor 4: Reserve Depletion Horizon
  const reserveScore = computeReserveDepletion(material);
  factors.push({
    name: "Reserve Depletion",
    score: reserveScore,
    weight: MRF_WEIGHTS["Reserve Depletion"],
    drivers: [
      `Reserves: ${material.reservesYears ?? "N/A"} years`,
      `USGS projection for ${material.name}`,
    ],
  });

  // Factor 5: Export Concentration
  const exportScore = computeExportConcentration(material);
  factors.push({
    name: "Export Concentration",
    score: exportScore,
    weight: MRF_WEIGHTS["Export Concentration"],
    drivers: [
      `${(material.productionByCountry?.[0]?.sharePercent ?? 0).toFixed(1)}% from top producer`,
      `${material.name} export by country`,
    ],
  });

  // Factor 6: Supply Chain Centrality
  const centralityScore = material.supplyCentralityScore ?? 50;
  factors.push({
    name: "Supply Chain Centrality",
    score: centralityScore,
    weight: MRF_WEIGHTS["Supply Chain Centrality"],
    drivers: [
      `Centrality index: ${centralityScore}`,
      `Criticality in material network`,
    ],
  });

  // Factor 7: Substitutability (inverse)
  const substitutabilityScore = computeSubstitutability(material);
  factors.push({
    name: "Substitutability",
    score: substitutabilityScore,
    weight: MRF_WEIGHTS["Substitutability"],
    drivers: [
      `Tech replaceability: ${(((material.substitutabilityScore ?? 0.5) * 100).toFixed(0))}%`,
      `Lower = easier to replace`,
    ],
  });

  // Factor 8: ESG & Regulatory Risk
  const esgScore = material.esgScore ?? 50;
  factors.push({
    name: "ESG Regulatory",
    score: esgScore,
    weight: MRF_WEIGHTS["ESG Regulatory"],
    drivers: [
      `ESG score: ${esgScore}`,
      `Recycling rate: ${material.recycleRate}%`,
      `Regulatory exposure`,
    ],
  });

  // Factor 9: Trade Restrictions
  const tradeScore = material.tradeRestrictionScore ?? 20;
  factors.push({
    name: "Trade Restrictions",
    score: tradeScore,
    weight: MRF_WEIGHTS["Trade Restrictions"],
    drivers: [
      `Trade barrier score: ${tradeScore}`,
      `Active sanctions/export limits`,
    ],
  });

  // Composite MRF = weighted sum
  const materialRiskFactor = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0) * 10
  ) / 10;

  // Resilience threshold = 35
  const RESILIENCE_THRESHOLD = 35;
  const resilienceDistance = Math.max(0, materialRiskFactor - RESILIENCE_THRESHOLD);

  // Risk level classification
  const riskLevel: MaterialRiskFactorResult["riskLevel"] =
    materialRiskFactor >= 75 ? "critical" :
    materialRiskFactor >= 55 ? "high" :
    materialRiskFactor >= 35 ? "medium" : "low";

  return {
    materialRiskFactor,
    resilienceDistance,
    riskLevel,
    factors,
    resilient: materialRiskFactor < RESILIENCE_THRESHOLD,
  };
}

// ============================================================
// FACTOR CALCULATIONS (normalized 0-100)
// ============================================================

function computeSupplyDisruption(material: CriticalMaterial): number {
  // HHI normalization: 0-10000 scale → 0-100
  // Higher HHI = higher concentration = higher risk
  const hhi = material.hhi ?? 1000;
  const normalizedHHI = Math.min(100, (hhi / 10000) * 100);

  // Top 3 producer share amplifier (max 100% total share)
  const topShareSum = Math.min(
    100,
    material.productionByCountry
      ?.slice(0, 3)
      .reduce((sum, p) => sum + p.sharePercent, 0) ?? 50
  );

  // Weighted combination (capped at 100)
  const score = normalizedHHI * 0.6 + topShareSum * 0.4;
  return Math.min(100, Math.max(0, score));
}

function computePriceVolatility(material: CriticalMaterial): number {
  const vol30d = material.priceVolatility30d ?? 15;
  const vol1y = material.priceVolatility1y ?? 20;

  // Weighted average: recent volatility more important
  const avgVol = vol30d * 0.4 + vol1y * 0.6;

  // Normalize to 0-100 (capped at 100%)
  return Math.min(100, avgVol);
}

function computeReserveDepletion(material: CriticalMaterial): number {
  const reserves = material.reservesYears ?? 50;

  // Risk function: lower reserves = higher risk
  // <20 years = critical (90-100)
  // 20-50 years = high (60-80)
  // 50-100 years = medium (40-60)
  // >100 years = low (10-40)
  if (reserves < 20) return Math.min(100, 90 + (20 - reserves));
  if (reserves < 50) return 60 + ((50 - reserves) / 30) * 20;
  if (reserves < 100) return 40 + ((100 - reserves) / 50) * 20;
  return Math.max(10, 40 - (reserves - 100) / 100);
}

function computeExportConcentration(material: CriticalMaterial): number {
  const topShare = material.productionByCountry?.[0]?.sharePercent ?? 30;

  // Risk: if top exporter has >40%, risk is high
  // Linear: 40% → 60 score, 80% → 100 score, 10% → 20 score
  return Math.min(100, Math.max(0, (topShare - 10) * 1.5));
}

function computeSubstitutability(material: CriticalMaterial): number {
  const subScore = material.substitutabilityScore ?? 0.5;
  // Convert 0-1 scale to 0-100 risk scale
  // 0 (easily replaced) → 10 (low risk)
  // 1 (not replaceable) → 100 (high risk)
  return subScore * 100;
}

// ============================================================
// SCENARIO ANALYSIS
// ============================================================

export const BOM_SCENARIOS: Record<string, BOMScenario> = {
  optimistic: {
    name: "optimistic",
    label: "Optimistic",
    description: "Supply stable, prices -15%, no geopolitical shock, new substitute available",
    mrfAdjustment: -0.25,  // MRF reduced by 25%
    keyAssumptions: [
      "Global supply chain stabilization",
      "Commodity prices decline 15%",
      "No major geopolitical events",
      "New technology / substitute emerging",
    ],
  },
  base: {
    name: "base",
    label: "Base Case",
    description: "Status quo, current price trends, existing volatility",
    mrfAdjustment: 0,      // No change
    keyAssumptions: [
      "Continuation of current trends",
      "Normal market volatility",
      "Geopolitical status quo",
      "Current regulatory environment",
    ],
  },
  pessimistic: {
    name: "pessimistic",
    label: "Pessimistic",
    description: "Top producer supply shock (-40%), trade barrier (+25%), geopolitical escalation",
    mrfAdjustment: 0.35,   // MRF increased by 35%
    keyAssumptions: [
      "Major producer supply disruption (-40% production)",
      "Trade barrier / tariff escalation (+25%)",
      "Geopolitical tensions in key regions",
      "Regulatory tightening (ESG, supply chain)",
    ],
  },
};

export function applyScenario(
  baseMRF: number,
  scenario: BOMScenario
): number {
  const adjustedMRF = baseMRF * (1 + scenario.mrfAdjustment);
  return Math.max(0, Math.min(100, Math.round(adjustedMRF * 10) / 10));
}

// ============================================================
// RESILIENCE TARGETS & RECOMMENDATIONS
// ============================================================

export function getResiliencyRecommendations(
  result: MaterialRiskFactorResult
): string[] {
  const recommendations: string[] = [];

  // Highest-scoring factors → recommendations
  const topFactors = [...result.factors]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  for (const factor of topFactors) {
    switch (factor.name) {
      case "Supply Disruption":
        recommendations.push(
          "🛡️ Diversify supplier base: reduce single-country concentration"
        );
        break;
      case "Geopolitical Risk":
        recommendations.push(
          "📍 Monitor geopolitical indicators; establish strategic reserves"
        );
        break;
      case "Price Volatility":
        recommendations.push(
          "💰 Implement hedging strategy; lock in long-term contracts"
        );
        break;
      case "Reserve Depletion":
        recommendations.push(
          "⏰ Accelerate circular economy & recycling programs"
        );
        break;
      case "Export Concentration":
        recommendations.push(
          "🔗 Build relationships with alternative producers"
        );
        break;
      case "Supply Chain Centrality":
        recommendations.push(
          "🌐 Develop dual-source strategy; invest in redundancy"
        );
        break;
      case "Substitutability":
        recommendations.push(
          "🔬 R&D into material substitutes or alternative technologies"
        );
        break;
      case "ESG Regulatory":
        recommendations.push(
          "♻️ Invest in recycling & ESG compliance; improve supply chain transparency"
        );
        break;
      case "Trade Restrictions":
        recommendations.push(
          "⚖️ Monitor trade policy; explore sourcing from non-restricted producers"
        );
        break;
    }
  }

  return recommendations;
}
