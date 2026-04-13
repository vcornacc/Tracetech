/**
 * Anomaly Radar — Statistical Outlier Visualization
 *
 * Philosophy: Most dashboards show averages. Averages hide disasters.
 * This component surfaces the DEVIATIONS — the things that are
 * behaving abnormally compared to the rest of the portfolio.
 *
 * Each anomaly shows how many standard deviations from the mean
 * a material's risk dimension is. Critical outliers (>2σ) get
 * prominent treatment.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Radar, AlertCircle } from "lucide-react";
import type { AnomalyFlag } from "@/lib/predictiveEngine";

interface AnomalyRadarProps {
  anomalies: AnomalyFlag[];
  maxVisible?: number;
}

export function AnomalyRadar({ anomalies, maxVisible = 6 }: AnomalyRadarProps) {
  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const visible = anomalies.slice(0, maxVisible);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-destructive/10">
              <Radar className="w-4 h-4 text-destructive" />
            </div>
            Anomaly Detection
          </CardTitle>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {criticalCount} critical
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Risk dimensions deviating &gt;1.5σ from portfolio average
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {visible.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/5 text-success">
            <AlertCircle className="w-4 h-4" />
            <p className="text-xs">No significant anomalies detected. Portfolio within normal bounds.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((anomaly, i) => {
              const absZ = Math.abs(anomaly.zScore);
              const barWidth = Math.min(100, (absZ / 3) * 100);
              const isHigh = anomaly.zScore > 0;

              return (
                <div
                  key={`${anomaly.materialName}-${anomaly.dimension}-${i}`}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-lg transition-colors",
                    anomaly.severity === "critical"
                      ? "bg-destructive/5 border border-destructive/10"
                      : "bg-secondary/20"
                  )}
                >
                  {/* Z-score indicator */}
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md text-[10px] font-mono font-bold shrink-0",
                    anomaly.severity === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/10 text-accent"
                  )}>
                    {isHigh ? "+" : ""}{anomaly.zScore.toFixed(1)}σ
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{anomaly.materialName}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{anomaly.dimension}</span>
                    </div>

                    {/* Deviation bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            anomaly.severity === "critical" ? "bg-destructive" : "bg-accent"
                          )}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                        {anomaly.value} vs avg {anomaly.portfolioMean}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
