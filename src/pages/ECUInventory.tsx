import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/MetricCard";
import {
  Cpu, Search, MapPin, Activity, Recycle, Shield, AlertTriangle, ChevronRight, Package,
} from "lucide-react";
import { type ECU } from "@/data/ecuData";
import { useData } from "@/hooks/useData";

const statusConfig: Record<ECU["status"], { label: string; class: string }> = {
  active: { label: "Attivo", class: "bg-success/15 text-success border-success/30" },
  maintenance: { label: "Manutenzione", class: "bg-accent/15 text-accent border-accent/30" },
  eol: { label: "Fine Vita", class: "bg-destructive/15 text-destructive border-destructive/30" },
  recovered: { label: "Recuperato", class: "bg-primary/15 text-primary border-primary/30" },
  in_recovery: { label: "In Recovery", class: "bg-chart-violet/15 text-chart-violet border-chart-violet/30" },
};

const pathConfig: Record<ECU["circularPath"], { label: string; class: string }> = {
  repair: { label: "Repair", class: "bg-success/15 text-success border-success/30" },
  reuse: { label: "Reuse", class: "bg-primary/15 text-primary border-primary/30" },
  refurbish: { label: "Refurbish", class: "bg-accent/15 text-accent border-accent/30" },
  selective_recovery: { label: "Selective Recovery", class: "bg-chart-violet/15 text-chart-violet border-chart-violet/30" },
  pending: { label: "Pending", class: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30" },
};

export default function ECUInventory() {
  const navigate = useNavigate();
  const { ecuInventory } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pathFilter, setPathFilter] = useState("all");

  const filtered = ecuInventory.filter((ecu) => {
    const matchSearch =
      ecu.id.toLowerCase().includes(search.toLowerCase()) ||
      ecu.model.toLowerCase().includes(search.toLowerCase()) ||
      ecu.vehicleModel.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || ecu.status === statusFilter;
    const matchPath = pathFilter === "all" || ecu.circularPath === pathFilter;
    return matchSearch && matchStatus && matchPath;
  });

  const activeCount = ecuInventory.filter((e) => e.status === "active").length;
  const eolCount = ecuInventory.filter((e) => e.status === "eol" || e.status === "in_recovery").length;
  const recoveredCount = ecuInventory.filter((e) => e.status === "recovered").length;
  const totalCrmValue = ecuInventory.reduce((s, e) => s + e.crmValueEuro, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventario ECU</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Digital Product Passport — {ecuInventory.length} unità tracciate nel sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="ECU Attive" value={activeCount} subtitle="in servizio" icon={<Cpu className="w-5 h-5" />} variant="cyan" />
        <MetricCard title="Fine Vita / Recovery" value={eolCount} subtitle="in pipeline circolare" icon={<Recycle className="w-5 h-5" />} variant="amber" />
        <MetricCard title="ECU Recuperate" value={recoveredCount} subtitle="CRM reintegrati" icon={<Package className="w-5 h-5" />} variant="success" />
        <MetricCard title="Valore CRM Totale" value={`€${Math.round(totalCrmValue).toLocaleString()}`} subtitle="materiali recuperabili" icon={<Shield className="w-5 h-5" />} variant="critical" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cerca ECU, modello, veicolo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 bg-secondary/30 border-border/50" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9 bg-secondary/30 border-border/50"><SelectValue placeholder="Stato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="active">Attivo</SelectItem>
            <SelectItem value="maintenance">Manutenzione</SelectItem>
            <SelectItem value="eol">Fine Vita</SelectItem>
            <SelectItem value="in_recovery">In Recovery</SelectItem>
            <SelectItem value="recovered">Recuperato</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pathFilter} onValueChange={setPathFilter}>
          <SelectTrigger className="w-[180px] h-9 bg-secondary/30 border-border/50"><SelectValue placeholder="Percorso" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i percorsi</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="reuse">Reuse</SelectItem>
            <SelectItem value="refurbish">Refurbish</SelectItem>
            <SelectItem value="selective_recovery">Selective Recovery</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-[10px] uppercase tracking-wider">ID / Modello</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Veicolo</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Stato</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Percorso</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Health</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">CRM (g)</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Valore €</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Risk</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ecu) => {
                const sc = statusConfig[ecu.status];
                const pc = pathConfig[ecu.circularPath];
                return (
                  <TableRow
                    key={ecu.id}
                    className="cursor-pointer hover:bg-secondary/30 border-border/30"
                    onClick={() => navigate(`/ecu/${ecu.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium font-mono">{ecu.id}</p>
                        <p className="text-[10px] text-muted-foreground">{ecu.model}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs">{ecu.vehicleModel}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{ecu.location}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] ${sc.class}`}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] ${pc.class}`}>{pc.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={ecu.healthScore} className="h-1.5 w-16" />
                        <span className="text-[10px] font-mono">{ecu.healthScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{ecu.crmContentGrams.toFixed(1)}</TableCell>
                    <TableCell className="text-xs font-mono">€{ecu.crmValueEuro.toFixed(0)}</TableCell>
                    <TableCell>
                      <span className="text-xs font-bold" style={{
                        color: ecu.riskScore >= 70 ? "hsl(0, 72%, 55%)" : ecu.riskScore >= 50 ? "hsl(38, 92%, 55%)" : "hsl(160, 70%, 45%)"
                      }}>{ecu.riskScore}</span>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
