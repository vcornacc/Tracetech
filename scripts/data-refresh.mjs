#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isDryRun = process.argv.includes("--dry-run");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return acc;
      const separator = trimmed.indexOf("=");
      if (separator < 0) return acc;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['\"]|['\"]$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

function loadEnv() {
  const envCandidates = [
    path.join(root, ".env.local.example"),
    path.join(root, ".env"),
    path.join(root, ".env.local"),
  ];

  const merged = {};
  for (const envPath of envCandidates) {
    Object.assign(merged, parseEnvFile(envPath));
  }
  Object.assign(merged, process.env);
  return merged;
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (cols[index] ?? "").trim();
    });
    return row;
  });
}

async function withRetry(operation, config = {}) {
  const maxAttempts = config.maxAttempts ?? 3;
  const baseDelayMs = config.baseDelayMs ?? 400;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      const backoffMs = baseDelayMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchJson(url, headers = {}) {
  return withRetry(async () => {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return response.json();
  });
}

async function fetchText(url, headers = {}) {
  return withRetry(async () => {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return response.text();
  });
}

async function fetchLmeData(env) {
  const apiUrl = env.LME_API_URL;
  if (!apiUrl) {
    throw new Error("LME_API_URL missing");
  }

  const headers = env.LME_API_KEY ? { Authorization: `Bearer ${env.LME_API_KEY}` } : {};
  const payload = await fetchJson(apiUrl, headers);

  if (!Array.isArray(payload?.materials)) {
    throw new Error("LME response must contain materials[]");
  }

  return payload.materials.map((item) => ({
    materialName: item.materialName,
    pricePerKg: safeNumber(item.pricePerKg, 0),
    volatility30d: clamp(safeNumber(item.volatility30d, 0), 0, 100),
    volatility1y: clamp(safeNumber(item.volatility1y, 0), 0, 100),
    sourceDate: item.sourceDate || new Date().toISOString().slice(0, 10),
  }));
}

async function fetchUsgsData(env) {
  const csvUrl = env.USGS_CSV_URL;
  if (!csvUrl) {
    throw new Error("USGS_CSV_URL missing");
  }

  const csvText = await fetchText(csvUrl);
  const rows = parseCsv(csvText);

  return rows.map((row) => ({
    materialName: row.material || row.material_name || row.name,
    reservesYears: clamp(safeNumber(row.reserves_years ?? row.reservesYears, 0), 0, 500),
    topProducer: row.top_producer || row.topProducer || "",
  }));
}

async function fetchGprData(env) {
  const csvUrl = env.GPR_CSV_URL;
  if (!csvUrl) {
    throw new Error("GPR_CSV_URL missing");
  }

  const csvText = await fetchText(csvUrl);
  const rows = parseCsv(csvText);

  return rows.map((row) => ({
    country: row.country || row.Country,
    score: clamp(safeNumber(row.gpr_score ?? row.score, 50), 0, 100),
  }));
}

function buildCountryRiskMap(gprRows) {
  const byCountry = new Map();
  for (const row of gprRows) {
    if (!row.country) continue;
    byCountry.set(normalizeName(row.country), row.score);
  }
  return byCountry;
}

function computeWeightedGpr(topProducers, countryRiskMap) {
  if (!Array.isArray(topProducers) || topProducers.length === 0) {
    return 50;
  }

  const scores = topProducers
    .map((country) => countryRiskMap.get(normalizeName(country)))
    .filter((score) => Number.isFinite(score));

  if (scores.length === 0) return 50;
  return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10;
}

async function logRefresh(supabase, entry) {
  const { error } = await supabase.from("data_refresh_log").insert(entry);
  if (error) {
    console.warn("[data:refresh] Failed to write data_refresh_log:", error.message);
  }
}

async function seedAlertLog(supabase, materials, warnings) {
  const { count, error: countError } = await supabase
    .from("alert_log")
    .select("id", { count: "exact", head: true })
    .is("resolved_at", null);

  if (countError) {
    warnings.push(`Alert seed skipped: ${countError.message}`);
    return 0;
  }

  if ((count ?? 0) > 0) {
    return 0;
  }

  const sortedByRisk = [...materials].sort((a, b) => {
    const riskA = safeNumber(a.risk_geopolitical, 0) + safeNumber(a.risk_price_volatility, 0);
    const riskB = safeNumber(b.risk_geopolitical, 0) + safeNumber(b.risk_price_volatility, 0);
    return riskB - riskA;
  });

  const seedRows = sortedByRisk.slice(0, 3).map((mat, idx) => ({
    material_id: mat.id,
    severity: idx === 0 ? "critical" : "high",
    title: `${mat.name} risk concentration alert`,
    description: `Auto-seeded from daily refresh: elevated combined geopolitical and volatility profile detected for ${mat.name}.`,
    metadata: {
      source: "auto-seed",
      affected_ecus: 0,
      seeded_from: "data-refresh",
    },
  }));

  if (seedRows.length === 0) {
    return 0;
  }

  const { error: insertError } = await supabase.from("alert_log").insert(seedRows);
  if (insertError) {
    warnings.push(`Alert seed failed: ${insertError.message}`);
    return 0;
  }

  return seedRows.length;
}

async function main() {
  const env = loadEnv();

  const supabaseUrl = env.VITE_SUPABASE_URL || (env.VITE_SUPABASE_PROJECT_ID ? `https://${env.VITE_SUPABASE_PROJECT_ID}.supabase.co` : undefined);
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[data:refresh] Missing VITE_SUPABASE_URL (or VITE_SUPABASE_PROJECT_ID) and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const warnings = [];
  const details = {};

  console.log(`[data:refresh] Start ${startedAt}${isDryRun ? " (dry-run)" : ""}`);

  const [{ data: materials, error: materialsError }, lmeResult, usgsResult, gprResult] = await Promise.all([
    supabase.from("materials").select("id,name,top_producers,risk_geopolitical,risk_price_volatility,price_per_kg,country_risk_scores"),
    fetchLmeData(env).catch((err) => {
      warnings.push(`LME: ${err.message}`);
      return [];
    }),
    fetchUsgsData(env).catch((err) => {
      warnings.push(`USGS: ${err.message}`);
      return [];
    }),
    fetchGprData(env).catch((err) => {
      warnings.push(`GPR: ${err.message}`);
      return [];
    }),
  ]);

  if (materialsError) {
    console.error("[data:refresh] Failed to load materials:", materialsError.message);
    await logRefresh(supabase, {
      source: "composite",
      status: "error",
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      rows_affected: 0,
      warning_count: warnings.length,
      error_message: materialsError.message,
      details: { warnings },
    });
    process.exit(1);
  }

  const materialsByName = new Map(materials.map((m) => [normalizeName(m.name), m]));
  const countryRiskMap = buildCountryRiskMap(gprResult);

  const updates = [];
  const priceHistoryRows = [];

  for (const material of materials) {
    const normalized = normalizeName(material.name);
    const lme = lmeResult.find((row) => normalizeName(row.materialName) === normalized);
    const usgs = usgsResult.find((row) => normalizeName(row.materialName) === normalized);

    const weightedGpr = computeWeightedGpr(material.top_producers, countryRiskMap);

    const countryScoreObject = {};
    for (const producer of material.top_producers || []) {
      const score = countryRiskMap.get(normalizeName(producer));
      if (Number.isFinite(score)) {
        countryScoreObject[producer] = score;
      }
    }

    const updateRow = {
      id: material.id,
      risk_geopolitical: weightedGpr,
      country_risk_scores: Object.keys(countryScoreObject).length > 0 ? countryScoreObject : material.country_risk_scores,
      updated_at: new Date().toISOString(),
    };

    if (lme) {
      updateRow.price_per_kg = lme.pricePerKg;
      updateRow.risk_price_volatility = lme.volatility1y;
      priceHistoryRows.push({
        material_id: material.id,
        price_per_kg: lme.pricePerKg,
        recorded_date: lme.sourceDate,
        source: "LME",
      });
    }

    if (usgs && usgs.reservesYears > 0) {
      details[material.name] = {
        ...(details[material.name] || {}),
        reservesYears: usgs.reservesYears,
        topProducerHint: usgs.topProducer,
      };
    }

    updates.push(updateRow);
  }

  details.summary = {
    materialsCount: materials.length,
    lmeMatches: lmeResult.filter((row) => materialsByName.has(normalizeName(row.materialName))).length,
    usgsMatches: usgsResult.filter((row) => materialsByName.has(normalizeName(row.materialName))).length,
    gprCountries: gprResult.length,
  };

  let rowsAffected = 0;
  let seededAlerts = 0;
  if (!isDryRun) {
    for (const row of updates) {
      const { error } = await supabase.from("materials").update(row).eq("id", row.id);
      if (error) {
        warnings.push(`Material update failed for ${row.id}: ${error.message}`);
        continue;
      }
      rowsAffected += 1;
    }

    for (const row of priceHistoryRows) {
      const { error } = await supabase
        .from("material_price_history")
        .upsert(row, { onConflict: "material_id,recorded_date" });
      if (error) {
        warnings.push(`Price history upsert failed for ${row.material_id}: ${error.message}`);
      }
    }

    seededAlerts = await seedAlertLog(supabase, materials, warnings);
  }

  // Retention cleanup (fallback if pg_cron is not available)
  if (!isDryRun) {
    const { error: cleanupError } = await supabase.rpc("cleanup_old_logs");
    if (cleanupError) {
      // Non-fatal: log and continue
      console.warn(`[data:refresh] Retention cleanup skipped: ${cleanupError.message}`);
    } else {
      console.log("[data:refresh] Retention cleanup completed.");
    }
  }

  const status = warnings.length > 0 ? "warning" : "success";
  await logRefresh(supabase, {
    source: "composite",
    status,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    rows_affected: isDryRun ? 0 : rowsAffected,
    warning_count: warnings.length,
    details: {
      dryRun: isDryRun,
      warnings,
      seededAlerts,
      summary: details.summary,
    },
  });

  console.log(`[data:refresh] Completed with status=${status}, rowsAffected=${rowsAffected}, warnings=${warnings.length}`);
  if (warnings.length > 0) {
    console.warn("[data:refresh] Warnings:");
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }
}

main().catch((error) => {
  console.error("[data:refresh] Fatal error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
