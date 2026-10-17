# DEAD PIXELS — Signal Archive visual integration

Verified on 2026-10-17 using Chromium via Playwright, on macOS.

## Baseline and recovery

The existing source, collision layout, physics, channel logic, CRT shell and
automation were inspected before changes. Baseline typecheck/build passed and the
production preview booted at 320×180. The legacy channel suite passed 41/41.
This working folder was not a Git repository. A safe source backup (excluding
node_modules and generated dist) was created before editing:

`/var/folders/8v/zm5wp0k17wj87f72s4l9sxgw0000gn/T/opencode/dead-pixels-before-art-20261017.tar.gz`

## Art delivered

- **Downloaded**: Kenney Pixel Platformer Industrial Expansion, confirmed CC0.
  Only two cropped/recolored mechanical cable fittings ship; source ZIP stays
  outside the production project. See ASSET_CREDITS.md and KENNEY_LICENSE.txt.
- **Original offline-generated**: 19 PNGs (robot sheet/carrier, seven exact-size
  platform surfaces, nine environmental layers, exit). All actually exist under
  public/assets. Generation source is included; no runtime generation of these.
- **Existing reused**: custom 5×7 PixelFont, channel-transition interference,
  original test chamber geometry and gameplay systems.
- **Procedural**: CSS receiver, six blinking LEDs/local light pools, twelve
  floating motes and one sparse dust texture generated once at boot.

17 genuinely distinct 16×24 robot frames: idle 4, run 6, jump 2, fall 2, land 3.
Offline generation asserts uniqueness of every frame. Body remains 6×12,
offset (1,0); carrier remains 8×12. A separate visual sprite is bottom-aligned to
the carrier and never scales or changes the body. Land compression is drawn into
the frames. Speed 85, jump -205, gravity 500 are preserved.

Industrial platforms have continuous readable rails, beveled caps, seams, vents,
relay chips, damage variants and channel-specific archival/corrupted materials.
All original platform coordinates, sizes and activation rules remain unchanged.

The background now has a vaulted archive, analog signal disc, tape libraries,
phosphor terminals, hanging cable looms and discarded components. MEMORY has
missing scan rows/dormant diagrams; VOID has severed looms and cracked cabinets.
All channel art is preloaded; switching changes visibility without allocations.
Parallax factors: distant .18, midground .55, near 1.0. Foreground tops remain
brighter than background detail.

## Presentation and defects fixed

- Menu uses the redesigned molded receiver, vents, recessed glass and screws.
- Gameplay recedes to a thin CRT surround with compact physical controls and a
  much larger display: 1600×900 at 1920×1080; 960×540 at 1366×768/1280×720.
- Nearest-neighbor integer scaling on desktop; fractional fallback on small
  screens. Logical 320×180 and 16:9 unchanged.
- Existing ChannelSystem owns all keyboard and physical-channel requests.
  HTML selected state is driven by accepted change events. Rejection keeps the
  selector on the actual current channel. New runs reset the external controls.
- Removed the redundant request back into ChannelSystem after a successful
  change; removed the old double-parallax offset and full-screen ambient tint.
- Fixed mismatched character frame heights that could disturb animation/body
  alignment, reversed rise/fall selection, and prematurely interrupted landing.
- Fixed missing `/` glyphs in controls/menu text.
- Visual QA found cached Phaser parent bounds after the menu/game size change.
  Added parent-bound refresh and an automated assertion that the canvas fills
  the glass without internal letterboxing. All screenshots were regenerated.
- Fixed old automation: sub-frame jump presses and timed walking off the first
  ledge were replaced with held real input and state-based arrival waits. Scene
  assertions check active state rather than merely existence of a scene object.

## Final test results

| Check | Final result |
|---|---|
| npm run typecheck | PASS |
| npm run build | PASS |
| Legacy channels.cjs | 41 passed / 0 failed |
| Updated real-input qa-full.cjs, dev at 1366×768 | 45 passed / 0 failed |
| Same suite, production at 1920×1080 | 45 passed / 0 failed |
| Same suite, production at 1366×768 | 45 passed / 0 failed |
| Same suite, production at 1280×720 | 45 passed / 0 failed |
| Browser page/console errors in full suites | 0 |
| Asset load failures / external runtime requests | 0 |
| End-of-run measured frame rate | approximately 60–61 FPS |
| Supplementary 390×844 menu/game layout | Fits, 16:9 preserved |

Total: **221 successful assertions across final runs**, including repeated cases
at different viewport sizes. **FULL PLAYTHROUGH VERIFIED**, in dev and production.

The new full-playthrough suite starts at the menu, moves both ways, performs a
real jump, selects each channel, checks Q/E and cooldown, falls/respawns, starts a
fresh run via canvas click, crosses the MEMORY bridge, hits and passes the wall,
tests a rejected physical switch inside it, restores end-floor collision, walks
into the original exit, observes actual PixelFont messages SIGNAL RESTORED and
TEST CHAMBER COMPLETE, tests disabled completion controls, returns and replays.
It never writes gameplay state. Read-only snapshots are available in production
for diagnostics, not as a test-only shortcut.

Production JS: 1,232.71 kB / 338.13 kB gzip. CSS: 5.05 kB / 1.83 kB gzip.
These are the actual Vite outputs for this revision, dominated by Phaser.

## Visual evidence

33 production PNGs (11 states × 3 resolutions) plus 11 dev PNGs were captured.
All production series were visually reviewed in three labeled contact sheets,
with full-size spot checks for menu, channels, character, mid-level and completion.
No cropped canvas or presentation, text overlap or blurred sprite scaling was
found in the final reviewed shots. Temporary interference is intentionally visible
in switch/rejection/exit frames.

Production folder: `qa-artifacts/4173/`.

For each of `1920x1080`, `1366x768`, `1280x720`:

`01-menu`, `02-reality`, `03-jump`, `04-fall`, `05-memory`, `06-void`,
`07-transition`, `08-mid-level`, `09-rejected`, `10-exit-signal`, `11-complete`.

Example: `qa-artifacts/4173/1920x1080-02-reality.png`.
Contact sheets: `review-1920x1080.jpg`, `review-1366x768.jpg`, `review-1280x720.jpg`.
Dev folder: `qa-artifacts/5173/`. Machine results: `results.json` in each folder.

## Files

New: ART_BIBLE.md, ASSET_CREDITS.md, KENNEY_LICENSE.txt, README.md,
QUALITY_REPORT.md, scripts/generate-art.py, scripts/review-screenshots.py,
src/assets/AssetManifest.ts, src/systems/ArchiveEnvironment.ts,
src/ui/Television.ts, and the 21 shipped PNGs (19 original + 2 adapted).

Modified: src/entities/Player.ts, src/scenes/BootScene.ts,
src/scenes/GameScene.ts, src/scenes/MenuScene.ts,
src/systems/LevelBuilder.ts, src/systems/TextureFactory.ts,
src/systems/PixelFont.ts, src/ui/ChannelHud.ts, src/main.ts,
src/styles/main.css, qa-full.cjs, package.json, .gitignore.

## Limitations

- Artwork is original script-authored pixel art with two CC0 details, not a
  hand-painted commercial art pack. It has a deliberately limited palette.
- One existing playable chamber; larger sprite appearance does not enlarge its
  collision body. The body/visual distinction is intentional and documented.
- Keyboard gameplay; no mobile touch controls. Chromium is the automated target;
  Safari/Firefox have not been tested in this pass.
- Jump input preserves the original JustDown polling; automation holds jump for
  80 ms so it spans actual frames. No new input/physics mechanic was introduced.
- Source artwork regeneration needs Python/Pillow and the credited Kenney ZIP;
  running/building the shipped game needs only Node/npm.

Launch and exact QA commands: README.md.
