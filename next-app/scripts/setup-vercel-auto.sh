#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf "\n[%s] %s\n" "setup-vercel" "$1"
}

fail() {
  printf "\n[setup-vercel] ERROR: %s\n" "$1" >&2
  exit 1
}

get_env_value() {
  local key="$1"
  local file="$2"
  grep -E "^${key}=" "$file" | head -n 1 | cut -d'=' -f2-
}

get_project_json_value() {
  local key="$1"

  if [[ ! -f .vercel/project.json ]]; then
    return 0
  fi

  node -e '
const fs = require("fs");
const filePath = process.argv[1];
const key = process.argv[2];
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
process.stdout.write(data[key] ?? "");
' .vercel/project.json "$key"
}

if [[ ! -f .env.local ]]; then
  fail "Missing .env.local"
fi

ENV_LOCAL_BACKUP="$(mktemp)"
cp .env.local "$ENV_LOCAL_BACKUP"

restore_env_local() {
  if [[ -f "$ENV_LOCAL_BACKUP" ]]; then
    cp "$ENV_LOCAL_BACKUP" .env.local
    rm -f "$ENV_LOCAL_BACKUP"
  fi
}

trap restore_env_local EXIT

required_keys=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

for key in "${required_keys[@]}"; do
  if ! grep -q -E "^${key}=" .env.local; then
    fail "${key} is missing in .env.local"
  fi
done

VERCEL_TOKEN="${VERCEL_TOKEN:-$(get_env_value "VERCEL_TOKEN" .env.local || true)}"
VERCEL_PROJECT="${VERCEL_PROJECT:-$(get_env_value "VERCEL_PROJECT" .env.local || true)}"
VERCEL_TEAM="${VERCEL_TEAM:-$(get_env_value "VERCEL_TEAM" .env.local || true)}"

if [[ -z "$VERCEL_PROJECT" ]]; then
  VERCEL_PROJECT="$(get_project_json_value "projectName")"
fi

if [[ -z "$VERCEL_TEAM" ]]; then
  VERCEL_TEAM="$(get_project_json_value "orgId")"
fi

[[ -n "$VERCEL_TOKEN" ]] || fail "Missing VERCEL_TOKEN (export it or put it in .env.local)"
[[ -n "$VERCEL_PROJECT" ]] || fail "Missing VERCEL_PROJECT and no .vercel/project.json fallback was found"

scope_args=()
if [[ -n "$VERCEL_TEAM" ]]; then
  scope_args+=(--scope "$VERCEL_TEAM")
fi

run_vercel() {
  if [[ ${#scope_args[@]} -gt 0 ]]; then
    npx -y vercel "$@" "${scope_args[@]}" --token "$VERCEL_TOKEN"
  else
    npx -y vercel "$@" --token "$VERCEL_TOKEN"
  fi
}

log "Linking local next-app directory to Vercel project: ${VERCEL_PROJECT}"
run_vercel link --cwd . --yes --project "$VERCEL_PROJECT"

for env_name in production preview development; do
  for key in "${required_keys[@]}"; do
    value="$(get_env_value "$key" "$ENV_LOCAL_BACKUP")"
    log "Syncing ${key} to Vercel environment: ${env_name}"
    if [[ "$env_name" == "preview" ]]; then
      run_vercel env add "$key" "$env_name" "" --cwd . --yes --force --value "$value"
    else
      run_vercel env add "$key" "$env_name" --cwd . --yes --force --value "$value"
    fi
  done
done

log "Deploying to Vercel production"
run_vercel deploy --cwd . --prod --yes

cat <<'EOF'

[setup-vercel] Completed.

What was automated:
- Link local next-app to Vercel project
- Upload required env vars to production/preview/development
- Trigger production deploy
EOF
