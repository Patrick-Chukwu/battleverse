# Phase 1 — Backend, auth, schema

Practice, Battle bots, and the mock leaderboard still run from local data (`src/data/quizData.ts`). This phase adds **accounts** and a **Postgres schema** you can apply in Supabase.

## 1. Create a Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Project Settings → API: copy **Project URL** and **anon public** key.
3. Authentication → Providers: keep **Email** enabled. Turn on **Email OTP** (disable confirmations if you want codes without a confirm-link friction for local testing).
4. Authentication → URL configuration: add `http://localhost:5173` and your Vercel URL to Redirect URLs.

## 2. Apply SQL

In the SQL editor, run in order:

1. [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) — tables, RLS, `handle_new_user` trigger
2. [`supabase/seed.sql`](../supabase/seed.sql) — 4 subjects, exam types, 8 badges, 30 published questions (same items as `quizData.ts`)

Regenerate the seed after editing questions:

```bash
node scripts/generate-seed.mjs
```

## 3. Wire the frontend

```bash
cp .env.example .env.local
# paste URL + anon key
pnpm run dev
```

Flags ([`src/lib/flags.ts`](../src/lib/flags.ts)):

| Flag | Effect |
|------|--------|
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Enables `/login` and Sign in |
| `VITE_USE_SERVER_PROFILE` | Default **on** when Supabase is configured. Set to `false` to keep Zustand-only profiles |

Until Phase 2, quizzes still read `quizData.ts`. Seeded SQL questions are for admin/SQL inspection and the next phase.

## 4. Definition of done (manual)

- Device A: Sign in with email OTP, pick a username/avatar on Profile pencil, refresh Device B signed in as the same user — same username/avatar.
- In SQL, `select phone_hash, email_hash from profiles` as user B (or via the anon client selecting another id) returns no other user’s private columns. Other users only see [`public_profiles`](../supabase/migrations/0001_init.sql) (username, avatar, xp, level, age_band, discoverable).
- Continue as guest: finish a local practice quiz as before.
- Home, Subjects, Quiz, Battle (bots), Leaderboard mock are unchanged.

## 5. Vercel

Add the same `VITE_*` env vars on the project, then redeploy.
