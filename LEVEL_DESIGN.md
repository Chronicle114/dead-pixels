# DEAD PIXELS — authored campaign

## Physical contract

Player source: `src/entities/Player.ts`; gravity: `src/config/Constants.ts`.
Unchanged speed 85 px/s, takeoff -205 px/s, gravity 500 px/s², max fall 320.
Body: 6×12, offset (1,0), on an 8×12 carrier. Visual art is separate.

- Continuous-model apex: 205² / (2×500) = **42.025 px**.
- Same-height airtime: 2×205 / 500 = **0.82 s**.
- Same-height horizontal range: 85×0.82 = **69.7 px**.
- For a 32px rise, descending arrival is approximately 0.610s after takeoff,
  giving **51.9px** horizontal reach. Required transfers use much shorter gaps.
- Main airborne-transfer sources are **64px wide**, targets **64–80px wide**,
  gaps **16px**, rise **32px**. No frame-perfect inputs or tiny stepping stones.
- Lower recovery shelves are shared. A missed transfer restores a known safe
  checkpoint; it does not strand the player in a geometry overlap.

Data is in `src/levels/Campaign.ts`; helpers only express floor/relay/core shapes.
These are fixed, authored arrangements, not procedural world generation.

## Level progression

| Level | Width | Checkpoints | New idea / pacing | Landmark |
|---|---:|---:|---|---|
| 01 FIRST SIGNAL | 640 | 2 | Safe movement/jump experimentation; MEMORY fills an 80px gap, VOID erases the relay, REALITY restores the last floor | Receiver archive |
| 02 LOST FREQUENCY | 1056 | 3 | Coupled high REALITY / low MEMORY laser lanes; VOID removes beams and support; optional upper archive | Analog antenna |
| 03 BROKEN CIRCUITS | 1216 | 3 | Two launch/landing transfers, first 1→2 then 2→1, with a live MEMORY landing panel requiring a second jump | Capacitor/core bank |
| 04 MEMORY LEAK | 1472 | 5 | Fragile REALITY bridge vs stable MEMORY islands, connected relay sequences, optional VOID room and airborne transfer | Tape rails |
| 05 STATIC INTERFERENCE | 1536 | 5 | Cover and three-shot sentry, laser/source interlock with delayed airborne retune, then 2→3 transfer | Broken monitors |
| 06 SYSTEM FAILURE | 1968 | 7 | Fragile MEMORY vs stable REALITY islands, phased lasers, optional high MEMORY room and three airborne transfers | Relay bus |
| 07 FINAL TRANSMISSION | 2240 | 7 | All-channel sentry with physical cover, coupled island lanes, retune-in-air source gate and fragile final transfer | Central transmission disc |

Total: 112 platform definitions, 32 checkpoints, 7 real exits. The first level
extends the existing test chamber's identity and retains its original geometry.
Subsequent levels teach through combinations, not faster physics or smaller bodies.

## Safety and learning

Every spawn/checkpoint is validated against target-channel solids at startup.
Validation rejects embedded bodies, out-of-bounds platforms and unsupported exits.
This is a guardrail, not a substitute for playthrough testing.

On activation, a checkpoint saves its authored safe position **and channel**.
Falling restores that pair with normal physics; it never returns to a disappearing
last-grounded ledge. Checkpoints only advance forward. R resets level-local
checkpoint state while keeping previous cleared levels; ESC returns to menu and
a new menu start begins from level 1.

World flags sit beside the route. HUD prompts are range-based, prebuilt, fade after
8 seconds and stop nagging after two visits. Inactive channel surfaces are shown
as sparse dashed rails; these have no bodies. Top rails of solid art exactly match
the collision surfaces.

## Transitions and ending

NEW GAME opens a 34-second animated introduction: shared room, receiver power-on,
push through the display, UNIT 07 awakening and walking into FIRST SIGNAL.
Space/Enter/ESC skip safely. Continue and respawns bypass the introduction.

Exit overlap locks movement and channel controls. SIGNAL RESTORED and the current
level's completion label remain for 1.1s, with a short analog fade; the reused
GameScene loads the next definition and stabilizes for 0.65s. Total retune to
control return is about **1.75 seconds**. Each arrival displays LEVEL NN, title
and a short subtitle.

After exit seven, a 52-second animated ending identifies UNIT 07 as the original
signal. The transmitter converges; a laboratory activation/failure montage splits
the room across REALITY / MEMORY / VOID. YOU WERE THE SIGNAL precedes a collapsing
display, the robot appearing outside the receiver, and SIGNAL LOST → SIGNAL FOUND.
The pullback ends at DEAD PIXELS / THE LAST SIGNAL / END OF TRANSMISSION and RETURN
TO MENU. Space/Enter/ESC skip to the final card; another activation returns to menu.

## Encounter rules and optional rooms

- Laser clocks progress even in an inactive channel. Reactivation has a visible
  350ms warning; no immediate invisible damage. Channel support and beam shape
  are paired so neither waiting nor one universal off-channel solves every gate.
- Turrets detect, lock a fixed aim vector, fire three bolts 240ms apart, then cool
  down. Selected speeds are 80px/s (below movement speed); real solids block aim
  and bolts. The final hub sentry operates in all three channels with actual cover.
- Fragile supports on levels 4/6/7 crack and creak after standing contact, then
  collapse after 1.05–1.2s. The real body disappears and rebuilds after 3.5s without
  embedding the player. Switching does not reset the crack timer; R rebuilds fresh
  geometry. Alternate-channel islands provide stable routes.
- Three optional recessed rooms hold activation/division/erasure fragments on
  levels 2/4/6. Reaching them requires real elevation/channel transfers. Collection
  persists through falls, death, R and Continue; NEW GAME resets it. All three add
  one ending line; the core identity reveal is available without them.
- The final `heart` checkpoint is at x1296, safely beyond the x1256 cover, in
  REALITY. This prevents the hidden flag/30FPS activation-boundary issue observed
  during WebKit replay. All 32 checkpoint routes are exercised in production QA.

## Pacing caveat

The requested **12–20 minute first-play target has not been validated with human
playtesters**. The deterministic browser route knows every solution and includes
recovery/restart checks, so it does not measure first-time-player duration. The
older 155–156s route predates the redesigned encounters. This is a compact campaign;
neither script completion nor longer cinematics establishes a 12–20 minute playtime.
Human timing and difficulty feedback remain necessary. See QUALITY_PASS_REPORT.md
for the final current production results and verification boundaries.
