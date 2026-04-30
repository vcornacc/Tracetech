import type { CriticalMaterial } from "@/data/materialsData";

export interface CriticalityPrediction {
  materialName: string;
  score: number;
  probability: number;
  isCritical: boolean;
  confidence: number;
  topDrivers: string[];
}

export interface CriticalitySummary {
  predictedCriticalCount: number;
  predictedNonCriticalCount: number;
  avgProbability: number;
  avgConfidence: number;
  topPredictedCritical: CriticalityPrediction[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeHhi(hhi: number): number {
  return clamp((hhi / 4000) * 100);
}

function averageRiskProfile(material: CriticalMaterial): number {
  if (!material.riskProfile.length) return 0;
  const total = material.riskProfile.reduce((sum, r) => sum + r.value, 0);
  return clamp(total / material.riskProfile.length);
}

export function predictMaterialCriticality(material: CriticalMaterial): CriticalityPrediction {
  const riskMean = averageRiskProfile(material);
  const weightedScore =
    material.yaleScore * 0.26 +
    material.euSRxEI * 20 * 0.22 +
    normalizeHhi(material.hhi) * 0.14 +
    riskMean * 0.22 +
    (100 - material.recycleRate) * 0.16;

  const score = Math.round(clamp(weightedScore) * 10) / 10;
  const probability = Math.round(clamp(score) * 10) / 1000;
  const isCritical = probability >= 0.6;
  const confidence = Math.round((Math.abs(probability - 0.5) * 2 * 100) * 10) / 10;

  const drivers = [
    { name: "Yale score", value: material.yaleScore },
    { name: "EU SRxEI", value: material.euSRxEI * 20 },
    { name: "Supply concentration (HHI)", value: normalizeHhi(material.hhi) },
    { name: "Risk profile average", value: riskMean },
    { name: "Low recycling", value: 100 - material.recycleRate },
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((d) => `${d.name}: ${d.value.toFixed(1)}`);

  return {
    materialName: material.name,
    score,
    probability,
    isCritical,
    confidence,
    topDrivers: drivers,
  };
}

export function predictPortfolioCriticality(materials: CriticalMaterial[]): CriticalitySummary {
  const predictions = materials.map(predictMaterialCriticality);
  const critical = predictions.filter((p) => p.isCritical);
  const nonCritical = predictions.filter((p) => !p.isCritical);

  const avgProbability = predictions.length
    ? Math.round((predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length) * 1000) / 1000
    : 0;

  const avgConfidence = predictions.length
    ? Math.round((predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length) * 10) / 10
    : 0;

  return {
    predictedCriticalCount: critical.length,
    predictedNonCriticalCount: nonCritical.length,
    avgProbability,
    avgConfidence,
    topPredictedCritical: [...critical]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5),
  };
}
