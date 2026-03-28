# Vercel deploy checklist

## 1) Push repository

Push this `next-app` folder to your Git repository.

## 2) Import project into Vercel

1. Open <https://vercel.com/new>.
2. Select your repository.
3. Set root directory to `next-app` if repository contains multiple apps.

## 3) Configure environment variables

In `Project Settings > Environment Variables`, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Apply to `Production`, `Preview`, and `Development` as needed.

## 4) Deploy

Trigger first deployment from Vercel UI or by pushing to main branch.

## 5) Post-deploy checks

- Open the deployed URL and verify homepage loads.
- Confirm auth login/signup works.
- Confirm read/write to `projects` table respects RLS.
