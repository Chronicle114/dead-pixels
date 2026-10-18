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
| 02 LOST FREQUENCY | 1056 | 3 | Choose elevated REALITY or lower MEMORY, then plan VOID passage and restore the correct bridge channel | Analog antenna |
| 03 BROKEN CIRCUITS | 1216 | 3 | Two generous launch/landing pairs, first 1→2 and then 2→1; observation before movement | Capacitor/core bank |
| 04 MEMORY LEAK | 1472 | 5 | Connected 2→3→1 and 3→2 sequences, then an airborne transfer and final restore | Tape rails |
| 05 STATIC INTERFERENCE | 1536 | 5 | Begin in MEMORY, identify a REALITY bridge, then 2→3 airborne transfer; visual noise never changes solids | Broken monitors |
| 06 SYSTEM FAILURE | 1968 | 7 | Three airborne transfers, shared refuges and alternating bridges/relays; culminates at an elevated exit | Relay bus |
| 07 FINAL TRANSMISSION | 2240 | 7 | Combine all three signals through two airborne sections and the last gate; increasingly unstable image, stable rules | Central transmission disc |

Total: 98 platform definitions, 32 checkpoints, 7 real exits. The first level
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

Exit overlap locks movement and channel controls. SIGNAL RESTORED and the current
level's completion label remain for 1.1s, with a short analog fade; the reused
GameScene loads the next definition and stabilizes for 0.65s. Total retune to
control return is about **1.75 seconds**. Each arrival displays LEVEL NN, title
and a short subtitle.

After exit seven, EndingScene displays TRANSMISSION COMPLETE, then THE SIGNAL WAS
NEVER LOST. / IT WAS WAITING FOR YOU., fades to black, and shows DEAD PIXELS /
END OF TRANSMISSION / RETURN TO MENU. The automatic sequence lasts about four
seconds; Enter/Space can skip to the final card, and ESC returns to menu.

## Pacing caveat

The requested **12–20 minute first-play target has not been validated with human
playtesters**. The deterministic browser route knows every solution and reaches
the last exit in about **155–156 seconds**, including intentional recovery tests,
an alternate route and a restart. This is a compact campaign, not evidence of a
12–20 minute experience. Do not describe the target duration as a measured result.
Further first-time-player timing and difficulty tuning would be required to
establish that duration; empty corridors or artificial waits were not added.
