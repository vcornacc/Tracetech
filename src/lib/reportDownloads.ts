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
    [`Date: ${timestamp()}`],
    [],
    ["Material", "Yale Score", "EU SR×EI", "Cluster", "HHI", "Recovery Rate %", "Top Producers"],
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
    ["Cluster Distribution"],
    ["Cluster", "Count"],
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
    `  Generated: ${new Date().toLocaleString("en-US")}`,
    "═══════════════════════════════════════════════════════════════",
    "",
    "1. EXECUTIVE SUMMARY",
    "───────────────────────────────────────────────────────────────",
    `  Tracked materials:     ${criticalMaterials.length}`,
    `  High exposure (>=60):   ${highRisk.length}`,
    `  Average Yale Score:         ${avgYale}/100`,
    `  Average Recovery Rate:      ${avgRecovery}%`,
    "",
    "2. HIGH-EXPOSURE MATERIALS",
    "───────────────────────────────────────────────────────────────",
    ...highRisk.map((m) =>
      `  • ${m.name.padEnd(16)} Yale: ${m.yaleScore}  HHI: ${m.hhi.toString().padStart(5)}  Cluster: ${clusterInfo[m.cluster].label}`
    ),
    "",
    "3. CLUSTER DISTRIBUTION",
    "───────────────────────────────────────────────────────────────",
    ...Object.entries(clusterInfo).map(([key, info]) => {
      const count = criticalMaterials.filter((m) => m.cluster === key).length;
      const bar = "█".repeat(count) + "░".repeat(Math.max(0, 20 - count));
      return `  ${info.label.padEnd(30)} [${bar}] ${count}`;
    }),
    "",
    "4. MATERIAL DETAILS",
    "───────────────────────────────────────────────────────────────",
    "  Name            Yale  EU SR×EI  HHI    Recycling  Producers",
    "  ─────────────── ────  ────────  ─────  ───────  ──────────────────",
    ...criticalMaterials
      .sort((a, b) => b.yaleScore - a.yaleScore)
      .map((m) =>
        `  ${m.name.padEnd(16)} ${m.yaleScore.toString().padStart(3)}   ${m.euSRxEI.toFixed(1).padStart(6)}    ${m.hhi.toString().padStart(5)}    ${(m.recycleRate + "%").padStart(5)}    ${m.topProducers.join(", ")}`
      ),
    "",
    "═══════════════════════════════════════════════════════════════",
    "  End of Report",
    "═══════════════════════════════════════════════════════════════",
  ];
  downloadFile(lines.join("\n"), `CRIS_Executive_Report_${timestamp()}.txt`, "text/plain");
}

// ── Materials List Report ──
export function downloadMaterialsCSV(materials: CriticalMaterial[]) {
  const rows = [
    ["CRIS - CRM Materials Report"],
    [`Date: ${timestamp()}`],
    [],
    [
      "Material", "CAS", "g/Circuit", "Yale Score", "EU SR×EI", "Cluster",
      "HHI", "Recovery Rate %", "Supply Risk", "Geopolitical", "Price Vol.",
      "Recycling Gap", "ESG Risk", "HHI Concentration", "Top Producers",
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
    `  Generated: ${new Date().toLocaleString("en-US")}`,
    "═══════════════════════════════════════════════════════════════",
    "",
    "1. IDENTIFICATION",
    "───────────────────────────────────────────────────────────────",
    `  Name:              ${material.name}`,
    `  CAS Number:        ${material.casNumber}`,
    `  Weight/Circuit:     ${material.gramsPerCircuit.toFixed(4)} g`,
    `  Cluster:           ${cluster.label}`,
    "",
    "2. RISK INDICATORS",
    "───────────────────────────────────────────────────────────────",
    `  Yale Score:        ${material.yaleScore}/100  ${material.yaleScore >= 60 ? "⚠ HIGH EXPOSURE" : ""}`,
    `  EU SR × EI:        ${material.euSRxEI}  ${material.euSRxEI >= 3.5 ? "⚠ EU CRITICAL ZONE" : ""}`,
    `  HHI:               ${material.hhi}  ${material.hhi >= 2500 ? "⚠ CONCENTRATED MARKET" : ""}`,
    `  Recovery Rate:     ${material.recycleRate}%`,
    `  Average Risk:     ${avgRisk}/100`,
    "",
    "3. DETAILED RISK PROFILE",
    "───────────────────────────────────────────────────────────────",
    ...material.riskProfile.map((r) => {
      const bar = "█".repeat(Math.round(r.value / 5)) + "░".repeat(Math.max(0, 20 - Math.round(r.value / 5)));
      return `  ${r.subject.padEnd(18)} [${bar}] ${r.value}/100`;
    }),
    "",
    "4. GEOGRAPHIC CONCENTRATION",
    "───────────────────────────────────────────────────────────────",
    `  Top Producers:`,
    ...material.topProducers.map((p, i) => `    ${i + 1}. ${p}`),
    "",
    "═══════════════════════════════════════════════════════════════",
    "  End of Report",
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
    [`Date: ${timestamp()}`],
    [],
    ["Field", "Value"],
    ["Name", material.name],
    ["CAS Number", material.casNumber],
    ["g/Circuit", material.gramsPerCircuit],
    ["Yale Score", material.yaleScore],
    ["EU SR×EI", material.euSRxEI],
    ["Cluster", clusterInfo[material.cluster].label],
    ["HHI", material.hhi],
    ["Recovery Rate %", material.recycleRate],
    ["Top Producers", `"${material.topProducers.join(", ")}"`],
    [],
    ["Risk Dimension", "Value"],
    ...material.riskProfile.map((r) => [r.subject, r.value]),
  ];
  downloadFile(
    rows.map((r) => r.join(";")).join("\n"),
    `CRIS_${material.name}_${timestamp()}.csv`,
    "text/csv"
  );
}
