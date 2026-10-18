# THE LAST SIGNAL — development checkpoints

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
