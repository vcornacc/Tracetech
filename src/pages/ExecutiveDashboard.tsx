import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/MetricCard";
import {
  Globe, AlertTriangle, Recycle, Shield, TrendingUp, MapPin, Activity, BarChart3, Cpu, DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Treemap,
} from "recharts";
import { clusterInfo } from "@/data/materialsData";
import { useData } from "@/hooks/useData";
import { DataPageSkeleton } from "@/components/DataPageSkeleton";

// Geographic dependency data
const geoDependency = [
  { country: "China", materials: 18, share: 42, risk: "high" },
  { country: "Russia", materials: 8, share: 18, risk: "critical" },
  { country: "South Africa", materials: 5, share: 12, risk: "medium" },
  { country: "Congo (DRC)", materials: 3, share: 8, risk: "critical" },
  { country: "Australia", materials: 4, share: 7, risk: "low" },
  { country: "Chile", materials: 2, share: 5, risk: "low" },
  { country: "Indonesia", materials: 3, share: 4, risk: "medium" },
  { country: "Other", materials: 6, share: 4, risk: "low" },
];

const riskColors: Record<string, string> = {
  low: "hsl(160,70%,45%)", medium: "hsl(38,92%,55%)", high: "hsl(0,72%,65%)", critical: "hsl(0,72%,50%)",
};

// Recovery KPIs
const recoveryKPIs = [
  { label: "Cobalt Recovered", value: 4.2, unit: "kg/mo", target: 8, color: "hsl(0,72%,55%)" },
  { label: "Palladium Recovered", value: 0.8, unit: "kg/mo", target: 1.5, color: "hsl(38,92%,55%)" },
  { label: "Tantalum Recovered", value: 1.1, unit: "kg/mo", target: 2.0, color: "hsl(190,85%,50%)" },
  { label: "Indium Recovered", value: 0.3, unit: "kg/mo", target: 0.6, color: "hsl(270,60%,60%)" },
];

export default function ExecutiveDashboard() {
  const { materials: criticalMaterials, ecuInventory, circularTriggers, materialsLoading, ecusLoading, triggersLoading } = useData();

  if (materialsLoading || ecusLoading || triggersLoading) {
    return <DataPageSkeleton cards={6} rows={8} />;
  }

  const clusterBarData = Object.entries(clusterInfo).map(([key, info]) => ({
    name: info.label.split(" ").slice(0, 2).join(" "),
    count: criticalMaterials.filter((m) => m.cluster === key).length,
    fill: info.color,
  }));

  const activeAlerts = circularTriggers.filter((t) => t.status === "active" || t.status === "monitoring");

  const totalECU = ecuInventory.length;
  const recoveredECU = ecuInventory.filter((e) => e.status === "recovered").length;
  const avgRiskScore = Math.round(ecuInventory.reduce((s, e) => s + e.riskScore, 0) / totalECU);
  const totalCrmValue = Math.round(ecuInventory.reduce((s, e) => s + e.crmValueEuro, 0));
  const highExposure = criticalMaterials.filter((m) => m.yaleScore >= 60 && (m.cluster === "systemic" || m.cluster === "product")).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Circular governance — TraceTech strategic overview
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="CRM Materials" value={criticalMaterials.length} subtitle="monitored" icon={<Activity className="w-5 h-5" />} variant="cyan" />
        <MetricCard title="High Exposure" value={highExposure} subtitle="Yale ≥ 60 + EU Critical" icon={<AlertTriangle className="w-5 h-5" />} variant="critical" />
        <MetricCard title="Tracked ECUs" value={totalECU} subtitle="in DPP system" icon={<Cpu className="w-5 h-5" />} variant="amber" />
        <MetricCard title="Recovery Rate" value="23%" subtitle="circular average" icon={<Recycle className="w-5 h-5" />} variant="success" />
        <MetricCard title="Avg Risk Score" value={`${avgRiskScore}/100`} subtitle="ECU portfolio" icon={<Shield className="w-5 h-5" />} variant="critical" />
        <MetricCard title="CRM Value" value={`€${totalCrmValue.toLocaleString()}`} subtitle="recoverable" icon={<DollarSign className="w-5 h-5" />} variant="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Global Exposure Map (simulated as bar chart) */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Global CRM Exposure Map
            </CardTitle>
            <p className="text-xs text-muted-foreground">Geographic dependency by supply country</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={geoDependency} layout="vertical" margin={{ left: 5, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="country" width={90} tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,22%,10%)", border: "1px solid hsl(220,14%,20%)", borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="share" radius={[0, 4, 4, 0]} barSize={18} name="Share (%)">
                  {geoDependency.map((d, i) => <Cell key={i} fill={riskColors[d.risk]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cluster Distribution */}
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
                  {clusterBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {recoveryKPIs.map((kpi) => (
                <div key={kpi.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{kpi.label}</span>
                    <span className="font-mono">{kpi.value} / {kpi.target} {kpi.unit}</span>
                  </div>
                  <Progress value={(kpi.value / kpi.target) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert System */}
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
