import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  sparkline?: number[]; // 5–8 data points, latest last
  variant?: "default" | "cyan" | "amber" | "critical" | "success";
  href?: string;
}

function Sparkline({ data, variant }: { data: number[]; variant: MetricCardProps["variant"] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const step = w / (data.length - 1);

  const strokeColor =
    variant === "critical" ? "hsl(0,72%,60%)" :
    variant === "amber" ? "hsl(38,92%,55%)" :
    variant === "success" ? "hsl(142,71%,45%)" :
    "hsl(190,85%,50%)";

  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* highlight last point */}
      <circle
        cx={(data.length - 1) * step}
        cy={h - ((data[data.length - 1] - min) / range) * h}
        r="2.5"
        fill={strokeColor}
      />
    </svg>
  );
}

const variantStyles = {
  default: "border-border/50",
  cyan: "border-primary/30 glow-cyan",
  amber: "border-accent/30 glow-amber",
  critical: "border-destructive/30 glow-critical",
  success: "border-success/30",
};

const iconBgStyles = {
  default: "bg-secondary",
  cyan: "bg-primary/10",
  amber: "bg-accent/10",
  critical: "bg-destructive/10",
  success: "bg-success/10",
};

const iconColorStyles = {
  default: "text-muted-foreground",
  cyan: "text-primary",
  amber: "text-accent",
  critical: "text-destructive",
  success: "text-success",
};

export function MetricCard({ title, value, subtitle, icon, trend, sparkline, variant = "default", href }: MetricCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "transition-all hover:border-primary/40",
        variantStyles[variant],
        href && "cursor-pointer hover:bg-secondary/20"
      )}
      onClick={href ? () => navigate(href) : undefined}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-success" : "text-destructive")}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
            {sparkline && sparkline.length >= 2 && (
              <div className="pt-1">
                <Sparkline data={sparkline} variant={variant} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={cn("p-2.5 rounded-lg", iconBgStyles[variant])}>
              <div className={iconColorStyles[variant]}>{icon}</div>
            </div>
            {href && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
