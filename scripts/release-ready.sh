#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[release:ready] Installing dependencies if needed..."
npm install

echo "[release:ready] Running tests..."
npm run test

echo "[release:ready] Building production bundle..."
npm run build

echo "[release:ready] OK - app is ready to publish."
