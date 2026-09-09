# Production vs localhost

Battleverse is a **Vite SPA**. `VITE_*` values are **baked in at build time**. Adding keys in Vercel after a deploy does nothing until you **Redeploy**.

## Why localhost works and Vercel does not

| | Localhost | Live `thebattleverse.vercel.app` (checked 9 Sep 2026) |
|---|---|---|
| Code | Latest working tree (`fix/production-parity` / `main` after PR #3) | `/exams` exists, `/privacy` 404 → older than Phase 7 **or** a stale deploy |
| Env | `.env.local` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Keys missing or not present at **build** time |
| Symptom | Sign in, Exam papers, real leaderboard | Guest-only: mock leaderboard, disabled login, “Exam papers need the Battleverse backend” |
| Auth redirects | `window.location.origin` → `http://localhost:5173/login` | Same code uses the Vercel origin **once keys exist**. Supabase must allow that origin. |

GitHub default branch is `main`. `main` now includes PR #3 (`3bc6083`). Confirm Vercel Production is building **that commit**, not an old feature-branch SHA.

## A. You (engineer / this repo)

- Do not commit `.env` / `.env.local`.
- After env vars are set on Vercel, trigger a new Production deploy.

## B. Vercel (you must do this)

### 1. Confirm the Production git source

1. [vercel.com](https://vercel.com) → project **battleverse** (or the one serving `thebattleverse.vercel.app`).
2. **Settings → Git**
   - Production Branch: **`main`**
   - Connected repo: `Patrick-Chukwu/battleverse`
3. **Deployments**
   - Latest **Production** row → commit SHA.
   - It must be `3bc6083` or later (after this fix branch is merged: the new SHA).
   - If it is older: **Redeploy** that Production deployment, or push/merge to `main` so a new Production build starts.

### 2. Environment variables (required)

Vite only reads names that start with `VITE_`. `NEXT_PUBLIC_*` will be ignored.

1. Vercel → project → **Settings → Environment Variables**
2. Add these two (values from Supabase, never paste them into chat):

| Name | Value (where to copy) | Environments |
|------|------------------------|--------------|
| `VITE_SUPABASE_URL` | Supabase → **Project Settings → API** → **Project URL** (`https://….supabase.co`) | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Same page → **anon public** (or the current publishable key). **Not** `service_role`. | Production, Preview, Development |

Do **not** set `VITE_USE_*=false` unless you want to turn a feature off.

3. After saving, **Deployments → ⋯ on the latest Production → Redeploy**.  
   Uncheck “Use existing Build Cache” if the previous build had empty keys.

### 3. What success looks like

Hard-refresh `https://thebattleverse.vercel.app` (or incognito):

- Home shows **Sign in** and **Exam papers** (no “guest-only” banner).
- `/login` email field is enabled; after agreeing to Terms you can send a code.
- `/leaderboard` shows real usernames (e.g. not StarCoder/MathNinja).
- `/privacy` and `/terms` render.

## C. Supabase (you must do this)

Same project localhost already uses (`Project URL` on the API page).

### Auth URL configuration

1. Supabase → **Authentication → URL Configuration**
2. **Site URL:** `https://thebattleverse.vercel.app`  
   (If you keep Site URL as `http://localhost:5173`, magic-link emails opened from production still bounce to localhost.)
3. **Redirect URLs** — add:
   - `http://localhost:5173/**`
   - `https://thebattleverse.vercel.app/**`
   - any custom domain `https://your-domain/**`
4. Save.

Email provider can stay Magic Link. The app sends `emailRedirectTo` = `{current-origin}/login`.

### Database

Do not re-run `reset.sql` on production data. The live project already has the Phase 5–7 RPCs. If a **new** deploy calls a function that 404s, run only the missing file from `supabase/migrations/` in **SQL Editor**.

## D. Local / GitHub

1. Merge `fix/production-parity` into `main` (PR) and let Vercel build Production.
2. Keep working on feature branches; do not expect Vercel Production to track `cursor/phase-1-auth-schema-1e18` unless you set that as the Production Branch (not recommended).

## Vite vs Next.js (so env mistakes are obvious)

This is **not** Next.js. There is no App Router, no server actions, no `NEXT_PUBLIC_`. The client is the only runtime; the anon key is public by design. Never put `service_role` in Vercel `VITE_*` vars.
