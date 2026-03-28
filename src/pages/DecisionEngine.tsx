import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, Zap, Globe, TrendingUp, FileText, Shield,
  Recycle, Wrench, RefreshCw, Cpu, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, Cell,
  PieChart, Pie, Tooltip,
} from "recharts";
import { useData } from "@/hooks/useData";
import { DataPageSkeleton } from "@/components/DataPageSkeleton";

const triggerIcons: Record<string, typeof Zap> = {
  eol_vehicle: Cpu,
  component_replacement: Wrench,
  geopolitical_shock: Globe,
  price_volatility: TrendingUp,
  regulatory_update: FileText,
};

const severityConfig: Record<string, { label: string; class: string }> = {
  low: { label: "Low", class: "bg-success/15 text-success border-success/30" },
  medium: { label: "Medium", class: "bg-accent/15 text-accent border-accent/30" },
  high: { label: "High", class: "bg-chart-rose/15 text-chart-rose border-chart-rose/30" },
  critical: { label: "Critical", class: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function DecisionEngine() {
  const { ecuInventory, circularTriggers, ecusLoading, triggersLoading, dataSource } = useData();
  const [statusFilter, setStatusFilter] = useState("all");

  if (ecusLoading || triggersLoading) {
    return <DataPageSkeleton cards={3} rows={7} />;
  }

  const pathDistribution = [
    { name: "Repair", value: ecuInventory.filter((e) => e.circularPath === "repair").length, color: "hsl(160,70%,45%)" },
    { name: "Reuse", value: ecuInventory.filter((e) => e.circularPath === "reuse").length, color: "hsl(190,85%,50%)" },
    { name: "Refurbish", value: ecuInventory.filter((e) => e.circularPath === "refurbish").length, color: "hsl(38,92%,55%)" },
    { name: "Selective Recovery", value: ecuInventory.filter((e) => e.circularPath === "selective_recovery").length, color: "hsl(270,60%,60%)" },
    { name: "Pending", value: ecuInventory.filter((e) => e.circularPath === "pending").length, color: "hsl(215,15%,40%)" },
  ];

  const riskBuckets = [
    {
      bucket: "Critical Risk (>= 75)",
      items: ecuInventory.filter((e) => e.riskScore >= 75),
      priority: "Selective Recovery",
      rationale: "Focus on CRM extraction from highest-risk units",
    },
    {
      bucket: "High Risk (60-74)",
      items: ecuInventory.filter((e) => e.riskScore >= 60 && e.riskScore < 75),
      priority: "Refurbish",
      rationale: "Preserve value while reducing replacement demand",
    },
    {
      bucket: "Medium Risk (40-59)",
      items: ecuInventory.filter((e) => e.riskScore >= 40 && e.riskScore < 60),
      priority: "Reuse",
      rationale: "Redeploy healthy units in compatible platforms",
    },
    {
      bucket: "Low Risk (< 40)",
      items: ecuInventory.filter((e) => e.riskScore < 40),
      priority: "Repair",
      rationale: "Extend service life with low intervention cost",
    },
  ];

  const decisionMatrix = riskBuckets
    .map((bucket) => {
      const count = bucket.items.length;
      const avgRisk = count > 0 ? Math.round(bucket.items.reduce((sum, ecu) => sum + ecu.riskScore, 0) / count) : 0;
      const avgHealth = count > 0 ? Math.round(bucket.items.reduce((sum, ecu) => sum + ecu.healthScore, 0) / count) : 0;
      const urgency = Math.min(100, avgRisk);

      return {
        bucket: bucket.bucket,
        count,
        avgRisk,
        avgHealth,
        priority: bucket.priority,
        rationale: bucket.rationale,
        urgency,
      };
    })
    .filter((row) => row.count > 0);

  const filteredTriggers = circularTriggers.filter(
    (t) => statusFilter === "all" || t.status === statusFilter
  );

  const ecusInPipeline = ecuInventory.filter((e) => e.status === "eol" || e.status === "in_recovery").length;
  const totalCrmGrams = ecuInventory.reduce((sum, ecu) => sum + ecu.crmContentGrams, 0);
  const recoverableCrmGrams = ecuInventory
    .filter((e) => e.status !== "active")
    .reduce((sum, ecu) => sum + ecu.crmContentGrams, 0);
  const recoverableShare = totalCrmGrams > 0 ? Math.round((recoverableCrmGrams / totalCrmGrams) * 100) : 0;
  const activeFlows = new Set(
    ecuInventory
      .filter((e) => e.circularPath !== "pending")
      .map((e) => e.circularPath)
  ).size;

  const avgRecoveryRate =
    ecuInventory.length > 0
      ? Math.round(ecuInventory.reduce((sum, ecu) => sum + ecu.recoveryRate, 0) / ecuInventory.length)
      : 0;
  const avgRemainingLife =
    ecuInventory.filter((e) => e.status === "active").length > 0
      ? Math.round(
          ecuInventory
            .filter((e) => e.status === "active")
            .reduce((sum, ecu) => sum + ecu.remainingLifeMonths, 0) /
            ecuInventory.filter((e) => e.status === "active").length
        )
      : 0;
  const maintenanceUnits = ecuInventory.filter((e) => e.status === "maintenance").length;
  const highRiskUnits = ecuInventory.filter((e) => e.riskScore >= 75).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Decision Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Event-driven decision engine for cluster-based circular path activation
        </p>
      </div>

      {dataSource === "none" && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-6 text-sm text-muted-foreground">
            No live data available. Connect Supabase and seed records to view decision analytics.
          </CardContent>
        </Card>
      )}

      {/* Active Triggers */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Active Triggers
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTriggers.map((trigger) => {
              const Icon = triggerIcons[trigger.type] || AlertTriangle;
              const sev = severityConfig[trigger.severity];
              return (
                <div key={trigger.id} className="p-4 rounded-lg bg-secondary/20 border border-border/30 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{trigger.label}</p>
                          <Badge variant="outline" className={`text-[9px] ${sev.class}`}>{sev.label}</Badge>
                          <Badge variant="outline" className="text-[9px]">{trigger.status === "active" ? "Active" : trigger.status === "monitoring" ? "Monitoring" : "Resolved"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{trigger.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
                    <span>Affected ECUs: <strong className="text-foreground">{trigger.affectedECUs}</strong></span>
                    <span>Materials: {trigger.affectedMaterials.map((m) => (
                      <Badge key={m} variant="outline" className="text-[8px] mx-0.5 px-1">{m}</Badge>
                    ))}</span>
                    <span className="font-mono">{new Date(trigger.timestamp).toLocaleDateString("en-US")}</span>
                  </div>
                </div>
              );
            })}
            {filteredTriggers.length === 0 && (
              <div className="p-6 rounded-lg bg-secondary/20 border border-border/30 text-center text-sm text-muted-foreground">
                No trigger records match the selected status.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Circular Path Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Recycle className="w-4 h-4 text-primary" />
              Circular Path Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pathDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                  {pathDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,22%,10%)", border: "1px solid hsl(220,14%,20%)", borderRadius: "8px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cluster Decision Matrix */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Cluster-Based Decision Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {decisionMatrix.map((rule) => (
                <div key={rule.bucket} className="p-3 rounded-lg bg-secondary/20 border border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{rule.bucket}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px]">{rule.count} ECUs</Badge>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-[9px]">{rule.priority}</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{rule.rationale}</p>
                  <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                    <span>Avg Risk: <strong className="text-foreground">{rule.avgRisk}</strong></span>
                    <span>Avg Health: <strong className="text-foreground">{rule.avgHealth}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-muted-foreground">Urgency:</span>
                    <Progress value={rule.urgency} className="h-1 flex-1" />
                    <span className="text-[9px] font-mono">{rule.urgency}%</span>
                  </div>
                </div>
              ))}
              {decisionMatrix.length === 0 && (
                <p className="text-xs text-muted-foreground">No ECU risk data in the current live dataset.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Inventory Pool */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Secondary Inventory Pool
          </CardTitle>
          <p className="text-xs text-muted-foreground">Secondary material pool status for upstream reintegration</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "ECUs in Pipeline", value: ecusInPipeline, unit: "units" },
              { label: "Recoverable CRM", value: `${Math.round(recoverableCrmGrams)} g`, unit: "available" },
              { label: "Recoverable Share", value: `${recoverableShare}%`, unit: "of CRM tracked" },
              { label: "Active Flows", value: activeFlows, unit: "circular paths" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-lg font-bold mt-1">{item.value}</p>
                {item.unit && <p className="text-[10px] text-muted-foreground">{item.unit}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live operational metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Recovery Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Avg Recovery Rate</span><span className="font-mono">{avgRecoveryRate}%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Recovered Units</span><span className="font-mono text-success">{ecuInventory.filter((e) => e.status === "recovered").length}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">In-Recovery Units</span><span className="font-mono">{ecuInventory.filter((e) => e.status === "in_recovery").length}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Pending Path Units</span><span className="font-mono">{ecuInventory.filter((e) => e.circularPath === "pending").length}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Fleet Health Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Avg Remaining Life (active)</span><span className="font-mono">{avgRemainingLife} months</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Maintenance Units</span><span className="font-mono">{maintenanceUnits}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">High Risk Units</span><span className="font-mono text-accent">{highRiskUnits}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Tracked ECUs</span><span className="font-mono text-success">{ecuInventory.length}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
