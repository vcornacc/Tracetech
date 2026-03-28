import { MetricCard } from "@/components/MetricCard";
import { DownloadReportSection } from "@/components/DownloadReportSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Recycle,
  Globe,
  Database,
  BarChart3,
  Activity,
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

import { criticalMaterials as fallbackMaterials, clusterInfo } from "@/data/materialsData";
import { useData } from "@/hooks/useData";
import { downloadDashboardCSV, downloadDashboardReport } from "@/lib/reportDownloads";

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
  const { materials: criticalMaterials, dataSource } = useData();

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Executive</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panoramica rischio materie prime critiche — aggiornamento in tempo reale
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Materiali Monitorati"
          value={criticalMaterials.length}
          subtitle="da Bosch Circuit BOM"
          icon={<Database className="w-5 h-5" />}
          variant="cyan"
          href="/materials"
        />
        <MetricCard
          title="Alta Esposizione"
          value={criticalMaterials.filter((m) => m.yaleScore >= 60 && (m.cluster === "systemic" || m.cluster === "product")).length}
          subtitle="Yale ≥ 60 + EU Critical"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="critical"
          trend={{ value: -8, label: "vs Q3" }}
        />
        <MetricCard
          title="Recovery Rate"
          value="23%"
          subtitle="media circolare"
          icon={<Recycle className="w-5 h-5" />}
          variant="success"
          trend={{ value: 5, label: "vs Q3" }}
        />
        <MetricCard
          title="Rischio Geopolitico"
          value="72/100"
          subtitle="indice concentrazione"
          icon={<Globe className="w-5 h-5" />}
          variant="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Criticality Matrix */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Matrice di Criticità 2D
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
                {/* Threshold lines */}
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
              Profilo di Rischio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 14%, 18%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Rischio"
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cluster Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Distribuzione Cluster
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

        {/* Alert Feed */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent" />
              Alert Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { level: "critical", msg: "Cobalto: Yale Score superato soglia 80 — cluster Systemic Dual", time: "2h fa" },
                { level: "warning", msg: "Litio: HHI in aumento (+12%) — concentrazione Australia/Cile", time: "5h fa" },
                { level: "info", msg: "Terre Rare: nuovo fornitore qualificato riduce HHI del 4%", time: "1g fa" },
                { level: "warning", msg: "Platino: volatilità prezzo +18% nell'ultimo trimestre", time: "2g fa" },
              ].map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      alert.level === "critical"
                        ? "bg-destructive"
                        : alert.level === "warning"
                        ? "bg-accent"
                        : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed">{alert.msg}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Download Report */}
      <DownloadReportSection
        title="Esporta Report Executive"
        actions={[
          { label: "Report Completo (.txt)", description: "Report executive testuale", icon: "txt", onClick: downloadDashboardReport },
          { label: "Dati Materiali (.csv)", description: "Esporta dati in CSV", icon: "csv", onClick: downloadDashboardCSV },
        ]}
      />
    </div>
  );
}
