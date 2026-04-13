/**
 * System Pulse — Live Heartbeat Visualization
 *
 * Philosophy: Static dashboards feel dead. A living system needs a heartbeat.
 * The Pulse is an at-a-glance system health indicator that communicates
 * portfolio status through color, rhythm, and shape — no reading required.
 *
 * - Healthy system: calm blue pulse, slow rhythm
 * - Elevated risk: amber pulse, faster rhythm
 * - Critical: red pulse, rapid rhythm with outer ring
 *
 * This is a "glanceable" indicator. In meetings, from across the room,
 * you can tell if the system is healthy in 0.3 seconds.
 */

import { cn } from "@/lib/utils";

interface SystemPulseProps {
  health: number;           // 0-100
  posture: "stable" | "moderate" | "elevated" | "critical";
  className?: string;
}

const postureConfig = {
  stable: {
    color: "bg-success",
    ringColor: "ring-success/20",
    glowColor: "shadow-success/20",
    pulseSpeed: "animate-pulse",
    label: "Stable",
  },
  moderate: {
    color: "bg-primary",
    ringColor: "ring-primary/20",
    glowColor: "shadow-primary/20",
    pulseSpeed: "animate-pulse",
    label: "Moderate",
  },
  elevated: {
    color: "bg-accent",
    ringColor: "ring-accent/30",
    glowColor: "shadow-accent/30",
    pulseSpeed: "animate-pulse",
    label: "Elevated",
  },
  critical: {
    color: "bg-destructive",
    ringColor: "ring-destructive/30",
    glowColor: "shadow-destructive/40",
    pulseSpeed: "animate-ping",
    label: "Critical",
  },
};

export function SystemPulse({ health, posture, className }: SystemPulseProps) {
  const config = postureConfig[posture];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Pulse indicator */}
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Outer ping ring for critical/elevated */}
        {(posture === "critical" || posture === "elevated") && (
          <span
            className={cn(
              "absolute inset-0 rounded-full opacity-30",
              config.color,
              posture === "critical" ? "animate-ping" : "animate-pulse"
            )}
          />
        )}
        {/* Inner pulse ring */}
        <span
          className={cn(
            "absolute inset-1 rounded-full opacity-20",
            config.color,
            "animate-pulse"
          )}
        />
        {/* Core dot */}
        <span
          className={cn(
            "relative w-4 h-4 rounded-full ring-2 shadow-lg",
            config.color,
            config.ringColor,
            config.glowColor
          )}
        />
      </div>

      {/* Health readout */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight">{health}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/100</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          {config.label}
        </p>
      </div>
    </div>
  );
}
