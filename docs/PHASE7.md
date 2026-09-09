# Phase 7 — Leaderboard and legal

The last Must items from the PRD: a **server-backed** global board (guests never rank) and Privacy / Terms in-app before account creation.

## What this phase adds

- RPC `list_leaderboard` — top players by server XP, plus your real rank if you are signed in
- `/leaderboard` reads that list (keeps the existing podium chrome)
- Guests can look at the board; they are **not** inserted as “You” from local XP
- Offline: last saved board from Dexie, with the existing offline banner
- `/privacy` and `/terms` (NDPR / child-safety plain language)
- Login: must tick Terms + Privacy before a sign-in email is sent
- Flag `VITE_USE_SERVER_LEADERBOARD` (default on when Supabase is configured; off → old mock board)

Phone OTP stays stubbed (email sign-in + hashed phone on Profile).

## SQL you must run (once)

In the Supabase SQL Editor, after Phase 6:

1. `supabase/migrations/0007_leaderboard.sql`

You do **not** need to re-run `seed.sql`.

## How to test

1. Signed out: open `/leaderboard`. Real usernames and XP appear. There is no “Player (You)” from guest XP. Copy points to **Sign in**.
2. Sign in, earn XP in Practice, reload Leaderboard. You are highlighted; rank matches server XP.
3. Airplane mode after a successful load: the last board still shows (“last saved board”).
4. `/login`: Send is disabled until the Terms / Privacy box is ticked. Open both legal pages; they are readable without an account.
5. `VITE_USE_SERVER_LEADERBOARD=false`: mock names return (prototype fallback).

## Flag

`VITE_USE_SERVER_LEADERBOARD` defaults on when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
