# Safari / physical listening check

The quality pass records real post-master browser PCM in Chromium and WebKit.
That proves a non-silent digital mix, not that a particular Mac speaker/output
device or Safari tab is unmuted. No human listening is claimed by the automation.

## Short manual check

1. Open the **new local production build** at http://localhost:4193/ in Safari.
   A hard refresh may be needed if checking a previously cached build.
2. Click NEW GAME once. The indicator at the upper right should change from
   ENABLE SOUND to SOUND ON. Intro music should begin without a second click.
3. Space skips to gameplay. Walk, jump, land and change signal with 1/2/3.
   Metallic steps should stop at rest and while airborne; the other actions have
   their own cues. M or the sound badge toggles mute.
4. SETTINGS controls actual master/music/SFX/ambience gains. For a listening check,
   try approximately 80/70/80 percent, with MUTE AUDIO OFF. Existing saved choices
   are respected, including a previously muted/zero-volume profile.
5. If SOUND ON is displayed but nothing is audible, check Safari's tab mute,
   macOS output-device selection and output volume. If Safari explicitly blocks
   site audio, use the ENABLE SOUND badge and its site autoplay setting.

Diagnostics (read-only) in Safari's console:

```js
window.deadPixels.getAudioState()
```

Check `state`, `needsGesture`, `preferences`, `gains`, `playing`, `error` and
`output.rms`. A nonzero output RMS with no hardware sound localizes the remaining
problem beyond the measured game mix; it is not evidence that the player imagined
the silence.

## Actual captured output

`qa-artifacts/audio-output/` contains original-level recordings from the browser
output graph (not source WAV copies):

- `chromium-first-new-game.wav`, `webkit-first-new-game.wav`
- `chromium-gameplay.wav`, `webkit-gameplay.wav`
- `chromium-effects-only.wav`, `webkit-effects-only.wav`
- `chromium-muted.wav`, `webkit-muted.wav`
- `results.json` with RMS, context count and errors

For example, on macOS, from the project folder:

```sh
afplay "qa-artifacts/audio-output/webkit-gameplay.wav"
afplay "qa-artifacts/audio-output/webkit-effects-only.wav"
```

This is the remaining physical listening step. The assistant did not listen
through the user's actual Safari speaker path and does not claim otherwise.
