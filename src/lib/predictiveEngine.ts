/**
 * Predictive Intelligence Engine
 *
 * Philosophy: Dashboards that show "what happened" are commodities.
 * The competitive advantage is showing "what WILL happen" and "what to do about it."
 *
 * This engine transforms static risk snapshots into velocity-aware predictions:
 *
 * 1. RISK MOMENTUM — Are materials getting more or less risky over time?
 *    Uses synthetic trend analysis on risk dimensions to project 30/60/90 day trajectories.
 *
 * 2. THRESHOLD ALERTS — Which materials will cross critical boundaries?
 *    Predicts when a "high" material becomes "critical" based on current velocity.
 *
 * 3. ANOMALY DETECTION — What's behaving unusually right now?
 *    Statistical outlier detection across the portfolio, flagging deviations > 1.5σ.
 *
 * 4. OPPORTUNITY SCORING — Where is the highest ROI for risk mitigation?
 *    Ranks actions by (risk reduction × economic impact) / effort.
 *
 * Tech: Pure TypeScript computation. No ML dependencies. Runs client-side in <5ms.
 * The "intelligence" comes from domain-aware heuristics, not black-box models.
 */

import {
  type NormalizedMaterial,
  type NormalizedECU,
  type PortfolioSnapshot,
  RISK_DIMENSIONS,
  type RiskDimension,
} from "./dataSchema";
import type { CircularTrigger } from "@/data/ecuData";

// ============================================================
// TYPES
// ============================================================

export interface RiskMomentumItem {
  materialName: string;
  cluster: NormalizedMaterial["cluster"];
  currentRisk: number;
  projectedRisk30d: number;
  projectedRisk90d: number;
  velocity: number;            // rate of change per month (-100 to +100)
  acceleration: number;        // change in velocity (2nd derivative)
  direction: "accelerating" | "decelerating" | "stable" | "improving";
  crossesThreshold: boolean;   // will cross into next risk tier within 90d
  thresholdName: string | null; // which tier boundary it crosses
  daysToThreshold: number | null;
}

export interface AnomalyFlag {
  materialName: string;
  dimension: RiskDimension;
  value: number;
  portfolioMean: number;
  portfolioStdDev: number;
  zScore: number;
  severity: "warning" | "critical";
  description: string;
}

export interface PredictiveAction {
  id: string;
  priority: number;            // 1-100, higher = more urgent
  category: "mitigate" | "diversify" | "recover" | "hedge" | "monitor";
  title: string;
  description: string;
  impactScore: number;         // estimated risk reduction 0-100
  effortLevel: "low" | "medium" | "high";
  roi: number;                 // impactScore / effort as ratio
  affectedMaterials: string[];
  timeHorizon: "immediate" | "short-term" | "medium-term" | "long-term";
  icon: string;                // lucide icon name
}

export interface ThresholdCrossing {
  materialName: string;
  currentTier: NormalizedMaterial["riskTier"];
  projectedTier: NormalizedMaterial["riskTier"];
  daysUntilCrossing: number;
  riskDelta: number;
}

export interface PredictiveInsights {
  momentum: RiskMomentumItem[];
  anomalies: AnomalyFlag[];
  actions: PredictiveAction[];
  thresholdCrossings: ThresholdCrossing[];
  portfolioForecast: {
    current: PortfolioSnapshot["riskPosture"];
    projected30d: PortfolioSnapshot["riskPosture"];
    projected90d: PortfolioSnapshot["riskPosture"];
    trend: "worsening" | "stable" | "improving";
  };
  systemHealth: number;        // 0-100 composite system health score
}

// ============================================================
// RISK MOMENTUM ENGINE
// ============================================================

/**
 * Generates risk momentum using domain-aware heuristics.
 *
 * In production, this would ingest time-series data from material_price_history.
 * Currently, we derive synthetic but realistic trends from:
 * - Trigger activity (active triggers increase affected material velocity)
 * - HHI concentration (high concentration = unstable, higher velocity variance)
 * - Recycling gap (large gaps trend worse as regulation tightens)
 * - Geopolitical context (systemic materials trend worse)
 */
function computeRiskMomentum(
  materials: NormalizedMaterial[],
  triggers: CircularTrigger[]
): RiskMomentumItem[] {
  // Build affected material set from active triggers
  const triggerAffected = new Set<string>();
  for (const t of triggers) {
    if (t.status === "active") {
      for (const m of t.affectedMaterials) {
        triggerAffected.add(m);
      }
    }
  }

  return materials.map((m) => {
    // Base velocity from structural risk factors
    let velocity = 0;

    // Trigger pressure: active triggers push risk up
    if (triggerAffected.has(m.name)) {
      velocity += 2.5 + Math.random() * 1.5;
    }

    // Concentration risk: high HHI = structural instability
    if (m.hhi > 3000) velocity += 0.8;
    else if (m.hhi > 2000) velocity += 0.3;

    // Recycling gap pressure: regulation is tightening globally
    if (m.recycleGapSeverity === "severe") velocity += 1.2;
    else if (m.recycleGapSeverity === "moderate") velocity += 0.4;

    // Systemic materials face more pressure
    if (m.cluster === "systemic") velocity += 0.6;
    else if (m.cluster === "product") velocity += 0.3;

    // Some materials are improving (diversification/recycling efforts)
    if (m.recycleRate > 40) velocity -= 0.5;
    if (m.hhi < 1200) velocity -= 0.3;

    // Add controlled noise for realism (seeded by name to be deterministic)
    const seed = m.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const noise = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
    velocity += noise * 0.8;

    // Round velocity
    velocity = Math.round(velocity * 100) / 100;

    // Acceleration (second derivative) — based on trigger severity
    let acceleration = 0;
    if (triggerAffected.has(m.name)) {
      const criticalTriggers = triggers.filter(
        (t) => t.status === "active" && t.severity === "critical" && t.affectedMaterials.includes(m.name)
      );
      acceleration = criticalTriggers.length * 0.5;
    }
    acceleration = Math.round(acceleration * 100) / 100;

    // Project risk
    const projectedRisk30d = Math.min(100, Math.max(0, Math.round((m.compositeRisk + velocity * 1) * 10) / 10));
    const projectedRisk90d = Math.min(100, Math.max(0, Math.round((m.compositeRisk + velocity * 3 + acceleration * 2) * 10) / 10));

    // Threshold detection
    const thresholds = [
      { name: "critical", value: 75 },
      { name: "high", value: 55 },
      { name: "medium", value: 35 },
    ];

    let crossesThreshold = false;
    let thresholdName: string | null = null;
    let daysToThreshold: number | null = null;

    if (velocity > 0) {
      for (const thresh of thresholds) {
        if (m.compositeRisk < thresh.value && projectedRisk90d >= thresh.value) {
          crossesThreshold = true;
          thresholdName = thresh.name;
          const gap = thresh.value - m.compositeRisk;
          daysToThreshold = velocity > 0 ? Math.round((gap / velocity) * 30) : null;
          break;
        }
      }
    }

    // Direction classification
    const direction: RiskMomentumItem["direction"] =
      velocity > 1 && acceleration > 0 ? "accelerating" :
      velocity > 0.5 ? "decelerating" :
      velocity < -0.5 ? "improving" : "stable";

    return {
      materialName: m.name,
      cluster: m.cluster,
      currentRisk: m.compositeRisk,
      projectedRisk30d,
      projectedRisk90d,
      velocity,
      acceleration,
      direction,
      crossesThreshold,
      thresholdName,
      daysToThreshold,
    };
  }).sort((a, b) => b.velocity - a.velocity);
}

// ============================================================
// ANOMALY DETECTION
// ============================================================

function detectAnomalies(materials: NormalizedMaterial[]): AnomalyFlag[] {
  if (materials.length < 3) return [];

  const anomalies: AnomalyFlag[] = [];

  for (const dim of RISK_DIMENSIONS) {
    const values = materials.map((m) => m.riskVector[dim]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 1) continue; // Not enough variance to detect outliers

    for (const m of materials) {
      const zScore = (m.riskVector[dim] - mean) / stdDev;
      if (Math.abs(zScore) > 1.5) {
        anomalies.push({
          materialName: m.name,
          dimension: dim,
          value: m.riskVector[dim],
          portfolioMean: Math.round(mean * 10) / 10,
          portfolioStdDev: Math.round(stdDev * 10) / 10,
          zScore: Math.round(zScore * 100) / 100,
          severity: Math.abs(zScore) > 2.0 ? "critical" : "warning",
          description: zScore > 0
            ? `${m.name} has unusually high ${dim} (${m.riskVector[dim]}) — ${Math.round(Math.abs(zScore) * 10) / 10}σ above portfolio average of ${Math.round(mean)}`
            : `${m.name} has unusually low ${dim} (${m.riskVector[dim]}) — ${Math.round(Math.abs(zScore) * 10) / 10}σ below portfolio average of ${Math.round(mean)}`,
        });
      }
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

// ============================================================
// THRESHOLD CROSSING PREDICTIONS
// ============================================================

function predictThresholdCrossings(momentum: RiskMomentumItem[]): ThresholdCrossing[] {
  return momentum
    .filter((m) => m.crossesThreshold && m.daysToThreshold !== null)
    .map((m) => {
      const currentTier: NormalizedMaterial["riskTier"] =
        m.currentRisk >= 75 ? "critical" :
        m.currentRisk >= 55 ? "high" :
        m.currentRisk >= 35 ? "medium" : "low";

      return {
        materialName: m.materialName,
        currentTier,
        projectedTier: m.thresholdName as NormalizedMaterial["riskTier"],
        daysUntilCrossing: m.daysToThreshold!,
        riskDelta: Math.round((m.projectedRisk90d - m.currentRisk) * 10) / 10,
      };
    })
    .sort((a, b) => a.daysUntilCrossing - b.daysUntilCrossing);
}

// ============================================================
// ACTIONABLE INTELLIGENCE — Priority Actions
// ============================================================

function generateActions(
  materials: NormalizedMaterial[],
  ecus: NormalizedECU[],
  momentum: RiskMomentumItem[],
  anomalies: AnomalyFlag[],
  triggers: CircularTrigger[]
): PredictiveAction[] {
  const actions: PredictiveAction[] = [];
  let actionId = 1;

  // 1. Critical trigger responses
  const criticalTriggers = triggers.filter((t) => t.status === "active" && t.severity === "critical");
  for (const trigger of criticalTriggers) {
    actions.push({
      id: `ACT-${String(actionId++).padStart(3, "0")}`,
      priority: 95,
      category: "mitigate",
      title: `Respond to ${trigger.label}`,
      description: `Critical alert affecting ${trigger.affectedECUs} ECUs. Activate contingency sourcing for ${trigger.affectedMaterials.join(", ")}.`,
      impactScore: 85,
      effortLevel: "high",
      roi: 85 / 3,
      affectedMaterials: trigger.affectedMaterials,
      timeHorizon: "immediate",
      icon: "AlertTriangle",
    });
  }

  // 2. Accelerating risk materials — hedge before it's too late
  const accelerating = momentum.filter((m) => m.direction === "accelerating" && m.velocity > 2);
  for (const item of accelerating.slice(0, 3)) {
    actions.push({
      id: `ACT-${String(actionId++).padStart(3, "0")}`,
      priority: 85,
      category: "hedge",
      title: `Hedge ${item.materialName} exposure`,
      description: `Risk accelerating at ${item.velocity.toFixed(1)}/mo. Projected to reach ${item.projectedRisk90d} in 90 days. Lock in forward contracts or activate secondary suppliers.`,
      impactScore: 70,
      effortLevel: "medium",
      roi: 70 / 2,
      affectedMaterials: [item.materialName],
      timeHorizon: "short-term",
      icon: "TrendingUp",
    });
  }

  // 3. Threshold crossings — prevent escalation
  const crossings = momentum.filter((m) => m.crossesThreshold);
  for (const item of crossings.slice(0, 2)) {
    actions.push({
      id: `ACT-${String(actionId++).padStart(3, "0")}`,
      priority: 80,
      category: "mitigate",
      title: `Prevent ${item.materialName} escalation to ${item.thresholdName}`,
      description: `${item.materialName} will cross into ${item.thresholdName} tier in ~${item.daysToThreshold} days at current trajectory. Diversify supply or increase recovery.`,
      impactScore: 75,
      effortLevel: "medium",
      roi: 75 / 2,
      affectedMaterials: [item.materialName],
      timeHorizon: "short-term",
      icon: "ShieldAlert",
    });
  }

  // 4. Recovery opportunities — EOL ECUs with high CRM value
  const eolEcus = ecus.filter((e) => e.urgency === "immediate");
  if (eolEcus.length > 0) {
    const totalRecoverableValue = eolEcus.reduce((s, e) => s + e.crmValueEuro, 0);
    actions.push({
      id: `ACT-${String(actionId++).padStart(3, "0")}`,
      priority: 75,
      category: "recover",
      title: `Recover CRM from ${eolEcus.length} EOL ECUs`,
      description: `€${totalRecoverableValue.toFixed(0)} in critical raw materials available for recovery. Prioritize selective recovery for systemic materials.`,
      impactScore: 60,
      effortLevel: "medium",
      roi: 60 / 2,
      affectedMaterials: [],
      timeHorizon: "immediate",
      icon: "Recycle",
    });
  }

  // 5. Diversification opportunities — high HHI materials
  const concentratedMaterials = materials
    .filter((m) => m.hhi > 3000 && m.cluster !== "operational")
    .sort((a, b) => b.hhi - a.hhi);

  if (concentratedMaterials.length > 0) {
    actions.push({
      id: `ACT-${String(actionId++).padStart(3, "0")}`,
      priority: 65,
      category: "diversify",
      title: `Diversify supply for ${concentratedMaterials.length} concentrated materials`,
      description: `${concentratedMaterials.map((m) => m.name).slice(0, 3).join(", ")} have HHI > 3000. Explore alternative suppliers in non-aligned regions.`,
      impactScore: 55,
      effortLevel: "high",
      roi: 55 / 3,
      affectedMaterials: concentratedMaterials.map((m) => m.name),
      timeHorizon: "medium-term",
      icon: "GitBranch",
    });
  }

  // 6. Recycling gap closure — severe gaps with high risk
  const recycleOpportunities = materials
    .filter((m) => m.recycleGapSeverity === "severe" && m.compositeRisk > 60);

  if (recycleOpportunities.length > 0) {
    actions.push({
      id: `ACT-${String(actionId++).padStart(3, "0")}`,
      priority: 60,
      category: "recover",
      title: `Close recycling gap for ${recycleOpportunities.length} critical materials`,
      description: `${recycleOpportunities.map((m) => m.name).slice(0, 3).join(", ")} have <15% recycling rate with high risk profiles. Invest in hydrometallurgy R&D.`,
      impactScore: 50,
      effortLevel: "high",
      roi: 50 / 3,
      affectedMaterials: recycleOpportunities.map((m) => m.name),
      timeHorizon: "long-term",
      icon: "Leaf",
    });
  }

  // 7. Monitoring recommendations for anomalous materials
  const criticalAnomalies = anomalies.filter((a) => a.severity === "critical").slice(0, 3);
  for (const anomaly of criticalAnomalies) {
    const existing = actions.find((a) => a.affectedMaterials.includes(anomaly.materialName));
    if (!existing) {
      actions.push({
        id: `ACT-${String(actionId++).padStart(3, "0")}`,
        priority: 50,
        category: "monitor",
        title: `Monitor ${anomaly.materialName} — ${anomaly.dimension} anomaly`,
        description: anomaly.description,
        impactScore: 30,
        effortLevel: "low",
        roi: 30 / 1,
        affectedMaterials: [anomaly.materialName],
        timeHorizon: "short-term",
        icon: "Eye",
      });
    }
  }

  return actions.sort((a, b) => b.priority - a.priority);
}

// ============================================================
// SYSTEM HEALTH SCORE
// ============================================================

function computeSystemHealth(
  snapshot: PortfolioSnapshot,
  anomalies: AnomalyFlag[],
  crossings: ThresholdCrossing[]
): number {
  let health = 100;

  // Deduct for risk posture
  const postureDeductions = { critical: 30, elevated: 15, moderate: 5, stable: 0 };
  health -= postureDeductions[snapshot.riskPosture];

  // Deduct for active triggers
  health -= Math.min(20, snapshot.activeTriggers * 5);

  // Deduct for critical anomalies
  health -= Math.min(15, anomalies.filter((a) => a.severity === "critical").length * 3);

  // Deduct for threshold crossings
  health -= Math.min(15, crossings.length * 5);

  // Deduct for ECUs needing action
  health -= Math.min(10, Math.round(snapshot.ecuNeedingAction / snapshot.totalECUs * 20));

  // Boost for good recovery rate
  if (snapshot.avgRecoveryRate > 40) health += 5;

  return Math.max(0, Math.min(100, Math.round(health)));
}

// ============================================================
// PORTFOLIO FORECAST
// ============================================================

function forecastPosture(
  current: PortfolioSnapshot["riskPosture"],
  momentum: RiskMomentumItem[]
): PredictiveInsights["portfolioForecast"] {
  const avgVelocity = momentum.length > 0
    ? momentum.reduce((s, m) => s + m.velocity, 0) / momentum.length
    : 0;

  const crossingCount = momentum.filter((m) => m.crossesThreshold).length;
  const acceleratingCount = momentum.filter((m) => m.direction === "accelerating").length;

  const postureOrder: PortfolioSnapshot["riskPosture"][] = ["stable", "moderate", "elevated", "critical"];
  const currentIdx = postureOrder.indexOf(current);

  // Calculate posture shifts
  let shift30d = 0;
  let shift90d = 0;

  if (avgVelocity > 1.5 || acceleratingCount > 3) shift30d = 1;
  if (avgVelocity > 2.5 || crossingCount > 2) shift90d = 2;
  if (avgVelocity < -0.5) { shift30d = 0; shift90d = -1; }

  const projected30dIdx = Math.max(0, Math.min(3, currentIdx + shift30d));
  const projected90dIdx = Math.max(0, Math.min(3, currentIdx + shift90d));

  const trend: PredictiveInsights["portfolioForecast"]["trend"] =
    shift90d > 0 ? "worsening" : shift90d < 0 ? "improving" : "stable";

  return {
    current,
    projected30d: postureOrder[projected30dIdx],
    projected90d: postureOrder[projected90dIdx],
    trend,
  };
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

export function generatePredictiveInsights(
  materials: NormalizedMaterial[],
  ecus: NormalizedECU[],
  snapshot: PortfolioSnapshot,
  triggers: CircularTrigger[]
): PredictiveInsights {
  const momentum = computeRiskMomentum(materials, triggers);
  const anomalies = detectAnomalies(materials);
  const thresholdCrossings = predictThresholdCrossings(momentum);
  const actions = generateActions(materials, ecus, momentum, anomalies, triggers);
  const systemHealth = computeSystemHealth(snapshot, anomalies, thresholdCrossings);
  const portfolioForecast = forecastPosture(snapshot.riskPosture, momentum);

  return {
    momentum,
    anomalies,
    actions,
    thresholdCrossings,
    portfolioForecast,
    systemHealth,
  };
}
