# Trace Platform Starter (Next.js + Supabase + Vercel)

Questo progetto e uno starter per principianti con stack:

- Next.js per frontend e API routes
- Supabase per database PostgreSQL, Auth e Storage
- Vercel per hosting e deploy continuo

## 1) Setup locale

Installa le dipendenze:

```bash
npm install
```

Copia il file ambiente:

```bash
cp .env.local.example .env.local
```

Compila le variabili in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Avvia in locale:

```bash
npm run dev
```

## 2) Struttura Supabase nel codice

- Client browser: `src/lib/supabase/client.ts`
- Client server: `src/lib/supabase/server.ts`

## 3) Cosa creare su Supabase

1. Crea un nuovo progetto su Supabase Dashboard.
2. Vai in `Settings > API` e copia URL + keys.
3. Crea tabelle/migrazioni SQL.
4. Abilita RLS e aggiungi policy prima di andare in produzione.

Dettaglio completo:

- `docs/SUPABASE_SETUP.md`
- Migrazione iniziale: `supabase/migrations/20260328110000_initial_schema_auth.sql`

## 4) Deploy su Vercel

1. Pusha il repository su GitHub/GitLab.
2. Importa il progetto in Vercel.
3. Imposta le stesse env var in `Project Settings > Environment Variables`.
4. Fai deploy.

Dettaglio completo:

- `docs/VERCEL_DEPLOY.md`

## 5) Comandi utili

```bash
npm run lint
npm run build
npm run start
npm run supabase:link
npm run supabase:push
npm run supabase:types
```
