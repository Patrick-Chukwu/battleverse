# Phase 6 — Exam-specific modes

Learners sit timed JAMB / WAEC / custom papers built in the Phase 5 CMS. Casual Practice is unchanged: explanations still appear after each item.

## What this phase adds

- `/exams` picker (Home **Exam papers** + Subjects link)
- `/exam/:testId` — paper timer, **no per-question hints** until submit (unless the test has `hints_allowed`)
- Results: pass / fail vs `pass_mark_pct`, then a review with explanations
- Offline: published papers with `offline_pack` (and the demo papers) cache in Dexie on sync
- Attempts record `test_id` when signed in
- Flag `VITE_USE_EXAM_MODES` (default on when Supabase is configured)

Battle stays casual / age-banded. No exam battle.

## SQL you must run (once)

In the Supabase SQL Editor, after Phase 5:

1. `supabase/migrations/0006_exam_rpcs.sql`

This adds `list_published_tests` / `get_exam_paper`, stores `test_id` on attempts, tightens `test_questions` RLS to published papers, and seeds **JAMB Practice Paper** + **WAEC Practice Paper** from existing published items (offline packs).

You do **not** need to re-run `seed.sql`.

If Phase 5 import still used `gen_random_bytes` on the remote, also re-run `0005_admin_rpcs.sql` (or the `admin_import_uuid_fallback` migration) so missing ids use `gen_random_uuid()`.

## How to test

1. Sign in (or stay a guest). Home → **Exam papers**. You should see JAMB and WAEC mocks.
2. Start JAMB. One clock for the whole paper. Choosing an answer does **not** reveal the explanation. **Submit paper** → pass/fail vs 50% and a review list.
3. Casual Practice (`/subjects` → any subject) still shows Correct / Not quite + the lightbulb after each item.
4. Online: open a paper once so it caches. Airplane mode: start the same paper from `/exams`, finish it, then go online and Retry sync. Attempts land once.
5. Admin: publish a custom test in `/admin` → Tests. It appears on `/exams` after refresh/sync.
6. `VITE_USE_EXAM_MODES=false`: Home hides Exam papers; `/exams` explains that the backend flag is off.

## Flag

`VITE_USE_EXAM_MODES` defaults on when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
