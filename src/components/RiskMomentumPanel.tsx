/**
 * Risk Momentum Panel — Velocity-Aware Risk Trends
 *
 * Philosophy: A risk score of "72" means nothing without context.
 * Is it going UP (panic) or going DOWN (relax)?
 * This component shows the DIRECTION and SPEED of risk movement —
 * the first derivative of risk. No other dashboard does this.
 *
 * Visual: Compact sparkline-style rows showing current → projected risk
 * with velocity arrows and threshold crossing warnings.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskMomentumItem } from "@/lib/predictiveEngine";

const clusterBadgeColors: Record<string, string> = {
  systemic: "bg-destructive/10 text-destructive border-destructive/20",
  product: "bg-accent/10 text-accent border-accent/20",
  sectoral: "bg-primary/10 text-primary border-primary/20",
  operational: "bg-success/10 text-success border-success/20",
};

const directionConfig = {
  accelerating: { icon: TrendingUp, color: "text-destructive", bg: "bg-destructive/10", label: "Accelerating" },
  decelerating: { icon: TrendingUp, color: "text-accent", bg: "bg-accent/10", label: "Rising" },
  stable: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted", label: "Stable" },
  improving: { icon: TrendingDown, color: "text-success", bg: "bg-success/10", label: "Improving" },
};

interface RiskMomentumPanelProps {
  momentum: RiskMomentumItem[];
  maxVisible?: number;
}

export function RiskMomentumPanel({ momentum, maxVisible = 8 }: RiskMomentumPanelProps) {
  const visible = momentum.slice(0, maxVisible);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent/10">
            <Activity className="w-4 h-4 text-accent" />
          </div>
          Risk Momentum
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Risk velocity — how fast each material's risk is changing per month
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr,60px,60px,50px,80px] gap-2 px-2 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">
            <span>Material</span>
            <span className="text-right">Now</span>
            <span className="text-right">90d</span>
            <span className="text-right">Vel.</span>
            <span className="text-right">Status</span>
          </div>

          {/* Rows */}
          {visible.map((item) => {
            const dirConf = directionConfig[item.direction];
            const DirIcon = dirConf.icon;
            const riskDelta = item.projectedRisk90d - item.currentRisk;

            return (
              <div
                key={item.materialName}
                className={cn(
                  "grid grid-cols-[1fr,60px,60px,50px,80px] gap-2 px-2 py-2 rounded-md items-center transition-colors",
                  item.crossesThreshold
                    ? "bg-destructive/5 border border-destructive/10"
                    : "hover:bg-secondary/30"
                )}
              >
                {/* Name + cluster */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium truncate">{item.materialName}</span>
                  {item.crossesThreshold && (
                    <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                  )}
                </div>

                {/* Current risk */}
                <div className="text-right">
                  <span className={cn(
                    "text-xs font-mono font-medium",
                    item.currentRisk >= 75 ? "text-destructive" :
                    item.currentRisk >= 55 ? "text-accent" :
                    "text-muted-foreground"
                  )}>
                    {item.currentRisk}
                  </span>
                </div>

                {/* Projected 90d */}
                <div className="text-right">
                  <span className={cn(
                    "text-xs font-mono",
                    item.projectedRisk90d >= 75 ? "text-destructive font-medium" :
                    item.projectedRisk90d >= 55 ? "text-accent" :
                    "text-muted-foreground"
                  )}>
                    {item.projectedRisk90d}
                  </span>
                </div>

                {/* Velocity */}
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-mono",
                    item.velocity > 0 ? "text-destructive" : item.velocity < 0 ? "text-success" : "text-muted-foreground"
                  )}>
                    {item.velocity > 0 ? "+" : ""}{item.velocity.toFixed(1)}
                  </span>
                </div>

                {/* Direction badge */}
                <div className="flex justify-end">
                  <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium", dirConf.bg, dirConf.color)}>
                    <DirIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{dirConf.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Threshold crossing warnings */}
        {visible.some((m) => m.crossesThreshold) && (
          <div className="mt-3 p-2 rounded-md bg-destructive/5 border border-destructive/10">
            <p className="text-[10px] font-medium text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Threshold crossings predicted within 90 days
            </p>
            <div className="mt-1.5 space-y-1">
              {visible.filter((m) => m.crossesThreshold).map((m) => (
                <p key={m.materialName} className="text-[10px] text-muted-foreground pl-4.5">
                  <span className="font-medium">{m.materialName}</span> → {m.thresholdName} tier in ~{m.daysToThreshold}d
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
