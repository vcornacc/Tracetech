import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";

export default function Simulation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simulazione Strategica</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scenari what-if e modellazione di strategie di mitigazione del rischio
        </p>
      </div>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            Motore di Simulazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Modulo in costruzione — Fase 4 del piano di implementazione.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
