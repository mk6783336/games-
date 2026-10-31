# PLAYFLIX — Milestone 0 Platform Audit

**Date:** 31 October 2026
**Scope audited:** Full Product Requirements Document v1.0 (website, Android, iOS, accounts, backend, advertising, admin).
**Verdict:** The current repository is a complete, polished **front-end web prototype**. It is not yet the launch product described by the PRD. Native applications, accounts, a validated backend, advertising and admin cannot be shipped from this checkout without additional platform decisions, credentials and build infrastructure.

---

## 1. Environment audit

| Capability | Result |
|---|---|
| OS / shell | Windows, Git Bash |
| Node / npm | Node v22.18.0, npm 10.9.3 |
| Web build | Vite 7 + React 19 + TypeScript 5.9 — working |
| Android SDK / `adb` | Not installed |
| Java / `javac` | Not installed |
| Android Studio / Gradle | Not present |
| Xcode / `xcodebuild` / CocoaPods | Not installed (requires macOS) |
| Flutter | Not installed |
| Docker | Not installed |
| PostgreSQL / `psql` | Not installed |
| Supabase CLI | Not installed |
| Backend / API code | None in this repository |
| Database | None; player data is in `localStorage` |
| Ad SDK / provider account | None |
| Auth provider / credentials | None |
| Deployment target configured | None (no `sites`/hosting manifest) |

**Hard blockers**

1. Genuine Android and iOS builds cannot be produced on this host. Android needs an SDK/Java toolchain; iOS needs macOS/Xcode or a cloud macOS build service. A PWA or a WebView wrapper is explicitly excluded by the PRD as the final native product.
2. A production backend (accounts, guest sessions, progress sync, score validation, challenge tokens, admin, analytics) does not exist. Managed PostgreSQL/auth must be selected and provisioned, or a server stack installed and hosted.
3. Advertising, consent management and reward callbacks need a provider account, approval and policy review before integration.
4. Admin metrics must come from a real backend. Building an admin UI against local demo data would violate the PRD's "no fake statistics" rule.
5. Trademark, domain and app-store availability checks, and legal review of privacy/terms, remain external work.

---

## 2. What already exists

The web application in this repository includes:

- Responsive brand system in midnight navy, violet, electric blue and gold.
- Home page with hero, start CTA, daily challenge, exactly two game cards, progress, achievements, leaderboard preview and footer.
- Game library and game detail pages for exactly two games.
- **THE IMPOSSIBLE ROOM** — three connected chapters, inspectable hotspots, inventory, object combinations, keypad/symbol/ring puzzles, progressive hints, timer, pause, saved chapter progress and completion rewards.
- **ONE CHANCE** — full-screen canvas survival runner, one-life collision, telegraphed jump/slide hazards, double-jump, coins, progressive speed, pause/resume, fast retry and game-over screen.
- **Practice mode for ONE CHANCE** — same run, no records, XP, coins, history, achievements or leaderboard changes. Reachable from the run menu.
- Daily challenges, shareable seed/target challenge URLs, challenge inbox, global/country/friends leaderboard views and player profile.
- Guest profile stored locally, achievements, level/XP, coin balance, sound and (new) haptic settings, reduced-motion support.
- Privacy, terms, support, community and 404 surfaces.
- Mobile bottom navigation and touch controls; desktop keyboard controls.
- Preview board disclosure so sample rival entries are not presented as production data.

---

## 3. PRD gap matrix

| PRD area | Status | Remaining work / blocker |
|---|---|---|
| Two launch games | Implemented | Device-lab testing and external playtesting still required |
| Website home/library/detail | Implemented | Server-rendered/prerendered SEO version still required |
| Guest-first play | Implemented locally | Guest identity is device-local, not a secure server session |
| Player accounts (email/Google/Apple) | Missing | Backend/auth provider + credentials |
| Cross-device progress sync | Missing | Backend + account linking |
| Daily challenges | Implemented | Seed and completion are client-local; server validation needed |
| Friend challenges | Implemented as URL links | Tokens are client-generated, no expiry, rate limiting or server verification |
| Leaderboards | Preview only | Sample rivals; real global/country/friends boards need backend |
| Achievements | Implemented locally | Must be server-validated for competitive integrity |
| Practice mode | Implemented | Competitive mode separation verified |
| Sound / haptics | Implemented | Haptics only where the browser exposes `navigator.vibrate` (iOS Safari does not) |
| Website SEO | Partial | Per-page client titles exist; no SSR/prerender, sitemap, robots, canonical or OG images |
| Error/loading/offline states | Partial | No global error boundary, backend loading/offline states or sync failure UX |
| Android app | Not started | No Android toolchain on this host; genuine game/native port required |
| iOS app | Not started | No macOS/Xcode; cloud macOS/EAS build infrastructure and an iOS-capable codebase required |
| Accounts / profiles backend | Missing | Database, APIs, auth |
| Score validation / anti-cheat | Missing | Server-owned game sessions and validation |
| Admin dashboard | Missing | Needs real backend, RBAC, audit logs |
| Advertising / consent / rewards | Missing | Provider selection, approval, consent management, frequency caps |
| Analytics events | Missing | Backend/analytics pipeline |
| Database/migrations | Missing | Postgres schema and migration tooling |
| Security (rate limits, secrets, backups) | Missing | Platform + backend work |
| Automated tests | Missing | Unit/API/e2e suite; current checks are typecheck, build and manual browser QA |
| Analytics/business baselines | Not measurable yet | Requires backend and analytics |
| Localization | Missing | Future per PRD; English only today |

---

## 4. Architecture recommendation

The PRD recommends Next.js, NestJS, PostgreSQL, Supabase Auth, Redis/S3 and managed hosting. The current front end is Vite/React. Before deep backend integration, choose one of two paths:

1. **Recommended for the PRD:** migrate the public site to Next.js (SSR/SEO) while keeping the games as client components, then add a managed PostgreSQL/auth provider and versioned APIs. This resolves the site SEO requirement and gives a production-shaped deployment.
2. **Keep Vite and add prerendering + a separate API service.** Faster for the current codebase, but requires custom SEO/prerender work and two deployables.

Either way, competitive state must move server-side before leaderboards are presented as real:

- Guest session created and signed by the server.
- Game session started by the server; client submits inputs/result; server validates score/time.
- Account linking merges guest progress with a documented conflict policy.
- Friend-challenge tokens generated server-side with expiry and rate limits.
- Leaderboards and achievements derived from validated submissions.
- Admin RBAC and audit logging on top of the same data.

**Native path (separate milestone):** a genuine cross-platform client requires a native codebase (React Native/Expo or a game runtime such as Godot). The existing games would need to be ported rather than wrapped. iOS builds need a macOS CI/EAS build service; Android needs an SDK/CI. This cannot be completed in the current Windows front-end checkout.

---

## 5. Work completed in this pass

| Item | Result |
|---|---|
| Practice mode | Added to ONE CHANCE. Practice runs explicitly do not call the record pipeline. Verified: after a practice run, plays stayed 5, best stayed 201, coins stayed 745, history stayed 6. |
| Haptics setting | Added to the player settings, default **off**. Profile exposes a persisted toggle. |
| Haptic feedback | Wired to coin pickups and fatal hits in ONE CHANCE, and puzzle/item feedback in THE IMPOSSIBLE ROOM. Verified with a stubbed `navigator.vibrate`: a fatal hit emitted `[22,32,44]`. |
| Demo-data disclosure | Leaderboard page now states that rival entries are sample data. |
| Report | This audit. |

**Files changed**

- `src/lib/haptics.ts` (new)
- `src/lib/types.ts`
- `src/lib/storage.ts`
- `src/pages/Profile.tsx`
- `src/pages/OneChance.tsx`
- `src/pages/ImpossibleRoom.tsx`
- `src/pages/Leaderboard.tsx`
- `docs/MILESTONE-0-PLATFORM-AUDIT.md` (new)

**Database changes:** none. No database exists yet.

**Tests executed**

- `npx tsc -b` — passed.
- `npm run build` — production build passed (Vite bundle-size warning only).
- Browser QA at 390x844: practice mode ran to game over, displayed "No records. Just reps.", no reward strip, unchanged local stats; haptics toggle persisted; stubbed vibration fired on death.
- Browser QA at 1440x900: previous gameplay, pause and HUD checks passed.

**Remaining defects / limitations in this build**

- Leaderboard rivals are sample data (now disclosed).
- Challenge links are client-generated and mutable; no server validation or expiry.
- SEO is not crawler-complete.
- Haptics are unavailable on iOS Safari and some browsers.
- No backend means no accounts, cross-device sync, real competition, admin or analytics.
- No native app, ad integration or legal clearance.

---

## 6. Recommended next milestone

**Milestone 1 — identity and backend foundation**

1. Select and provision managed PostgreSQL + auth (or an approved self-hosted NestJS/Postgres stack).
2. Add the PRD schema and migrations: users, profiles, guest sessions, linked accounts, games, sessions, progress, challenges, attempts, scores, achievements, friendships, blocks, reports, admin, audit.
3. Implement API v1 for guest sessions, profiles, progress, challenge links and leaderboards with validation, rate limits and tests.
4. Upgrade the front end from `localStorage` to the API, supporting guest → account merge.
5. Keep the leaderboard marked as preview until server-validated scores exist.

This milestone is blocked on two decisions: **backend/auth provider** and **hosting/deployment target**. Native builds and ad integration are later milestones and require separate infrastructure and accounts.
