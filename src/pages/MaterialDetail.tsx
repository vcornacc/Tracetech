import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  MapPin,
  Recycle,
  Globe,
  Activity,
  AlertTriangle,
  Shield,
  TrendingUp,
  Factory,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { clusterInfo } from "@/data/materialsData";
import { useData } from "@/hooks/useData";
import { DownloadReportSection } from "@/components/DownloadReportSection";
import { downloadMaterialDetailReport, downloadMaterialDetailCSV } from "@/lib/reportDownloads";

const clusterBadgeVariant: Record<string, string> = {
  systemic: "bg-[hsl(0,72%,55%)]/15 text-[hsl(0,72%,65%)] border-[hsl(0,72%,55%)]/30",
  product: "bg-[hsl(38,92%,55%)]/15 text-[hsl(38,92%,65%)] border-[hsl(38,92%,55%)]/30",
  sectoral: "bg-[hsl(190,85%,50%)]/15 text-[hsl(190,85%,60%)] border-[hsl(190,85%,50%)]/30",
  operational: "bg-[hsl(160,70%,45%)]/15 text-[hsl(160,70%,55%)] border-[hsl(160,70%,45%)]/30",
};

// Demo supplier data per material
const suppliersData: Record<string, { name: string; country: string; share: number; risk: "low" | "medium" | "high" }[]> = {
  Cobalt: [
    { name: "Glencore", country: "Congo (DRC)", share: 35, risk: "high" },
    { name: "Umicore", country: "Belgium", share: 25, risk: "low" },
    { name: "Norilsk Nickel", country: "Russia", share: 20, risk: "high" },
    { name: "BHP", country: "Australia", share: 20, risk: "medium" },
  ],
  Copper: [
    { name: "Codelco", country: "Chile", share: 30, risk: "medium" },
    { name: "Freeport-McMoRan", country: "USA", share: 25, risk: "low" },
    { name: "BHP", country: "Australia", share: 20, risk: "low" },
    { name: "Jiangxi Copper", country: "China", share: 25, risk: "medium" },
  ],
  Palladium: [
    { name: "Norilsk Nickel", country: "Russia", share: 40, risk: "high" },
    { name: "Anglo American Platinum", country: "South Africa", share: 30, risk: "medium" },
    { name: "Impala Platinum", country: "South Africa", share: 20, risk: "medium" },
    { name: "Vale", country: "Canada", share: 10, risk: "low" },
  ],
  Platinum: [
    { name: "Anglo American Platinum", country: "South Africa", share: 38, risk: "medium" },
    { name: "Impala Platinum", country: "South Africa", share: 25, risk: "medium" },
    { name: "Norilsk Nickel", country: "Russia", share: 22, risk: "high" },
    { name: "Sibanye-Stillwater", country: "South Africa", share: 15, risk: "medium" },
  ],
  Tin: [
    { name: "Yunnan Tin", country: "China", share: 30, risk: "medium" },
    { name: "PT Timah", country: "Indonesia", share: 25, risk: "medium" },
    { name: "Minsur", country: "Peru", share: 20, risk: "low" },
    { name: "Malaysia Smelting Corp", country: "Malaysia", share: 25, risk: "low" },
  ],
  Silver: [
    { name: "Fresnillo", country: "Mexico", share: 28, risk: "medium" },
    { name: "KGHM", country: "Poland", share: 22, risk: "low" },
    { name: "Pan American Silver", country: "Canada", share: 25, risk: "low" },
    { name: "Polymetal", country: "Russia", share: 25, risk: "high" },
  ],
  Nickel: [
    { name: "Vale", country: "Brazil", share: 25, risk: "low" },
    { name: "Norilsk Nickel", country: "Russia", share: 30, risk: "high" },
    { name: "PT Aneka Tambang", country: "Indonesia", share: 25, risk: "medium" },
    { name: "Jinchuan Group", country: "China", share: 20, risk: "medium" },
  ],
  Tantalum: [
    { name: "Global Advanced Metals", country: "Australia", share: 30, risk: "low" },
    { name: "AMG Advanced Metallurgical", country: "Brazil", share: 25, risk: "low" },
    { name: "Kemet", country: "USA", share: 20, risk: "low" },
    { name: "Mining Minerals Resources", country: "Congo (DRC)", share: 25, risk: "high" },
  ],
  Tungsten: [
    { name: "China Minmetals", country: "China", share: 40, risk: "high" },
    { name: "Wolfram Bergbau", country: "Austria", share: 20, risk: "low" },
    { name: "Sandvik", country: "Sweden", share: 20, risk: "low" },
    { name: "Masan Resources", country: "Vietnam", share: 20, risk: "medium" },
  ],
  Indium: [
    { name: "Korea Zinc", country: "South Korea", share: 30, risk: "low" },
    { name: "Dowa Holdings", country: "Japan", share: 25, risk: "low" },
    { name: "Teck Resources", country: "Canada", share: 20, risk: "low" },
    { name: "Zhuzhou Smelter", country: "China", share: 25, risk: "medium" },
  ],
  Germanium: [
    { name: "Yunnan Germanium", country: "China", share: 45, risk: "high" },
    { name: "Umicore", country: "Belgium", share: 25, risk: "low" },
    { name: "Teck Resources", country: "Canada", share: 15, risk: "low" },
    { name: "PPM Pure Metals", country: "Germany", share: 15, risk: "low" },
  ],
  Ruthenium: [
    { name: "Anglo American Platinum", country: "South Africa", share: 40, risk: "medium" },
    { name: "Norilsk Nickel", country: "Russia", share: 35, risk: "high" },
    { name: "Impala Platinum", country: "South Africa", share: 25, risk: "medium" },
  ],
  Gold: [
    { name: "Newmont", country: "USA", share: 25, risk: "low" },
    { name: "Barrick Gold", country: "Canada", share: 25, risk: "low" },
    { name: "AngloGold Ashanti", country: "South Africa", share: 25, risk: "medium" },
    { name: "Polyus", country: "Russia", share: 25, risk: "high" },
  ],
};

const riskColors = {
  low: "hsl(160, 70%, 45%)",
  medium: "hsl(38, 92%, 55%)",
  high: "hsl(0, 72%, 55%)",
};

function getRiskLevel(value: number) {
  if (value >= 70) return { label: "CRITICO", color: "hsl(0, 72%, 55%)" };
  if (value >= 50) return { label: "ELEVATO", color: "hsl(38, 92%, 55%)" };
  if (value >= 30) return { label: "MODERATO", color: "hsl(190, 85%, 50%)" };
  return { label: "BASSO", color: "hsl(160, 70%, 45%)" };
}

export default function MaterialDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { materials: criticalMaterials } = useData();

  const material = criticalMaterials.find(
    (m) => m.name.toLowerCase() === name?.toLowerCase()
  );

  if (!material) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/materials")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Torna ai materiali
        </Button>
        <p className="text-muted-foreground">Materiale non trovato.</p>
      </div>
    );
  }

  const cluster = clusterInfo[material.cluster];
  const avgRisk = Math.round(
    material.riskProfile.reduce((sum, r) => sum + r.value, 0) / material.riskProfile.length
  );
  const geoRisk = material.riskProfile.find((r) => r.subject === "Geopolitica")?.value ?? 0;
  const supplyRisk = material.riskProfile.find((r) => r.subject === "Supply Risk")?.value ?? 0;
  const suppliers = suppliersData[material.name] || [
    { name: "Fornitore Generico 1", country: material.topProducers[0] || "N/A", share: 40, risk: "medium" as const },
    { name: "Fornitore Generico 2", country: material.topProducers[1] || "N/A", share: 35, risk: "low" as const },
    { name: "Fornitore Generico 3", country: material.topProducers[2] || "N/A", share: 25, risk: "low" as const },
  ];

  const avgRiskInfo = getRiskLevel(avgRisk);
  const geoRiskInfo = getRiskLevel(geoRisk);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => navigate("/materials")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{material.name}</h1>
            <Badge
              variant="outline"
              className={`text-[10px] ${clusterBadgeVariant[material.cluster]}`}
            >
              {cluster.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            CAS {material.casNumber} — {material.gramsPerCircuit.toFixed(4)} g per circuito ESU
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Activity className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Yale Score</p>
            <p className="text-xl font-bold mt-1" style={{ color: material.yaleScore >= 60 ? "hsl(0, 72%, 55%)" : undefined }}>
              {material.yaleScore}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Recycle className="w-5 h-5 mx-auto mb-2 text-[hsl(160,70%,45%)]" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Recovery Rate</p>
            <p className="text-xl font-bold mt-1">{material.recycleRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Globe className="w-5 h-5 mx-auto mb-2" style={{ color: geoRiskInfo.color }} />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rischio Geopolitico</p>
            <p className="text-xl font-bold mt-1" style={{ color: geoRiskInfo.color }}>{geoRisk}/100</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Shield className="w-5 h-5 mx-auto mb-2" style={{ color: avgRiskInfo.color }} />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rischio Medio</p>
            <p className="text-xl font-bold mt-1" style={{ color: avgRiskInfo.color }}>{avgRisk}/100</p>
            <p className="text-[9px] mt-0.5" style={{ color: avgRiskInfo.color }}>{avgRiskInfo.label}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Profile Radar */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Profilo di Rischio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={material.riskProfile} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(220, 14%, 18%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke={cluster.color}
                  fill={cluster.color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 22%, 10%)",
                    border: "1px solid hsl(220, 14%, 20%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            {/* Risk breakdown bars */}
            <div className="space-y-2 mt-4">
              {material.riskProfile.map((r) => {
                const info = getRiskLevel(r.value);
                return (
                  <div key={r.subject} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{r.subject}</span>
                      <span className="font-medium" style={{ color: info.color }}>{r.value}</span>
                    </div>
                    <Progress value={r.value} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Suppliers */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Factory className="w-4 h-4 text-primary" />
              Fornitori
            </CardTitle>
            <p className="text-xs text-muted-foreground">Distribuzione approvvigionamento e livello di rischio</p>
          </CardHeader>
          <CardContent>
            {/* Supplier share bar chart */}
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={suppliers} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" horizontal={false} />
                <XAxis type="number" domain={[0, 50]} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                <Bar dataKey="share" radius={[0, 4, 4, 0]} barSize={20}>
                  {suppliers.map((s, i) => (
                    <Cell key={i} fill={riskColors[s.risk]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Supplier detail list */}
            <div className="space-y-2 mt-4">
              {suppliers.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: riskColors[s.risk] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{s.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground">{s.country}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold">{s.share}%</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: riskColors[s.risk] }}>
                      {s.risk === "high" ? "Alto" : s.risk === "medium" ? "Medio" : "Basso"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geopolitical Concentration */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Concentrazione Geografica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Produttori</p>
              {material.topProducers.map((p, i) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm">{p}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Indice HHI</p>
              <p className="text-3xl font-bold">{material.hhi.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {material.hhi >= 2500 ? "Mercato altamente concentrato" : material.hhi >= 1500 ? "Concentrazione moderata" : "Mercato competitivo"}
              </p>
              <Progress value={Math.min(material.hhi / 50, 100)} className="h-2" />
            </div>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">EU SR × EI</p>
              <p className="text-3xl font-bold">{material.euSRxEI}</p>
              <p className="text-xs text-muted-foreground">
                {material.euSRxEI >= 3.5 ? "Zona critica EU" : material.euSRxEI >= 2.5 ? "Monitoraggio attivo" : "Sotto soglia"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Download Report */}
      <DownloadReportSection
        title={`Esporta Report ${material.name}`}
        actions={[
          { label: "Report Dettagliato (.txt)", description: "Report completo con profilo di rischio", icon: "txt", onClick: () => downloadMaterialDetailReport(material) },
          { label: "Dati (.csv)", description: "Esporta dati materiale", icon: "csv", onClick: () => downloadMaterialDetailCSV(material) },
        ]}
      />
    </div>
  );
}
