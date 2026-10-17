# DEAD PIXELS

A broken signal. Three realities. A small Phaser 3 puzzle-platformer for
Ludum Dare 60 — **OLD TECH**.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. All game artwork and fonts load locally.

Controls: **A/D** or arrows move; **Space/W/Up** jump; **1/2/3** select
REALITY/MEMORY/VOID; **Q/E** cycle; **ESC** menu; **Enter/Space/click** start.
The cabinet buttons route through the same collision-validated ChannelSystem.

Route: select MEMORY before the first gap; cross its bridge; approach the tall
wall; select VOID to pass it; restore REALITY before leaving the shared floor;
reach the lit EXIT receiver. Falls respawn automatically.

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

The test uses keyboard and real pointer input from the menu through completion
and replay. It only reads diagnostics; it never teleports, writes coordinates,
disables collisions or invokes completion. It also tests pit recovery, overlap
rejection, physical control synchronization and responsive canvas fitting.

Outputs: `qa-artifacts/5173/` and `qa-artifacts/4173/`, including PNG screenshots
and machine-readable `results.json`. These are local QA outputs, not build assets.

## Art and attribution

- [Art bible](ART_BIBLE.md)
- [Asset credits / licenses](ASSET_CREDITS.md)
- [Quality report](QUALITY_REPORT.md)

All shipped PNGs are under `public/assets/` and loaded by
`src/assets/AssetManifest.ts`. Original artwork is authored offline with
`scripts/generate-art.py`. Pillow is optional for regenerating art; it is not a
game/build dependency. The two adapted Kenney details use CC0; the original
license notice is preserved in `KENNEY_LICENSE.txt`.
