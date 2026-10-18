# DEAD PIXELS — original audio credits

No commercial recordings, downloaded loops or external audio libraries are used.
All music and effects were created specifically for this project through an
AI-assisted, programmatic composition/sound-design workflow. Author credit:
**DEAD PIXELS original programmatic score / sound design**. These original audio
contributions are released under **CC0 1.0**; this does not relicense existing code.

## Soundtrack (local PCM WAV, 22.05kHz mono)

Source: `scripts/compose-soundtrack.py` (Python standard library). Each piece has
its own harmony, rhythm and orchestration; all share a four-note signal motif.
They are 16-bar arrangements, not playback-speed variations of one loop.

| File | Composition | Arrangement | Usage |
|---|---|---|---|
| `menu.wav` | The Last Signal | Melodic D-minor synthwave, 88 BPM | Main menu |
| `intro.wav` | A Room That Remembers | Sparse C-minor ambient, 64 BPM | Intro |
| `level-1.wav` | First Signal | Calm E-minor exploration, 84 BPM | Level 1 |
| `level-2.wav` | Lost Frequency | Syncopated A-dorian-leaning electronics, 102 BPM | Level 2 |
| `level-3.wav` | Broken Circuits | C-minor industrial arpeggios, 112 BPM | Level 3 |
| `level-4.wav` | Memory Leak | F-minor bell/pad elegy, 76 BPM | Level 4 |
| `level-5.wav` | Static Interference | D-minor/chromatic glitch rhythm, 116 BPM | Level 5 |
| `level-6.wav` | System Failure | Driving G-minor dark synth, 108 BPM | Level 6 |
| `level-7.wav` | Final Transmission | E-minor cinematic motif build, 96 BPM | Level 7 |
| `ending.wav` | Outside the Glass | C-major electronic resolution, 72 BPM | Ending |

All are under `public/assets/audio/`. `soundtrack.json` records exact durations,
authored-note counts, independent score/PCM hashes and measured RMS. A short edge
envelope, release tails and quiet circular delay avoid hard loop-boundary clicks.
Runtime music transitions use gain crossfades; files are decoded on demand.

## Original real-time sound effects

Source: `src/systems/AudioManager.ts`. No sample files or external dependencies.

- Metallic grounded footsteps: short filtered noise + low resonant body.
- Jump/landing: mechanical pitch impulse and soft contact noise.
- Damage/death/reboot: electrical crackle, falling oscillator shutdown,
  three-note restoration.
- Checkpoint/complete/confirm: related restorative arpeggio.
- UI hover/click/back/channel/invalid: quiet switch contact and signal tuning.
- Laser warning/on/off: distinct charge whistle, ignition and falling release.
- Turret acquire/aim/fire/impact: relay movement and short coil impulse.
- Machinery creak/fall/impact: detuned metal resonances and low filtered noise.
- Electricity charge/arc/off: controlled crackle and rising current.
- Corruption: restrained dissonant tones and broken-noise envelope.
- Low health: spaced soft warning pulse, not a constant alarm.
- Ambient computer/ventilation hum: low-level 50/100/151Hz partials, separate bus.
- Spaced localized fan, relay and broken-signal variations: filtered noise and
  restrained mechanical partials, routed through the ambience volume bus.

## Quality evidence and limitation

File existence, unique arrangements, decode/playback, gain routing and loop edges
are machine-verifiable. They do **not** prove professional musical quality.
This harness has no audio-listening attachment tool; subjective listening/mastering
review has not been performed and is not claimed. Playback is intentionally quiet
and limited, but the soundtrack still merits human audition on speakers/headphones.
