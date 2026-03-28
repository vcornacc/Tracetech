import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  DollarSign, TrendingUp, Calculator, BarChart3, AlertTriangle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, Area, AreaChart,
} from "recharts";
import { defaultFinancialScenario, type FinancialScenario } from "@/data/ecuData";

function calculateFinancials(s: FinancialScenario) {
  const annualRevenue = s.annualCapacity * s.crmValuePerUnit;
  const annualNetCashflow = annualRevenue - s.opex;
  const cashflows: number[] = [];
  const cumulativeCashflows: number[] = [];
  let cumulative = -s.capex;
  let paybackYear = -1;

  for (let y = 0; y < s.years; y++) {
    cashflows.push(annualNetCashflow);
    cumulative += annualNetCashflow;
    cumulativeCashflows.push(cumulative);
    if (paybackYear < 0 && cumulative >= 0) paybackYear = y + 1;
  }

  // NPV
  let npv = -s.capex;
  for (let y = 0; y < s.years; y++) {
    npv += cashflows[y] / Math.pow(1 + s.discountRate, y + 1);
  }

  // IRR (Newton's method approximation)
  let irr = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let f = -s.capex;
    let df = 0;
    for (let y = 0; y < s.years; y++) {
      const factor = Math.pow(1 + irr, y + 1);
      f += cashflows[y] / factor;
      df -= (y + 1) * cashflows[y] / Math.pow(1 + irr, y + 2);
    }
    const newIrr = irr - f / df;
    if (Math.abs(newIrr - irr) < 0.0001) break;
    irr = newIrr;
  }

  // Avoided procurement
  const avoidedProcurement = annualRevenue * s.years;

  // Yearly data for chart
  const yearlyData = Array.from({ length: s.years }, (_, y) => ({
    year: `Y${y + 1}`,
    revenue: annualRevenue,
    opex: s.opex,
    netCashflow: annualNetCashflow,
    cumulative: cumulativeCashflows[y],
    npvContrib: cashflows[y] / Math.pow(1 + s.discountRate, y + 1),
  }));

  return { npv, irr, paybackYear, avoidedProcurement, annualRevenue, annualNetCashflow, yearlyData, cumulativeCashflows };
}

// Sensitivity analysis
function sensitivityAnalysis(base: FinancialScenario) {
  const variations = [-30, -20, -10, 0, 10, 20, 30];
  return variations.map((pct) => {
    const scenario = { ...base, crmValuePerUnit: base.crmValuePerUnit * (1 + pct / 100) };
    const result = calculateFinancials(scenario);
    return { variation: `${pct >= 0 ? "+" : ""}${pct}%`, npv: Math.round(result.npv), irr: result.irr * 100 };
  });
}

// Geopolitical stress test
function stressTest(base: FinancialScenario) {
  const scenarios = [
    { label: "Base Case", capexMult: 1, opexMult: 1, revMult: 1 },
    { label: "Supply Disruption", capexMult: 1, opexMult: 1.3, revMult: 1.4 },
    { label: "Trade War", capexMult: 1.2, opexMult: 1.15, revMult: 1.6 },
    { label: "Green Transition", capexMult: 0.85, opexMult: 0.9, revMult: 1.2 },
    { label: "Deep Recession", capexMult: 1, opexMult: 0.95, revMult: 0.7 },
  ];
  return scenarios.map((sc) => {
    const modified = { ...base, capex: base.capex * sc.capexMult, opex: base.opex * sc.opexMult, crmValuePerUnit: base.crmValuePerUnit * sc.revMult };
    const result = calculateFinancials(modified);
    return { label: sc.label, npv: Math.round(result.npv), irr: Math.round(result.irr * 1000) / 10, payback: result.paybackYear };
  });
}

export default function FinancialEngine() {
  const [scenario, setScenario] = useState<FinancialScenario>(defaultFinancialScenario);

  const results = useMemo(() => calculateFinancials(scenario), [scenario]);
  const sensitivity = useMemo(() => sensitivityAnalysis(scenario), [scenario]);
  const stress = useMemo(() => stressTest(scenario), [scenario]);

  const updateField = (field: keyof FinancialScenario, value: number) => {
    setScenario((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Motore Finanziario</h1>
        <p className="text-sm text-muted-foreground mt-1">
          NPV, IRR, Payback Period and geopolitical stress tests for circular recovery
        </p>
      </div>

      {/* Input Parameters */}
      <Card className="border-border/50 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
              Scenario Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "CAPEX (€)", field: "capex" as const, min: 100000, max: 10000000, step: 100000 },
              { label: "Annual OPEX (€)", field: "opex" as const, min: 50000, max: 2000000, step: 50000 },
              { label: "Annual Capacity", field: "annualCapacity" as const, min: 500, max: 50000, step: 500 },
              { label: "CRM Value/Unit (€)", field: "crmValuePerUnit" as const, min: 10, max: 1000, step: 5 },
              { label: "Discount Rate (%)", field: "discountRate" as const, min: 0.01, max: 0.25, step: 0.01 },
              { label: "Horizon (Years)", field: "years" as const, min: 3, max: 20, step: 1 },
            ].map((param) => (
              <div key={param.field} className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{param.label}</Label>
                <Input
                  type="number"
                  value={param.field === "discountRate" ? Math.round(scenario[param.field] * 100) : scenario[param.field]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateField(param.field, param.field === "discountRate" ? val / 100 : val);
                  }}
                  className="h-8 text-xs bg-secondary/30 border-border/50 font-mono"
                  min={param.field === "discountRate" ? param.min * 100 : param.min}
                  max={param.field === "discountRate" ? param.max * 100 : param.max}
                  step={param.field === "discountRate" ? param.step * 100 : param.step}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-[9px] text-muted-foreground uppercase">NPV</p>
            <p className={`text-xl font-bold mt-1 ${results.npv >= 0 ? "text-success" : "text-destructive"}`}>
              €{Math.abs(Math.round(results.npv)).toLocaleString()}
              {results.npv >= 0 ? <ArrowUpRight className="w-4 h-4 inline ml-1" /> : <ArrowDownRight className="w-4 h-4 inline ml-1" />}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-[9px] text-muted-foreground uppercase">IRR</p>
            <p className={`text-xl font-bold mt-1 ${results.irr > scenario.discountRate ? "text-success" : "text-destructive"}`}>
              {(results.irr * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Calculator className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-[9px] text-muted-foreground uppercase">Payback Period</p>
            <p className="text-xl font-bold mt-1">{results.paybackYear > 0 ? `${results.paybackYear} yrs` : "N/A"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-2 text-success" />
            <p className="text-[9px] text-muted-foreground uppercase">Avoided Procurement</p>
            <p className="text-xl font-bold mt-1 text-success">€{Math.round(results.avoidedProcurement).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cumulative Cash Flow */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Cumulative Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={results.yearlyData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                <XAxis dataKey="year" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,22%,10%)", border: "1px solid hsl(220,14%,20%)", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => `€${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(190,85%,50%)" fill="hsl(190,85%,50%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue vs OPEX */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Revenue vs Annual OPEX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={results.yearlyData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                <XAxis dataKey="year" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,22%,10%)", border: "1px solid hsl(220,14%,20%)", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => `€${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(190,85%,50%)" radius={[4, 4, 0, 0]} name="Revenue CRM" />
                <Bar dataKey="opex" fill="hsl(38,92%,55%)" radius={[4, 4, 0, 0]} name="OPEX" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sensitivity Analysis */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
              Sensitivity Analysis — CRM Value Variation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sensitivity} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
              <XAxis dataKey="variation" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222,22%,10%)", border: "1px solid hsl(220,14%,20%)", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => `€${v.toLocaleString()}`} />
              <Bar dataKey="npv" radius={[4, 4, 0, 0]} name="NPV">
                {sensitivity.map((s, i) => <Cell key={i} fill={s.npv >= 0 ? "hsl(160,70%,45%)" : "hsl(0,72%,55%)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stress Test */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent" />
              Geopolitical Stress Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Scenario</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-muted-foreground">NPV (€)</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-muted-foreground">IRR (%)</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Payback (yrs)</th>
                </tr>
              </thead>
              <tbody>
                {stress.map((s) => (
                  <tr key={s.label} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="p-3 font-medium">{s.label}</td>
                    <td className={`p-3 text-right font-mono ${s.npv >= 0 ? "text-success" : "text-destructive"}`}>€{s.npv.toLocaleString()}</td>
                    <td className={`p-3 text-right font-mono ${s.irr > scenario.discountRate * 100 ? "text-success" : "text-destructive"}`}>{s.irr}%</td>
                    <td className="p-3 text-right font-mono">{s.payback > 0 ? s.payback : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
