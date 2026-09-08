# Phase 1 setup — run this on your machine

This Cloud Agent cannot log into your Supabase project (the Supabase MCP you added lives in desktop Cursor, not here). Do these three jobs locally. They take about 10 minutes.

## A. Run the SQL (schema, then seed)

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and click the **Battleverse** project.
2. Left sidebar: **SQL Editor** → **New query**.
3. Open this repo file: `supabase/migrations/0001_init.sql`. Select all, copy, paste into the editor.
4. Click **Run**. Wait until you see success (green).
5. If you see `ERROR: 42710: type "age_band" already exists`, the schema was already applied (or a previous run got partway). Do this:
   - **Option A (clean redo):** New query → paste `supabase/reset.sql` → Run → then run `0001_init.sql` again → then seed.
   - **Option B (already finished init):** Skip init. Go to **Table Editor**. If you see `profiles`, `subjects`, `questions`, jump to step 6 and only run `seed.sql`.
6. **New query** again. Open `supabase/seed.sql`, copy all, paste, **Run**.
7. Confirm seed worked: left sidebar **Table Editor** → `subjects` should have 4 rows; `questions` should have 30 rows; `badges` should have 8.

### Auth settings (needed for Sign in)

8. Left sidebar: **Authentication** → **Providers** → **Email**. Leave Email enabled.
9. **Authentication** → **URL Configuration**:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: add `http://localhost:5173` and `http://localhost:5173/login`  
     (later add `https://thebattleverse.vercel.app/**` for production)
10. Optional but helpful for local testing: **Authentication** → **Providers** → Email → turn **Confirm email** off if codes/links are delayed. Keep it on for production.

The app expects a **6-digit email OTP**. The default Supabase email includes a code and/or a magic link. Type the code on `/login`. If you only get a link, you can click it (the app also reads the session from the URL).

## B. Create `.env.local` (URL + anon key)

1. In the dashboard: **Project Settings** (gear) → **API**.
2. Copy **Project URL** (looks like `https://abcdefgh.supabase.co`).
3. Copy **anon public** key (long JWT starting with `eyJ...`).  
   Do **not** copy the `service_role` key. Never put that in the frontend.
4. In the repo root on your computer:

```bash
cp .env.example .env.local
```

5. Edit `.env.local` so it looks like this (your real values):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

6. Save. `.env.local` is gitignored — do not commit it.
7. Vercel (when you deploy this branch): Project → Settings → Environment Variables → add the same two `VITE_*` names.

## C. Sign in and edit username on two browsers

1. In the repo:

```bash
pnpm install
pnpm run dev
```

2. Open the URL Vite prints (usually `http://localhost:5173`).
3. Click **Sign in** (top right, desktop) or go to `/login`.
4. Enter your email → **Send code**.
5. Open the email from Supabase → copy the 6-digit code → **Verify**.
6. If asked, pick a username (letters/numbers/underscore, 3–20 chars) and avatar → **Save and play**.
7. Go to **Profile**. Click the pencil on the avatar. Change username or avatar → **Save**. You should see “Profile saved to your account.”
8. **Second browser** (or Chrome Incognito):
   - Open `http://localhost:5173/login`
   - Sign in with the **same email** and a new code
   - Profile should show the username/avatar you saved in step 7 — not “Player” / a blank guest

Guest path (no account): **Continue as guest** still plays Practice/Battle as before.

## If something fails

| Symptom | Fix |
|---------|-----|
| `/login` says auth is not configured | `.env.local` missing or Vite not restarted after saving it |
| Send code errors | Email provider on; check Auth logs in the dashboard |
| Verify fails | Use the latest code; codes expire quickly |
| **Database error saving new user** (and no email) | Auth could not create a `profiles` row, so signup was rolled back and no mail was sent. Run `supabase/fix_signup_trigger.sql` in the SQL Editor, then try Sign in again. |
| Profile does not sync on browser 2 | SQL `0001_init.sql` not applied (no `handle_new_user` trigger) |
| `subjects` empty | You ran init but not `seed.sql` |
