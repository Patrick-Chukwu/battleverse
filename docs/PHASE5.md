# Phase 5 — Admin CMS

Non-engineers publish into the same Postgres catalog Practice already syncs. Learner chrome is unchanged.

## What this phase adds

- Internal route `/admin`, gated by `profiles.role = admin` (not a secret URL)
- Question list, filters, create/edit, publish / unpublish
- CSV / JSON import via RPC `import_questions` (invalid rows reported; nothing written)
- Custom test builder (`tests` + `test_questions`: time limit, pass mark, hints, offline pack)
- Item analytics: attempts, % correct, timeout rate; too-easy / too-hard flags (n≥30)
- Every write lands in `admin_audit`
- Unpublish: the next Practice pull removes the item from Dexie; an in-flight quiz can finish

Phase 6 (exam modes) uses the tags and custom tests from this CMS — see [PHASE6.md](./PHASE6.md).

## SQL you must run (once)

In the Supabase SQL Editor, after Phase 1–2 (and Phase 3–4 if those are live):

1. `supabase/migrations/0005_admin_rpcs.sql`

Promote one account (replace the username):

```sql
UPDATE public.profiles SET role = 'admin' WHERE username = 'your_username';
```

You do **not** need to re-run `seed.sql`. Exam papers (taking a JAMB/WAEC mock) are Phase 6 — see [PHASE6.md](./PHASE6.md).

## How to test

1. Sign in as the admin account. Navbar shows **Admin**. Open `/admin`.
2. **Questions → New question** → save as draft → **Publish**.
3. Another browser as a player: open Practice, wait for sync (or reload while online). The new item can appear in that subject pack.
4. Unpublish the item. Player syncs again: a *new* quiz no longer draws it. A quiz already in progress can finish.
5. **Import**: paste `docs/admin-import-sample.csv` (20 rows). **Validate**, then **Import drafts**. All 20 land as drafts. Change one `correct_index` to `9`, re-import: errors listed, imported count stays 0.
6. Signed-in **player** (not admin): `/admin` shows “Admins only”. Calling `import_questions` in the SQL editor as that user (or via the app) returns `not an admin`.
7. **Tests**: create a custom paper, pick items, set time / pass mark. **Analytics** lists attempt counts (empty until players answer).

## Flag

No extra Vite flag. Access is the `admin` role. When Supabase is not configured, `/admin` explains that the CMS needs the backend.
