import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import {
  Globe,
  AlertTriangle,
  Recycle,
  Shield,
  Activity,
  TrendingUp,
  BarChart3,
  Cpu,
  DollarSign,
  BellOff,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { clusterInfo } from "@/data/materialsData";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DataPageSkeleton } from "@/components/DataPageSkeleton";
import { DownloadReportSection } from "@/components/DownloadReportSection";
import { downloadExecutiveCSV, downloadDashboardReport } from "@/lib/reportDownloads";
import { buildPortfolioSnapshot, normalizeECU, normalizeMaterial } from "@/lib/dataSchema";
import { generatePredictiveInsights } from "@/lib/predictiveEngine";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const riskColors: Record<string, string> = {
  low: "hsl(160,70%,45%)",
  medium: "hsl(38,92%,55%)",
  high: "hsl(0,72%,65%)",
  critical: "hsl(0,72%,50%)",
};

function isMissingSupabaseRelationError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  const status = "status" in error ? Number(error.status) : 0;

  return status === 404 || code === "PGRST205" || /schema cache|could not find the table|404/i.test(message);
}

type AlertLogRow = Tables<"alert_log">;

interface ExecutiveAlertItem {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  label: string;
  description: string;
  timestamp: string;
  affectedECUs: number;
  source: "persisted" | "live" | "predicted";
  acknowledgedAt?: string | null;
  snoozedUntil?: string | null;
}

export default function ExecutiveDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    materials: criticalMaterials,
    ecuInventory,
    circularTriggers,
    materialsLoading,
    ecusLoading,
    triggersLoading,
    dataSource,
  } = useData();

  const alertLogQuery = useQuery({
    queryKey: ["executive-alert-log"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("alert_log")
        .select("*")
        .is("resolved_at", null)
        .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        if (isMissingSupabaseRelationError(error)) {
          return [] as AlertLogRow[];
        }
        throw error;
      }

      return (data ?? []) as AlertLogRow[];
    },
    retry: 1,
    staleTime: 3 * 60 * 1000,
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const payload: Tables<"alert_log">["Update"] = {
        acknowledged_at: new Date().toISOString(),
      };

      if (user?.id) {
        payload.acknowledged_by = user.id;
      }

      const { error } = await supabase.from("alert_log").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-alert-log"] });
      toast({ title: "Alert acknowledged", description: "Alert has been marked as acknowledged." });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to acknowledge alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alert_log")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-alert-log"] });
      toast({ title: "Alert resolved", description: "Alert has been moved out of active monitoring." });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to resolve alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const snoozeAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("alert_log")
        .update({ snoozed_until: snoozedUntil })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-alert-log"] });
      toast({ title: "Alert snoozed", description: "Alert hidden for 24 hours." });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to snooze alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (materialsLoading || ecusLoading || triggersLoading) {
    return <DataPageSkeleton cards={6} rows={8} />;
  }

  const snapshot = useMemo(
    () => buildPortfolioSnapshot(criticalMaterials, ecuInventory, circularTriggers),
    [criticalMaterials, ecuInventory, circularTriggers]
  );

  const predictive = useMemo(() => {
    const normalizedMaterials = criticalMaterials.map(normalizeMaterial);
    const normalizedEcus = ecuInventory.map(normalizeECU);
    return generatePredictiveInsights(normalizedMaterials, normalizedEcus, snapshot, circularTriggers);
  }, [criticalMaterials, ecuInventory, snapshot, circularTriggers]);

  const clusterBarData = Object.entries(clusterInfo).map(([key, info]) => ({
    name: info.label.split(" ").slice(0, 2).join(" "),
    count: criticalMaterials.filter((m) => m.cluster === key).length,
    fill: info.color,
  }));

  const countryCounts = new Map<string, number>();
  criticalMaterials.forEach((material) => {
    material.topProducers.forEach((country) => {
      countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    });
  });
  const totalCountryRefs = Array.from(countryCounts.values()).reduce((sum, count) => sum + count, 0);
  const geoDependency = Array.from(countryCounts.entries())
    .map(([country, count]) => {
      const share = totalCountryRefs > 0 ? Math.round((count / totalCountryRefs) * 100) : 0;
      const risk = share >= 20 ? "critical" : share >= 12 ? "high" : share >= 7 ? "medium" : "low";
      return { country, share, risk };
    })
    .sort((a, b) => b.share - a.share)
    .slice(0, 8);

  const recoverableByMaterial = new Map<string, number>();
  ecuInventory.forEach((ecu) => {
    if (ecu.status === "active") return;
    ecu.materials.forEach((mat) => {
      if (!mat.recoverable) return;
      recoverableByMaterial.set(mat.name, (recoverableByMaterial.get(mat.name) ?? 0) + mat.weightGrams);
    });
  });
  const recoveryKPIs = Array.from(recoverableByMaterial.entries())
    .map(([name, grams]) => ({
      label: `${name} recoverable`,
      valueKg: grams / 1000,
      targetKg: Math.max((grams / 1000) * 1.25, 0.1),
    }))
    .sort((a, b) => b.valueKg - a.valueKg)
    .slice(0, 4);

  const activeAlerts = circularTriggers.filter((trigger) => trigger.status === "active" || trigger.status === "monitoring");
  const persistedAlerts = alertLogQuery.data ?? [];

  const predictedAlertFeed = [
    ...predictive.thresholdCrossings.slice(0, 4).map((crossing) => ({
      id: `cross-${crossing.materialName}`,
      severity: crossing.projectedTier === "critical" ? "critical" : "high",
      label: `${crossing.materialName} crossing risk threshold`,
      description: `Projected to move from ${crossing.currentTier} to ${crossing.projectedTier} in ${crossing.daysUntilCrossing} days (delta ${Number(crossing.riskDelta ?? 0).toFixed(1)}).`,
      timestamp: new Date().toISOString(),
      affectedECUs: 0,
    })),
    ...predictive.anomalies
      .filter((anomaly) => anomaly.severity === "critical")
      .slice(0, 3)
      .map((anomaly) => ({
        id: `anomaly-${anomaly.materialName}-${anomaly.dimension}`,
        severity: "high",
        label: `${anomaly.materialName} anomaly in ${anomaly.dimension}`,
        description: anomaly.description,
        timestamp: new Date().toISOString(),
        affectedECUs: 0,
      })),
  ];

  const executiveAlerts: ExecutiveAlertItem[] = persistedAlerts.length > 0
    ? persistedAlerts.map((alert) => ({
        id: alert.id,
        severity: alert.severity,
        label: alert.title,
        description: alert.description ?? "No description",
        timestamp: alert.created_at,
        affectedECUs: Number((alert.metadata as Record<string, unknown> | null)?.affected_ecus ?? 0),
        source: "persisted",
        acknowledgedAt: alert.acknowledged_at,
        snoozedUntil: alert.snoozed_until,
      }))
    : [
        ...activeAlerts.map((alert) => ({
          id: alert.id,
          severity: alert.severity,
          label: alert.label,
          description: alert.description,
          timestamp: alert.timestamp,
          affectedECUs: alert.affectedECUs,
          source: "live" as const,
        })),
        ...predictedAlertFeed.map((alert) => ({ ...alert, source: "predicted" as const })),
      ].slice(0, 12);

  const totalECU = ecuInventory.length;
  const recoveredECU = ecuInventory.filter((ecu) => ecu.status === "recovered").length;
  const recoveryRate = totalECU > 0 ? Math.round((recoveredECU / totalECU) * 100) : 0;
  const avgRiskScore =
    totalECU > 0
      ? Math.round(ecuInventory.reduce((sum, ecu) => sum + ecu.riskScore, 0) / totalECU)
      : 0;
  const totalCrmValue = Math.round(ecuInventory.reduce((sum, ecu) => sum + ecu.crmValueEuro, 0));
  const highExposure = criticalMaterials.filter(
    (material) => material.yaleScore >= 60 && (material.cluster === "systemic" || material.cluster === "product")
  ).length;

  const avgVelocity = predictive.momentum.length > 0
    ? Math.round((predictive.momentum.reduce((sum, item) => sum + item.velocity, 0) / predictive.momentum.length) * 10) / 10
    : 0;

  const criticalAnomalies = predictive.anomalies.filter((a) => a.severity === "critical").length;

  const targetVsActual = [
    {
      label: "System Health",
      current: predictive.systemHealth,
      target: 80,
      unit: "/100",
    },
    {
      label: "Avg Risk Velocity",
      current: Math.max(0, Math.round((2 - avgVelocity) * 25)),
      target: 75,
      unit: " index",
    },
    {
      label: "Threshold Stability",
      current: Math.max(0, 100 - predictive.thresholdCrossings.length * 20),
      target: 90,
      unit: "%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Circular governance — TraceTech strategic overview</p>
      </div>

      {dataSource === "none" && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-6 text-sm text-muted-foreground">
            No live data available. Connect Supabase and seed records to view executive analytics.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="CRM Materials" value={criticalMaterials.length} subtitle="monitored" icon={<Activity className="w-5 h-5" />} variant="cyan" href="/materials" />
        <MetricCard title="High Exposure" value={highExposure} subtitle="Yale ≥ 60 + EU Critical" icon={<AlertTriangle className="w-5 h-5" />} variant="critical" href="/bom" />
        <MetricCard title="Tracked ECUs" value={totalECU} subtitle="in DPP system" icon={<Cpu className="w-5 h-5" />} variant="amber" href="/ecu" />
        <MetricCard title="Recovery Rate" value={`${recoveryRate}%`} subtitle="live portfolio" icon={<Recycle className="w-5 h-5" />} variant="success" href="/decision-engine" />
        <MetricCard title="Avg Risk Score" value={`${avgRiskScore}/100`} subtitle="ECU portfolio" icon={<Shield className="w-5 h-5" />} variant="critical" href="/simulation" />
        <MetricCard title="CRM Value" value={`€${totalCrmValue.toLocaleString()}`} subtitle="recoverable" icon={<DollarSign className="w-5 h-5" />} variant="cyan" href="/financial" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="System Health" value={`${predictive.systemHealth}/100`} subtitle="predictive signal" icon={<Shield className="w-5 h-5" />} variant="success" href="/executive" />
        <MetricCard title="Portfolio 30d" value={predictive.portfolioForecast.projected30d.toUpperCase()} subtitle="forecast posture" icon={<TrendingUp className="w-5 h-5" />} variant="amber" href="/simulation" />
        <MetricCard title="Portfolio 90d" value={predictive.portfolioForecast.projected90d.toUpperCase()} subtitle={predictive.portfolioForecast.trend} icon={<BarChart3 className="w-5 h-5" />} variant="critical" href="/simulation" />
        <MetricCard title="Risk Velocity" value={avgVelocity.toFixed(1)} subtitle="avg monthly drift" icon={<Activity className="w-5 h-5" />} variant="amber" href="/materials" />
        <MetricCard title="Crossings 90d" value={predictive.thresholdCrossings.length} subtitle="predicted tier shifts" icon={<AlertTriangle className="w-5 h-5" />} variant="critical" href="/simulation" />
        <MetricCard title="Critical Anomalies" value={criticalAnomalies} subtitle="portfolio outliers" icon={<Cpu className="w-5 h-5" />} variant="cyan" href="/materials" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Global CRM Exposure Map
            </CardTitle>
            <p className="text-xs text-muted-foreground">Derived from live top producer distribution</p>
          </CardHeader>
          <CardContent>
            {geoDependency.length === 0 ? (
              <p className="text-sm text-muted-foreground">No geographic dependency data in the current live dataset.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={geoDependency} layout="vertical" margin={{ left: 5, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="country" width={110} tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(222,22%,10%)", border: "1px solid hsl(220,14%,20%)", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="share" radius={[0, 4, 4, 0]} barSize={18} name="Share (%)">
                    {geoDependency.map((entry, i) => <Cell key={i} fill={riskColors[entry.risk]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Cluster Distribution & Recovery KPIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={clusterBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                  {clusterBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {recoveryKPIs.length === 0 && (
                <p className="text-xs text-muted-foreground">No recoverable material KPI data in the current live dataset.</p>
              )}
              {recoveryKPIs.map((kpi) => (
                <div key={kpi.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{kpi.label}</span>
                    <span className="font-mono">{kpi.valueKg.toFixed(2)} / {kpi.targetKg.toFixed(2)} kg</span>
                  </div>
                  <Progress value={Math.min((kpi.valueKg / kpi.targetKg) * 100, 100)} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Target vs Actual Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {targetVsActual.map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-mono">{row.current}{row.unit} / target {row.target}{row.unit}</span>
                </div>
                <Progress value={Math.min((row.current / row.target) * 100, 100)} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent" />
            Automatic Alert System
            <Badge variant="outline" className="text-[9px] bg-destructive/15 text-destructive border-destructive/30 ml-2">
              {executiveAlerts.length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executiveAlerts.length === 0 && <p className="text-xs text-muted-foreground">No active alerts in the current live dataset.</p>}
            {executiveAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  alert.severity === "critical" ? "bg-destructive animate-pulse" : alert.severity === "high" ? "bg-destructive" : "bg-accent"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium">{alert.label}</p>
                    <Badge variant="outline" className="text-[8px]">{alert.severity.toUpperCase()}</Badge>
                    {alert.source === "persisted" && alert.acknowledgedAt && (
                      <Badge variant="outline" className="text-[8px] bg-primary/10 text-primary border-primary/30">ACK</Badge>
                    )}
                    {alert.source === "persisted" && alert.snoozedUntil && new Date(alert.snoozedUntil) > new Date() && (
                      <Badge variant="outline" className="text-[8px] bg-muted text-muted-foreground border-muted-foreground/30">SNOOZED</Badge>
                    )}
                    {alert.source === "predicted" && (
                      <Badge variant="outline" className="text-[8px] bg-accent/10 text-accent border-accent/30">PREDICTIVE</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-muted-foreground">ECU: {alert.affectedECUs}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{new Date(alert.timestamp).toLocaleDateString("en-US")}</span>
                  </div>
                  {alert.source === "persisted" && (
                    <div className="flex items-center gap-2 mt-2">
                      {!alert.acknowledgedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px]"
                          onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                          disabled={acknowledgeAlertMutation.isPending || resolveAlertMutation.isPending || snoozeAlertMutation.isPending}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px]"
                        onClick={() => snoozeAlertMutation.mutate(alert.id)}
                        disabled={acknowledgeAlertMutation.isPending || resolveAlertMutation.isPending || snoozeAlertMutation.isPending}
                      >
                        <BellOff className="w-3 h-3 mr-1" />
                        Snooze 24h
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 text-[10px]"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                        disabled={acknowledgeAlertMutation.isPending || resolveAlertMutation.isPending || snoozeAlertMutation.isPending}
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DownloadReportSection
        title="Export Executive Report"
        actions={[
          { label: "Executive Report (.txt)", description: "Full strategic overview", icon: "txt", onClick: downloadDashboardReport },
          { label: "Executive Data (.csv)", description: "KPIs and exposure data", icon: "csv", onClick: downloadExecutiveCSV },
        ]}
      />
    </div>
  );
}
