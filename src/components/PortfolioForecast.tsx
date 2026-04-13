/**
 * Portfolio Forecast Card — Where Are We Heading?
 *
 * Philosophy: The most valuable information isn't where you ARE,
 * it's where you're GOING. This card shows the projected portfolio
 * risk posture over 30/90 days with a clean timeline visualization.
 *
 * This is the "weather forecast" for your supply chain.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Compass, ArrowRight } from "lucide-react";
import type { PredictiveInsights } from "@/lib/predictiveEngine";
import type { PortfolioSnapshot } from "@/lib/dataSchema";

const postureStyles: Record<PortfolioSnapshot["riskPosture"], { bg: string; text: string; dot: string; label: string }> = {
  stable: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Stable" },
  moderate: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary", label: "Moderate" },
  elevated: { bg: "bg-accent/10", text: "text-accent", dot: "bg-accent", label: "Elevated" },
  critical: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive", label: "Critical" },
};

const trendConfig = {
  worsening: { color: "text-destructive", arrow: "↗", label: "Worsening" },
  stable: { color: "text-primary", arrow: "→", label: "Holding" },
  improving: { color: "text-success", arrow: "↘", label: "Improving" },
};

interface PortfolioForecastProps {
  forecast: PredictiveInsights["portfolioForecast"];
  thresholdCrossings: number;
  anomalyCount: number;
}

export function PortfolioForecast({ forecast, thresholdCrossings, anomalyCount }: PortfolioForecastProps) {
  const currentStyle = postureStyles[forecast.current];
  const proj30Style = postureStyles[forecast.projected30d];
  const proj90Style = postureStyles[forecast.projected90d];
  const trend = trendConfig[forecast.trend];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Compass className="w-4 h-4 text-primary" />
          </div>
          Portfolio Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Timeline */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Now */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">Now</span>
            <div className={cn("w-full py-2 px-3 rounded-lg text-center", currentStyle.bg)}>
              <div className="flex items-center justify-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", currentStyle.dot)} />
                <span className={cn("text-xs font-bold", currentStyle.text)}>{currentStyle.label}</span>
              </div>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-4" />

          {/* 30d */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">30 days</span>
            <div className={cn("w-full py-2 px-3 rounded-lg text-center border border-dashed border-border/50", proj30Style.bg)}>
              <div className="flex items-center justify-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", proj30Style.dot)} />
                <span className={cn("text-xs font-semibold", proj30Style.text)}>{proj30Style.label}</span>
              </div>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-4" />

          {/* 90d */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">90 days</span>
            <div className={cn("w-full py-2 px-3 rounded-lg text-center border border-dashed border-border/50", proj90Style.bg)}>
              <div className="flex items-center justify-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", proj90Style.dot)} />
                <span className={cn("text-xs font-semibold", proj90Style.text)}>{proj90Style.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trend + stats */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-secondary/20">
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold", trend.color)}>{trend.arrow}</span>
            <div>
              <p className={cn("text-xs font-medium", trend.color)}>{trend.label}</p>
              <p className="text-[10px] text-muted-foreground">Risk trajectory</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-sm font-bold">{thresholdCrossings}</p>
              <p className="text-[9px] text-muted-foreground">Crossings</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">{anomalyCount}</p>
              <p className="text-[9px] text-muted-foreground">Anomalies</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
