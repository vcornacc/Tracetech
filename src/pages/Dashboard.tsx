import { useMemo } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DownloadReportSection } from "@/components/DownloadReportSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  AlertTriangle,
  Recycle,
  Globe,
  Database,
  BarChart3,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

import { clusterInfo } from "@/data/materialsData";
import { useData } from "@/hooks/useData";
import { downloadDashboardCSV, downloadDashboardReport } from "@/lib/reportDownloads";
import { DataPageSkeleton } from "@/components/DataPageSkeleton";

// New intelligence layer
import { buildPortfolioSnapshot, normalizeMaterial, normalizeECU } from "@/lib/dataSchema";
import { generatePredictiveInsights } from "@/lib/predictiveEngine";
import { AdaptiveDashboardHeader } from "@/components/AdaptiveDashboardHeader";
import { CommandCenter } from "@/components/CommandCenter";
import { RiskMomentumPanel } from "@/components/RiskMomentumPanel";
import { PortfolioForecast } from "@/components/PortfolioForecast";
import { AnomalyRadar } from "@/components/AnomalyRadar";

const clusterColors: Record<string, string> = Object.fromEntries(
  Object.entries(clusterInfo).map(([k, v]) => [k, v.color])
);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-sm">{d.name}</p>
        <p className="text-xs text-muted-foreground">Yale Score: {d.yale}</p>
        <p className="text-xs text-muted-foreground">EU SR×EI: {d.euSR}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { materials: criticalMaterials, ecuInventory, circularTriggers, materialsLoading, triggersLoading, dataSource } = useData();

  // ── Source of Truth: Normalized data + Predictive Intelligence ──
  const { snapshot, insights } = useMemo(() => {
    const snap = buildPortfolioSnapshot(criticalMaterials, ecuInventory, circularTriggers);
    const normalizedMats = criticalMaterials.map(normalizeMaterial);
    const normalizedEcus = ecuInventory.map(normalizeECU);
    const ins = generatePredictiveInsights(normalizedMats, normalizedEcus, snap, circularTriggers);
    return { snapshot: snap, insights: ins };
  }, [criticalMaterials, ecuInventory, circularTriggers]);

  if (materialsLoading) {
    return <DataPageSkeleton cards={4} rows={8} />;
  }

  const matrixData = criticalMaterials.map((m) => ({
    name: m.name,
    yale: m.yaleScore,
    euSR: m.euSRxEI,
    cluster: m.cluster,
  }));

  const clusterBarData = Object.entries(clusterInfo).map(([key, info]) => ({
    name: info.label.split(" ").slice(0, 2).join(" "),
    count: criticalMaterials.filter((m) => m.cluster === key).length,
    fill: info.color,
  }));

  const radarData = criticalMaterials.length > 0
    ? criticalMaterials[0].riskProfile.map((_, i) => {
        const subject = criticalMaterials[0].riskProfile[i].subject;
        const avg = Math.round(
          criticalMaterials.reduce((sum, m) => sum + m.riskProfile[i].value, 0) / criticalMaterials.length
        );
        return { subject, A: avg };
      })
    : [];

  return (
    <div className="space-y-6">
      {/* ═══ ADAPTIVE HEADER — context-aware greeting + system pulse ═══ */}
      <AdaptiveDashboardHeader snapshot={snapshot} insights={insights} />

      {dataSource === "none" && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-6 text-sm text-muted-foreground">
            No live data available. Connect Supabase and seed records to view dashboard analytics.
          </CardContent>
        </Card>
      )}

      {/* ═══ KPI ROW — now with trend data from predictive engine ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tracked Materials"
          value={snapshot.totalMaterials}
          subtitle={`${snapshot.systemicCount} systemic · ${snapshot.productCount} product`}
          icon={<Database className="w-5 h-5" />}
          variant="cyan"
          href="/materials"
        />
        <MetricCard
          title="High Exposure"
          value={snapshot.criticalMaterials + snapshot.highRiskMaterials}
          subtitle={`${snapshot.criticalMaterials} critical · ${snapshot.highRiskMaterials} high risk`}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="critical"
          href="/bom"
          trend={insights.thresholdCrossings.length > 0
            ? { value: insights.thresholdCrossings.length, label: "crossings in 90d" }
            : undefined
          }
        />
        <MetricCard
          title="Recovery Rate"
          value={`${snapshot.avgRecoveryRate}%`}
          subtitle={`${snapshot.ecuNeedingAction} ECUs need action`}
          icon={<Recycle className="w-5 h-5" />}
          variant="success"
          href="/ecu"
        />
        <MetricCard
          title="Portfolio Risk"
          value={`${snapshot.avgCompositeRisk}`}
          subtitle={`max: ${snapshot.maxCompositeRisk} · ${insights.actions.length} actions`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="amber"
          href="/executive"
          trend={insights.portfolioForecast.trend === "worsening"
            ? { value: Math.round(snapshot.avgCompositeRisk * 0.08), label: "projected 90d" }
            : insights.portfolioForecast.trend === "improving"
            ? { value: -Math.round(snapshot.avgCompositeRisk * 0.05), label: "projected 90d" }
            : undefined
          }
        />
      </div>

      {/* ═══ INTELLIGENCE ROW — Forecast + Command Center ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio Forecast — where are we heading? */}
        <PortfolioForecast
          forecast={insights.portfolioForecast}
          thresholdCrossings={insights.thresholdCrossings.length}
          anomalyCount={insights.anomalies.filter((a) => a.severity === "critical").length}
        />

        {/* Command Center — what to do about it */}
        <div className="lg:col-span-2">
          <CommandCenter actions={insights.actions} maxVisible={5} />
        </div>
      </div>

      {/* ═══ PREDICTIVE ROW — Risk Momentum + Anomalies ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskMomentumPanel momentum={insights.momentum} maxVisible={10} />
        <AnomalyRadar anomalies={insights.anomalies} maxVisible={6} />
      </div>

      {/* ═══ ANALYTICS ROW — Traditional charts (enhanced) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Criticality Matrix */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              2D Criticality Matrix
            </CardTitle>
            <p className="text-xs text-muted-foreground">Yale Score vs EU Supply Risk × Economic Importance</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis
                  type="number"
                  dataKey="euSR"
                  name="EU SR×EI"
                  domain={[1, 5]}
                  tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                  label={{ value: "EU SR × EI", position: "bottom", fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="yale"
                  name="Yale Score"
                  domain={[30, 100]}
                  tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                  label={{ value: "Yale Score", angle: -90, position: "insideLeft", fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={matrixData} fill="hsl(190, 85%, 50%)">
                  {matrixData.map((entry, i) => (
                    <Cell key={i} fill={clusterColors[entry.cluster]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-3 px-2">
              {[
                { label: "Systemic Dual Exposure", color: clusterColors.systemic },
                { label: "Product-Embedded", color: clusterColors.product },
                { label: "Sectoral Strategic", color: clusterColors.sectoral },
                { label: "Operational Backbone", color: clusterColors.operational },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Radar */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 14%, 18%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Risk"
                  dataKey="A"
                  stroke="hsl(190, 85%, 50%)"
                  fill="hsl(190, 85%, 50%)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ═══ BOTTOM ROW — Cluster + Alerts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cluster Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Cluster Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clusterBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {clusterBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alert Feed — enhanced with severity awareness */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent" />
              Active Alerts
              {snapshot.activeTriggers > 0 && (
                <span className="ml-auto text-[10px] font-mono text-destructive">
                  {snapshot.activeTriggers} active
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!triggersLoading && snapshot.activeAlerts.length === 0 && (
                <p className="text-xs text-muted-foreground">No active alerts. Portfolio within normal parameters.</p>
              )}
              {snapshot.activeAlerts.slice(0, 4).map((trigger, i) => (
                <div key={trigger.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      trigger.severity === "critical"
                        ? "bg-destructive animate-pulse"
                        : trigger.severity === "high"
                        ? "bg-destructive"
                        : trigger.severity === "medium"
                        ? "bg-accent"
                        : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium leading-relaxed">{trigger.label}</p>
                      <span className={`text-[9px] uppercase font-mono tracking-wider ${
                        trigger.severity === "critical" ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        {trigger.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{trigger.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {trigger.affectedECUs} ECUs · {trigger.affectedMaterials.join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Download Report */}
      <DownloadReportSection
        title="Export Executive Report"
        actions={[
          { label: "Full Report (.txt)", description: "Executive text report", icon: "txt", onClick: downloadDashboardReport },
          { label: "Materials Data (.csv)", description: "Export data to CSV", icon: "csv", onClick: downloadDashboardCSV },
        ]}
      />
    </div>
  );
}
