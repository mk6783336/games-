# PLAYFLIX — Milestone 1: Managed Database, Auth & API

**Version:** 1.0
**Date:** 31 October 2026
**Status:** Complete (local database live; managed Neon connection pending sign-in)
**Build:** `tsc -b` ✅ · `npm run build` ✅ · API suite **35/35 checks passed**

---

## 1. Goal

Move PLAYFLIX player data off `localStorage` and onto a real, versioned backend:
a managed PostgreSQL database, a guest-session + account auth layer, and a
`/v1` API for profile and progress — without losing any existing player's progress.

## 2. What shipped

### 2.1 Database schema & migrations

`server/migrations/001_identity_and_progress.sql` — first versioned migration:

| Table | Purpose |
| --- | --- |
| `accounts` | Email + scrypt password hash (unique on `lower(email)`) |
| `profiles` | Display name, country, avatar hue; optional `account_id` (guest vs. account) |
| `guest_sessions` | Hashed guest cookies, expiry, `last_seen_at` |
| `auth_sessions` | Hashed account session cookies, expiry |
| `player_state` | Single JSONB document per profile with an optimistic-lock `revision` |
| `player_progress` | Per-game plays/best/coins rollup (leaderboard & stats source) |

- **Migration runner:** `server/migrate.ts` (`npm run db:migrate`) applies files in
  filename order and records them in `schema_migrations`, wrapped in a transaction.
- **Dual-database adapter:** `server/db.ts` exposes one `Database` interface with two
  backends selected by environment:
  - `DATABASE_URL` set → `pg` Pool against real Postgres (Neon in production).
  - unset → embedded **PGlite** Postgres at `.data/pglite` for zero-setup local dev.
  The same migrations and queries run on both; IDs are API-generated so no
  `gen_random_uuid()` dependency exists.

### 2.2 Versioned API (`/v1`, Express + zod)

| Route | Purpose |
| --- | --- |
| `GET /v1/health` | Liveness + which database backend is active |
| `GET /v1/me` | Current identity (guest or account), profile, state, revision — creates a guest session on first hit |
| `GET /v1/progress` | Full player state document |
| `PUT /v1/progress` | Save state with optimistic concurrency (`revision` mismatch → 409) |
| `POST /v1/profile` | Update display name / country / avatar |
| `POST /v1/auth/signup` | Create account; **adopts the guest profile** so progress carries over |
| `POST /v1/auth/signin` | Email + password sign-in (rate-limited) |
| `POST /v1/auth/signout` | Destroys the server session |
| `DELETE /v1/account` | Cascades profile, progress and sessions |

Security posture:

- Passwords hashed with **scrypt** (Node `crypto`, per-user salt), never stored or logged raw.
- Session and guest tokens stored **hashed**; httpOnly cookies; `SameSite=Lax`.
- **CORS allow-list** anchored on `APP_ORIGIN` — foreign origins get **403** (verified).
- Per-IP + per-email **rate limits** on signup/signin.
- All state writes scoped by the session's own `profile_id` — a client can never name another player's row.
- Zod validation on every body; consistent error envelope `{ error: { code, message } }`.

### 2.3 Web app migrated off localStorage

- `src/lib/api.ts` — typed `/v1` client (`ApiError`, credentials, revision handling).
- `src/state/player.tsx` — boots from `GET /v1/me`; debounced `PUT /v1/progress`
  with retry/backoff; guest→account upgrade, sign-in/out and delete flow through the API.
- `src/lib/storage.ts` — now **legacy-only**: reads the old localStorage blob once,
  seeds it into the server as a guest, then deletes it. No gameplay data is written back.
- `src/pages/Account.tsx` — new account screen (create account / sign in / sign out /
  delete account, sync status, guest-upgrade explanation), linked from nav and Profile.
- Only remaining `localStorage` use is the anonymous **analytics visitor id**
  (`src/lib/analytics.ts`), which is intentionally device-local and consent-gated.

### 2.4 Config & scripts

- `.env.example` documents `DATABASE_URL`, `PGLITE_DIR`, `PORT`, `APP_ORIGIN`, `VITE_API_URL`.
- `.gitignore` excludes `.env`, `.data/`, `.logs/`.
- `package.json`: `db:migrate`, `server`, `dev:all` (Vite + API together).
- `tsconfig.server.json` added to the root project references (`tsc -b` covers web + server).

## 3. Verification performed

- `npx tsc -b` → **0 errors**; `npm run build` → **built in 16.2 s**.
- `npm run db:migrate` → applied cleanly on a fresh PGlite database.
- `.logs/api-qa.mjs` → **35/35 checks passed**, covering:
  - guest auto-creation and cross-request session continuity;
  - progress GET/PUT with revision increment and **409 on stale revision**;
  - guest → account upgrade **preserving progress**;
  - duplicate email (409), bad password (401), rate limiting;
  - sign-out → guest state, re-sign-in → account progress restored;
  - **foreign Origin rejected (403)** on state routes;
  - account deletion → session and credentials unusable afterwards.
- Browser QA: account screen create/sign-in/sign-out/delete verified against the live API.

## 4. Database provisioning status

**Chosen provider: Neon** (serverless Postgres, `DATABASE_URL`, free plan — matches the
`pg` driver already wired in `server/db.ts`; no code changes needed to switch).

Connection is a one-step, zero-code change once credentials exist:

1. Create the Neon project → copy the connection string.
2. Put it in `.env` as `DATABASE_URL=postgresql://…` (see `.env.example`).
3. `npm run db:migrate` → applies `001_identity_and_progress.sql` to Neon.
4. Restart `npm run server`; `/v1/health` then reports `"database": "postgres"`.

Until then the platform runs fully on the local PGlite Postgres, and every API,
auth and progress flow above is already exercised against it.

**Auth note:** this milestone ships the PLAYFLIX-owned session layer (guest + email/password).
OAuth providers and email verification are scoped as the next security milestone; the
`accounts` table and session machinery are designed to extend to them without a schema break.

## 5. Milestone acceptance

| Requirement | Status |
| --- | --- |
| Managed PostgreSQL target selected & wired (`DATABASE_URL`) | ✅ Neon ready; local PGlite active |
| Schema + versioned migration runner | ✅ `001_identity_and_progress.sql` + `schema_migrations` |
| Guest sessions | ✅ auto-created, hashed, expiring |
| Account auth (signup/signin/signout/delete) | ✅ scrypt + rate limits + CORS |
| Versioned profile/progress API | ✅ `/v1` with optimistic concurrency |
| Web app off localStorage | ✅ legacy import → server state |
| Verified flows | ✅ 35/35 API checks, typecheck, production build |
