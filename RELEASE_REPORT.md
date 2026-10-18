# DEAD PIXELS — THE LAST SIGNAL

## Delivered scope

The existing seven-level Phaser 3 game now includes channel-aware security,
four-segment health, original music and sound, a standalone menu/settings/save
flow, a forty-second introduction and a return-to-the-room ending. Existing PNG
world/character art, all seven terrain layouts, movement speed, jump, gravity and
the 6×12 collision body are preserved. No engine migration or new dependency.

Baseline was actually inspected, built and played before modification: 47
regression + 277 campaign assertions passed. Git checkpoint **`2e4b27d`** preserves
that baseline. Working milestone commits were made after each verified stage;
see RELEASE_PROGRESS.md and Git history.

## Systems

### Health / damage / checkpoints

`HealthSystem` owns max 4 HP, scene-clock invulnerability, enable/disable state,
damage/death counts and per-checkpoint healing history. ENERGY shows four pixel
segments without covering level/channel information.

| Source | Damage |
|---|---:|
| Laser | 1 HP |
| Turret bolt | 1 HP |
| Electricity | 1 HP |
| Falling machinery | 2 HP |
| Corrupted signal | 1 HP |

Accepted damage grants 1000 ms invulnerability. Subtle sprite flicker and sparks
communicate it, while movement/channel controls remain available. No knockback.
Zero HP emits a single lethal event: darkened/compressing display, shutdown sound,
brief fade, safe checkpoint restore after 500 ms, full HP and reboot protection.
The death state prevents overlapping damage/respawn sequences.

Pit falls preserve HP and restore the saved checkpoint/channel with a short grace
period. New checkpoints heal **one** HP, capped at four. Visiting at full health
still spends the heal. Revisit and death do not replenish a consumed checkpoint;
R/new level creates a predictable new activation cycle. All original 32 stations
remain reachable. Spawn/checkpoint validation now also checks hazard bounds.

### Hazards

- `LaserHazard`: IDLE 350 ms → WARNING 800 ms → ACTIVE 1200 ms → COOLDOWN 1500 ms.
  A targeting beam is harmless; the bright active core matches its damage box.
- `ElectricHazard`: OFF → CHARGING → ACTIVE → DISCHARGING; visible leads,
  charging indicator and warm arc. AABB damage is limited to the drawn panel area.
- `FallingMachinery`: approach-triggered 1000 ms creak/shake warning, deterministic
  fall, impact/dust, cooldown/reset. Fallen debris fades and is not a hidden ledge.
- `TurretHazard`: limited-range idle/detect/aim/fire/cooldown sequence; locked,
  readable 48px/s bolts; three preallocated bolts per sentry. Solid geometry
  blocks line-of-sight and swept bolt motion. No random aiming/firing.
- `CorruptionHazard`: rare late-game checker-pattern zone with 1100 ms warning,
  900 ms active window and cooldown, solved through signal choice.

All enabled-channel lists live in level data. A disabled channel cannot hurt;
deactivation clears turret projectiles and resets hazard telegraphs. Re-enabling
starts safely, never in an unannounced active frame. Hazards add no physics bodies
and never change player velocity or silently disable terrain.

| Level | Security placement |
|---|---|
| FIRST SIGNAL | No damaging hazards |
| LOST FREQUENCY | Two separated channel-dependent laser gates |
| BROKEN CIRCUITS | Two live-wire panels around established transfer sections |
| MEMORY LEAK | A loose CRT monitor over a shared safe-floor section |
| STATIC INTERFERENCE | Two industrial sentries with channel/relay-wall counters |
| SYSTEM FAILURE | Laser, loose server, live conduit and sentry in separate rooms |
| FINAL TRANSMISSION | One of each established type, spread across the full route |

Sixteen total hazard definitions. Every level was played with zero accepted hits.
Every damaging level was also completed after intentional damage. Level 1 is
intentionally exempt from the damage run because it must remain hazard-free.
Passing these tests establishes tested solutions, not perfect balancing or fun.

### Audio

`AudioManager` owns one gesture-unlocked Web Audio graph, independent MASTER /
MUSIC / SFX / AMBIENCE gains, mute, limiter, quiet spatial cues, bounded voices,
visibility handling, crossfades and unload cleanup. Music uses a lazy local
decode cache; duplicate scene requests do not spawn duplicate looping tracks.

Ten **actual original 16-bar WAV compositions** exist locally, 33–60 seconds each:

| Use | Track |
|---|---|
| Menu | The Last Signal |
| Intro | A Room That Remembers |
| Level 1 | First Signal |
| Level 2 | Lost Frequency |
| Level 3 | Broken Circuits |
| Level 4 | Memory Leak |
| Level 5 | Static Interference |
| Level 6 | System Failure |
| Level 7 | Final Transmission |
| Ending | Outside the Glass |

The common four-note motif links different harmony, rhythm, registers and
orchestration. They are not one loop with changed playback speeds. Authoring
source and per-score/PCM hashes are included. Ten WAVs total **19,131,112 bytes**;
only the requested track is fetched/decoded, not the whole score at boot.

Original synthesized effects cover grounded animation-synchronized footsteps,
jump, landing, damage, shutdown, reboot, checkpoint, low HP, UI and channel
actions, all hazard state cues, impacts and spaced localized fan/relay/signal
ambience. Ambient variants are sparse, not all played at once. Sources/licenses
and the listening limitation are in **AUDIO_CREDITS.md**. All new audio is CC0;
no third-party music was downloaded or claimed.

### Menu / settings / Continue

DEAD PIXELS / THE LAST SIGNAL now appears over the original shared electronics
room. The visible competition branding is removed. NEW GAME, CONTINUE, SETTINGS
and CREDITS use pixel typography, selection feedback and quiet interface sounds.
Continue is visibly disabled without progress; New Game asks before overwriting.

Settings support pointer and keyboard: master/music/SFX/ambience, mute and CRT
overlays. Actual gain nodes are changed and verified, not just UI labels.
`SaveManager` validates a versioned payload containing current/highest level,
intro-viewed flag and preferences. Continue loads a safe level start/channel, not
temporary hazards, projectiles or unsafe coordinates. Read-denied and write/quota
failures safely fall back to memory. No storage error crashes the game.

QA discovered and fixed two real menu issues: a stationary pointer stealing focus
after a panel rebuild, and Phaser replaying DOM key events within a sub-frame
batch. Menu navigation now deduplicates each DOM press and processes code order.

### Cinematic / narrative / ending

`IntroScene` is a 40-second Phaser timeline, with no MP4 dependency:

1. 0–8 s: dark room, inactive receiver, red indicator and electrical ambience.
2. 8–18 s: powering on, static, terminal startup/messages and a push into the TV.
3. 18–30 s: inactive UNIT 07 reinitializes, stands, and the world awakens;
   THREE SIGNALS. / ONE WAY OUT.
4. 30–40 s: CH-01 REALITY / LEVEL 01 - FIRST SIGNAL, then normal player control.

Space, Enter and ESC skip safely. The viewed flag is saved. Death/R do not replay
the intro; Continue resumes directly. Menu, intro and ending use the same actual
pixel-art room asset and receiver geometry.

Subtle first-checkpoint fragments add UNKNOWN TRANSMISSION, MEMORY FRAGMENT FOUND
and DO NOT DISCONNECT without blocking play. After the existing final exit, ending
music accompanies TRANSMISSION COMPLETE, the preserved two-line mystery, a fade
to black and a return to that room. The receiver is dark and UNIT 07 stands outside
it. DEAD PIXELS / END OF TRANSMISSION / RETURN TO MENU complete the short, skippable
sequence. Replay and save lifecycle were actually tested.

### Game feel / performance

A shared pool of sixteen pixels provides landing dust, damage/heal/checkpoint/
channel/exit accents and impacts. No screen shake, physics scaling or new player
movement mechanic. Existing interference remains the single channel-noise layer.
Sentry pools, ambient objects, audio voices and texture caches are bounded.

## Final production verification

A fresh production preview was actually launched on **http://localhost:4183**.
All three target sizes were tested: **1920×1080, 1366×768, 1280×720**.

| Final suite | Passed | Failed |
|---|---:|---:|
| Health model (actual TypeScript implementation) | 18 | 0 |
| Hazard geometry/timing model | 18 | 0 |
| Menu/settings/Continue/storage | 42 | 0 |
| Full intro timelines and skip keys | 24 | 0 |
| Updated existing gameplay regressions | 147 | 0 |
| Full zero-hit seven-level campaigns | 943 | 0 |
| Full damage/death/survival campaigns | 991 | 0 |

**2,147 counted browser assertions + 36 model assertions, 0 failures.** The actual
audio integration suite also passed (its checks are not included in those numeric
counters). Ten WAV format/unique hash/RMS/peak/edge checks passed independently.
Counts include repeated cases at three viewports, not that many unique scenarios.

**FULL GAME PLAYTHROUGH VERIFIED** through both campaign modes, ending, return to
menu and a new campaign. Tests use real keyboard/pointer input. They never teleport,
write player coordinates, disable collision/hazards, invoke completion or skip
level state. Disabling a security system through normal channel controls is the
intended mechanic, not a test bypass.

Real hazard testing verifies every damage amount, one-second accepted-hit spacing,
subtle invulnerability feedback, low/zero HP, one death, reboot, checkpoint healing
and anti-farming. Actual sentry wall occlusion and projectile clearing are checked;
swept wall/projectile contact uses the independently tested geometry routine.
All seven starts/checkpoints/exits remain solvable, and physics bodies are cleaned
between scenes. Audio tests verify gesture unlock, distinct selected music,
bounded crossfade voices, grounded-only footsteps, cues, actual gain routing,
mute, preferences and decoded assets. No page/console errors or missing resources
occurred in the final browser suites. Runtime resources remain local.

`npm run typecheck` and `npm run build`: **PASS**.
Final JS **1,286.06 kB / 354.98 kB gzip**; CSS **5.15 kB / 1.85 kB gzip**.
Recorded per-level rates in simultaneous production runs: **58.36–60.84 FPS**.

## Visual evidence

**324 final PNG captures** across the production regression, both campaign modes,
menus and full intro. Six expanded-release and six all-level review boards were
actually inspected, plus full-size menu/intro/ending/hazard spot checks during
implementation. No final cropping, label overlap or blurred canvas scaling was
found in those reviewed series. Startup/switch/death fades are deliberately brief.

- Expanded boards: `qa-artifacts/release-review/` (two per resolution).
- Full campaign evidence: `qa-artifacts/campaign/4183/`.
- Damage evidence: same folder, `*-damage-*` filenames, including each warning,
  actual hit, low HP, shutdown and reboot.
- Menu/settings/credits/confirmation: `qa-artifacts/menu/`.
- Cinematic stages: `qa-artifacts/intro/`.
- Machine results: `qa-artifacts/release-summary.json`, `qa-artifacts/4183/results.json`,
  campaign `results.json` / `damage-results.json`, menu/intro `results.json`.

## Files / milestones

Created: `HealthSystem`, `HealthHud`, `GameFeedback`, `HazardSystem`, five concrete
hazards plus shared hazard types/geometry/base, `AudioManager`, `AudioManifest`,
`SaveManager`, `RoomBackdrop`, `IntroScene`, original room PNG, ten WAVs/metadata,
room/music authoring scripts, audio validation script, release review/summary
scripts, QA model/menu/intro/audio/support scripts, AUDIO_CREDITS.md and this report.

Modified: Player (visual/cue hooks only), GameScene, MenuScene, EndingScene,
LevelManager, LevelGuidance, level types/validation and campaign hazard data,
asset manifest, scene config/constants, main lifecycle, CSS CRT preferences,
existing gameplay QA, package scripts and documentation. Original platform/robot/
background PNGs and all seven terrain arrangements are retained.

Verified milestone commits: baseline `2e4b27d`; A `9a1d947`; B `13dca3c`;
C `ee7c309`; D `614150d`; E `4617243`; F `fb50ab7`; G `ff29469`;
H `6d84aa2`; I `ba9590c`. The final J verification is committed separately.

## Limitations / work not claimed complete

- This harness has no audio-listening attachment tool. **Subjective audition and
  professional music mastering review remain unperformed.** File existence and
  passing playback tests do not establish musical taste or professional quality.
- **Human fun/difficulty/playtime evaluation remains open.** Tested zero-hit paths
  do not prove perfect balance. The compact campaign is not advertised here as a
  measured 12–20 minute first-play experience.
- Chromium desktop was automated; Safari/Firefox and mobile touch gameplay are
  not verified. No mobile touch controls or optional shake setting were added.
- If persistent storage is blocked, Continue/settings work in memory for the
  session, but persistence across a browser reload cannot be guaranteed.

All requested core implementation subsystems are present and their listed technical
checks passed. The remaining work above is qualitative/cross-browser validation,
not silently skipped or claimed as completed.

## Run / reproduce

```sh
npm install
npm run dev
# http://localhost:5173
```

Production:

```sh
npm run typecheck
npm run build
npm run preview -- --port 4183 --strictPort
```

With that preview running, in another terminal:

```sh
QA_URL=http://localhost:4183 QA_SIZES=1920x1080,1366x768,1280x720 npm run qa:release
QA_URL=http://localhost:4183 QA_SIZES=1920x1080,1366x768,1280x720 npm run qa:survival
```

If needed: `npx playwright install chromium`. Python is not needed to run/build;
Pillow is only an optional art/review authoring dependency. Music generation uses
the Python standard library. Regenerate boards with the two review scripts and
port 4183; summarize actual final machine evidence with
`python3 scripts/summarize-release.py 4183`.
