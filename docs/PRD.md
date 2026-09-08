# Battleverse — Product Requirements Document

**Audience:** founder / PM (plain language) and the engineer implementing against the existing frontend  
**Status:** planning pass — no application code until Phase 1 is approved  
**Companion docs:** [TRD.md](./TRD.md), [BUILD_PLAN.md](./BUILD_PLAN.md)

---

## 1. Problem statement

Exam prep in Nigeria (and similar markets) is split into two broken experiences:

- **Boring and static.** Past questions live in PDFs, bulky textbooks, and untimed web dumps. Learners do not get Kahoot-style energy, instant feedback, or a reason to come back tomorrow.
- **Fun but unusable without data.** Most quiz apps assume a live connection. A student on a bus, in a boarding house, or on a flaky network cannot practice. When they *can* compete, they are matched with bots or strangers — not the classmate they actually want to beat.

Parents and older siblings also cannot do the simple social thing they already understand from Chess.com: **search someone they know and challenge them**.

Battleverse already has a pixel-complete frontend for a colorful, competitive quiz. This phase turns that prototype into a **real full-stack, gamified exam-prep platform**: offline-first practice, real live battles, directed challenges, a content CMS, and exam-realistic modes for JAMB/WAEC — without redesigning the UI.

---

## 2. Target users

### 2.1 Casual K-12 learners (ages 6–16)

Kids who play for fun, XP, badges, and short sessions. They use the existing subjects (Tech, AI, Math, General Knowledge) and age bands (6–8, 9–12, 13–16). They need a simple identity (username + avatar), not a professional exam dashboard.

### 2.2 JAMB / WAEC candidates (and other exam-age learners)

Older learners (typically 15+) who need **exam-realistic practice**: official-ish subject combinations, timed papers, no hints during the attempt, and a score they can trust. They still want the live-battle hook so revision does not feel like homework.

### 2.3 Admins / content creators

Non-engineers who own the question bank. They add, edit, tag, bulk-import, publish/unpublish, configure custom tests, and see which items are too easy, too hard, or skipped.

---

## 3. Goals and non-goals (this phase)

### Goals

- Accounts that persist across devices (email + unique username; optional phone).
- A real question bank on the server, replacing the 32 hardcoded items as the source of truth.
- **Practice Mode fully usable offline**, then auto-sync when the network returns.
- **Live Battle Mode** with real opponents, keeping the existing **Arena Setup** product (subject + age band + ENTER BATTLEVERSE ARENA) — not a “Coming Soon” page.
- **Challenge a specific person** by username, email, or phone (privacy-preserving, opt-in), with matchmaking as the fallback.
- An **admin CMS** so non-engineers can ship content at scale.
- At least one **exam-realistic mode** (timed, no hints) tagged for JAMB and/or WAEC, plus custom tests we define.
- Child-safety defaults appropriate for under-18 users (see Section 8).

### Explicit non-goals

- Payments, subscriptions, or in-app purchases.
- Chat, DMs, or video.
- A school / teacher LMS or class rosters.
- Native iOS/Android apps (PWA is in scope; app stores are not).
- AI-generated questions.
- A social feed, comments, or public profiles beyond challenge discoverability.
- Rewriting the existing visual design or replacing Vite/React with Next.js.

---

## 4. Personas

**Amina, 10 (casual).** Uses mum’s Android phone after school. Wants 8-question Tech quizzes, fox avatar, and to beat her cousin. Often has no data until she gets home.

**Chidi, 17 (JAMB).** Needs UTME-style Physics/English mixes, a 60-minute mock, and a score report. Will battle a classmate the night before an exam if it is fast.

**Tunde, content lead (admin).** Not an engineer. Imports 200 WAEC items from a spreadsheet on Sunday, tags difficulty, publishes Monday, and wants to see which items everyone is failing.

**Mrs. Okonkwo, parent.** Will allow a username. Will not allow a public phone book of children. Needs a way her daughter is findable *by cousins she already knows*, not by strangers.

---

## 5. Core user journeys

### 5.1 Challenge a friend by username, email, or phone (end-to-end)

1. Amina opens Battleverse (signed in). Profile shows a presence dot: she is online.
2. She goes to Battle (existing Arena Setup). Besides “match anyone,” she opens **Challenge**.
3. She types a **username** (`cousin-kemi`), or an **email**, or a **phone number** her family already uses.
4. Search only returns people who opted into discoverability. Phone and email are **equality lookups on hashed values**, never a browseable directory. Under-13 accounts default to *not* discoverable except by exact username if a parent enabled it.
5. She picks subject + age band (same Arena Setup chips), sends an invite. Kemi gets an in-app prompt (and email if we have one). Status: pending.
6. **Accept:** both join a live room; the existing battle UI (countdown, 2×2 answers, live scores) starts with **shared questions** from the server.  
   **Decline:** Amina sees “Kemi declined — Find anyone instead?”  
   **Expire** (e.g. 10 minutes) or Kemi **offline:** invite queues or she is offered matchmaking.
7. Match ends on the existing podium/results chrome. XP is written server-side, then appears on Profile and Leaderboard.

If Amina is **offline**, Battle does not crash. She sees a clear “You need a connection to battle” state, and the invite is **queued** until she is back online (or she is told it cannot send).

### 5.2 Study offline on the bus, sync at home (end-to-end)

1. Chidi opened Practice at home last night. The app cached his subject/exam pack into on-device storage.
2. On the bus (airplane mode / no data) he opens Practice, picks Mathematics, completes an 8-question (or exam-length) run. Timer, scoring, and explanations work **without the network**. XP and answers save locally.
3. He closes the phone. Nothing is lost.
4. At home, Wi‑Fi returns. The app syncs in the background: attempts upload once (no double XP), server recomputes totals, badges/leaderboard update.
5. If two devices both logged attempts offline, both attempts count (append-only). Profile display name uses last-write-wins.

Live Battle remains connectivity-required; Practice and cached exam packs do not.

---

## 6. Feature list (MoSCoW)

### Must (MVP)

- Email + unique username auth; optional phone OTP; guest practice that does **not** rank on the global leaderboard.
- Server question bank; Practice wired to real questions with **offline play** after first sync.
- Live Battle vs real users; **matchmaking fallback** if no named opponent; keep Arena Setup.
- Invite: search → send → accept / decline / expire; presence (online/offline/in-battle).
- Graceful Battle-offline messaging + queued challenge send.
- Admin: question CRUD, tagging (exam type, subject, topic, difficulty, age band), bulk CSV/JSON import, publish/unpublish.
- XP, badges, and leaderboard **server-backed** (client remains optimistic UI).
- Privacy and terms pages; opt-in discoverability.

### Should (same product generation, after Must)

- JAMB and WAEC subject/exam tags plus one timed, no-hints exam mode.
- Custom tests (subject set, time limit, pass mark) configured in admin.
- Item analytics (too easy / too hard / skip rate).
- Age/parental gate for under-13 **discoverability** (default off).
- Profile name/avatar edit actually works (store actions exist today; UI does not call them).

### Could (later)

- 4+ player rooms, spectator mode, weekly leagues.
- School/class codes.
- Push notifications beyond email.
- Parental dashboard.

### Won’t (this phase)

- Payments, chat, AI generation, native apps, LMS.

---

## 7. Success metrics

| Metric | Why it matters | Early target (directional) |
|--------|----------------|----------------------------|
| D1 / D7 return | Habit, not a one-tap demo | Track from first signed-in session |
| Practice sessions completed **offline** | Proves the bus journey | Share of practice finishes with `syncedFromOffline = true` |
| Sync success rate | Trust | ≥ 99% of outbox items settle within 5 minutes of reconnect |
| Invite → battle start rate | Challenge loop works | Measure accept rate and time-to-start |
| Matchmaking time-to-match | Kahoot energy | p50 under ~10s when a pool exists; otherwise bot-free “waiting” UI |
| Exam-mode completion rate | Prep value | Completes / starts for timed mocks |
| Item coverage | CMS health | % of published items with enough attempts for difficulty stats |
| Guest → account conversion | Identity for challenges | Optional, not a vanity metric |

We do **not** treat client-side XP as source of truth in analytics.

---

## 8. Child safety, privacy, and data

Battleverse is explicitly for ages 6–16 as well as older exam candidates. Defaults protect the younger end.

### Collect

- Username, avatar, age band (self-declared or parent-declared).
- Email for account recovery and invite notify.
- Phone **only if** the user (or parent) opts in for findability; store **hashed/normalized**, never show it to other users.
- Quiz attempts, XP events, battle membership (needed for the product).
- Minimal device/session diagnostics (no precise location).

### Do not collect

- Precise GPS, contacts dump, photos of faces (beyond emoji avatars in MVP).
- A public, searchable phone or email directory.
- Payment card data (out of scope).
- Chat transcripts (no chat).

### Rules

- **Discoverability is opt-in.** Under-13: default off; username search may be enabled by a parent later (open question: parental email in MVP vs Phase 2).
- No stranger-browse of children. Search is exact match, not “people near you.”
- Scores for ranked modes are computed **on the server**.
- Privacy policy and terms are in-app before account creation.
- Comply with **NDPR** (Nigeria) and store/Families policies if we later ship PWA-as-app (COPPA-like: under-13, minimal PII, no behavioral ads in this phase — we have no ads).

---

## 9. Product constraints that bind engineering

- **Do not redesign the learner UI.** New screens (login, challenge sheet, offline banner, `/admin`, exam picker) must use existing design tokens (Nunito, `#5142f0`, glass cards).
- **Keep Arena Setup** as the Battle product, including subject chips, age brackets, and ENTER BATTLEVERSE ARENA.
- Practice stays the current `/subjects` → `/quiz/:subjectId` loop; exam mode is an additional path, not a replacement.
- Guest can practice; **challenges, global leaderboard, and live battle require an account**.
