# Sound effects

## What plays when

| Event (engine) | Sound | Notes |
|---|---|---|
| `hurt` (spike floor or ceiling spikes, damage > 0, player still alive) | **hurt**: NS-SHAFT 被刺 recording (trimmed to 1.24 s) | once per damage event; a repeat for the same player within 180 ms is skipped |
| `playerDown` with cause `health` (life reached 0) | **death**: NS-SHAFT fall-dead recording (trimmed to 1.86 s) | the fatal hit does not also play the hurt sound |
| `playerDown` with cause `fall` (dropped below the playfield) | **fall**: NS-SHAFT fall-dead recording (trimmed to 1.86 s) | once per player per round |

The engine only *announces* these events (`Hero.hurt` fires `hurt`; the round-end code fires
`playerDown` once per dead player). `audio.js` listens and plays; it never changes gameplay. 1P is
panned slightly right and 2P slightly left so both players are heard independently, including two
sounds in the same frame.

## Settings

* `config.js` → `audio: { enabled, muted, volume }` (volume 0..1, default 0.6).
* **M** toggles mute during play; the choice is remembered in this browser (localStorage).
* URL: `?mute=1`, `?volume=0.4`.
* API: `ShotStairs.setMuted(true|false)`, `ShotStairs.setVolume(0..1)` (or `ShotAudio.*`).

## Which audio is used (decision 2026-11-12)

Eventmatic chose the classic NS-SHAFT recordings for this private event build:

| Sound | Source URL (loaded at runtime) |
|---|---|
| hurt | `https://awiclass.monoame.com/audio/小朋友下樓梯 被刺.mp3` |
| fall and death | `https://comebuycb.github.io/files/NS-SHAFT/fall-dead.mp3` |

They are fetched when the page loads (both hosts allow cross-origin requests), decoded, trimmed
of leading/trailing silence and kept in memory, so playback is instant. They are **not** stored in
this repository. Each sound also has an original synthesised version (built at load); it plays until
the file has loaded and permanently if a file cannot be loaded (no internet at the venue, host
removed the file).

Switches:
* `config.js` → `audio.files.{hurt,fall,death}`: any URL, or `null` for the synthesised sound.
* `?audioFiles=0`: synthesised sounds only. `?audioFiles=local`: use copies saved as
  `assets/audio/local/hurt.mp3` and `assets/audio/local/fall-dead.mp3` (that folder is git-ignored,
  for offline venues; it is not distributed with the repo).
* `ShotAudio.sources()` reports `file`, `synth` or `synth (file failed)` per sound.

## Preloading and browser autoplay

Synthesised fallbacks are built and the recordings are fetched when the page loads, before anyone
can start a round. Browsers start audio suspended until the user interacts; `audio.js` resumes the
audio context on the first key press, click or touch, which always happens before a round starts.

## Sources and licensing

| Reference (checked 2026-11-12) | Accessible / playable | Status |
|---|---|---|
| 被刺 (hurt) on awiclass.monoame.com | yes, 200 OK, MP3 2.06 s, decodes | **used at runtime by Eventmatic's decision**, not redistributed |
| fall-dead on comebuycb.github.io | yes, 200 OK, MP3 2.27 s, decodes | **used at runtime by Eventmatic's decision**, not redistributed |
| CodePen "Remastered NS-SHAFT" (`codepen.io/eebgwuss/pen/OJvzzga`) | lists 6 sounds: BGM, conveyor, hurt, fall/death, step, spring | reference only |

Rights note: these are the sound effects of NS-SHAFT (Nagi-P Soft), a freeware game; freeware does
not by itself grant redistribution rights, and neither host states a license. On that basis the
first version shipped only original synthesised sounds. Eventmatic then decided to use the two
recordings for this private event; the build therefore loads them from their public URLs at runtime
and does not copy them into the repository or a public release. For any public or commercial use,
switch back to `?audioFiles=0` / `files: null` (the synthesised sounds are original, Apache-2.0).

## Tests

`tests/audio-tests.js` (run in the page console): spike damage once with no repeats while standing
on spikes, both players at once, ceiling hits, fatal hit → death only, fall below the playfield,
both falling, repeat guard, and an analyser check that the output is audible, silent when muted
and scaled by volume.
