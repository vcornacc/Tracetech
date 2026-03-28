# Supabase setup (project + auth + schema)

## 1) Create the Supabase project

1. Open <https://supabase.com/dashboard/new>.
2. Create a project and save the database password in a secure place.
3. Wait for provisioning to finish.

## 2) Copy API keys into Next.js env

In Supabase dashboard go to `Settings > API` and copy:

- Project URL
- `anon` public key
- `service_role` key

Then create local env file:

```bash
cp .env.local.example .env.local
```

Fill values in `.env.local`.

## 3) Apply schema and auth policies

Use one of these options:

- SQL Editor: paste `supabase/migrations/20260328110000_initial_schema_auth.sql` and run it.
- CLI migrations: link project and push migrations.

## 4) Configure Auth provider (minimum email/password)

1. Open `Authentication > Providers`.
2. Enable `Email` provider.
3. Optionally enable OAuth providers (Google, GitHub).
4. Set redirect URL to your app domain.

For local dev, include:

- `http://localhost:3000`

For production (Vercel), include:

- `https://YOUR_VERCEL_DOMAIN`

## 5) Recommended security checks

- Keep RLS enabled on all tables.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Restrict production redirect URLs to trusted domains only.
