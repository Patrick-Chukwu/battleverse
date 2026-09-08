# Phase 2 — Offline practice

Default magic-link email is unchanged. Do not set up custom SMTP — click the Supabase link on your laptop until you are ready to switch.

## What this phase adds

- Questions cache in IndexedDB (Dexie), seeded from `quizData.ts` then refreshed from Supabase when online
- Attempt outbox so a quiz finished offline uploads once when you reconnect
- Offline / pending-sync banner
- Profile badges read `earnedBadges` (and server `user_badges` when signed in)
- PWA app-shell cache on production builds only

Guest Practice still works with no account. Battle bots are unchanged.

## SQL you must run (once)

In the Supabase SQL Editor, paste and run:

`supabase/migrations/0002_practice_rpcs.sql`

This adds `practice_sessions` plus `submit_attempt` and `finish_practice`.

## How to test

1. Online, signed in: open **Practice**, finish a quiz. In **Table Editor** → `attempts` you should see one row per question after sync.
2. DevTools → Network → Offline (or airplane mode). Finish another quiz. Banner says you are offline.
3. Go online. Banner shows pending results, or they flush automatically. `attempts` should not duplicate. XP on Profile should match the server after refresh.
4. Guest (signed out): same quiz UI, nothing written to Supabase.

## Flag

`VITE_USE_DEXIE_QUESTIONS` defaults on when `.env.local` has Supabase keys. Set it to `false` to force bundled `quizData.ts` only.
