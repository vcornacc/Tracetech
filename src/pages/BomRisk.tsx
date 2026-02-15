import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp } from "lucide-react";

export default function BomRisk() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">BOM & Risk Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload Bill of Materials e analisi di esposizione per prodotto
        </p>
      </div>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileUp className="w-4 h-4 text-primary" />
            Upload BOM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Modulo in costruzione — Fase 3 del piano di implementazione.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
