import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function Financial() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Motore Finanziario</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analisi NPV, IRR, payback period e stress test geopolitici
        </p>
      </div>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Engine Finanziario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Modulo in costruzione — Fase 5 del piano di implementazione.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
