#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

async function main() {
  const env = loadEnv();
  const rawSupabaseUrl = env.VITE_SUPABASE_URL?.trim().replace(/^['\"]|['\"]$/g, "");
  const projectId = env.VITE_SUPABASE_PROJECT_ID?.trim().replace(/^['\"]|['\"]$/g, "");
  const supabaseUrl = rawSupabaseUrl
    ? (rawSupabaseUrl.startsWith("http://") || rawSupabaseUrl.startsWith("https://") ? rawSupabaseUrl : `https://${rawSupabaseUrl}`)
    : (projectId ? `https://${projectId}.supabase.co` : undefined);
  const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const redirectUrl = env.VITE_AUTH_EMAIL_REDIRECT_URL;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[auth:check] Missing Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured.");
    process.exit(1);
  }

  console.log("[auth:check] Supabase project URL detected:", supabaseUrl);

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status} ${response.statusText} - ${text.slice(0, 240)}`);
    }

    const settings = await response.json();

    console.log("[auth:check] Auth settings endpoint reachable.");
    console.log("[auth:check] Email confirmations required:", settings.mailer_autoconfirm === false ? "YES" : "NO / Unknown");

    if (redirectUrl) {
      console.log("[auth:check] Using email redirect URL from env:", redirectUrl);
    } else {
      console.warn("[auth:check] VITE_AUTH_EMAIL_REDIRECT_URL is not set. App falls back to <current-origin>/auth.");
    }

    console.log("\n[auth:check] SMTP/API verification checklist (Supabase Dashboard):");
    console.log("1. Auth > Email > enable custom SMTP provider for production.");
    console.log("2. Auth > URL Configuration > include your redirect URL in Additional Redirect URLs.");
    console.log("3. Auth > Logs > filter on 'email' events to verify delivery attempts.");
    console.log("4. If using external provider, confirm SPF/DKIM records are valid.");
  } catch (error) {
    console.error("[auth:check] Failed to read auth settings:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
