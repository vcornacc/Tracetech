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
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  PieChart, Pie, Tooltip,
} from "recharts";
import { type CircularTrigger } from "@/data/ecuData";
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
  const { ecuInventory, circularTriggers, ecusLoading, triggersLoading } = useData();
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

  const clusterDecisionMatrix = [
    { cluster: "Systemic Dual", priority: "Selective Recovery", rationale: "Maximise recovery of high-risk CRMs", urgency: 95 },
    { cluster: "Product-Embedded", priority: "Refurbish", rationale: "Extend component lifespan with embedded CRMs", urgency: 75 },
    { cluster: "Sectoral Strategic", priority: "Reuse", rationale: "Direct reuse in sectoral applications", urgency: 60 },
    { cluster: "Operational Backbone", priority: "Repair", rationale: "Cost-effective maintenance, low CRM risk", urgency: 40 },
  ];

  const filteredTriggers = circularTriggers.filter(
    (t) => statusFilter === "all" || t.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Decision Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Event-driven decision engine for cluster-based circular path activation
        </p>
      </div>

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
                No triggers found for the selected status.
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
              {clusterDecisionMatrix.map((rule) => (
                <div key={rule.cluster} className="p-3 rounded-lg bg-secondary/20 border border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{rule.cluster}</span>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-[9px]">{rule.priority}</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{rule.rationale}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-muted-foreground">Urgency:</span>
                    <Progress value={rule.urgency} className="h-1 flex-1" />
                    <span className="text-[9px] font-mono">{rule.urgency}%</span>
                  </div>
                </div>
              ))}
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
              { label: "ECUs in Pipeline", value: ecuInventory.filter((e) => e.status === "eol" || e.status === "in_recovery").length, unit: "units" },
              { label: "Recoverable CRM", value: `${Math.round(ecuInventory.filter((e) => e.status !== "active").reduce((s, e) => s + e.crmContentGrams, 0))} g`, unit: "" },
              { label: "Procurement Reduction", value: "12%", unit: "vs baseline" },
              { label: "Active Flows", value: "3", unit: "reverse logistics" },
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

      {/* Robotics & Predictive placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Robotic Disassembly
              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30">Simulation</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Throughput</span><span className="font-mono">42 ECU/day</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Success Rate</span><span className="font-mono text-success">94.2%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Average Time</span><span className="font-mono">18 min/ECU</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Active Stations</span><span className="font-mono">3/4</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Predictive Analytics
              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30">Simulation</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Incoming ECUs (Q2)</span><span className="font-mono">~320 units</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Expected Cobalt</span><span className="font-mono">4.2 kg</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Flow Stability</span><span className="font-mono text-accent">72%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Model Accuracy</span><span className="font-mono text-success">89%</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
