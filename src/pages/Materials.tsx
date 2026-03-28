import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadReportSection } from "@/components/DownloadReportSection";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Search, MapPin, Recycle, Activity, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { clusterInfo, type CriticalMaterial } from "@/data/materialsData";
import { useData } from "@/hooks/useData";
import { downloadMaterialsCSV } from "@/lib/reportDownloads";

const clusterBadgeVariant: Record<string, string> = {
  systemic: "bg-[hsl(0,72%,55%)]/15 text-[hsl(0,72%,65%)] border-[hsl(0,72%,55%)]/30",
  product: "bg-[hsl(38,92%,55%)]/15 text-[hsl(38,92%,65%)] border-[hsl(38,92%,55%)]/30",
  sectoral: "bg-[hsl(190,85%,50%)]/15 text-[hsl(190,85%,60%)] border-[hsl(190,85%,50%)]/30",
  operational: "bg-[hsl(160,70%,45%)]/15 text-[hsl(160,70%,55%)] border-[hsl(160,70%,45%)]/30",
};

function MaterialCard({ material }: { material: CriticalMaterial }) {
  const navigate = useNavigate();
  const cluster = clusterInfo[material.cluster];
  const avgRisk = Math.round(
    material.riskProfile.reduce((sum, r) => sum + r.value, 0) / material.riskProfile.length
  );

  return (
    <Card
      className="border-border/50 hover:border-primary/40 transition-colors cursor-pointer"
      onClick={() => navigate(`/materials/${material.name.toLowerCase()}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{material.name}</CardTitle>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              CAS {material.casNumber}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 shrink-0 ${clusterBadgeVariant[material.cluster]}`}
          >
            {cluster.label.split(" ")[0]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Radar Chart */}
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={material.riskProfile} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="hsl(220, 14%, 18%)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 8 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke={cluster.color}
              fill={cluster.color}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 22%, 10%)",
                border: "1px solid hsl(220, 14%, 20%)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-secondary/30 p-1.5">
            <p className="text-[9px] text-muted-foreground">Yale</p>
            <p className="text-xs font-bold" style={{ color: material.yaleScore >= 60 ? "hsl(0, 72%, 55%)" : "hsl(215, 15%, 70%)" }}>
              {material.yaleScore}
            </p>
          </div>
          <div className="rounded-md bg-secondary/30 p-1.5">
            <p className="text-[9px] text-muted-foreground">HHI</p>
            <p className="text-xs font-bold">{material.hhi.toLocaleString()}</p>
          </div>
          <div className="rounded-md bg-secondary/30 p-1.5">
            <p className="text-[9px] text-muted-foreground">Avg Risk</p>
            <p className="text-xs font-bold" style={{ color: avgRisk >= 70 ? "hsl(0, 72%, 55%)" : avgRisk >= 50 ? "hsl(38, 92%, 55%)" : "hsl(160, 70%, 45%)" }}>
              {avgRisk}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-[10px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>{material.gramsPerCircuit.toFixed(4)} g/circuit</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Recycle className="w-3 h-3" />
            <span>Tasso riciclo: {material.recycleRate}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{material.topProducers.join(", ")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Materials() {
  const { materials: criticalMaterials } = useData();
  const [search, setSearch] = useState("");
  const [clusterFilter, setClusterFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("yaleScore");

  const filtered = criticalMaterials
    .filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchCluster = clusterFilter === "all" || m.cluster === clusterFilter;
      return matchSearch && matchCluster;
    })
    .sort((a, b) => {
      if (sortBy === "yaleScore") return b.yaleScore - a.yaleScore;
      if (sortBy === "hhi") return b.hhi - a.hhi;
      if (sortBy === "grams") return b.gramsPerCircuit - a.gramsPerCircuit;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Materiali CRM</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Profilo di rischio per {criticalMaterials.length} materiali critici — dati Bosch Circuit ESU
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca materiale..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-secondary/30 border-border/50"
          />
        </div>
        <Select value={clusterFilter} onValueChange={setClusterFilter}>
          <SelectTrigger className="w-[180px] h-9 bg-secondary/30 border-border/50">
            <SelectValue placeholder="Tutti i cluster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i cluster</SelectItem>
            <SelectItem value="systemic">Systemic Dual Exposure</SelectItem>
            <SelectItem value="product">Product-Embedded</SelectItem>
            <SelectItem value="sectoral">Sectoral Strategic</SelectItem>
            <SelectItem value="operational">Operational Backbone</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] h-9 bg-secondary/30 border-border/50">
            <SelectValue placeholder="Ordina per" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yaleScore">Yale Score ↓</SelectItem>
            <SelectItem value="hhi">HHI ↓</SelectItem>
            <SelectItem value="grams">Peso ↓</SelectItem>
            <SelectItem value="name">Nome A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cluster Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(clusterInfo).map(([key, info]) => {
          const count = criticalMaterials.filter((m) => m.cluster === key).length;
          return (
            <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
              <span>{info.label} ({count})</span>
            </div>
          );
        })}
      </div>

      {/* Material Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((material) => (
          <MaterialCard key={material.casNumber + material.name} material={material} />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Database className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nessun materiale trovato</p>
          </CardContent>
        </Card>
      )}
      {/* Download */}
      <DownloadReportSection
        title="Esporta Materiali"
        actions={[
          {
            label: `Esporta ${filtered.length} materiali (.csv)`,
            description: "Esporta lista filtrata con profili di rischio",
            icon: "csv",
            onClick: () => downloadMaterialsCSV(filtered),
          },
        ]}
      />
    </div>
  );
}
