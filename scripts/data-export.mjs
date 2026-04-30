#!/usr/bin/env node
/**
 * data-export.mjs
 * Queries Supabase and writes TXT + CSV summary reports to reports/
 * Usage: node scripts/data-export.mjs [--dry-run]
 * Env:   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPORTS_DIR = join(ROOT, "reports");

const isDryRun = process.argv.includes("--dry-run");

// ── Env validation ──────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("[data:export] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

function writeSafe(filePath, content) {
  if (isDryRun) {
    console.log(`[dry-run] Would write ${filePath} (${content.length} bytes)`);
    return;
  }
  writeFileSync(filePath, content, "utf-8");
  console.log(`[data:export] Written: ${filePath}`);
}

// ── Queries ──────────────────────────────────────────────────────────────────

async function fetchRefreshLogs() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("data_refresh_log")
    .select("source, status, rows_affected, warning_count, started_at, finished_at")
    .gte("created_at", sevenDaysAgo)
    .order("finished_at", { ascending: false });
  if (error) throw new Error(`data_refresh_log query failed: ${error.message}`);
  return data ?? [];
}

async function fetchAlertSummary() {
  const { data, error } = await supabase
    .from("alert_log")
    .select("id, severity, title, created_at, resolved_at, acknowledged_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`alert_log query failed: ${error.message}`);
  return data ?? [];
}

async function fetchScenarioHistory() {
  const { data, error } = await supabase
    .from("scenario_history")
    .select("scenario_name, source, kpi_snapshot, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(`scenario_history query failed: ${error.message}`);
  return data ?? [];
}

// ── Report builders ──────────────────────────────────────────────────────────

function buildTxtReport(refreshLogs, alertSummary, scenarioHistory) {
  const total = refreshLogs.length;
  const successes = refreshLogs.filter((r) => r.status === "success").length;
  const failures = total - successes;
  const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;
  const lastRun = refreshLogs[0]?.finished_at
    ? new Date(refreshLogs[0].finished_at).toLocaleString("en-US")
    : "N/A";

  const openAlerts = alertSummary.filter((a) => !a.resolved_at);
  const resolvedAlerts = alertSummary.filter((a) => a.resolved_at);

  const lines = [
    "═══════════════════════════════════════════════════════════════",
    "  TraceTech — Scheduled Export Report",
    `  Generated: ${new Date().toLocaleString("en-US")}${isDryRun ? "  [DRY RUN]" : ""}`,
    "═══════════════════════════════════════════════════════════════",
    "",
    "1. DATA RELIABILITY (last 7 days)",
    "───────────────────────────────────────────────────────────────",
    `  Refresh runs:           ${total}`,
    `  Successful:             ${successes}`,
    `  Failed:                 ${failures}`,
    `  Success rate:           ${successRate}%`,
    `  Last run:               ${lastRun}`,
    "",
    "2. ALERT SUMMARY",
    "───────────────────────────────────────────────────────────────",
    `  Open alerts:            ${openAlerts.length}`,
    `  Resolved (last 50):     ${resolvedAlerts.length}`,
    ...openAlerts.slice(0, 10).map(
      (a) =>
        `  [${a.severity.toUpperCase()}] ${a.title} (${new Date(a.created_at).toLocaleDateString("en-US")})`
    ),
    "",
    "3. RECENT SCENARIO RUNS",
    "───────────────────────────────────────────────────────────────",
    ...scenarioHistory.slice(0, 5).map((s) => {
      const snap = s.kpi_snapshot ?? {};
      const severity = snap.result?.severity ?? "—";
      const cost = snap.result?.costImpactEuro != null
        ? `€${Math.round(snap.result.costImpactEuro).toLocaleString("en-US")}`
        : "—";
      return `  ${s.scenario_name} | ${severity.toUpperCase()} | impact ${cost} | ${new Date(s.created_at).toLocaleDateString("en-US")}`;
    }),
    "",
    "═══════════════════════════════════════════════════════════════",
    "  End of Report",
    "═══════════════════════════════════════════════════════════════",
  ];

  return lines.join("\n");
}

function buildCsvReport(refreshLogs, alertSummary, scenarioHistory) {
  const csvRows = [
    ["TraceTech Scheduled Export"],
    [`Date: ${timestamp()}${isDryRun ? " [DRY RUN]" : ""}`],
    [],
    ["Refresh Log (last 7 days)"],
    ["Source", "Status", "Rows Affected", "Warnings", "Started At", "Finished At"],
    ...refreshLogs.map((r) => [r.source, r.status, r.rows_affected, r.warning_count, r.started_at, r.finished_at]),
    [],
    ["Alert Summary (last 50)"],
    ["Severity", "Title", "Created At", "Acknowledged At", "Resolved At"],
    ...alertSummary.map((a) => [a.severity, `"${a.title}"`, a.created_at, a.acknowledged_at ?? "", a.resolved_at ?? ""]),
    [],
    ["Scenario History (last 10)"],
    ["Scenario", "Source", "Severity", "Cost Impact EUR", "Risk Delta", "Created At"],
    ...scenarioHistory.map((s) => {
      const snap = s.kpi_snapshot ?? {};
      return [
        `"${s.scenario_name}"`,
        s.source,
        snap.result?.severity ?? "",
        snap.result?.costImpactEuro ?? "",
        snap.result?.riskScoreChange ?? "",
        s.created_at,
      ];
    }),
  ];

  return csvRows.map((r) => r.join(";")).join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[data:export] Starting export${isDryRun ? " (dry-run)" : ""}…`);

  const [refreshLogs, alertSummary, scenarioHistory] = await Promise.all([
    fetchRefreshLogs(),
    fetchAlertSummary(),
    fetchScenarioHistory(),
  ]);

  console.log(
    `[data:export] Fetched ${refreshLogs.length} refresh logs, ${alertSummary.length} alerts, ${scenarioHistory.length} scenarios`
  );

  if (!isDryRun && !existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const txtContent = buildTxtReport(refreshLogs, alertSummary, scenarioHistory);
  const csvContent = buildCsvReport(refreshLogs, alertSummary, scenarioHistory);

  writeSafe(join(REPORTS_DIR, `TraceTech_Export_${timestamp()}.txt`), txtContent);
  writeSafe(join(REPORTS_DIR, `TraceTech_Export_${timestamp()}.csv`), csvContent);

  console.log("[data:export] Done.");
}

main().catch((err) => {
  console.error("[data:export] Fatal error:", err.message);
  process.exit(1);
});
