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

## Background music

| | |
|---|---|
| Track | **8 Bit Retro Game Music** by **moodmode** (publisher IPI: KROTOV VLADYSLAV, 378003660) |
| Source | https://pixabay.com/music/video-games-8-bit-retro-game-music-233964/ |
| File | `assets/audio/bgm-moodmode-8-bit-retro-game-music.mp3` (downloaded from Pixabay's own download URL on 2026-11-12, unmodified, 70.17 s; checksum in `assets/audio/CREDITS.md`) |
| License | Pixabay Content License: free for commercial and non-commercial use, no attribution required (credited here anyway), may be modified; **may not be sold or distributed on a standalone basis** (i.e. do not offer the MP3 itself for download; shipping it inside the game is fine). |
| Content ID | The track page says **"Content ID Registered"**. Playing it at the event is unaffected. If anyone uploads a recording or stream of the game to YouTube (or another platform that uses Content ID), the upload can receive an automated claim from the artist's publisher, which may monetise it or show the claim. This is not a license violation; claims on Pixabay tracks can usually be released by contacting the artist / disputing with the Pixabay license, but the simplest option for recordings is `?music=0`. |

Behaviour (`audio.js`):

* One looping source on its own gain node, default **25 %** (`audio.music.volume`), independent of
  the sound-effect volume (`audio.volume`, 60 %). M mutes both.
* Starts when a round starts and audio is allowed; if the browser still blocks audio, it starts on
  the first key press / click / touch (the same unlock as the sound effects).
* Loops sample-accurately between the first and last audible samples (0.009 s to 68.18 s), skipping
  the MP3 padding and the 2 s of silence at the end of the file, so the loop has no gap.
* Fades out over 0.8 s when the round ends; a rematch starts it again from the top. Only one music
  source can exist at a time, so repeated round starts never stack loops.
* `?music=0` disables it (the file is not even downloaded), `?musicVolume=0.15` sets the level;
  API `ShotStairs.setMusicVolume(v)`.
* Tests: `tests/music-tests.js`.

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
