# PLAYFLIX — Product Audit & Redesign

**Date:** 1 November 2026  
**Audited build:** https://games-orcin-six.vercel.app (anonymous visitor, no account)  
**Local redesign:** `npm run dev:all` → http://127.0.0.1:5173  
**Scope of this milestone:** design system, site shell, home, library, game detail, all three gameplay presentations, Cycle chase-camera gameplay rebuild, One Chance character, Room intro. Secondary screens restyled through shared tokens.

> The audited deployment is the previous build. The redesign in this document is on disk and has not been deployed. The site currently online still shows the old design.

---

## 1. How the audit was performed

- Opened the deployed site as an anonymous visitor in Chrome at **1440 × 900** and **390 × 844**.
- Captured every top-level route: home, library, three game detail pages, all three play routes, challenges, leaderboard, profile.
- Started and played each game: Cycle (start, accelerate, steer, brake, pass traffic, clear all five roads in a scripted autopilot run), One Chance (start, run, jump, double-jump), The Impossible Room (entered chapter I, inspected hotspots, opened the inventory).
- Recorded console errors, failed requests and layout overflows. The deployed console was clean; no request failures were observed.
- Read the game engines and screen code to confirm what the screenshots implied.
- Did **not** complete all chapters or all five roads during the audit; gameplay scores reflect the first several minutes plus code review. That limitation is carried into the verification section.

---

## 2. Game inventory

| # | Game | Genre | Route | Build state |
|---|------|-------|-------|-------------|
| 01 | The Impossible Room | Escape-room puzzle | `/play/impossible-room` | 3 chapters, inventory, hints, saved progress |
| 02 | One Chance | One-life survival arcade | `/play/one-chance` | Endless seeded run, hazards, daily challenge |
| 03 | Cycle | Chase-camera cycling climb | `/play/cycle` | 5 roads, steering, braking, hazards, traffic, ghost rivals, splits, checkpoints |

**Product conflict:** the PRD says *exactly two launch games* and forbids a third until both are complete. The owner subsequently asked for a five-road cycling game, so Cycle ships as a third game. This should be an explicit product decision: either keep three games and update the PRD, or hold Cycle out of the public library until the launch two pass acceptance.

---

## 3. Scores (audited build, before this redesign)

Scores are 1–10 and reflect actual play plus source review.

| Category | Impossible Room | One Chance | Cycle |
|---|---|---|---|
| Visual quality | 6 | 3 | 2 |
| Gameplay quality | 7 | 6 | 4 |
| UI / UX | 6 | 5 | 5 |
| Control responsiveness | 7 | 6 | 4 |
| Animation quality | 4 | 4 | 2 |
| Sound quality | 5 | 5 | 4 |
| Mobile experience | 6 | 6 | 5 |
| Performance | 8 | 8 | 8 |
| **Overall** | **6.1** | **5.4** | **4.3** |

### 3.1 The Impossible Room — IMPROVE

- **Visual:** warm, legible study scene; the only game with a coherent mood. But it is flat vector art, hotspot dots float without depth, and object shadows do not match the door light.
- **Gameplay:** the strongest foundation. Three linked chapters, real inventory combinations, optional hints and saved progress. It is a puzzle game rather than a toy.
- **UI/UX:** clear objective and inventory, but the intro is a centred wall of uppercase type with three identical chapter buttons and little sense of place.
- **Controls:** pointer/tap hotspots are responsive on desktop and mobile; the selected-item state is clear.
- **Animation:** transitions exist but the room is mostly static; there is no camera move, dust, light flicker or object feedback.
- **Sound:** short synthesized cues; no room tone.
- **Mobile:** playable, but the inventory and scene compete for height and the intro is dense.
- **Performance:** no canvas cost; fine.
- **Main problems:** flat materials, no lighting depth, intro reads like a form, chapter selector visually weak.
- **Recommended redesign:** keep mechanics; rebuild the scene as a layered, lamp-lit set with real foreground/background separation, add a cinematic chapter intro, and make the inventory a bottom case-file drawer.
- **Decision:** **IMPROVE** — mechanics are good; presentation needs a proper art pass.

### 3.2 One Chance — IMPROVE (presentation rebuilt)

- **Visual:** the low point. A stick-figure silhouette with an oversized head and glowing cyan visor, a flat purple city of black rectangles, magenta bloom and a huge "GET READY" number.
- **Gameplay:** solid one-life loop. Jump, double-jump, slide, telegraphed hazards, coins and a daily seed. The timing is fair.
- **UI/UX:** functional HUD; the menu is a purple poster with three identical briefing rows.
- **Controls:** responsive keyboard and touch; slide/jump hit areas are large.
- **Animation:** procedural run cycle but the figure reads as a blob, not a runner; no coat, weight or landing compression.
- **Sound:** short cues, no city bed.
- **Mobile:** controls fit; the character is small and the skyline is unreadable.
- **Performance:** stable.
- **Main problems:** character silhouette, flat skyline, neon bloom, no environmental depth.
- **Recommended redesign:** cold nocturnal city, sodium-amber windows, a lean hooded courier with visible limbs and a readable stride, layered rooftops and rain, no glowing eyes.
- **Decision:** **IMPROVE** — keep the mechanics, rebuild the actor, palette and skyline.

### 3.3 Cycle — REBUILD (completed in this milestone)

- **Previous visual:** an outline bicycle roughly 30 px tall with a green dot for a rider, triangle trees, a flat green hill and a large empty sky. It read as a prototype.
- **Previous gameplay:** holding speed, hopping gaps and reading the grade was a real loop, but the player never steered, braked or chose a line. It was a rhythm runner wearing a bicycle.
- **Previous UI/UX:** HUD was legible; the start screen was a dense form with five stacked road buttons and a large empty left column.
- **Previous controls:** one hop button and one tuck button. Responsive, but not cycling.
- **Previous animation:** wheels spun; the rider was a dot. No lean, suspension, weight transfer or crash pose.
- **Previous sound:** cues only; no wind, tyres or drivetrain.
- **Previous mobile:** playable, but the race was hard to read and the start screen overflowed at 390 px.
- **Previous performance:** canvas was cheap because the scene was sparse.
- **Main problems:** no believable rider or bike, no line choice, flat world, toy-scale composition.
- **Decision:** **REBUILD** — replace the side-view runner with a pseudo-3D chase-camera cycling game.

**What now exists:** a segmented perspective road with hills and bends, speed-sensitive lateral steering, pedal and brake inputs, off-road drag, boulder/log/pothole collisions, motes, and checkpoint arches. The rider is a rear-view articulated cyclist with a pedalling cadence, lean, braking light, crash rotation and finish gesture. Each road has its own palette, weather and roadside scenery. The road now carries slow service traffic — vans, pickups and cars that hold one lane — plus three pace ghosts (Ilya Ren, Mara Voss, Sena Okafor) with a live HUD gap and a result-screen field. Traffic placement is kept 180 units clear of hazard clusters so a car never creates an unavoidable pinch. The start screen, briefing and HUD now teach steering, braking, passing traffic and racing the ghosts. The test seam and save contract were preserved: `x`, `y`, `camX`, `camLift`, `world.spans` and `hAt` still work, and the two-gate E2E passes.

**Balance run:** a scripted autopilot using the engine's real steer, brake and pedal inputs completed all five roads in one run — 48.63 s, 51.82 s, 55.65 s, 58.59 s and 61.54 s (4:36 total, 40,727 points). The closest ghost finished 1.4 s behind, with the other two 19.8 s and 35.3 s back. The split curve is monotonic and the later roads lean on traffic density and pace rather than tighter hazard spacing. Remaining depth work is gear/terrain grip, more hazard families and drivetrain audio.

### 3.4 Homepage and library — REBUILD (done)

- Repeated identical cards for all three games, a marquee strip clipped at both edges, chunky offset shadows, a tilted 3D card cluster, an avatar chip in the header, a purple-on-black "arcade" palette and a 6-step marketing band.
- Hero headline "FREE ARCADE, BUILT TO BE REPLAYED" said nothing about the games; the strongest artwork was hidden behind cards.
- Mobile was a shrunken desktop page: the header was crowded, the hero art was cropped to near-black, and the game library was a long stack of the same card.

---

## 4. New creative direction

**Positioning:** a premium, cinematic game platform for adults and older teens — closer to a streaming service's editorial page than an arcade lobby.

- **Surfaces:** warm near-black (`#08090b`), bone type (`#f2efe6`), brass signal (`#e5b15f`). No CRT grille, scanlines, neon bloom or chunky offset shadows.
- **Type:** Archivo for display, Instrument Sans for interface, Instrument Serif italic for editorial lines. Sentence case for headings; labels are small, tracked uppercase.
- **Composition:** one image, one idea per screen. Asymmetric library, full-bleed hero, hairline rules, generous negative space.
- **Art:** bespoke SVG key art per game — alpine dusk, rain-soaked rooftops, a lamp-lit study. No floating 3D avatars, no characters where the game does not need one.
- **Motion:** 140–520 ms ease-out, reveal on load, one hover lift, no bobbing, tilting or looping decoration.
- **3D stance:** no Three.js added. Cycle uses a custom pseudo-3D segmented road with a chase camera and a 2.5D articulated rider. That keeps draw cost and control latency predictable while delivering real perspective, line choice and depth. It is pseudo-3D, not a general 3D engine.

---

## 5. What changed in this milestone

### Foundation

- [`src/tokens.css`](../src/tokens.css): new palette, type scale, 3 px surfaces, no shadow offsets.
- [`src/base.css`](../src/base.css): sentence-case display hierarchy, serif accent, film grain, focus treatment.
- [`src/index.css`](../src/index.css): hairline panels, solid/ghost buttons, editorial chips, game HUD surfaces, mobile hero scrim.
- [`index.html`](../index.html): Archivo, Instrument Sans, Instrument Serif; new favicon and metadata.

### Shell and commercial pages

- [`src/components/SiteChrome.tsx`](../src/components/SiteChrome.tsx): new header, footer, toasts; no avatar chip.
- [`src/components/MobileNav.tsx`](../src/components/MobileNav.tsx): hairline bottom bar, small icons, text active state.
- [`src/components/Brand.tsx`](../src/components/Brand.tsx): restrained brass mark and flat monogram.
- [`src/components/Art.tsx`](../src/components/Art.tsx): three new cinematic key-art scenes; redrawn cyclist and courier.
- [`src/pages/Home.tsx`](../src/pages/Home.tsx): full-bleed Cycle hero (height tightened so the type no longer floats under a dead band of sky), asymmetric library, daily challenge band, record and board.
- [`src/pages/Games.tsx`](../src/pages/Games.tsx): alternating editorial library entries.
- [`src/pages/GameDetail.tsx`](../src/pages/GameDetail.tsx): genre-specific detail pages, road profile, chapter dossier, controls, board.
- [`src/components/LeaderboardTable.tsx`](../src/components/LeaderboardTable.tsx): rank typography and hairlines instead of gradient avatars.

### Games

- [`src/games/cycle/engine.ts`](../src/games/cycle/engine.ts):
  - replaced the side-view scroll with a segmented pseudo-3D road projected into a chase camera;
  - speed-sensitive steering, automatic touring tempo, pedal boost, braking to a stop, off-road drag and verge crashes;
  - boulder, log and pothole hazards; collectible motes; checkpoint arches across the full road;
  - one-lane service traffic (van, pickup, car) with collision, braking gaps and hazard-separated placement;
  - three pace ghosts with route-average pacing, lateral weave, name tags, live HUD gap and a result-screen field;
  - rear-view cyclist with articulated arms, pedalling legs, helmet, jersey, lean, brake light, contact shadow, crash rotation and finish gesture;
  - five road palettes and weather states, curving alpine backdrop, treeline and roadside props;
  - one continuous shoulder/asphalt strip, cached per-road backdrop, cached prop sprites and atmospheric fog, which lifted headless desktop FPS from 19 into the low-to-mid 40s;
  - preserved `x`, `y`, `camX`, `camLift`, `world.spans` and `hAt` as the E2E seam; production still strips the engine handle.
- [`src/games/one-chance/engine.ts`](../src/games/one-chance/engine.ts):
  - cold nocturnal palette, amber and ice windows, no magenta;
  - realistic head proportion and a new hooded/silhouetted runner with visible far/near limbs, backpack and stride;
  - two faint motion ghosts instead of a neon aura;
  - hazards recoloured to rust/amber; countdown typography rebuilt.
- [`src/pages/Cycle.tsx`](../src/pages/Cycle.tsx): steering/brake/pedal keyboard and multi-touch controls; briefing, HUD, pause, results and road select updated to match; braking state, nearest ghost gap and ghost-field results added; results copy now reflects a checkpoint-started run instead of always claiming all five roads.
- [`src/lib/games.ts`](../src/lib/games.ts): Cycle description, feature list, traffic/ghost tags and control legend updated.
- [`src/pages/OneChance.tsx`](../src/pages/OneChance.tsx): start, pause, game-over, briefing and touch controls restyled; title hierarchy rebuilt.
- [`src/pages/ImpossibleRoom.tsx`](../src/pages/ImpossibleRoom.tsx): chapter intro, objective, chapter selector, inventory selection and result chrome restyled; backdrop reframed and chapter cards given their own scrim so the door hardware no longer reads as a floating avatar.
- Secondary pages (`Profile`, `Challenges`, `Leaderboard`, `Account`, `InfoPage`, `NotFound`, room puzzles): violet chrome normalised to brass; shared type and surfaces apply.

---

## 6. Before / after

| Screen | Before | After |
|---|---|---|
| Home | [before-home.png](audit/before-home.png) | [after-home.png](audit/after-home.jpg) |
| Library | [before-library.png](audit/before-library.png) | [after-library.png](audit/after-library.jpg) |
| Cycle | [before-cycle.png](audit/before-cycle.png) | [after-cycle-play.png](audit/after-cycle-play.jpg) |
| One Chance | [before-one-chance.png](audit/before-one-chance.png) | [after-one-chance-play.png](audit/after-one-chance-play.jpg) |
| The Impossible Room | [before-room.png](audit/before-room.png) | [after-room-menu.png](audit/after-room-menu.jpg) |

Additional after shots: [Cycle detail](audit/after-cycle-detail.jpg), [Cycle start](audit/after-cycle-menu.jpg), [Cycle checkpoint](audit/after-cycle-gate.jpg), [mobile home](audit/after-home-mobile.jpg), [mobile Cycle](audit/after-cycle-mobile.jpg).

### Per-game result

**The Impossible Room — improved, not rebuilt.**  
Previous problems: flat lighting, form-like intro, weak chapter selector.  
Changes: cinematic chapter intro over the room, brass objective, square chapter cards, clearer inventory selection, new key art in the library.  
Remaining: the in-room scene itself is still the old vector set; no camera or material pass yet.

**One Chance — presentation rebuilt.**  
Previous problems: giant-headed glowing stick figure, flat purple city, magenta bloom.  
Changes: cold night palette, amber windows, new hooded runner with visible stride and backpack, no aura, rust hazard palette, rebuilt start/pause/game-over hierarchy.  
Remaining: the skyline is still procedurally simple; no foreground rooftops, rain interaction or skybed yet.

**Cycle — gameplay rebuilt.**  
Previous problems: 30 px outline bike, dot rider, triangle trees, flat hills, no steering, no reason to brake.  
Changes: chase-camera perspective road, lateral steering, pedal/brake controls, hazards, off-road failure, checkpoint arches, articulated rear-view cyclist, cached scenery, rebuilt HUD and briefing; one-lane service traffic with pass/brake decisions; three pace ghosts with live gaps and a result field; dynamic results copy for checkpoint-started runs; five-road balance pass.  
Remaining: three hazard families only, no gear or weather-grip model, no drivetrain audio, and the balance run was automated rather than a broad human playtest.

New Cycle evidence: [start](audit/after-cycle-menu.jpg), [riding](audit/after-cycle-play.jpg), [traffic](audit/after-cycle-traffic.png), [five-road result](audit/after-cycle-result.png), [checkpoint approach](audit/after-cycle-gate.jpg), [mobile](audit/after-cycle-mobile.jpg).

---

## 7. Verification actually performed

- `npm run build` — passes (`tsc -b` + Vite production build, 634.00 kB / 187.48 kB gzip, built in 22.73 s). The production bundle contains no `__playflixCycle` test seam.
- `npm run test:e2e` — 1 test passes (`ok 1 … two cleared gates unlock the next roads and both splits survive a reload`, 1.1 min). This exercises the real Cycle engine, gate clearing, API save and reload against an isolated PGlite database on ports 5174/8791, after the traffic and ghost changes.
- Five-road balance run: scripted autopilot with real steering/braking/pedal calls cleared every road without a fall; splits **48.63 / 51.82 / 55.65 / 58.59 / 61.54 s**, score 40,727, closest ghost 1.4 s behind. A second run started at Ridgeclimb cleared roads 2–5 in 55.53 / 56.13 / 58.55 / 61.73 s, which confirms checkpoint starts remain consistent.
- Traffic: generated counts per road were 2 / 3 / 7 / 8 / 6 on a representative seed, increasing with difficulty; every vehicle was generated at least 180 units from a hazard. A direct same-lane approach transitioned the engine to `phase: "crash"`; the five-road run passed multiple vehicles in the opposite lane without a collision.
- Ghosts: paces resolve to 374 / 353 / 337 units/s for a full Fern Hollow run and scale with the average difficulty of the remaining route; the HUD reported the nearest rival within 1.4 s at the finish.
- Headless Chrome at 1440 × 900 and 390 × 844: home, library, all three detail pages, all three play routes, challenges, leaderboard, profile. **0 console errors, 0 page errors.** Final home/Cycle/Room captures after the last changes are also clean.
- Cycle input and consequences were exercised directly: steering moved the rider across the road, braking took the bike to 0, pedalling raised speed into the 300s (352 on Fern Hollow, 400 on Stormfront), a log collision ended the run in the result screen, a service-vehicle collision ended a run, and holding off-road input produced a crash at `riderLat 1.96`.
- Cycle checkpoint: approach frame shows the arch, crossing it moves the world to road 2 and fires the `Road 01 cleared` banner; the E2E confirms both splits persist through reloads.
- Headless frame rate before the traffic/ghost layer: **42 fps at 1440 × 900** and **57 fps at 390 × 844** in software rendering. The final build has not been re-benchmarked, so those numbers are provisional rather than a current guarantee.
- Mobile: home and Cycle gameplay captured at 390 × 844 after the final changes; `scrollWidth - innerWidth = 0` (no horizontal overflow).

**Not yet verified:** full completion of all three Room chapters, a long One Chance survival run, low-end Android FPS, Safari/Firefox, screen readers, and audio on real devices. The five-road run was automated, not a broad human playtest, and the final traffic/ghost build has not been re-benchmarked for frame rate. The redesigned build is not deployed.

---

## 8. Technical risks

1. **Cycle gameplay depth.** Traffic and ghost rivals now make the road a decision space, but gear choice, weather grip and drivetrain audio are still missing. The next depth layer is vehicle feel, not more scenery.
2. **Cycle balance.** The five-road curve is now measured on a scripted run, not a broad human sample. Traffic density, ghost pace and hazard spacing should be checked with several real players before competitive modes are tuned around them.
3. **Bundle size.** The app remains one chunk. Gameplay routes should be lazy-loaded before a paid acquisition push.
4. **Canvas cost.** Headless desktop runs in the low-to-mid 40s after caching the backdrop and props. Low-end Android and Safari are untested; the cached sprites and single-strip road are the main mitigations.
5. **Deployment drift.** The live Vercel build is older than the workspace. A Git deploy needs the generated serverless entry and `vercel.json` committed first.
6. **Three-game conflict.** The PRD still says two launch games. Decide whether Cycle is a launch title or a post-launch addition before the store pages and marketing copy are finalised.
7. **Secondary screens are not fully redesigned.** They inherit the new tokens and lose the violet, but their card geometry and some hero treatments remain from the old system.

---

## 9. Recommended next milestones

1. **Cycle: vehicle feel.** Add gears and weather-dependent grip, a fourth hazard family and drivetrain/tyre audio; then run a human balance sample against the new ghost paces.
2. **One Chance: world pass.** Detailed rooftops, foreground rails, rain, skybed and a more readable hazard language. Keep the current actor.
3. **Room: material and light pass.** Rebuild the room scene with foreground/background layers, light shafts and object feedback; keep puzzles untouched.
4. **Secondary screens.** Rebuild Profile, Challenges and Leaderboard on the new editorial grid; remove the remaining rounded-card legacy.
5. **Ship and measure.** Commit the Vercel serverless changes, deploy, then run Lighthouse and a mid-range Android frame test.

---

## 10. Acceptance criteria status

| Criterion | Status |
|---|---|
| Substantially more professional | Met on home, library, game detail, all three intros and gameplay HUDs |
| Distinctive gaming identity | Met — brass/bone editorial cinema, no neon arcade chrome |
| No toy-like visuals | Improved; Cycle rider and One Chance actor rebuilt, city/room still stylised |
| No unnecessary avatars | Header and home removed; monogram remains only in profile/account contexts |
| Game-specific identities | Met on detail pages and key art |
| Genuinely engaging gameplay | Improved — Cycle now has steering, braking, hazards, traffic to pass and three pace ghosts with live gaps; five-road curve measured end to end |
| Desktop and mobile | Verified at 1440 and 390; no console errors |
| Responsive controls | Preserved; touch controls restyled |
| Polished loading/result states | Cycle and One Chance start/pause/over restyled; Room intro/results restyled |
| No dead buttons | Not exhaustively audited; existing routes and actions exercised |
| Real game-by-game testing | First minutes of each game, Cycle input/collision/off-road checks, a full five-road autopilot run and the two-gate E2E; Room and One Chance full completions not run |
