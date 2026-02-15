import { criticalMaterials, clusterInfo } from "@/data/materialsData";
import type { CriticalMaterial } from "@/data/materialsData";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

// ── Dashboard Executive Report ──
export function downloadDashboardCSV() {
  const rows = [
    ["CRIS - Dashboard Executive Report"],
    [`Data: ${timestamp()}`],
    [],
    ["Materiale", "Yale Score", "EU SR×EI", "Cluster", "HHI", "Recovery Rate %", "Top Produttori"],
    ...criticalMaterials.map((m) => [
      m.name,
      m.yaleScore,
      m.euSRxEI,
      clusterInfo[m.cluster].label,
      m.hhi,
      m.recycleRate,
      `"${m.topProducers.join(", ")}"`,
    ]),
    [],
    ["Distribuzione Cluster"],
    ["Cluster", "Conteggio"],
    ...Object.entries(clusterInfo).map(([key, info]) => [
      info.label,
      criticalMaterials.filter((m) => m.cluster === key).length,
    ]),
  ];
  downloadFile(rows.map((r) => r.join(";")).join("\n"), `CRIS_Dashboard_${timestamp()}.csv`, "text/csv");
}

export function downloadDashboardReport() {
  const avgYale = Math.round(criticalMaterials.reduce((s, m) => s + m.yaleScore, 0) / criticalMaterials.length);
  const avgRecovery = Math.round(criticalMaterials.reduce((s, m) => s + m.recycleRate, 0) / criticalMaterials.length);
  const highRisk = criticalMaterials.filter((m) => m.yaleScore >= 60);

  const lines = [
    "═══════════════════════════════════════════════════════════════",
    "  CRIS — CIRCULAR RISK INTELLIGENCE SYSTEM",
    "  Dashboard Executive Report",
    `  Generato: ${new Date().toLocaleString("it-IT")}`,
    "═══════════════════════════════════════════════════════════════",
    "",
    "1. RIEPILOGO ESECUTIVO",
    "───────────────────────────────────────────────────────────────",
    `  Materiali monitorati:     ${criticalMaterials.length}`,
    `  Alta esposizione (≥60):   ${highRisk.length}`,
    `  Yale Score medio:         ${avgYale}/100`,
    `  Recovery Rate medio:      ${avgRecovery}%`,
    "",
    "2. MATERIALI AD ALTA ESPOSIZIONE",
    "───────────────────────────────────────────────────────────────",
    ...highRisk.map((m) =>
      `  • ${m.name.padEnd(16)} Yale: ${m.yaleScore}  HHI: ${m.hhi.toString().padStart(5)}  Cluster: ${clusterInfo[m.cluster].label}`
    ),
    "",
    "3. DISTRIBUZIONE CLUSTER",
    "───────────────────────────────────────────────────────────────",
    ...Object.entries(clusterInfo).map(([key, info]) => {
      const count = criticalMaterials.filter((m) => m.cluster === key).length;
      const bar = "█".repeat(count) + "░".repeat(Math.max(0, 20 - count));
      return `  ${info.label.padEnd(30)} [${bar}] ${count}`;
    }),
    "",
    "4. DETTAGLIO MATERIALI",
    "───────────────────────────────────────────────────────────────",
    "  Nome            Yale  EU SR×EI  HHI    Riciclo  Produttori",
    "  ─────────────── ────  ────────  ─────  ───────  ──────────────────",
    ...criticalMaterials
      .sort((a, b) => b.yaleScore - a.yaleScore)
      .map((m) =>
        `  ${m.name.padEnd(16)} ${m.yaleScore.toString().padStart(3)}   ${m.euSRxEI.toFixed(1).padStart(6)}    ${m.hhi.toString().padStart(5)}    ${(m.recycleRate + "%").padStart(5)}    ${m.topProducers.join(", ")}`
      ),
    "",
    "═══════════════════════════════════════════════════════════════",
    "  Fine Report",
    "═══════════════════════════════════════════════════════════════",
  ];
  downloadFile(lines.join("\n"), `CRIS_Executive_Report_${timestamp()}.txt`, "text/plain");
}

// ── Materials List Report ──
export function downloadMaterialsCSV(materials: CriticalMaterial[]) {
  const rows = [
    ["CRIS - Materiali CRM Report"],
    [`Data: ${timestamp()}`],
    [],
    [
      "Materiale", "CAS", "g/Circuit", "Yale Score", "EU SR×EI", "Cluster",
      "HHI", "Recovery Rate %", "Supply Risk", "Geopolitica", "Prezzo Vol.",
      "Riciclo Gap", "ESG Risk", "Concentr. HHI", "Top Produttori",
    ],
    ...materials.map((m) => [
      m.name,
      m.casNumber,
      m.gramsPerCircuit,
      m.yaleScore,
      m.euSRxEI,
      clusterInfo[m.cluster].label,
      m.hhi,
      m.recycleRate,
      ...m.riskProfile.map((r) => r.value),
      `"${m.topProducers.join(", ")}"`,
    ]),
  ];
  downloadFile(rows.map((r) => r.join(";")).join("\n"), `CRIS_Materials_${timestamp()}.csv`, "text/csv");
}

// ── Single Material Detail Report ──
export function downloadMaterialDetailReport(material: CriticalMaterial) {
  const cluster = clusterInfo[material.cluster];
  const avgRisk = Math.round(
    material.riskProfile.reduce((s, r) => s + r.value, 0) / material.riskProfile.length
  );

  const lines = [
    "═══════════════════════════════════════════════════════════════",
    `  CRIS — Material Risk Report: ${material.name}`,
    `  Generato: ${new Date().toLocaleString("it-IT")}`,
    "═══════════════════════════════════════════════════════════════",
    "",
    "1. IDENTIFICAZIONE",
    "───────────────────────────────────────────────────────────────",
    `  Nome:              ${material.name}`,
    `  CAS Number:        ${material.casNumber}`,
    `  Peso/Circuito:     ${material.gramsPerCircuit.toFixed(4)} g`,
    `  Cluster:           ${cluster.label}`,
    "",
    "2. INDICATORI DI RISCHIO",
    "───────────────────────────────────────────────────────────────",
    `  Yale Score:        ${material.yaleScore}/100  ${material.yaleScore >= 60 ? "⚠ ALTA ESPOSIZIONE" : ""}`,
    `  EU SR × EI:        ${material.euSRxEI}  ${material.euSRxEI >= 3.5 ? "⚠ ZONA CRITICA EU" : ""}`,
    `  HHI:               ${material.hhi}  ${material.hhi >= 2500 ? "⚠ MERCATO CONCENTRATO" : ""}`,
    `  Recovery Rate:     ${material.recycleRate}%`,
    `  Rischio Medio:     ${avgRisk}/100`,
    "",
    "3. PROFILO DI RISCHIO DETTAGLIATO",
    "───────────────────────────────────────────────────────────────",
    ...material.riskProfile.map((r) => {
      const bar = "█".repeat(Math.round(r.value / 5)) + "░".repeat(Math.max(0, 20 - Math.round(r.value / 5)));
      return `  ${r.subject.padEnd(18)} [${bar}] ${r.value}/100`;
    }),
    "",
    "4. CONCENTRAZIONE GEOGRAFICA",
    "───────────────────────────────────────────────────────────────",
    `  Top Produttori:`,
    ...material.topProducers.map((p, i) => `    ${i + 1}. ${p}`),
    "",
    "═══════════════════════════════════════════════════════════════",
    "  Fine Report",
    "═══════════════════════════════════════════════════════════════",
  ];
  downloadFile(
    lines.join("\n"),
    `CRIS_${material.name}_Report_${timestamp()}.txt`,
    "text/plain"
  );
}

export function downloadMaterialDetailCSV(material: CriticalMaterial) {
  const rows = [
    [`CRIS - Report: ${material.name}`],
    [`Data: ${timestamp()}`],
    [],
    ["Campo", "Valore"],
    ["Nome", material.name],
    ["CAS Number", material.casNumber],
    ["g/Circuit", material.gramsPerCircuit],
    ["Yale Score", material.yaleScore],
    ["EU SR×EI", material.euSRxEI],
    ["Cluster", clusterInfo[material.cluster].label],
    ["HHI", material.hhi],
    ["Recovery Rate %", material.recycleRate],
    ["Top Produttori", `"${material.topProducers.join(", ")}"`],
    [],
    ["Dimensione Rischio", "Valore"],
    ...material.riskProfile.map((r) => [r.subject, r.value]),
  ];
  downloadFile(
    rows.map((r) => r.join(";")).join("\n"),
    `CRIS_${material.name}_${timestamp()}.csv`,
    "text/csv"
  );
}
