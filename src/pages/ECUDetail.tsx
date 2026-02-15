import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Cpu, MapPin, Recycle, Globe, Activity, Shield, Factory,
  Clock, Fingerprint, Box, Zap, Thermometer, Wrench,
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, PieChart, Pie,
} from "recharts";
import { ecuInventory } from "@/data/ecuData";
import { criticalMaterials, clusterInfo } from "@/data/materialsData";

const statusLabels: Record<string, string> = {
  active: "Attivo", maintenance: "Manutenzione", eol: "Fine Vita",
  recovered: "Recuperato", in_recovery: "In Recovery",
};
const pathLabels: Record<string, string> = {
  repair: "Repair", reuse: "Reuse", refurbish: "Refurbish",
  selective_recovery: "Selective CRM Recovery", pending: "In Attesa",
};
const eventIcons: Record<string, typeof Cpu> = {
  production: Factory, installation: Wrench, maintenance: Wrench,
  replacement: Zap, eol: Clock, recovery: Recycle,
};

export default function ECUDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ecu = ecuInventory.find((e) => e.id === id);

  if (!ecu) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/ecu")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Torna all'inventario
        </Button>
        <p className="text-muted-foreground">ECU non trovata.</p>
      </div>
    );
  }

  // Build risk radar from materials in this ECU
  const ecuMaterialNames = ecu.materials.map((m) => m.name);
  const ecuCriticals = criticalMaterials.filter((cm) => ecuMaterialNames.includes(cm.name));
  const radarData = ecuCriticals.length > 0
    ? ecuCriticals[0].riskProfile.map((_, i) => ({
        subject: ecuCriticals[0].riskProfile[i].subject,
        value: Math.round(ecuCriticals.reduce((s, m) => s + m.riskProfile[i].value, 0) / ecuCriticals.length),
      }))
    : [];

  // Material composition pie
  const pieData = ecu.materials
    .sort((a, b) => b.weightGrams - a.weightGrams)
    .slice(0, 8)
    .map((m) => ({ name: m.name, value: Math.round(m.weightGrams * 1000) / 1000 }));
  const pieColors = ["hsl(190,85%,50%)", "hsl(38,92%,55%)", "hsl(0,72%,55%)", "hsl(160,70%,45%)", "hsl(270,60%,60%)", "hsl(190,85%,70%)", "hsl(38,92%,75%)", "hsl(160,70%,65%)"];

  // Material value bar chart
  const valueData = ecu.materials
    .map((m) => ({ name: m.name, value: Math.round(m.weightGrams * m.valuePerKg / 1000 * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => navigate("/ecu")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{ecu.id}</h1>
            <Badge variant="outline" className="text-[10px]">{ecu.model}</Badge>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
              {statusLabels[ecu.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Digital Product Passport: <span className="font-mono">{ecu.dppId}</span>
          </p>
        </div>
      </div>

      {/* DPP Identity */}
      <Card className="border-border/50 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary" />
            Digital Product Passport (DPP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: "DPP ID", value: ecu.dppId, mono: true },
              { label: "Digital Twin", value: ecu.digitalTwinId, mono: true },
              { label: "Part Number", value: ecu.partNumber, mono: true },
              { label: "VIN", value: ecu.vin, mono: true },
              { label: "Veicolo", value: ecu.vehicleModel },
              { label: "Produzione", value: ecu.productionDate },
              { label: "Ubicazione", value: ecu.location },
              { label: "Km Percorsi", value: `${ecu.mileageKm.toLocaleString()} km` },
              { label: "Peso Totale", value: `${ecu.totalWeightGrams.toFixed(0)} g` },
              { label: "CRM Content", value: `${ecu.crmContentGrams.toFixed(1)} g` },
              { label: "Valore CRM", value: `€${ecu.crmValueEuro.toFixed(0)}` },
              { label: "Percorso Circolare", value: pathLabels[ecu.circularPath] },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className={`text-xs font-medium ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Thermometer className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-[9px] text-muted-foreground uppercase">Health Score</p>
            <p className="text-xl font-bold mt-1">{ecu.healthScore}%</p>
            <Progress value={ecu.healthScore} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-[9px] text-muted-foreground uppercase">Vita Residua</p>
            <p className="text-xl font-bold mt-1">{ecu.remainingLifeMonths} mesi</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Shield className="w-5 h-5 mx-auto mb-2" style={{ color: ecu.riskScore >= 70 ? "hsl(0,72%,55%)" : ecu.riskScore >= 50 ? "hsl(38,92%,55%)" : "hsl(160,70%,45%)" }} />
            <p className="text-[9px] text-muted-foreground uppercase">Risk Score</p>
            <p className="text-xl font-bold mt-1" style={{ color: ecu.riskScore >= 70 ? "hsl(0,72%,55%)" : ecu.riskScore >= 50 ? "hsl(38,92%,55%)" : "hsl(160,70%,45%)" }}>{ecu.riskScore}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Recycle className="w-5 h-5 mx-auto mb-2 text-success" />
            <p className="text-[9px] text-muted-foreground uppercase">Recovery Rate</p>
            <p className="text-xl font-bold mt-1 text-success">{ecu.recoveryRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Radar */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Profilo di Rischio Aggregato ECU
            </CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(220,14%,18%)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="hsl(190,85%,50%)" fill="hsl(190,85%,50%)" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground p-8 text-center">Dati non disponibili</p>}
          </CardContent>
        </Card>

        {/* Material Composition */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="w-4 h-4 text-primary" />
              Composizione Materiale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,22%,10%)", border: "1px solid hsl(220,14%,20%)", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => `${v} g`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Material Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Bill of Materials CRM — {ecu.materials.length} materiali
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Materiale</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Peso (g)</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-muted-foreground">€/kg</th>
                  <th className="text-center p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Recuperabile</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Metodo Recovery</th>
                </tr>
              </thead>
              <tbody>
                {ecu.materials.map((m) => (
                  <tr key={m.name} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-right font-mono">{m.weightGrams.toFixed(4)}</td>
                    <td className="p-3 text-right font-mono">€{m.valuePerKg.toFixed(0)}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${m.recoverable ? "bg-success" : "bg-destructive"}`} />
                    </td>
                    <td className="p-3 text-muted-foreground">{m.recoveryMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Timeline */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Timeline Ciclo di Vita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
            <div className="space-y-4">
              {ecu.lifecycle.map((event, i) => {
                const Icon = eventIcons[event.type] || Clock;
                return (
                  <div key={i} className="flex items-start gap-4 pl-1">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 z-10 border border-border/50">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-xs font-medium">{event.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground font-mono">{event.date}</span>
                        {event.location && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Traceability Simulation */}
      <Card className="border-border/50 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary" />
            Tracciabilità Blockchain
            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30 ml-2">Simulazione</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Chain ID</p>
              <p className="text-xs font-mono">0x{ecu.dppId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 40)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Blocchi Registrati</p>
              <p className="text-xs font-mono">{ecu.lifecycle.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Ultimo Aggiornamento</p>
              <p className="text-xs font-mono">{ecu.lifecycle[ecu.lifecycle.length - 1]?.date || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
