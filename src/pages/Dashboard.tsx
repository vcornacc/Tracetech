import { useMemo } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DownloadReportSection } from "@/components/DownloadReportSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  AlertTriangle,
  Recycle,
  Database,
  BarChart3,
  TrendingUp,
  RotateCcw,
  RefreshCw,
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
} from "recharts";

import { clusterInfo } from "@/data/materialsData";
import { useData } from "@/hooks/useData";
import { downloadDashboardCSV, downloadDashboardReport } from "@/lib/reportDownloads";
import { DataPageSkeleton } from "@/components/DataPageSkeleton";
import { buildPortfolioSnapshot } from "@/lib/dataSchema";

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
        <p className="text-xs text-muted-foreground">EU SRxEI: {d.euSR}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const {
    materials: criticalMaterials,
    ecuInventory,
    circularTriggers,
    materialsLoading,
    triggersLoading,
    dataSource,
    isZeroTestMode,
    enableZeroTestMode,
    disableZeroTestMode,
  } = useData();
  const { toast } = useToast();

  const snapshot = useMemo(
    () => buildPortfolioSnapshot(criticalMaterials, ecuInventory, circularTriggers),
    [criticalMaterials, ecuInventory, circularTriggers]
  );

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

  const activeAlerts = snapshot.activeAlerts.slice(0, 6);

  const handleResetForTests = () => {
    enableZeroTestMode();
    toast({
      title: "Dashboard reset per test",
      description: "Tutte le metriche sono state azzerate in modalita test.",
    });
  };

  const handleRestoreData = () => {
    disableZeroTestMode();
    toast({
      title: "Dati ripristinati",
      description: "La dashboard ora usa di nuovo i dati reali.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vista operativa essenziale con sole metriche reali di materiali, ECU e alert.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleResetForTests}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Test
          </Button>
          {isZeroTestMode && (
            <Button variant="outline" size="sm" onClick={handleRestoreData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Ripristina Dati
            </Button>
          )}
        </div>
      </div>

      {isZeroTestMode && (
        <Card className="border-accent/40 bg-accent/10">
          <CardContent className="py-3 text-sm">
            Modalita test attiva: dashboard azzerata a zero per i test di regressione UI.
          </CardContent>
        </Card>
      )}

      {dataSource === "none" && !isZeroTestMode && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-6 text-sm text-muted-foreground">
            No live data available. Connect Supabase and seed records to view dashboard analytics.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tracked Materials"
          value={snapshot.totalMaterials}
          subtitle={`${snapshot.systemicCount} systemic - ${snapshot.productCount} product`}
          icon={<Database className="w-5 h-5" />}
          variant="cyan"
          href="/materials"
        />
        <MetricCard
          title="High Exposure"
          value={snapshot.criticalMaterials + snapshot.highRiskMaterials}
          subtitle={`${snapshot.criticalMaterials} critical - ${snapshot.highRiskMaterials} high risk`}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="critical"
          href="/bom"
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
          subtitle={`max: ${snapshot.maxCompositeRisk}`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="amber"
          href="/executive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Criticality Matrix
            </CardTitle>
            <p className="text-xs text-muted-foreground">Yale Score vs EU Supply Risk x Economic Importance</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis
                  type="number"
                  dataKey="euSR"
                  name="EU SRxEI"
                  domain={[1, 5]}
                  tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="yale"
                  name="Yale Score"
                  domain={[30, 100]}
                  tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={matrixData}>
                  {matrixData.map((entry, i) => (
                    <Cell key={i} fill={clusterColors[entry.cluster]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Cluster Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={clusterBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {clusterBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent" />
            Active Alerts
            {snapshot.activeTriggers > 0 && (
              <span className="ml-auto text-[10px] font-mono text-destructive">{snapshot.activeTriggers} active</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!triggersLoading && activeAlerts.length === 0 && (
              <p className="text-xs text-muted-foreground">No active alerts. Portfolio within normal parameters.</p>
            )}
            {activeAlerts.map((trigger) => (
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
                    <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">{trigger.severity}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{trigger.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {trigger.affectedECUs} ECUs - {trigger.affectedMaterials.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DownloadReportSection
        title="Export Dashboard Report"
        actions={[
          { label: "Full Report (.txt)", description: "Executive text report", icon: "txt", onClick: downloadDashboardReport },
          { label: "Materials Data (.csv)", description: "Export data to CSV", icon: "csv", onClick: downloadDashboardCSV },
        ]}
      />
    </div>
  );
}
