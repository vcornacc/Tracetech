import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function Materials() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Materiali CRM</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Database materie prime critiche — criticality assessment e classificazione
        </p>
      </div>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Database Materiali
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Modulo in costruzione — Fase 2 del piano di implementazione.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
