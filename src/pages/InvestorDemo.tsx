import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataPageSkeleton } from "@/components/DataPageSkeleton";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { buildPortfolioSnapshot } from "@/lib/dataSchema";
import { buildEcuMaterialMaps, runSimulation, SCENARIO_TEMPLATES, type SimulationResult } from "@/lib/simulationEngine";
import { downloadInvestorDemoCSV, downloadInvestorDemoReport } from "@/lib/reportDownloads";
import { supabase } from "@/integrations/supabase/client";
import {
  Rocket,
  Play,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Shield,
  Cpu,
  GitCompare,
} from "lucide-react";

interface DemoStep {
  id: number;
  title: string;
  description: string;
}

const DEMO_STEPS: DemoStep[] = [
  { id: 1, title: "Load Portfolio Baseline", description: "Read live CRM, ECU, and trigger dataset" },
  { id: 2, title: "Compute Risk Baseline", description: "Build baseline posture and key investor KPIs" },
  { id: 3, title: "Run Stress Scenario", description: "Execute deterministic supply disruption scenario" },
  { id: 4, title: "Quantify Financial Delta", description: "Calculate portfolio cost and risk deltas" },
  { id: 5, title: "Generate Action Plan", description: "Output top strategic actions and investor narrative" },
];

export default function InvestorDemo() {
  const { materialsRaw, materials, ecuInventory, circularTriggers, materialsLoading, ecusLoading } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Fetch last 2 scenario_history entries for comparison view
  const { data: scenarioHistory } = useQuery({
    queryKey: ["scenario_history", "last2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scenario_history")
        .select("id, scenario_name, kpi_snapshot, created_at")
        .eq("source", "investor-demo")
        .order("created_at", { ascending: false })
        .limit(2);
      return data ?? [];
    },
  });

  // Fetch last-7-days refresh health for reliability metrics in export
  const sevenDaysAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), []);
  const { data: refreshLogs } = useQuery({
    queryKey: ["data_refresh_log", "last7d"],
    queryFn: async () => {
      const { data } = await supabase
        .from("data_refresh_log")
        .select("source, status, rows_affected, finished_at")
        .gte("created_at", sevenDaysAgo)
        .order("finished_at", { ascending: false });
      return data ?? [];
    },
  });

  const refreshHealth = useMemo(() => {
    if (!refreshLogs || refreshLogs.length === 0) return null;
    const total = refreshLogs.length;
    const successes = refreshLogs.filter((r) => r.status === "success").length;
    const lastRun = refreshLogs[0]?.finished_at ?? null;
    return { total, successes, failures: total - successes, successRate: Math.round((successes / total) * 100), lastRun };
  }, [refreshLogs]);

  if (materialsLoading || ecusLoading) {
    return <DataPageSkeleton cards={6} rows={10} />;
  }

  const baseline = useMemo(
    () => buildPortfolioSnapshot(materials, ecuInventory, circularTriggers),
    [materials, ecuInventory, circularTriggers]
  );

  const ecuMaterialData = useMemo(() => {
    const flatEntries: { material_id: string; ecu_id: string; weight_grams: number }[] = [];
    for (const ecu of ecuInventory) {
      for (const mat of ecu.materials) {
        const rawMat = materialsRaw.find((m) => m.name === mat.name);
        if (rawMat) {
          flatEntries.push({ material_id: rawMat.id, ecu_id: ecu.id, weight_grams: mat.weightGrams });
        }
      }
    }
    return buildEcuMaterialMaps(flatEntries);
  }, [ecuInventory, materialsRaw]);

  const scenarioTemplate = SCENARIO_TEMPLATES.find((tpl) => tpl.id === "drc-crisis") ?? SCENARIO_TEMPLATES[0];

  const persistScenarioHistory = async (simulationResult: SimulationResult) => {
    if (!user?.id || !scenarioTemplate) {
      return false;
    }

    // Deduplication: skip if same scenario was already saved within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("scenario_history")
      .select("id")
      .eq("scenario_name", scenarioTemplate.name)
      .eq("source", "investor-demo")
      .eq("created_by", user.id)
      .gte("created_at", fiveMinutesAgo)
      .limit(1);
    if (recent && recent.length > 0) {
      return "duplicate" as const;
    }

    const { error } = await supabase.from("scenario_history").insert({
      scenario_name: scenarioTemplate.name,
      source: "investor-demo",
      created_by: user.id,
      parameters: scenarioTemplate.params as unknown as Record<string, unknown>,
      kpi_snapshot: {
        baseline: {
          riskPosture: baseline.riskPosture,
          avgCompositeRisk: baseline.avgCompositeRisk,
          totalMaterials: baseline.totalMaterials,
          totalECUs: baseline.totalECUs,
          totalCrmValue: baseline.totalCrmValue,
        },
        result: {
          severity: simulationResult.severity,
          costImpactEuro: simulationResult.impactSummary.totalCostImpactEuro,
          costChangePct: simulationResult.impactSummary.costChangePct,
          riskScoreChange: simulationResult.impactSummary.riskScoreChange,
          affectedEcusCount: simulationResult.impactSummary.affectedEcusCount,
          affectedMaterialsCount: simulationResult.impactSummary.affectedMaterialsCount,
          supplyChainInterruptionRisk: simulationResult.impactSummary.supplyChainInterruptionRisk,
        },
      },
    });

    if (error) {
      return false;
    }

    return true;
  };

  const handleRunDemo = () => {
    if (!scenarioTemplate || materialsRaw.length === 0) return;

    setIsRunning(true);
    setTimeout(() => {
      void (async () => {
        const simulationResult = runSimulation(
          scenarioTemplate.params,
          materialsRaw,
          ecuMaterialData.ecuMaterialCounts,
          ecuMaterialData.ecuMaterialGrams
        );
        setResult(simulationResult);
        downloadInvestorDemoReport(baseline, simulationResult, scenarioTemplate.name, refreshHealth ?? undefined);
        downloadInvestorDemoCSV(baseline, simulationResult, scenarioTemplate.name, refreshHealth ?? undefined);

        const persisted = await persistScenarioHistory(simulationResult);
        if (persisted === "duplicate") {
          toast({
            title: "Scenario already saved",
            description: "A snapshot for this scenario was saved less than 5 minutes ago — skipping duplicate.",
          });
        } else if (persisted) {
          void queryClient.invalidateQueries({ queryKey: ["scenario_history", "last2"] });
          toast({
            title: "Scenario snapshot saved",
            description: "Investor Demo run has been stored in scenario_history.",
          });
        } else {
          toast({
            title: "Scenario snapshot skipped",
            description: "No authenticated user session available for scenario_history insert.",
          });
        }

        setIsRunning(false);
      })();
    }, 750);
  };

  const completedSteps = result ? DEMO_STEPS.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investor Demo Mode</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One-click deterministic walkthrough for risk, financial impact, and strategic recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRunDemo} disabled={isRunning || materialsRaw.length === 0}>
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running Demo..." : "Run One-Click Demo"}
          </Button>
          <Button variant="outline" onClick={() => setResult(null)} disabled={isRunning || !result}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            Demo Scenario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">{scenarioTemplate?.name}</p>
          <p className="text-xs text-muted-foreground">{scenarioTemplate?.description}</p>
          <Badge variant="outline" className="text-[10px] mt-1">Deterministic investor flow</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Execution Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_STEPS.map((step) => {
                const done = step.id <= completedSteps;
                return (
                  <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="mt-0.5">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{step.id}. {step.title}</p>
                      <p className="text-[11px] text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono">{completedSteps}/5</span>
              </div>
              <Progress value={(completedSteps / DEMO_STEPS.length) * 100} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Baseline Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Portfolio posture</span><span className="font-semibold uppercase">{baseline.riskPosture}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tracked materials</span><span className="font-mono">{baseline.totalMaterials}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tracked ECUs</span><span className="font-mono">{baseline.totalECUs}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Avg composite risk</span><span className="font-mono">{baseline.avgCompositeRisk}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">CRM value exposure</span><span className="font-mono">€{baseline.totalCrmValue.toLocaleString()}</span></div>
          </CardContent>
        </Card>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border/50"><CardContent className="pt-6"><p className="text-[10px] text-muted-foreground">Cost Impact</p><p className="text-lg font-bold text-destructive">€{Math.round(result.impactSummary.totalCostImpactEuro).toLocaleString()}</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="pt-6"><p className="text-[10px] text-muted-foreground">Risk Score Delta</p><p className="text-lg font-bold text-amber-500">{result.impactSummary.riskScoreChange.toFixed(1)}</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="pt-6"><p className="text-[10px] text-muted-foreground">Affected ECUs</p><p className="text-lg font-bold text-primary">{result.impactSummary.affectedEcusCount}</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="pt-6"><p className="text-[10px] text-muted-foreground">Supply Risk</p><p className="text-lg font-bold text-destructive">{result.impactSummary.supplyChainInterruptionRisk}%</p></CardContent></Card>
          </div>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Strategic Recommendation Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Investor message</p>
                  <p className="text-sm font-medium mt-1">
                    Current scenario projects a <span className="text-destructive">{result.severity.toUpperCase()}</span> disruption profile with
                    potential cost pressure of <span className="font-mono">€{Math.round(result.impactSummary.totalCostImpactEuro).toLocaleString()}</span>.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Immediate strategic action</p>
                  <p className="text-sm font-medium mt-1">Prioritize diversification and recovery investment on top affected materials.</p>
                </div>
              </div>

              <div className="space-y-2">
                {result.recommendations.slice(0, 5).map((recommendation, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-secondary/20">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-border/50"><CardContent className="pt-6"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><p className="text-xs text-muted-foreground">Scenario severity</p></div><p className="text-sm font-semibold mt-1 uppercase">{result.severity}</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="pt-6"><div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Cost change %</p></div><p className="text-sm font-semibold mt-1">{result.impactSummary.costChangePct.toFixed(2)}%</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="pt-6"><div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Materials impacted</p></div><p className="text-sm font-semibold mt-1">{result.impactSummary.affectedMaterialsCount}</p></CardContent></Card>
          </div>
        </>
      )}

      {scenarioHistory && scenarioHistory.length >= 2 && (() => {
        const [run1, run2] = scenarioHistory;
        type KpiSnapshot = { baseline?: { riskPosture?: string; avgCompositeRisk?: number; totalCrmValue?: number }; result?: { severity?: string; costImpactEuro?: number; costChangePct?: number; riskScoreChange?: number; affectedEcusCount?: number } };
        const snap1 = (run1.kpi_snapshot as KpiSnapshot) ?? {};
        const snap2 = (run2.kpi_snapshot as KpiSnapshot) ?? {};
        const deltaEuro = (snap1.result?.costImpactEuro ?? 0) - (snap2.result?.costImpactEuro ?? 0);
        const deltaRisk = (snap1.result?.riskScoreChange ?? 0) - (snap2.result?.riskScoreChange ?? 0);
        return (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-primary" />
                Scenario Run Comparison
                <Badge variant="outline" className="text-[9px] ml-auto">last 2 saved runs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {[{ label: "Latest run", snap: snap1, date: run1.created_at }, { label: "Previous run", snap: snap2, date: run2.created_at }].map(({ label, snap, date }) => (
                  <div key={label} className="space-y-2 p-3 rounded-lg bg-secondary/30">
                    <p className="font-semibold text-[11px]">{label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{new Date(date).toLocaleString("en-US")}</p>
                    <div className="flex justify-between"><span className="text-muted-foreground">Posture</span><span className="font-semibold uppercase">{snap.baseline?.riskPosture ?? "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Severity</span><span className="font-semibold uppercase">{snap.result?.severity ?? "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Cost impact</span><span className="font-mono">€{Math.round(snap.result?.costImpactEuro ?? 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Risk delta</span><span className="font-mono">{(snap.result?.riskScoreChange ?? 0).toFixed(1)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Affected ECUs</span><span className="font-mono">{snap.result?.affectedEcusCount ?? "—"}</span></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex-1 p-2 rounded-md bg-secondary/20 text-center">
                  <p className="text-muted-foreground">Cost impact Δ</p>
                  <p className={`font-bold font-mono ${deltaEuro > 0 ? "text-destructive" : "text-green-500"}`}>
                    {deltaEuro > 0 ? "+" : ""}€{Math.round(deltaEuro).toLocaleString()}
                  </p>
                </div>
                <div className="flex-1 p-2 rounded-md bg-secondary/20 text-center">
                  <p className="text-muted-foreground">Risk score Δ</p>
                  <p className={`font-bold font-mono ${deltaRisk > 0 ? "text-destructive" : "text-green-500"}`}>
                    {deltaRisk > 0 ? "+" : ""}{deltaRisk.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
