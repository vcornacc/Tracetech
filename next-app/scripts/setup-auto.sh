#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf "\n[%s] %s\n" "setup-auto" "$1"
}

fail() {
  printf "\n[setup-auto] ERROR: %s\n" "$1" >&2
  exit 1
}

get_env_value() {
  local key="$1"
  local file="$2"
  grep -E "^${key}=" "$file" | head -n 1 | cut -d'=' -f2-
}

is_placeholder() {
  local value="$1"
  [[ -z "$value" || "$value" == *"YOUR_"* || "$value" == *"example"* || "$value" == *"changeme"* ]]
}

if [[ ! -f .env.local ]]; then
  fail "Missing .env.local. Create it with: cp .env.local.example .env.local"
fi

# Required keys used by the app.
required_keys=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

for key in "${required_keys[@]}"; do
  if ! grep -q -E "^${key}=" .env.local; then
    fail "${key} is missing in .env.local"
  fi
  value="$(get_env_value "$key" .env.local)"
  if is_placeholder "$value"; then
    fail "${key} in .env.local looks like a placeholder value"
  fi
done

SUPABASE_URL="$(get_env_value "NEXT_PUBLIC_SUPABASE_URL" .env.local)"
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [[ -z "$SUPABASE_PROJECT_REF" ]]; then
  SUPABASE_PROJECT_REF="$(printf "%s" "$SUPABASE_URL" | sed -E 's#https://([^.]+)\.supabase\.co.*#\1#')"
fi

if [[ -z "$SUPABASE_PROJECT_REF" || "$SUPABASE_PROJECT_REF" == "$SUPABASE_URL" ]]; then
  fail "Unable to derive SUPABASE_PROJECT_REF from NEXT_PUBLIC_SUPABASE_URL. Export SUPABASE_PROJECT_REF and retry."
fi

SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-$(get_env_value "SUPABASE_DB_PASSWORD" .env.local || true)}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-$(get_env_value "SUPABASE_ACCESS_TOKEN" .env.local || true)}"

if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
  fail "Missing SUPABASE_ACCESS_TOKEN. Add it to .env.local (or export it) to run setup fully non-interactive."
fi

if [[ -z "$SUPABASE_DB_PASSWORD" ]]; then
  fail "Missing SUPABASE_DB_PASSWORD. Add it to .env.local (or export it) to avoid interactive prompts during link/db push."
fi

if [[ ! -d node_modules ]]; then
  log "Installing npm dependencies"
  npm install
fi

log "Ensuring Supabase CLI is available"
npx -y supabase@latest --version >/dev/null

if [[ ! -f supabase/config.toml ]]; then
  log "Initializing Supabase project files"
  npx -y supabase@latest init --workdir .
fi

if [[ -n "$SUPABASE_ACCESS_TOKEN" ]]; then
  export SUPABASE_ACCESS_TOKEN
fi

log "Linking project ref: ${SUPABASE_PROJECT_REF}"
npx -y supabase@latest link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" --workdir . --yes

log "Pushing migrations to linked Supabase project"
npx -y supabase@latest db push --linked --password "$SUPABASE_DB_PASSWORD" --workdir . --yes

log "Generating database types"
npx -y supabase@latest gen types typescript --linked --workdir . > src/lib/supabase/database.types.ts

if [[ "${SETUP_AUTO_RUN_BUILD:-0}" == "1" ]]; then
  log "Running production build check"
  npm run build
fi

cat <<'EOF'

[setup-auto] Completed.

What is already automated:
- Env file sanity checks
- Supabase CLI setup/init
- Supabase project link
- Migration push
- Generated TypeScript DB types

Optional next actions:
1) Start local app: npm run dev
2) For Vercel, add env vars in dashboard or CLI and deploy.
EOF
