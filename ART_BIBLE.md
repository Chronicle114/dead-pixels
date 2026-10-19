# DEAD PIXELS — Signal Archive art bible

## World
An abandoned broadcast archive: ferrite cores, tape libraries, relay cabinets,
phosphor terminals and suspended cable looms. The explorer is a maintenance robot
with a small amber scarf, ceramic helmet and cyan face. No borrowed characters.

## Pixel rules
- Logical screen 320×180; campaign worlds have authored widths (640–2240) and
  retain a height of 180. The original test chamber remains 640×180.
- Structural module 16×16. All artwork uses whole-pixel marks and nearest-neighbor
  sampling. No painted/vector art inside the game and no scaling of physics bodies.
- Explorer sheet: uniform 16×24 cells, bottom-center pivot. A separate 8×12 carrier
  retains the original 6×12 body, offset (1,0), speed 85, jump -205, gravity 500.
- Light comes from upper left. One-pixel dark outlines; two-tone bevels, selective
  rim lighting, sparse dither, no random noise blanket.
- Walkable tops are uninterrupted light rails exactly on collision bounds. Sides
  are capped; center panels vary by module. Decorations never add implied ledges.

## Channel vocabulary
REALITY: navy #101b29, oxidized teal #31535d, steel #8ca8ad, amber #deb477.
Intact copper busbars, green phosphor, ordered tape cabinets.
MEMORY: ink violet #181526, slate lavender #4c4465, silver #b4b6d1.
Archived silhouettes, missing scan rows, wireframe diagrams and dormant tape reels.
VOID: charcoal #150f18, rust #53303a, burnt orange #c47758.
Severed wires, cracked monitors, disconnected relay cores and small embers.
These are authored structural variants, not fullscreen color filters.

## Contrast and animation
Background edges stay below gameplay contrast. Platform tops and robot display
are the brightest continuous features. EXIT has a cyan doorway and small arrow.
Idle 4 frames; run 6; jump 2; fall 2; land 3. Every frame differs; squash is drawn
inside the sheet. No scale animation on the collision carrier.

## Budget and presentation
Three preloaded channel groups, three raster layers each. Only one visible group.
At most 12 dust motes + 6 timed signal lights; no runtime terrain generation,
per-frame textures, expensive shaders, bloom filters or network requests.
Campaign landmarks reuse antenna discs, tape rails, relay cores and the original
PNG compositions. Repeatable debris excludes the old exit shrine, which is placed
only at each level's real exit. Inactive geometry uses faint dashed rails, never
bright solid surfaces. Checkpoints are small cyan flags with no collision body.
Menu is a warm-grey molded receiver. During gameplay the cabinet recedes and the
16:9 display fills the viewport using the largest fitting integer scale (fractional
nearest-neighbor fallback on narrow phones). Scanlines <8%, mild vignette only.
The existing ChannelTransition owns temporary interference.

## THE LAST SIGNAL presentation

UNIT 07 now has a four-segment energy readout between the level label and channel
indicator. Mint denotes available energy; muted amber denotes critical health.
Hazards use warm high-contrast active cores in every channel, with dark outlines,
distinct warning states and sparse sparks. No full-screen hit shake or physics
sprite scaling. Machinery is readable as a heavy CRT component; turret hardware
resembles industrial relay equipment rather than modern military weapons.

The menu/intro/ending share `ui/forgotten-room.png`, an original 320×180 laboratory
room. Cinematic zoom is limited to the non-physical room container; gameplay keeps
its pixel/physics contract. The menu title is DEAD PIXELS / THE LAST SIGNAL; no
competition label is shown in the game menu.

### Human-playtest quality pass

The main menu exposes three buttons: NEW GAME / CONTINUE / SETTINGS. The 34-second
intro animates a room dolly, CRT scan expansion, cropped terminal reveals, a close
UNIT 07 awakening, ferrite-ring convergence and a walking entry into the level.
The 52-second ending builds a transmitter approach, room activation/failure,
three-tinted cropped reconstruction, white-to-point screen collapse and an
outside-the-receiver interaction. Cinematic container zooms do not resize bodies.

`SignalTransmitter` uses integer-marked Graphics and a bounded 24-pixel particle
set; it creates no physics or per-frame textures. Fragile bridges retain their
exact top rail and show warm jittering pixel cracks before the surface disappears.
Recessed archive niches stay behind the actual channel rails and below gameplay
contrast. Their MEMORY FRAGMENT feedback is placed clear of the robot; MEM n/3 is
a small bottom-left readout. The original artwork remains the source vocabulary.

## Asset provenance
See ASSET_CREDITS.md. Keep original generation scripts outside public/. Baseline
artwork is retained and reused for campaign surfaces and environments. Source
downloads and working previews stay outside the build.
