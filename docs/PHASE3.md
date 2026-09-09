# Phase 3 — Live battle

Keep Arena Setup. Do not fall back to silent bots when live matchmaking is on.

## What this phase adds

- `start_matchmaking` pairs two signed-in players on the same subject + age band
- Server-picked 5 questions, server clock (10s answer window + 2s reveal)
- Realtime scores on channel `battle:{id}` (Postgres changes)
- First answer per player per question is scored: `100 + ceil(secondsLeft * 10)`
- Disconnect: 20s without a heartbeat → forfeit, remaining player sees results
- Offline or signed-out: **ENTER BATTLEVERSE ARENA** stays disabled (no fake 2.5s bot search)

When `VITE_USE_LIVE_BATTLE=false` (or Supabase is not configured), the old local bot match still runs.

## SQL you must run (once)

In the Supabase SQL Editor, in order:

1. `supabase/migrations/0003_battle_rpcs.sql`
2. Re-run `supabase/seed.sql` (upserts extra questions so each subject + age band has 5 items)

Also enable Realtime for `battles`, `battle_players`, `battle_events`, and `matchmaking_queue` if the publication statements in `0003` did not apply (Dashboard → Database → Publications → `supabase_realtime`).

## How to test

1. Two browsers, two accounts, both online. Same subject + age bracket → ENTER BATTLEVERSE ARENA.
2. Both should leave “SCANNING FOR RIVALS” and see the same question order.
3. Answer on A: B’s scoreboard updates without refresh.
4. Finish all rounds → podium; Profile XP matches the server after a refresh.
5. Pull A’s network for 20+ seconds mid-question: B gets forfeit/results, not a frozen spinner.
6. A third browser offline (or signed out): Arena Setup is visible, ENTER is disabled, no bot match.

## Flag

`VITE_USE_LIVE_BATTLE` defaults on when `.env.local` has Supabase keys. Set it to `false` to restore local bots.
