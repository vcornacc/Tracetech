# TraceTech

Single web application for Critical Raw Materials intelligence in automotive electronics.

## One App Architecture

- Main app: this root project (Vite + React)
- URL locale stabile: `http://127.0.0.1:5173/`
- Public URL target (GitHub Pages): `https://vcornacc.github.io/Tracetech/`

The `next-app/` folder can be considered legacy/experimental and is not required to run TraceTech.

## Quick Start

```sh
npm install
npm run dev:tracetech
```

Set your local auth environment first (copy values from Supabase project settings):

```sh
cp .env.local.example .env.local
```

Open in browser:

- `http://127.0.0.1:5173/`

## Useful Commands

- `npm run dev:tracetech`: run local app on fixed URL
- `npm run dev:tracetech:open`: run and open browser automatically
- `npm run build`: production build
- `npm run preview`: preview production build locally
- `npm run test`: run tests
- `npm run data:refresh:dry-run`: validate real-data connector mapping without writing to DB
- `npm run data:refresh`: fetch real data and update material risk fields + price history
- `npm run auth:check`: validate Supabase auth settings reachability and email setup checklist
- `npm run release:ready`: one-command preflight (install, test, build)
- `npm run release:publish`: run preflight then push `main` to trigger Pages deploy

## Real Data Refresh (LME + USGS + GPR)

TraceTech now includes an automated ETL script at `scripts/data-refresh.mjs`.

Required environment variables:

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LME_API_URL` (returns JSON with `materials[]`)
- `USGS_CSV_URL` (CSV for reserves)
- `GPR_CSV_URL` (CSV for geopolitical scores)

Optional:

- `LME_API_KEY` (if your LME endpoint requires bearer auth)

Expected LME payload shape:

```json
{
	"materials": [
		{
			"materialName": "Copper",
			"pricePerKg": 8.91,
			"volatility30d": 12.4,
			"volatility1y": 19.8,
			"sourceDate": "2026-04-30"
		}
	]
}
```

The script logs each run in `data_refresh_log` and writes warnings if one source fails while continuing with partial updates.

### Automated Daily Refresh (Zero Manual Ops)

GitHub Actions workflow: `.github/workflows/data-refresh.yml`

- Runs every day at 06:00 UTC
- Supports manual run via `workflow_dispatch`
- Executes `npm run data:refresh`

Required GitHub repository secrets:

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LME_API_URL`
- `USGS_CSV_URL`
- `GPR_CSV_URL`

Optional secret:

- `LME_API_KEY`

### Nightly Dry-Run and Failure Alert

GitHub Actions workflow: `.github/workflows/data-refresh-dry-run.yml`

- Runs every day at 02:15 UTC
- Executes `npm run data:refresh:dry-run`
- If the dry-run fails, it opens or updates a GitHub issue labeled `ops-alert`
- If the dry-run is successful and an `ops-alert` issue is open, it auto-comments and closes that issue

This gives automated early warning before production refresh windows.

### Investor Demo Persistence

Investor Demo one-click execution now does three automatic actions:

- runs deterministic scenario,
- exports TXT and CSV reports,
- stores a `scenario_history` snapshot when an authenticated user session is present.

If no authenticated session is present, export still works and persistence is skipped safely.

## Auth and Email Verification

- Registration requires email verification.
- The app sends signup and resend-verification emails using Supabase Auth.
- Set `VITE_AUTH_EMAIL_REDIRECT_URL` to a URL allowed in Supabase Auth URL configuration.
- Run `npm run auth:check` to verify auth settings endpoint connectivity and get a production SMTP checklist.

## Deploy With URL (Professional Setup)

This repository includes a GitHub Actions workflow that automatically deploys the app to GitHub Pages on push to `main`:

- Workflow file: `.github/workflows/deploy-pages.yml`
- Static base path is configured in `vite.config.ts` for Pages.

### First-time GitHub setup

1. Push this repository to GitHub.
2. In GitHub repository settings, enable Pages and set Source to `GitHub Actions`.
3. Push to `main` (or run workflow manually).

After deployment, the application is reachable at:

- `https://vcornacc.github.io/Tracetech/`

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui
- Supabase
- TanStack React Query
