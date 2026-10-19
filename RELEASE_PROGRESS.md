# THE LAST SIGNAL — development checkpoints

Milestones A–J below describe the earlier expanded release. The current
human-playtest quality pass is recorded in K and QUALITY_PASS_REPORT.md.

## Baseline
- Git checkpoint `2e4b27d` preserves the working seven-level campaign.
- `npm run typecheck` / `npm run build`: pass.
- Existing Chromium QA: 47 regression + 277 campaign assertions, 0 failures.
- All seven exits and the ending were reached through actual input.
- No pre-existing audio engine/assets. Player physics unchanged: 85 / -205 / 500,
  6×12 body, (1,0) offset; all 32 checkpoints inspected.

Milestones are recorded here only after their required checks actually pass.

## A — health architecture (verified)
- 4 HP; one-second scene-clock invulnerability, 1/2 damage categories, one lethal
  event, 500ms shutdown/reboot, full HP on death, health preserved on a pit fall.
- Each checkpoint consumes its one heal even if visited at full HP; history
  survives respawning. New level/manual restart creates a new activation cycle.
- Four-segment HUD and subtle sprite flash; damage never applies knockback.
- Typecheck/build pass; deterministic actual-model tests 18/18; existing browser
  regression 47/47. Full-HP HUD screenshot inspected.
- No damaging hazards existed in this milestone; real browser hit/death testing
  belongs to B/C, not claimed as verified here.

## B — hazard components (verified architecture)
- Channel-data-driven laser, electricity, falling machinery, turret and corruption
  components. Visible state machines, swept bolt/wall tests, three-bolt pools.
- Hazards do not add physics bodies or modify player motion. Disabled channel
  resets warning cycles and clears turret shots; no invisible damage remains.
- Typecheck/build pass; actual geometry/timing model 18/18; browser regression
  47/47. Level placement and real damage/survival tests follow in C.

## C — campaign hazards and balancing (verified)
- Level 1: no damage. Level 2: two channel lasers. Level 3: two live-wire panels.
  Level 4: falling monitor. Level 5: two industrial sentries. Level 6: four
  separated established hazards. Level 7: five separated final security hazards.
- Checkpoint/spawn geometry validation includes hazard bounds; original terrain
  and movement are unchanged. Every encounter has a channel-based safe route.
- Typecheck/build, health 18/18 and hazard models 18/18 pass. Browser regression
  47/47; complete seven-level **zero-hit** route 298/298; intentional-damage route
  313/313. Both reach the ending and replay through real input.
- Real laser/electric/turret/corruption hits cost 1, machinery costs 2. Actual
  death, one death event, low HP, reboot, healing and anti-farming were exercised.
  Sentry wall occlusion and projectile clearing were checked. Damage/HUD/hazard
  screenshots were actually inspected. This does not establish subjective fun.

## D — audio engine / effects (verified)
- One Web Audio graph with independent master/music/SFX/ambience buses, limiter,
  trusted-input unlock, suspended-tab handling, bounded SFX voices and music
  crossfade infrastructure. No audio network dependency or autoplay exception.
- Original synthesized mechanical steps, jump/land, damage/shutdown/reboot,
  checkpoint, UI/channel and hazard cues. Steps follow grounded run frames.
- Typecheck/build pass; real-input audio unlock/step/jump/land/channel/cleanup
  checks pass; browser regression 47/47. Music files and listening-quality
  review are not claimed in this milestone; soundtrack follows in E.

## E — soundtrack (verified playback, listening limitation recorded)
- Ten actual local WAV files: menu, intro, seven independently arranged level
  compositions and ending, 33–60 seconds each, 16 bars with a recurring motif.
  Original authoring source, score/PCM hashes and CC0 credits are included.
- PCM format/non-silence/peak/loop-edge/uniqueness checks pass for all ten files.
  Typecheck/build and audio browser QA pass. Full zero-hit campaign 306/306,
  including each level's correct decoded track and bounded crossfade voices.
- No listening attachment capability exists in this harness. Subjective music
  quality/mastering is explicitly unverified; see AUDIO_CREDITS.md.

## F — menu, settings and safe Continue (verified)
- Shared original pixel-art electronics room, NEW GAME / CONTINUE / SETTINGS /
  CREDITS, disabled no-save feedback, keyboard/pointer focus and overwrite dialog.
  Visible competition branding removed; subtitle is THE LAST SIGNAL.
- Versioned bounded progress/settings storage, reload persistence and safe
  in-memory fallback when storage access is denied. Continue starts a valid level
  spawn, never hazards/projectiles. Master/music/SFX/ambience/mute/CRT settings.
- Typecheck/build pass; menu/storage/actual-gain QA 14/14, audio QA passes,
  updated gameplay regression 49/49 including Continue from level 2.
- Actual menu/settings/credits screenshots inspected. Fixed repeated sub-frame
  Phaser DOM events and stationary-pointer focus stealing found during QA.
- NEW GAME still enters gameplay directly at this checkpoint; cinematic is G.

## G — THE LAST SIGNAL introduction (verified)
- Forty-second Phaser timeline: dark shared room/LED, receiver startup and terminal
  messages, push toward the display, UNIT 07 awakening, three-signal reveal and
  entry into FIRST SIGNAL. No video dependency or physics changes.
- Space/Enter/ESC skip safely; Continue bypasses intro; viewed state is saved.
- Typecheck/build pass; full timeline + three skip keys 9/9; menu QA 14/14;
  gameplay regression 49/49. Four actual cinematic screenshots inspected.

## H — narrative / return to the room (verified)
- Sparse first-checkpoint story fragments, preserved final transmission lines,
  fade to the same room with a dark receiver and UNIT 07 outside its display.
  Ending music, skip/replay and RETURN TO MENU are retained.
- Typecheck/build pass; full zero-hit new-menu/intro/campaign/ending/replay route
  307/307. Actual outside-the-receiver ending screenshot inspected.

## I — restrained game feel (verified)
- Shared 16-pixel pool now supports landing dust, checkpoint/health/channel/exit
  accents and impacts. No physics resizing, knockback or screen shake added.
- Shutdown compresses once rather than looping; fallen machinery fades into
  non-solid debris. Spaced localized fan/relay/signal sounds use the ambience bus.
  Audio graph closes on unload.
- Typecheck/build pass; health model 18/18, geometry/timing 18/18, real audio
  integration passes and browser regression 49/49. Final campaign/production and
  multi-size evidence are the remaining J checks.

## J — production release verification (complete)
- Final build/typecheck and all ten WAV integrity checks pass. A fresh production
  preview was started on port 4183. Both full campaign modes completed at
  1920x1080, 1366x768 and 1280x720 using real input only.
- Final counted production checks: health 18; hazard models 18; menu/save/settings
  42; full intro/skip 24; regression 147; zero-hit campaign 943; damage campaign
  991. All pass, 0 failures. Audio integration also passes (not included in those
  numbered counters). Recorded per-level rates: 58.36–60.84 FPS.
- 324 final PNG captures; six release and six campaign boards actually inspected,
  plus earlier full-size menu/intro/ending/hazard spot checks. No final clipping or
  text-layout defect was found in the reviewed series.
- Implementation/technical QA is complete. Subjective listening/mastering,
  first-time human balance/playtime and non-Chromium testing remain unverified;
  no claim of professional audio quality or perfect fun/balance is made.

## K — human-playtest quality pass (implementation and technical checks verified)
- Baseline tag `quality-pass-baseline-20261018` preserves `c6023a5`. Real player
  feedback drove changes to silence recovery, cinematic motion and encounter design.
- One output AudioContext, Safari gesture/resume recovery, revised gain staging,
  retryable decoding and a visible sound/M toggle. Actual Chromium/WebKit PCM
  recordings prove nonzero music/effects and zero mute; hardware listening remains
  unverified. The exact original user-profile silence was not reproduced.
- Three-button menu; animated 34-second intro and 52-second identity/reconstruction/
  escape/receiver ending. Skip/replay and the essential reveal without secrets work.
- Persistent phased laser clocks, predictable three-shot sentries with real cover,
  fragile warning/collapse/rebuild on levels 4/6/7, and three saved optional archive
  rooms. Total112 platform definitions,32 checkpoints,7 exits; physics/HP unchanged.
- Final production4193 checks: models36; menu42; Chromiumintro24/WebKitintro10;
  regression147; normal3sizecampaign1069; damage371; Chromiumsecrets/fragile385;
  WebKitsecrets/fragile385. **2,433 browser assertions +36 model assertions,0failed**;
  audio integration/PCM checks also pass outside the numeric total.
- All eight regenerated visual boards inspected. Fixed the upper-room popup overlap,
  relative cinematic timing and the covered/30FPS-boundary final heart checkpoint.
- Chromium ~60FPS; WebKit ~30FPS on this LowPowerMode host, also reproduced with an
  empty page. No claim of 60FPS WebKit or human validation of fun/playtime/listening.
- Checked build: `dist/assets/index-Bqesysth.js`. Quality-pass verification completed
  locally before the final upload; publication uses the existing Pages workflow on main.
