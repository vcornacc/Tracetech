import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FlaskConical, Play, AlertTriangle, TrendingUp, Shield,
  Globe, FileText, Zap, BarChart3, ArrowRight, Recycle, Cpu, Link2, Factory, Bot,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { useData } from "@/hooks/useData";
import { DataPageSkeleton } from "@/components/DataPageSkeleton";
import {
  runSimulation,
  buildEcuMaterialMaps,
  SCENARIO_TEMPLATES,
  type SimulationResult,
} from "@/lib/simulationEngine";

const typeIcons: Record<string, typeof Globe> = {
  price_change: TrendingUp,
  supply_disruption: Zap,
  geopolitical_crisis: Globe,
  regulatory_change: FileText,
  demand_surge: BarChart3,
  recycling_improvement: Recycle,
  supplier_diversification: Shield,
  blockchain_traceability: Link2,
  recovery_hub: Factory,
  robotic_disassembly: Bot,
};

const severityConfig: Record<string, { label: string; class: string }> = {
  low: { label: "Low", class: "bg-success/15 text-success border-success/30" },
  medium: { label: "Medium", class: "bg-accent/15 text-accent border-accent/30" },
  high: { label: "High", class: "bg-chart-rose/15 text-chart-rose border-chart-rose/30" },
  critical: { label: "Critical", class: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function Simulation() {
  const { materialsRaw, ecuInventory, materialsLoading, ecusLoading } = useData();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (materialsLoading || ecusLoading) {
    return <DataPageSkeleton cards={3} rows={6} />;
  }

  // Build ECU-material maps from the legacy ECU data
  const ecuMaterialData = useMemo(() => {
    const flatEntries: { material_id: string; ecu_id: string; weight_grams: number }[] = [];
    for (const ecu of ecuInventory) {
      for (const mat of ecu.materials) {
        const rawMat = materialsRaw.find((m) => m.name === mat.name);
        if (rawMat) {
          flatEntries.push({
            material_id: rawMat.id,
            ecu_id: ecu.id,
            weight_grams: mat.weightGrams,
          });
        }
      }
    }
    return buildEcuMaterialMaps(flatEntries);
  }, [ecuInventory, materialsRaw]);

  const handleRunSimulation = () => {
    const template = SCENARIO_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!template || materialsRaw.length === 0) return;

    setIsRunning(true);
    // Simulate async delay for UX
    setTimeout(() => {
      const res = runSimulation(
        template.params,
        materialsRaw,
        ecuMaterialData.ecuMaterialCounts,
        ecuMaterialData.ecuMaterialGrams,
      );
      setResult(res);
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Strategic Simulation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          What-if scenarios and risk mitigation strategy modelling
        </p>
      </div>

      {/* Scenario Selector */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
              Select Scenario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SCENARIO_TEMPLATES.map((tpl) => {
              const Icon = typeIcons[tpl.params.type] ?? FlaskConical;
              const isSelected = selectedTemplate === tpl.id;
              return (
                <Card
                  key={tpl.id}
                  className={`border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedTemplate(tpl.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-xs font-medium">{tpl.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={handleRunSimulation}
            disabled={!selectedTemplate || isRunning || materialsRaw.length === 0}
            className="w-full sm:w-auto"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running simulation..." : "Run Simulation"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Impact Summary */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent" />
                  Result: {result.scenarioName}
                </CardTitle>
                <Badge variant="outline" className={severityConfig[result.severity]?.class}>
                  {severityConfig[result.severity]?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Cost Impact</p>
                  <p className={`text-lg font-bold ${result.impactSummary.totalCostImpactEuro >= 0 ? "text-destructive" : "text-success"}`}>
                    {result.impactSummary.totalCostImpactEuro >= 0 ? "+" : ""}€{Math.abs(result.impactSummary.totalCostImpactEuro).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Cost Change %</p>
                  <p className={`text-lg font-bold ${result.impactSummary.costChangePct >= 0 ? "text-destructive" : "text-success"}`}>
                    {result.impactSummary.costChangePct >= 0 ? "+" : ""}{result.impactSummary.costChangePct.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Risk Score Change</p>
                  <p className={`text-lg font-bold ${result.impactSummary.riskScoreChange >= 0 ? "text-destructive" : "text-success"}`}>
                    {result.impactSummary.riskScoreChange >= 0 ? "+" : ""}{result.impactSummary.riskScoreChange.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Affected ECUs</p>
                  <p className="text-lg font-bold text-accent">{result.impactSummary.affectedEcusCount}</p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Supply Chain Risk</p>
                  <Progress value={result.impactSummary.supplyChainInterruptionRisk} className="mt-2 h-2" />
                  <p className="text-xs mt-1 font-mono">{result.impactSummary.supplyChainInterruptionRisk}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Impacts Chart */}
          {result.materialImpacts.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Impact by Material
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={result.materialImpacts.slice(0, 10).map((m) => ({
                      name: m.name,
                      costImpact: Math.round(m.costImpactEuro),
                      riskChange: Number(m.riskChangePct.toFixed(1)),
                    }))}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222,22%,10%)",
                        border: "1px solid hsl(220,14%,20%)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      formatter={(value: number) => [`€${value.toLocaleString("en-US")}`, "Cost Impact"]}
                    />
                    <Bar dataKey="costImpact" radius={[0, 4, 4, 0]} barSize={16}>
                      {result.materialImpacts.slice(0, 10).map((m, i) => (
                        <Cell
                          key={i}
                          fill={m.costImpactEuro >= 0 ? "hsl(0,72%,55%)" : "hsl(160,70%,45%)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-secondary/30">
                      <ArrowRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                      <p className="text-xs text-muted-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
