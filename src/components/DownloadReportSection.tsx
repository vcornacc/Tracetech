import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

interface ReportAction {
  label: string;
  description: string;
  icon: "txt" | "csv";
  onClick: () => void;
}

interface DownloadReportSectionProps {
  title?: string;
  actions: ReportAction[];
}

export function DownloadReportSection({
  title = "Download Report",
  actions,
}: DownloadReportSectionProps) {
  return (
    <Card className="border-border/50 border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="gap-2 bg-secondary/30 border-border/50 hover:border-primary/40 hover:bg-primary/5"
              onClick={action.onClick}
            >
              {action.icon === "csv" ? (
                <FileSpreadsheet className="w-3.5 h-3.5 text-[hsl(160,70%,45%)]" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {actions.length > 1
            ? "Select the desired export format"
            : actions[0]?.description}
        </p>
      </CardContent>
    </Card>
  );
}
