import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/MetricCard";
import {
  Globe,
  AlertTriangle,
  Recycle,
  Shield,
  Activity,
  BarChart3,
  Cpu,
  DollarSign,
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
import { DataPageSkeleton } from "@/components/DataPageSkeleton";

const riskColors: Record<string, string> = {
  low: "hsl(160,70%,45%)",
  medium: "hsl(38,92%,55%)",
  high: "hsl(0,72%,65%)",
  critical: "hsl(0,72%,50%)",
};

export default function ExecutiveDashboard() {
  const {
    materials: criticalMaterials,
    ecuInventory,
    circularTriggers,
    materialsLoading,
    ecusLoading,
    triggersLoading,
    dataSource,
  } = useData();

  if (materialsLoading || ecusLoading || triggersLoading) {
    return <DataPageSkeleton cards={6} rows={8} />;
  }

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
        <MetricCard title="CRM Materials" value={criticalMaterials.length} subtitle="monitored" icon={<Activity className="w-5 h-5" />} variant="cyan" />
        <MetricCard title="High Exposure" value={highExposure} subtitle="Yale ≥ 60 + EU Critical" icon={<AlertTriangle className="w-5 h-5" />} variant="critical" />
        <MetricCard title="Tracked ECUs" value={totalECU} subtitle="in DPP system" icon={<Cpu className="w-5 h-5" />} variant="amber" />
        <MetricCard title="Recovery Rate" value={`${recoveryRate}%`} subtitle="live portfolio" icon={<Recycle className="w-5 h-5" />} variant="success" />
        <MetricCard title="Avg Risk Score" value={`${avgRiskScore}/100`} subtitle="ECU portfolio" icon={<Shield className="w-5 h-5" />} variant="critical" />
        <MetricCard title="CRM Value" value={`€${totalCrmValue.toLocaleString()}`} subtitle="recoverable" icon={<DollarSign className="w-5 h-5" />} variant="cyan" />
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
            <AlertTriangle className="w-4 h-4 text-accent" />
            Automatic Alert System
            <Badge variant="outline" className="text-[9px] bg-destructive/15 text-destructive border-destructive/30 ml-2">
              {activeAlerts.length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeAlerts.length === 0 && <p className="text-xs text-muted-foreground">No active alerts in the current live dataset.</p>}
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  alert.severity === "critical" ? "bg-destructive animate-pulse" : alert.severity === "high" ? "bg-destructive" : "bg-accent"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium">{alert.label}</p>
                    <Badge variant="outline" className="text-[8px]">{alert.severity.toUpperCase()}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-muted-foreground">ECU: {alert.affectedECUs}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{new Date(alert.timestamp).toLocaleDateString("en-US")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
