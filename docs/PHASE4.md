# Phase 4 — Challenge / invite

Directed challenges sit on top of Phase 3 live rooms. There is no second battle engine: accept/redeem calls `create_live_battle(..., 'challenge')`, then the existing `battle:{id}` realtime, scoring, heartbeat, and forfeit path.

Arena Setup stays. **ENTER BATTLEVERSE ARENA** is still matchmaking. **CHALLENGE A RIVAL** is the new sheet.

## What this phase adds

- Presence heartbeat on login (`user_presence`, ~15s)
- RPC `search_users` — exact username, or email/phone hash if the player opted in
- Invites: send, shareable 6-character code/link, accept, decline, cancel, expire (10 minutes)
- Incoming invite toast (Accept / Decline) and an Arena badge on the navbar
- Offline: named invite queues in the Dexie outbox, or the UI says it needs a connection — the SPA does not white-screen
- Under-13 (`6-8`, `9-12`) never returned by email/phone search, even if discoverable
- Flag `VITE_USE_INVITES` (default on when live battle is on)

When `VITE_USE_LIVE_BATTLE=false`, local bots still run and Challenge stays hidden.

## SQL you must run (once)

In the Supabase SQL Editor, after Phase 3:

1. `supabase/migrations/0004_invite_rpcs.sql`

Also enable Realtime for `invites` and `user_presence` if the publication statements did not apply (Dashboard → Database → Publications → `supabase_realtime`).

You do **not** need to re-run `seed.sql` for this phase.

## Profile findability

On **Profile → pencil**:

- Turn on **Let others find me** (`discoverable`). Default is off.
- Set **age band**. Email/phone search only returns `13-16` and `16plus`.
- Optional phone is stored as a hash (`set_findable_phone`). Friends must type the same digits.

Email hash is already written at signup.

## How to test

1. Two browsers, two accounts, both online. On each Profile, enable discoverability and set age `13-16` or `16+`.
2. Browser A: Arena Setup → subject + age → **CHALLENGE A RIVAL** → search B’s username → Challenge.
3. Browser B: toast appears. **Accept** → both enter the same live room (same question order as Phase 3).
4. Repeat: B **Decline** → A sees “declined — find anyone instead.” ENTER still works.
5. A creates a shareable code, copies the `/battle?code=…` link. B opens it signed in → same live room.
6. A cancels while waiting: invite expires, A returns to Arena Setup.
7. Airplane mode on A: Challenge sheet stays up; a named invite queues (banner) or says it needs a connection. No white screen.
8. Signed out / `VITE_USE_LIVE_BATTLE=false`: ENTER disabled when live+offline/signed-out (Phase 3). Challenge hidden or disabled. Bots only when the live flag is off.

### Under-13 / privacy

- Account with age `9-12`, discoverable on: username search may find them; email and phone search must return nothing.
- Search never lists all users.

## Flag

`VITE_USE_INVITES` defaults on when live battle is on. Set it to `false` to hide Challenge UI while keeping matchmaking.

Admin CMS (publish questions, CSV import, custom tests) is Phase 5 — see [PHASE5.md](./PHASE5.md).
