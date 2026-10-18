# DEAD PIXELS

A broken signal. Three realities. A seven-level Phaser 3 puzzle-platformer for
Ludum Dare 60 — **OLD TECH**.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. All game artwork and fonts load locally.

Controls: **A/D** or arrows move; **Space/W/Up** jump; **1/2/3** select
REALITY/MEMORY/VOID; **Q/E** cycle; **R** restart current level; **ESC** menu;
**Enter/Space/click** start.
The cabinet buttons route through the same collision-validated ChannelSystem.

Route: select MEMORY before the first gap; cross its bridge; approach the tall
wall; select VOID to pass it; restore REALITY before leaving the shared floor;
reach the lit EXIT receiver. This is only the first signal: six further levels
introduce alternate routes, airborne switching and longer channel sequences.
Falls return you to the latest activated checkpoint and its safe channel.
R resets the current level, including its checkpoints; it does not reset the
campaign index. Starting from the main menu begins a new campaign. Progress is
in memory only.

## Campaign

1. FIRST SIGNAL — movement, MEMORY bridge, VOID wall.
2. LOST FREQUENCY — elevated REALITY / lower MEMORY routes and channel planning.
3. BROKEN CIRCUITS — launch in one reality, switch in the air, land in another.
4. MEMORY LEAK — connected bridge/relay/floor sequences.
5. STATIC INTERFERENCE — unreliable pictures, reliable collisions.
6. SYSTEM FAILURE — three airborne transfers and interlocked routes.
7. FINAL TRANSMISSION — final relay chamber and a short, skippable ending.

Exits automatically retune the next level in about 1.75 seconds. Checkpoint flags
glow cyan when activated. Short contextual hints explain the next idea. All
existing art and the original movement/jump constants are preserved.

## Production

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

Regression outputs: `qa-artifacts/5173/` and `qa-artifacts/4173/`.
Campaign outputs: `qa-artifacts/campaign/5173/` and
`qa-artifacts/campaign/4173/`. Each has screenshots and `results.json`.
These are local QA outputs, not build assets. Optional visual review boards:
`python3 scripts/review-campaign.py` (requires Pillow).

## Art and attribution

- [Art bible](ART_BIBLE.md)
- [Asset credits / licenses](ASSET_CREDITS.md)
- [Campaign design](LEVEL_DESIGN.md)
- [Current campaign QA report](CAMPAIGN_REPORT.md)
- [Previous visual-stage report](QUALITY_REPORT.md)

All shipped PNGs are under `public/assets/` and loaded by
`src/assets/AssetManifest.ts`. Original artwork is authored offline with
`scripts/generate-art.py`. Pillow is optional for regenerating art; it is not a
game/build dependency. The two adapted Kenney details use CC0; the original
license notice is preserved in `KENNEY_LICENSE.txt`.
