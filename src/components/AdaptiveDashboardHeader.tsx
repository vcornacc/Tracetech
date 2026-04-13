/**
 * Adaptive Dashboard Header — Context-Aware Greeting & Focus
 *
 * Philosophy: A dashboard that looks the same at 8 AM on Monday
 * and 5 PM on Friday is ignoring its user. Generative UI means
 * the interface adapts to CONTEXT:
 *
 * - Morning: Strategic overview, today's priorities
 * - Afternoon: Operational focus, what needs attention now
 * - Evening: Summary, what happened today
 * - Different postures: Calm vs urgent visual treatment
 *
 * The header changes its tone, focus items, and visual energy
 * based on time of day + risk posture. The user feels like
 * the system KNOWS them.
 */

import { cn } from "@/lib/utils";
import { SystemPulse } from "@/components/SystemPulse";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  Cloud,
  Moon,
  Coffee,
  Zap,
} from "lucide-react";
import type { PortfolioSnapshot } from "@/lib/dataSchema";
import type { PredictiveInsights } from "@/lib/predictiveEngine";

interface AdaptiveDashboardHeaderProps {
  snapshot: PortfolioSnapshot;
  insights: PredictiveInsights;
}

type TimeContext = "morning" | "afternoon" | "evening";

function getTimeContext(): TimeContext {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

const timeGreetings: Record<TimeContext, { greeting: string; icon: React.ComponentType<{ className?: string }>; focusLabel: string }> = {
  morning: {
    greeting: "Good morning",
    icon: Coffee,
    focusLabel: "Today's strategic priorities",
  },
  afternoon: {
    greeting: "Good afternoon",
    icon: Sun,
    focusLabel: "Operational attention needed",
  },
  evening: {
    greeting: "Good evening",
    icon: Moon,
    focusLabel: "Today's summary",
  },
};

const postureMessages: Record<PortfolioSnapshot["riskPosture"], { subtitle: string; urgency: string }> = {
  stable: {
    subtitle: "Portfolio within normal parameters. Focus on long-term optimization.",
    urgency: "No immediate actions required",
  },
  moderate: {
    subtitle: "Some areas need monitoring. Review the risk momentum panel.",
    urgency: "Review pending items",
  },
  elevated: {
    subtitle: "Active risks require attention. Prioritize Command Center actions.",
    urgency: "Actions recommended",
  },
  critical: {
    subtitle: "Critical alerts active. Immediate response needed on top priorities.",
    urgency: "Immediate action required",
  },
};

export function AdaptiveDashboardHeader({ snapshot, insights }: AdaptiveDashboardHeaderProps) {
  const timeCtx = getTimeContext();
  const timeConfig = timeGreetings[timeCtx];
  const postureMsg = postureMessages[snapshot.riskPosture];
  const TimeIcon = timeConfig.icon;

  const isCritical = snapshot.riskPosture === "critical" || snapshot.riskPosture === "elevated";

  return (
    <div className={cn(
      "rounded-xl p-5 transition-all",
      isCritical
        ? "bg-gradient-to-r from-destructive/5 via-card to-card border border-destructive/10"
        : "bg-gradient-to-r from-primary/5 via-card to-card border border-border/50"
    )}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Greeting + context */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <TimeIcon className={cn(
              "w-4 h-4",
              isCritical ? "text-destructive" : "text-primary"
            )} />
            <h1 className="text-xl font-bold tracking-tight">
              {timeConfig.greeting}
            </h1>
          </div>

          <p className="text-sm text-muted-foreground max-w-lg">
            {postureMsg.subtitle}
          </p>

          {/* Quick stats */}
          <div className="flex items-center gap-3 pt-1">
            <Badge
              variant={isCritical ? "destructive" : "outline"}
              className="text-[10px]"
            >
              {isCritical && <Zap className="w-3 h-3 mr-1" />}
              {postureMsg.urgency}
            </Badge>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>{snapshot.activeTriggers} active alerts</span>
              <span>·</span>
              <span>{snapshot.criticalMaterials} critical materials</span>
              <span>·</span>
              <span>{snapshot.ecuNeedingAction} ECUs need action</span>
            </div>
          </div>
        </div>

        {/* Right: System Pulse */}
        <SystemPulse
          health={insights.systemHealth}
          posture={snapshot.riskPosture}
        />
      </div>
    </div>
  );
}
