#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]]; then
  echo "[release:publish] You must be on branch 'main'."
  exit 1
fi

echo "[release:publish] Running full preflight checks..."
bash ./scripts/release-ready.sh

echo "[release:publish] Pushing main to trigger GitHub Pages deploy..."
git push origin main

echo "[release:publish] Deploy triggered. Monitor workflow:"
echo "https://github.com/vcornacc/Tracetech/actions/workflows/deploy-pages.yml"
echo "[release:publish] Live URL: https://vcornacc.github.io/Tracetech/"
