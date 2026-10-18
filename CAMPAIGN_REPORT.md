# DEAD PIXELS — seven-level campaign QA report

## Implemented

- Data-driven `LevelManager`: current definition/index, level-local checkpoint
  state, cleared-level history, falls, elapsed campaign time, restart and ending.
- Seven authored definitions in `Campaign.ts`; one reused `GameScene`.
- Safe checkpoint/channel restoration, manual R restart, ESC menu navigation.
- Prebuilt contextual tutorial text, level number/title HUD, active checkpoint flags.
- 1.75s analog retunes and a short skippable `EndingScene` with all requested text.
- Level-width-aware parallax, per-level compositions/landmarks and atmospheric
  static that never touches channel state or collision enable flags.
- Existing local PNGs retained; arbitrary platform sizes recompose the shipped
  art into cached textures once per size/style. No new dependency or downloaded art.

## Checkpoint / baseline

Git was initialized in the existing working folder, and baseline source/art was
committed before implementation: **`5293037` — Checkpoint working single-level
visual prototype**. Existing unrelated root screenshots remain untracked.

Before editing: `npm run typecheck`, `npm run build` and the prior 45-check
browser suite passed. Existing player speed, jump, gravity, body dimensions and
collision-safe channel rejection were inspected and retained.

## Final automated results (actual Chromium runs)

| Environment | Regression | Full campaign | Failed |
|---|---:|---:|---:|
| Dev, 1366×768 | 47 | 277 | 0 |
| Production, all three desktop sizes | 141 | 832 | 0 |

**1,297 final successful assertions across these runs; 0 failures.** Counts include
repeated checks at different resolutions, not 1,297 distinct scenarios.

**FULL GAME PLAYTHROUGH VERIFIED** in development and the actual production
preview at **1920×1080, 1366×768, 1280×720**.

The campaign tests start at the real menu, enter level 1, play through every
exit in order, observe the ending, return to menu and start a new campaign.
All movement uses browser keyboard/pointer input. Read-only diagnostics assert
state; the test never sets coordinates, disables collisions, invokes exits,
calls completion, changes the level index or skips puzzle validation.

Coverage includes:

- Both directions, release-to-stop, jump velocity/apex, fall/land animation/body.
- All three direct channel keys, Q/E wrapping, cooldown, same-channel requests.
- Shared and channel-specific collision, wall blocking/removal, overlap rejection
  and NO SIGNAL, HTML control synchronization, camera following.
- Every level's valid spawn, every one of the 32 reachable checkpoints, a real
  fall/recovery on each level, consistent restored channel/support, continued play.
- Both upper REALITY and lower MEMORY routes in level 2.
- Actual rising-air switches on levels 3–7, with safe landings and no unintended
  falls along the planned routes.
- R at level 1 and after activating a checkpoint on level 4; local progress resets
  while the campaign index and cleared previous levels remain correct.
- Exactly one dynamic body and `platform count + 1` static bodies on each fresh
  level, proving previous-level bodies are removed.
- Real exit overlap, automatic progression, completion input lock, all ending
  phrases, automatic final card, skip input and a real click on RETURN TO MENU.
- Logical 320×180, 16:9 CSS ratio, whole presentation fitting, click-through glass,
  no internal letterboxing, local resources, no browser errors or missing assets.

Final recorded per-level frame rates were approximately **59.8–60.8 FPS**.

One expanded-test failure was a real automation race: immediately after pressing
R, the script briefly observed the old scene before Phaser's queued restart. The
test now waits for the same level, a fresh spawn/checkpoint and playing phase.
Assertions were retained; full dev and production suites were rerun successfully.

## Build / production

`npm run typecheck`: PASS. `npm run build`: PASS.

Actual final Vite output: JS **1,249.20 kB / 343.63 kB gzip**; CSS **5.05 kB /
1.83 kB gzip**. Production was served using the existing `npm run preview` command
on port 4173, and every level was completed there with real input.

## Visual QA evidence

Campaign screenshots: **`qa-artifacts/campaign/4173/`**.
Dev equivalent: `qa-artifacts/campaign/5173/`.

For each of the three viewport prefixes:

- `level-1-start.png` … `level-7-start.png`
- `level-1-checkpoint.png` … `level-7-checkpoint.png`
- `level-1-route.png` … `level-7-route.png`
- `level-1-exit.png` … `level-7-exit.png`
- `level-3-airborne.png` … `level-7-airborne.png`
- `ending-transmission.png`, `ending-waiting.png`, `ending-card.png`
- `menu.png`

The final evidence series was visually inspected in **nine labeled review boards**
(levels 1–4, levels 5–7 + ending, and exits at each size), with full-size spot
checks for character/landing visibility, HUD, arrival titles and ending text.
No clipping, unreadable tutorial overlap or mismatched solid platform bounds was
found in those final reviewed shots. Temporary analog interference is intentional.

Review boards in the same directory:

`review-1920x1080-levels-1-4.jpg`,
`review-1920x1080-levels-5-7-ending.jpg`,
`review-1920x1080-exits.jpg`, plus equivalent 1366×768 and 1280×720 sets.

Machine-readable results: `qa-artifacts/campaign/4173/results.json` and
`qa-artifacts/4173/results.json`. Historical failed-run PNGs may coexist with the
final evidence; the named review boards and final result files are the final run.

## Files

Created:

- `src/levels/Campaign.ts`
- `src/levels/ValidateLevel.ts`
- `src/systems/LevelManager.ts`
- `src/ui/LevelGuidance.ts`
- `src/scenes/EndingScene.ts`
- `qa-campaign.cjs`
- `scripts/review-campaign.py`
- `LEVEL_DESIGN.md`, `CAMPAIGN_REPORT.md`

Modified:

- `src/levels/LevelTypes.ts`
- `src/systems/LevelBuilder.ts`, `ChannelSystem.ts`, `ChannelTransition.ts`,
  `ArchiveEnvironment.ts`
- `src/scenes/GameScene.ts`, `MenuScene.ts`
- `src/config/Constants.ts`, `GameConfig.ts`, `src/main.ts`
- `qa-full.cjs`, `package.json`
- `README.md`, `ART_BIBLE.md`, historical-report link in `QUALITY_REPORT.md`

Player.ts, the original TestLevel.ts fixture and all shipped PNG artwork are
unchanged in this stage. The prior regression suite remains in Git history and
its current expectations were updated for automatic progression rather than the
obsolete TEST CHAMBER COMPLETE prototype screen.

## Known limitations / pacing

- The 12–20 minute first-play target is **not validated**. The solution-aware
  automated route takes roughly 2m40s. This is a compact campaign; human timing and
  further difficulty/length tuning would be necessary to establish the requested
  duration. See LEVEL_DESIGN.md for the actual physical/design constraints.
- Progress is in memory; returning to the main menu and starting begins a new
  campaign. There is no disk save or level-select shortcut.
- Chromium is the automated browser target; other browser engines and mobile
  touch gameplay have not been tested in this stage.

## Launch / rerun

```sh
npm install
npm run dev
# http://localhost:5173
```

In another terminal with the server running: `npm run qa`.

```sh
npm run typecheck
npm run build
npm run preview -- --port 4173 --strictPort
```

With that preview running:

```sh
QA_URL=http://localhost:4173 QA_SIZES=1920x1080,1366x768,1280x720 npm run qa
```

If needed: `npx playwright install chromium`. Regenerate review boards with
`python3 scripts/review-campaign.py` (optional Pillow authoring dependency).
