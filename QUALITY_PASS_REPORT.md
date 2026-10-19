# DEAD PIXELS — human-playtest quality pass

## Baseline and approach

Checkpoint tag **`quality-pass-baseline-20261018`** points to `c6023a5`, before
implementation. The existing build/typecheck, audio integration and 49-check
gameplay regression passed at baseline. Those passes were not taken as evidence
that the user's silence/difficulty/cinematic findings were invalid.

The original art, engine, ten WAV tracks, seven-level progression and player
physics are retained. The work changes encounters and presentation rather than
raising damage or altering speed/jump/gravity.

## 1. Audio investigation and root-cause boundary

**Complete silence from the user's existing Safari profile was not reproduced.**
Before changes, clean Chromium and WebKit profiles both produced nonzero output
when instrumented. It would be false to name an unobserved device/profile failure
as a proven root cause.

The inspection did confirm problems in the pipeline:

- Phaser created an unused second AudioContext alongside AudioManager.
- SFX had several low gain multipliers (`.22` voice gain plus category/master).
- Unlock/resume did not reliably reconcile a newly requested scene track when
  an interrupted/suspended context still held an older active track reference.
- A failed pending decode could remain cached as a rejected promise.
- No gameplay-visible indication distinguished muted, locked and running audio.
- Prior tests checked state/counters/gains, not samples reaching the output.

### Changes

- Phaser audio is disabled; the existing custom manager owns the single graph.
- Trusted pointer/key/touch gestures synchronously start a silent buffer and
  request resume before asynchronous asset work, including Safari's wake path.
- Context state is tracked, pending failures can retry, and resume reconciles the
  intended track. A prefixed Web Audio constructor is supported where needed.
- Audible default mix and per-effect gain increased with a limiter retained.
  User-saved mute/volume choices are not silently deleted.
- A persistent sound badge and M toggle expose mute/activation state. The first
  NEW GAME click is sufficient in the tested Chromium and WebKit cases.
- A post-limiter analyser reports real RMS/peak/dBFS, not a synthetic play flag.

### Actual PCM verification

`qa-audio-output.cjs` attaches a silent recording side branch at the destination.
It records actual post-master PCM while leaving the normal output connection in
place. It uses real menu controls and real movement/jump input; it does not edit
gameplay state or substitute source audio files.

| Browser | First NEW GAME RMS | Gameplay music RMS | Effects-only RMS | Muted RMS | Contexts |
|---|---:|---:|---:|---:|---:|
| Chromium | 0.07625 | 0.08459 | 0.00764 | 0 | 1 |
| WebKit | 0.07524 | 0.09275 | 0.00762 | 0 | 1 |

Both recordings are non-silent, effects are present, mute produces zero output
and no runtime errors were reported. Actual selected music/crossfade lifecycle,
grounded-only footsteps, gain settings and local decoding are also tested.

**This does not prove physical speaker output or subjective quality.** The
recordings are saved as WAVs under `qa-artifacts/audio-output/`; physical Safari
listening instructions are in AUDIO_LISTENING.md. No claim of having heard the
user's output device is made.

## 2. Three-button menu

The visible menu now contains only NEW GAME, CONTINUE and SETTINGS, with revised
spacing in the abandoned room. The Credits screen/button was removed, while
ASSET_CREDITS.md and AUDIO_CREDITS.md remain intact and linked from documentation.
All external art is CC0, so no required in-game attribution was removed.

## 3. Animated introduction — 34 seconds

The intro now combines room dolly/parallax dust, an expanding CRT power-on scan,
three updated terminal lines, a sustained push into the receiver, a closer UNIT 07
awakening shot, face illumination, a live animated ferrite transmitter, the robot
walking to the actual level-1 position and a settling world camera.

Text is revealed through crop animation rather than whole static text slides:
BOOTING SYSTEM..., UNKNOWN ENTITY DETECTED, MEMORY FRAGMENTED, THREE SIGNALS. /
ONE WAY OUT. The soundtrack and startup/reboot/static cues are synchronized.

Space/Enter/ESC skip exactly once; scene-owned timers/tweens clean up on exit.
Save/Continue and respawn behavior are retained. Full intro and skip tests ran in
Chromium and WebKit. Relative cinematic elapsed time was corrected after visual
review found it was incorrectly using the global game clock.

## 4. Ending — 52 seconds

The existing final exit still starts the ending. The new cinematic contains:

1. UNIT 07 walks to a pixel-built transmitter, touches its control point and
   brings three coloured signal streams together. Machinery stabilizes.
2. TRANSMISSION SOURCE FOUND / IDENTITY: UNIT 07 / STATUS: ORIGINAL SIGNAL.
3. A laboratory reconstruction: activation, animated shutdown/failure, then the
   room image physically separates into three differently tinted frequencies.
4. REALITY - THE BODY / MEMORY - THE PAST / VOID - THE ERASED, followed by the
   preservation explanation and YOU WERE THE SIGNAL.
5. The display blooms white and collapses into a point. The dark room returns,
   UNIT 07 materializes outside the receiver and approaches it.
6. SIGNAL LOST becomes SIGNAL FOUND. at the touch; the camera pulls away and the
   final title shows DEAD PIXELS / THE LAST SIGNAL / END OF TRANSMISSION.

The montage/actor/particle/receiver animation uses existing local art plus original
pixel graphics; no external video. The ending theme is preserved. Skipping cancels
remaining scene events without triggering duplicate transitions. Three optional
fragments add one extra reconstruction line, but the essential reveal always runs.

## 5. Mechanical and difficulty changes

### Lasers

Laser clocks now continue while their channel is disabled; flipping a channel no
longer repeatedly resets a whole safe cycle. Re-enabling an active beam still has
a 350ms visible arming warning, avoiding an invisible instant hit. Different lane
phases are authored in level data.

REALITY/MEMORY lane pairs are tied to different support arrangements. VOID may
remove beams but also remove support. Some beams can be jumped, some must be
timed, and the source gate can be cleared by launching in one channel and creating
the next platform after crossing the beam. Telegraphs and 1 HP damage remain.

### Turrets / cover

Sentries now fire predictable **three-shot bursts**, 240ms apart, after detect and
aim phases, then cool down. Selected bolts are 80px/s, still below the player's
85px/s. Aim targets the body's upper area so shots do not uselessly dive into the
floor. Dashed aim lines are visible. Pools stay capped at three per sentry.

The first level-5 encounter targets REALITY and MEMORY; VOID is useful but cannot
materialize the required core. Physical cover, a laser/core interlock and an
airborne retune create positional decisions. The final hub sentry targets all
three realities, requiring actual geometry/jumping rather than one universal
off-channel. Real bursts hit solid cover in the tests.

### Fragile electronic platforms

REALITY/MEMORY fragile variants are authored on levels 4, 6 and 7. Standing starts
a warning crack/creak; cracks brighten/jitter before collapse after 1.05–1.2s.
Collapse disables the actual body and visible surface. Rebuild occurs after 3.5s
when a body will not be embedded; R always reconstructs fresh state.

Stable alternate-channel archival islands remain, so the solution may involve a
committed jump or a deliberate retune and another route. Health/damage/invulnerability
are unchanged; tanking a beam cannot replace a required platform transfer.

### Level-by-level

| Level | Revised identity |
|---|---|
| 1 FIRST SIGNAL | Beginner-safe terrain and core signal teaching retained |
| 2 LOST FREQUENCY | Coupled high/low laser lanes, VOID support tradeoff, optional upper memory niche |
| 3 BROKEN CIRCUITS | Electricity on an actual MEMORY landing route forces another planned jump |
| 4 MEMORY LEAK | Fragile REALITY bridge vs stable MEMORY islands, creaking machinery, optional archive room |
| 5 STATIC INTERFERENCE | Cover, three-bolt sentry, laser/source interlock, airborne retune and a second counter-signal |
| 6 SYSTEM FAILURE | Fragile bridge with alternate stable lanes and differently shaped lasers; optional high niche |
| 7 FINAL TRANSMISSION | Cover-based all-channel sentry, coupled island lanes, restore-behind/retune-in-air source gate, fragile final transfer |

The new heart checkpoint was moved 16px beyond its cover column and restores
REALITY. This fixes a hidden flag and a 30FPS landing/activation boundary found in
the final WebKit replay. Safe checkpoint count remains 32; global physics remains
85/-205/500, max health 4 and body 6×12.

## 6. Three optional rooms

- **Activation**, level 2: upper VOID archive, reached from the REALITY route.
  “I WAS AWAKE BEFORE THE SIGNAL.”
- **Division**, level 4: a VOID-side room above the archive/core section.
  “THEY PRESERVED ME IN THREE PARTS.”
- **Erasure**, level 6: a high MEMORY alcove reached from a VOID landing core.
  “EVEN WHAT WAS ERASED WAS MINE.”

They use low-contrast recessed architecture and visible channel-specific rails,
not invisible doors. Pickups are persisted with backward-compatible save reading;
they survive death/R and reset on a new campaign. The optional route returns to
the main checkpoints. The high-room popup was repositioned after review found an
overlap with UNIT 07's feet. Missing secrets never removes the main story reveal.

## 7. Actual QA results

Fresh production preview: **http://localhost:4193**. Desktop evidence at
1920×1080, 1366×768 and 1280×720.

| Suite | Passed | Failed |
|---|---:|---:|
| Chromium, seven-level zero-hit campaigns at three sizes | 1069 | 0 |
| Chromium, deliberate damage/death/healing/survival | 371 | 0 |
| Chromium, all secrets + fragile collapse/rebuild/R + full ending | 385 | 0 |
| WebKit, all seven levels, zero hits, secrets/fragile/full ending | 385 | 0 |
| Menu/settings/save at three sizes | 42 | 0 |
| Full Chromium intro timelines/skip at three sizes | 24 | 0 |
| Full WebKit intro/skip | 10 | 0 |
| Existing regression coverage, three sizes | 147 | 0 |
| Health + hazard geometry/timing models | 36 | 0 |

**2,433 counted browser assertions and 36 model assertions, 0 failures in the
listed successful runs.** PCM capture checks additionally passed in both engines;
they are not included in those numeric counters. Counts repeat scenarios across
viewports and are not a claim of that many distinct tests.

**FULL GAME PLAYTHROUGH VERIFIED** with and without secrets, without hits and with
intentional damage, through the complete reveal/escape/touch/final-card sequence,
return to menu and new campaign. All routes use real keyboard/pointer input. No
coordinates are written, exits invoked, collisions bypassed or test-only shortcuts
added. The initial old paths really hit the redesigned lasers; the routes were
changed to perform real jumps instead of weakening zero-hit assertions.

Failure reporting was improved so a failed campaign writes `failed: 1` rather than
leaving a stale previous successful JSON. Intermediate failures and fixes are not
evidence of perfect balance; the final named result files are the successful runs.

Typecheck/build pass. Final Vite JS: **1,301.72 kB / 359.46 kB gzip**; CSS:
**5.42 kB / 1.93 kB gzip**. Original WAV/assets remain local.
The checked production bundle is `dist/assets/index-Bqesysth.js`. Chromium release,
secrets/fragile, survival and both-engine PCM checks were rerun after the final
checkpoint/timeline corrections; all listed results are successful final runs.

### Performance boundary

Chromium gameplay measurements: approximately **59.6–60.8 FPS**. WebKit on this
host: approximately **30–32 FPS**. A separate empty-page measurement also yielded
about 28–30 requestAnimationFrame callbacks/s in WebKit versus 60 in Chromium.
`pmset -g custom` confirmed Low Power Mode enabled on both battery and AC. The OS
setting was not changed. Therefore WebKit's 60FPS target is **not verified in this
environment**, and the report does not hide the 30FPS result or attribute it to
proven gameplay overload.

## 8. Visual review / evidence

Actual screenshots were reviewed in eight labeled boards and full-size spot
checks. Review found and corrected the high-room popup overlap, the covered
checkpoint flag and the cinematic relative-clock capture bug. Final fragile
warning cracks, rooms, actor failure, colour split, SIGNAL LOST/FOUND and title
frames were actually inspected. No final clipping/text overlap was found in the
reviewed series; this is not a claim that every frame was manually watched.

- `qa-artifacts/quality/review/`: campaign/intro and ending boards for three sizes,
  plus secrets/fragile/montage and WebKit boards.
- `qa-artifacts/quality/campaign/4193-chromium/`: normal/damage/secrets PNGs and
  `results.json`, `damage-results.json`, `secrets-results.json`.
- `qa-artifacts/quality/campaign/4193-webkit/`: complete WebKit evidence/results.
- `qa-artifacts/quality/intro/chromium/`, `.../webkit/`: actual cinematic stages.
- `qa-artifacts/audio-output/`: browser-captured WAVs and RMS evidence.
- `qa-artifacts/quality/summary.json`: machine summary of the listed final runs.

## 9. Files and remaining limitations

New: `SecretSystem.ts`, `SignalTransmitter.ts`, `qa-audio-output.cjs`, quality
review/summary scripts, AUDIO_LISTENING.md and this report. Modified: AudioManager,
scene sound config/main/CSS, IntroScene/EndingScene/MenuScene, hazard timing and
turret classes, LevelBuilder/level schemas/campaign/checkpoints, save/level state,
guidance and existing QA. No existing art or score file was removed.

Remaining unverified:

- The exact original silence in the user's Safari profile/device. Digital output
  is now captured and nonzero, but **physical speaker listening is not verified**.
- Human judgment of the new difficulty, cinematic impact, fun and audio taste.
  These are real playtest concerns; passing scripts is not their final answer.
- WebKit at 60FPS outside the host's Low Power Mode, actual Safari application
  output hardware, other browser engines and touch gameplay.

### Publication handoff

This report records local quality-pass validation before the final GitHub upload.
The checked preview was http://localhost:4193/. Publication uses the existing
GitHub Pages workflow on `main`; the release handoff separately records the pushed
commit, deployment run and live verification results.

## Reproduce

```sh
npm run typecheck
npm run build
npm run preview -- --port 4193 --strictPort
```

In a second terminal:

```sh
QA_URL=http://localhost:4193 QA_SIZES=1920x1080,1366x768,1280x720 npm run qa:release
QA_URL=http://localhost:4193 npm run qa:survival
QA_URL=http://localhost:4193 npm run qa:quality
QA_URL=http://localhost:4193 QA_BROWSER=webkit npm run qa:quality
QA_URL=http://localhost:4193 QA_BROWSER=webkit npm run qa:intro
QA_URL=http://localhost:4193 npm run qa:audio-output
```

If needed: `npx playwright install chromium webkit`. Review/summarize with
`python3 scripts/review-quality.py` and `python3 scripts/summarize-quality.py`.
No Python or asset download is needed to play the already-built game.
