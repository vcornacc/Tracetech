import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, Target, Layers, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, ReferenceLine,
} from "recharts";
import { haasMetrics } from "@/data/ecuData";
import { DownloadReportSection } from "@/components/DownloadReportSection";
import { downloadHaaSReport } from "@/lib/reportDownloads";

const overallScore = Math.round(haasMetrics.reduce((s, m) => s + m.current, 0) / haasMetrics.length);
const readyDimensions = haasMetrics.filter((m) => m.current >= m.threshold).length;
const totalDimensions = haasMetrics.length;

const radarData = haasMetrics.map((m) => ({
  dimension: m.dimension,
  current: m.current,
  threshold: m.threshold,
}));

const gapData = haasMetrics.map((m) => ({
  name: m.dimension,
  gap: Math.max(0, m.threshold - m.current),
  achieved: Math.min(m.current, m.threshold),
  surplus: Math.max(0, m.current - m.threshold),
}));

const roadmapPhases = [
  {
    phase: "Phase 1 — Foundation",
    timeline: "Q1-Q2 2026",
    status: "in_progress",
    items: ["Data Maturity ≥ 80%", "DPP coverage 100% ECU", "ERP baseline integration"],
  },
  {
    phase: "Phase 2 — Scale",
    timeline: "Q3-Q4 2026",
    status: "planned",
    items: ["Reverse Flow Stability ≥ 70%", "Recovery Infrastructure ≥ 75%", "Circular supplier contracts"],
  },
  {
    phase: "Phase 3 — Transition",
    timeline: "Q1-Q2 2027",
    status: "planned",
    items: ["Financial Viability ≥ 65%", "HaaS pilot with 2 OEMs", "EU Battery Regulation compliance"],
  },
  {
    phase: "Phase 4 — HaaS Launch",
    timeline: "H2 2027",
    status: "planned",
    items: ["All dimensions above threshold", "HaaS model operational", "Production scale-up"],
  },
];

export default function HaaSReadiness() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">HaaS Readiness</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Maturity assessment for Hardware-as-a-Service transition
        </p>
      </div>

      {/* Overall Score */}
      <Card className="border-border/50 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">HaaS Readiness Score</p>
              <p className="text-4xl font-bold mt-1" style={{
                color: overallScore >= 70 ? "hsl(160,70%,45%)" : overallScore >= 50 ? "hsl(38,92%,55%)" : "hsl(0,72%,55%)"
              }}>
                {overallScore}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {readyDimensions}/{totalDimensions} dimensions above threshold
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`text-xs ${
                overallScore >= 70 ? "bg-success/15 text-success border-success/30" :
                overallScore >= 50 ? "bg-accent/15 text-accent border-accent/30" :
                "bg-destructive/15 text-destructive border-destructive/30"
              }`}>
                {overallScore >= 70 ? "Ready" : overallScore >= 50 ? "In Progress" : "Not Ready"}
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-2">Target: H2 2027</p>
            </div>
          </div>
          <Progress value={overallScore} className="h-2 mt-4" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Maturity by Dimension
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220,14%,18%)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: "hsl(215,15%,55%)", fontSize: 9 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Current" dataKey="current" stroke="hsl(190,85%,50%)" fill="hsl(190,85%,50%)" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Threshold" dataKey="threshold" stroke="hsl(38,92%,55%)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-primary" /> Current
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-accent border-dashed" style={{ borderTop: "1.5px dashed hsl(38,92%,55%)" }} /> Threshold
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Gap Analysis */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Gap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {haasMetrics.map((m) => {
                const ready = m.current >= m.threshold;
                return (
                  <div key={m.dimension} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {ready ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                        <span className="text-xs font-medium">{m.dimension}</span>
                      </div>
                      <span className="text-[10px] font-mono">
                        {m.current}% / {m.threshold}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-6">{m.label}</p>
                    <div className="ml-6 relative">
                      <Progress value={m.current} className="h-1.5" />
                      <div
                        className="absolute top-0 h-1.5 w-0.5 bg-accent"
                        style={{ left: `${m.threshold}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Roadmap HaaS Transition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roadmapPhases.map((phase, i) => (
              <div key={i} className={`p-4 rounded-lg border ${
                phase.status === "in_progress" ? "border-primary/30 bg-primary/5" : "border-border/30 bg-secondary/20"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={`text-[9px] ${
                    phase.status === "in_progress" ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground"
                  }`}>
                    {phase.status === "in_progress" ? "In Corso" : "Pianificato"}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground font-mono">{phase.timeline}</span>
                </div>
                <p className="text-xs font-medium mb-3">{phase.phase}</p>
                <ul className="space-y-1.5">
                  {phase.items.map((item, j) => (
                    <li key={j} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DownloadReportSection
        title="Export HaaS Assessment"
        actions={[
          { label: "HaaS Report (.txt)", description: "Maturity assessment report", icon: "txt", onClick: downloadHaaSReport },
        ]}
      />
    </div>
  );
}
