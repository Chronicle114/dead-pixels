# Asset provenance — DEAD PIXELS

All game resources are local. No CDN, runtime font fetch or external artwork request.

## Downloaded and adapted artwork (CC0)

Author: **Kenney** (https://kenney.nl).
Pack: **Pixel Platformer Industrial Expansion 1.0**, published 2022-10-29.
Verified source: https://kenney.nl/assets/pixel-platformer-industrial-expansion
Verified download: https://kenney.nl/media/pages/assets/pixel-platformer-industrial-expansion/f95a0189cd-1668793443/kenney_pixel-platformer-industrial-expansion.zip
License: **Creative Commons Zero 1.0**; original notice in `KENNEY_LICENSE.txt`.

| Shipped filename | Original | Modifications | Use |
|---|---|---|---|
| `public/assets/decorations/kenney-grille-80.png` | `Tiles/tile_0080.png` | 18×18 cropped to 16×16, archive-palette recolor | Background mechanical cable fitting |
| `public/assets/decorations/kenney-grille-81.png` | `Tiles/tile_0081.png` | Same | Background mechanical cable fitting |

Only these two adapted images ship. Download ZIP, samples and unused tiles are
outside the project/build. CC0 requires no attribution; credit is retained here.

## Original offline-generated artwork

Created specifically for DEAD PIXELS by the project's AI-assisted authoring workflow.
Source: `scripts/generate-art.py` (Pillow). No third-party art inside these files.
These original contributions are provided under **CC0 1.0** for unrestricted use
with this project. Existing project code/art licensing is not changed.

| Filenames under `public/assets/` | Contents | Use |
|---|---|---|
| `characters/explorer.png` | 17 distinct 16×24 pixel poses; ceramic robot, scarf, screen | Idle/run/jump/fall/land |
| `characters/carrier.png` | Transparent 8×12 carrier | Unscaled original physics dimensions |
| `tilesets/platform-0.png` … `platform-6.png` | Seven exact-size platform surfaces, beveled caps/corners, vents, relay chips, archival rails, broken traces | Every existing platform, original coordinates |
| `backgrounds/archive-1-far.png` … `archive-3-far.png` | Three 640×180 authored electronic vaults | Distant parallax |
| `backgrounds/archive-1-mid.png` … `archive-3-mid.png` | Tape cabinets, monitors, cables, cracks and archived scan gaps | Midground parallax |
| `decorations/archive-1-near.png` … `archive-3-near.png` | Discarded capacitors, cable coils, receiver shrine | Near environmental layer |
| `decorations/exit.png` | Original 16×17 test-pattern receiver | Existing exit trigger |

## Existing artwork / procedural rendering reused

- `src/systems/PixelFont.ts`: existing original 5×7 bitmap glyphs, with a new slash.
  No font download or font license introduced.
- `ChannelTransition`: existing procedural interference, rejection and VOID flicker.
- `TextureFactory`: original sparse dust texture, generated once at boot.
- `ArchiveEnvironment`: six indicator lights/local light pools and twelve motes.
- CSS cabinet, glass, scanlines and bezel: original interface styling, no images.

Rebuild offline artwork: `python3 scripts/generate-art.py --kenney /path/to/archive.zip`.
Pillow is only needed for authoring, not installing/building/playing the game.
