# DEAD PIXELS

## THE LAST SIGNAL

A broken signal. Three realities. A seven-level Phaser 3 puzzle-platformer for
Ludum Dare 60 — **OLD TECH**.

Current systems and verified results: [RELEASE_REPORT.md](RELEASE_REPORT.md).

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. All game artwork and fonts load locally.

Controls: **A/D** or arrows move; **Space/W/Up** jump; **1/2/3** select
REALITY/MEMORY/VOID; **Q/E** cycle; **R** restart current level; **ESC** menu;
**Enter/Space/click** select; arrows navigate menus. The new main menu offers
NEW GAME, CONTINUE, SETTINGS and CREDITS. NEW GAME plays THE LAST SIGNAL, a
40-second introduction; **Space/Enter/ESC** skip it safely.
The cabinet buttons route through the same collision-validated ChannelSystem.

Route: select MEMORY before the first gap; cross its bridge; approach the tall
wall; select VOID to pass it; restore REALITY before leaving the shared floor;
reach the lit EXIT receiver. This is only the first signal: six further levels
introduce alternate routes, airborne switching and longer channel sequences.
Falls return you to the latest activated checkpoint and its safe channel.
R resets the current level, including its checkpoints; it does not reset the
campaign index. NEW GAME asks before replacing existing progress. CONTINUE loads
the saved current level at its safe starting point. Level/highest unlock/intro
state and preferences use localStorage, with a safe in-memory fallback when blocked.

UNIT 07 has four energy segments. Ordinary security hits cost 1 HP; falling
machinery costs 2. Hits grant one second of invulnerability, with no knockback.
A new checkpoint heals 1 HP once, up to four. Death reboots at the checkpoint with
full health; pit recovery preserves health. Previously consumed checkpoints cannot
be farmed by revisiting or dying.

Music starts only after user input. SETTINGS provides independent master, music,
SFX and ambience levels, mute and CRT-overlay toggling. All ten original music
arrangements load locally; audio source/license details: [AUDIO_CREDITS.md](AUDIO_CREDITS.md).

## Campaign

1. FIRST SIGNAL — movement, MEMORY bridge, VOID wall.
2. LOST FREQUENCY — alternate routes, channel planning and telegraphed lasers.
3. BROKEN CIRCUITS — airborne channel transfers and live-wire panels.
4. MEMORY LEAK — channel sequences and loose falling machinery.
5. STATIC INTERFERENCE — predictable industrial sentries and interference.
6. SYSTEM FAILURE — airborne transfers, bridges and separated security systems.
7. FINAL TRANSMISSION — final security chamber, corruption and a short ending.

Exits automatically retune the next level in about 1.75 seconds. Checkpoint flags
glow cyan when activated. Short contextual hints explain the next idea. All
existing art and the original movement/jump constants are preserved.

## Production

### GitHub Pages

`.github/workflows/pages.yml` builds the Vite game and deploys **dist/** after a
push to main. In repository Settings → Pages, the source must be **GitHub Actions**.
Publishing the repository root directly serves the uncompiled TypeScript entry
and will not launch the game. Vite's relative base keeps scripts, styles, artwork
and audio working under the `/dead-pixels/` project URL.

```sh
npm run typecheck
npm run build
npm run preview -- --port 4173 --strictPort
```

Open http://localhost:4173. Logical resolution remains 320×180, with crisp integer
scaling on desktop. The large cabinet is reserved for the menu; gameplay uses a
thin screen surround and compact physical channel strip.

## Gameplay QA

Playwright is a dev dependency. If Chromium is not installed locally:

```sh
npx playwright install chromium
```

With the dev server running:

```sh
npm run qa
```

With the production preview running:

```sh
QA_URL=http://localhost:4173 QA_SIZES=1920x1080,1366x768,1280x720 npm run qa
```

`npm run qa` runs both the updated existing regression suite (`qa-full.cjs`) and
the full seven-level campaign (`qa-campaign.cjs`). The latter starts at the menu,
plays all seven levels, reaches every checkpoint, performs airborne transfers,
tests recovery, observes all ending messages, returns to menu and starts again.
It only reads diagnostics; it never teleports, writes coordinates, disables
collisions or invokes completion. Each script can also run separately with
`npm run qa:regression` or `npm run qa:campaign`.

Full technical release checks (health/geometry models, menu/storage/settings,
the complete intro, actual audio playback, regression and zero-hit campaign):

```sh
npm run qa:release
```

Deliberate damage/death/healing and survival through all seven levels:

```sh
npm run qa:survival
```

For example, with a production preview on port 4183:

```sh
QA_URL=http://localhost:4183 QA_SIZES=1920x1080,1366x768,1280x720 npm run qa:release
QA_URL=http://localhost:4183 QA_SIZES=1920x1080,1366x768,1280x720 npm run qa:survival
```

Regression outputs: `qa-artifacts/5173/` and `qa-artifacts/4173/`.
Campaign outputs: `qa-artifacts/campaign/5173/` and
`qa-artifacts/campaign/4173/`. Each has screenshots and `results.json`.
These are local QA outputs, not build assets. Optional visual review boards:
`python3 scripts/review-campaign.py` (requires Pillow).

The final expanded-release evidence uses port **4183**. See
`qa-artifacts/campaign/4183/`, `qa-artifacts/menu/`, `qa-artifacts/intro/` and
`qa-artifacts/release-review/`. Rebuild final boards with
`python3 scripts/review-campaign.py 4183` and
`python3 scripts/review-release.py 4183`.

## Art and attribution

- [Art bible](ART_BIBLE.md)
- [Asset credits / licenses](ASSET_CREDITS.md)
- [Campaign design](LEVEL_DESIGN.md)
- [Current release report](RELEASE_REPORT.md)
- [Audio credits](AUDIO_CREDITS.md)
- [Milestone verification log](RELEASE_PROGRESS.md)
- [Previous campaign QA report](CAMPAIGN_REPORT.md)
- [Previous visual-stage report](QUALITY_REPORT.md)

All shipped PNGs are under `public/assets/` and loaded by
`src/assets/AssetManifest.ts`. Original artwork is authored offline with
`scripts/generate-art.py`. Pillow is optional for regenerating art; it is not a
game/build dependency. The two adapted Kenney details use CC0; the original
license notice is preserved in `KENNEY_LICENSE.txt`.
