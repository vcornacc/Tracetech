/**
 * Command Center — Actionable Intelligence Panel
 *
 * Philosophy: A dashboard that just shows charts is a museum exhibit.
 * A Command Center tells you WHAT TO DO, WHY, and by WHEN.
 *
 * This component renders prioritized actions derived from the Predictive Engine,
 * each with clear impact scores, effort levels, and time horizons.
 * It's the "copilot" for supply chain managers — autopilot for risk mitigation.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Recycle,
  GitBranch,
  Leaf,
  Eye,
  Zap,
  Clock,
  ChevronRight,
  Target,
} from "lucide-react";
import type { PredictiveAction } from "@/lib/predictiveEngine";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Recycle,
  GitBranch,
  Leaf,
  Eye,
  Zap,
};

const categoryColors: Record<PredictiveAction["category"], string> = {
  mitigate: "bg-destructive/10 text-destructive border-destructive/20",
  hedge: "bg-accent/10 text-accent border-accent/20",
  recover: "bg-success/10 text-success border-success/20",
  diversify: "bg-primary/10 text-primary border-primary/20",
  monitor: "bg-muted text-muted-foreground border-border/50",
};

const timeHorizonLabels: Record<PredictiveAction["timeHorizon"], { label: string; color: string }> = {
  immediate: { label: "Now", color: "text-destructive" },
  "short-term": { label: "1-4 weeks", color: "text-accent" },
  "medium-term": { label: "1-3 months", color: "text-primary" },
  "long-term": { label: "3-12 months", color: "text-muted-foreground" },
};

const effortBars: Record<PredictiveAction["effortLevel"], number> = {
  low: 25,
  medium: 55,
  high: 85,
};

interface CommandCenterProps {
  actions: PredictiveAction[];
  maxVisible?: number;
}

export function CommandCenter({ actions, maxVisible = 6 }: CommandCenterProps) {
  const visibleActions = actions.slice(0, maxVisible);
  const remaining = actions.length - maxVisible;

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Target className="w-4 h-4 text-primary" />
            </div>
            Command Center
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {actions.length} actions queued
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          AI-prioritized actions ranked by impact × urgency. Execute top-down for maximum risk reduction.
        </p>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {visibleActions.map((action, i) => {
          const Icon = iconMap[action.icon] ?? Zap;
          const timeInfo = timeHorizonLabels[action.timeHorizon];

          return (
            <div
              key={action.id}
              className="group relative flex items-start gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer border border-transparent hover:border-border/50"
            >
              {/* Priority rank */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                <span className="text-[10px] font-mono font-bold text-muted-foreground w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                  {i + 1}
                </span>
              </div>

              {/* Icon */}
              <div className={`p-1.5 rounded-md shrink-0 ${categoryColors[action.category]}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium leading-tight">{action.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className={`w-3 h-3 ${timeInfo.color}`} />
                    <span className={`text-[10px] font-medium ${timeInfo.color}`}>{timeInfo.label}</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                  {action.description}
                </p>

                {/* Metrics bar */}
                <div className="flex items-center gap-4 pt-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Impact</span>
                    <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${action.impactScore}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground">{action.impactScore}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Effort</span>
                    <div className="w-12 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${effortBars[action.effortLevel]}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground capitalize">{action.effortLevel}</span>
                  </div>
                  {action.affectedMaterials.length > 0 && (
                    <span className="text-[9px] text-muted-foreground/70 truncate">
                      {action.affectedMaterials.slice(0, 2).join(", ")}
                      {action.affectedMaterials.length > 2 && ` +${action.affectedMaterials.length - 2}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron for drill-in */}
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-1 transition-colors" />
            </div>
          );
        })}

        {remaining > 0 && (
          <div className="text-center py-2">
            <span className="text-[10px] text-muted-foreground">
              +{remaining} more actions available
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
