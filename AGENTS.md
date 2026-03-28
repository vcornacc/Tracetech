# Project Guidelines

## Scope and Source of Truth

- Canonical product app is the root Vite React app in this repository.
- Treat next-app as a separate/legacy experimental app unless the task explicitly targets it.
- For root app work, follow this file plus [README.md](README.md).
- For next-app work, follow [next-app/AGENTS.md](next-app/AGENTS.md), [next-app/docs/SUPABASE_SETUP.md](next-app/docs/SUPABASE_SETUP.md), and [next-app/docs/VERCEL_DEPLOY.md](next-app/docs/VERCEL_DEPLOY.md).

## Build and Test

Run commands from repository root for the canonical app:

- Install: `npm install`
- Dev server (stable URL): `npm run dev:tracetech`
- Dev + auto-open browser: `npm run dev:tracetech:open`
- Build: `npm run build`
- Preview build: `npm run preview`
- Test: `npm run test`
- Lint: `npm run lint`

Before finishing code changes, run at least build and relevant tests.

## Architecture

- App entry: [src/main.tsx](src/main.tsx) -> [src/App.tsx](src/App.tsx)
- Routing: React Router in [src/App.tsx](src/App.tsx), mostly protected routes.
- Auth: context-based Supabase auth in [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx).
- Data access pattern:
  - Prefer unified provider [src/hooks/useData.tsx](src/hooks/useData.tsx)
  - Use granular query hooks in [src/hooks/useSupabaseData.ts](src/hooks/useSupabaseData.ts) when needed
- Supabase client/types:
  - [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts)
  - [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts)
- UI stack: Tailwind + shadcn components under [src/components/ui](src/components/ui)

## Conventions

- Language: TypeScript + React function components.
- Imports: use alias `@/` for files under `src`.
- Naming:
  - Components/pages: PascalCase
  - Hooks: `use*`
  - Utility/data modules: camelCase
- Prefer extending existing UI patterns/components instead of creating one-off styles.
- Keep changes focused; avoid broad refactors unless requested.

## Environment and Deployment

Root app env vars (see [.env.local.example](.env.local.example)):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_BYPASS_AUTH` (dev-only convenience)

Deployment:

- GitHub Pages workflow: [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)
- Vite base path logic: [vite.config.ts](vite.config.ts)

## Known Pitfalls

- Workspace folder name contains a trailing space (`Trace tech `). Use careful path handling in shell commands.
- If Supabase is unreachable or env vars are missing, data may fall back to mock data via [src/hooks/useData.tsx](src/hooks/useData.tsx).
- Do not mix root app instructions with next-app assumptions.


# Instructions for AI Code Agent (VS Code)

## User Profile

* I am a **beginner**: avoid overly technical terms or explain them clearly.
* I am **lazy**: I prefer simple, fast solutions with as few steps as possible.
* I want **ZERO manual tasks**: everything that can be automated MUST be automated.

## Core Rules

1. **Full Automation**

   * Automate setup, configuration, installations, and workflows.
   * If something can be done with a script, do it without asking.
   * Generate ready-to-run commands or execute them directly if possible.

2. **Minimal Human Effort**

   * Avoid unnecessary user input.
   * Do not ask for information if it can be inferred from context.
   * Use smart defaults whenever possible.

3. **Production-Ready Code**

   * Always provide complete, working, copy-paste-ready code.
   * Include dependencies, imports, and configurations.
   * Avoid incomplete snippets.

4. **Automatic Setup**

   * If something is missing (libraries, environments, configs), create it automatically.
   * Use scripts (bash, npm, pip, etc.) to set everything up.
   * Prepare files like `.env`, `requirements.txt`, `package.json`, etc.

5. **Smart Debugging**

   * If there is an error, analyze it and provide a direct solution.
   * Offer automatic fixes whenever possible.
   * Explain only when necessary, in a simple way.

6. **Project Structure**

   * Automatically organize files and folders.
   * Follow standard conventions without asking.
   * Keep the project clean and maintainable.

7. **Proactive Suggestions**

   * Anticipate issues and improvements.
   * Suggest optimizations without overcomplicating things.
   * Propose additional automations.

8. **Speed > Perfection**

   * I prefer a working solution now rather than a perfect but complex one.
   * Iterate later, don’t over-engineer at the start.

## Response Style

* Be direct and practical.
* Use clear steps and lists.
* Avoid unnecessary theory.
* Explain only what’s needed to understand quickly.

## Bonus (Strongly Recommended)

* Create automation scripts (setup.sh, Makefile, etc.)
* Integrate linting and formatting tools
* Add “one-click” commands to run everything
* Use Docker if it simplifies setup
* Provide working examples (demos)

## Final Goal

I want to be able to:

* Clone the project
* Run ONE command
* Have everything working without doing anything else

If I’m doing something manually, you can do better.
