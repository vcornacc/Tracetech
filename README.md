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

Open in browser:

- `http://127.0.0.1:5173/`

## Useful Commands

- `npm run dev:tracetech`: run local app on fixed URL
- `npm run dev:tracetech:open`: run and open browser automatically
- `npm run build`: production build
- `npm run preview`: preview production build locally
- `npm run test`: run tests

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
