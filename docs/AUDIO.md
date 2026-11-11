# Sound effects

## What plays when

| Event (engine) | Sound | Notes |
|---|---|---|
| `hurt` (spike floor or ceiling spikes, damage > 0, player still alive) | **hurt**, 0.32 s harsh hit | once per damage event; a repeat for the same player within 180 ms is skipped |
| `playerDown` with cause `health` (life reached 0) | **death**, 0.95 s falling three-note jingle | the fatal hit does not also play the hurt sound |
| `playerDown` with cause `fall` (dropped below the playfield) | **fall**, 1.35 s falling whistle + thump | once per player per round |

The engine only *announces* these events (`Hero.hurt` fires `hurt`; the round-end code fires
`playerDown` once per dead player). `audio.js` listens and plays; it never changes gameplay. 1P is
panned slightly right and 2P slightly left so both players are heard independently, including two
sounds in the same frame.

## Settings

* `config.js` → `audio: { enabled, muted, volume }` (volume 0..1, default 0.6).
* **M** toggles mute during play; the choice is remembered in this browser (localStorage).
* URL: `?mute=1`, `?volume=0.4`.
* API: `ShotStairs.setMuted(true|false)`, `ShotStairs.setVolume(0..1)` (or `ShotAudio.*`).

## Preloading and browser autoplay

All three sounds are synthesised into audio buffers when the page loads (about 2.6 s of audio in
total), so nothing is fetched during play and there is no first-play delay. Browsers start audio
suspended until the user interacts; `audio.js` resumes the audio context on the first key press,
click or touch, which always happens before a round starts (Space / arrows / Z / C).

## Sources and licensing

| Reference (checked 2026-11-12) | Accessible / playable | Reuse status |
|---|---|---|
| `awiclass.monoame.com/audio/小朋友下樓梯 被刺.mp3` (hurt) | yes, 200 OK, MP3 2.06 s (0.35 s audible), decodes in the browser | **not reused** |
| `comebuycb.github.io/files/NS-SHAFT/fall-dead.mp3` (fall / death) | yes, 200 OK, MP3 2.27 s (1.4 s audible), decodes | **not reused** |
| CodePen "Remastered NS-SHAFT" (`codepen.io/eebgwuss/pen/OJvzzga`) | loads 6 sounds: BGM, conveyor, hurt, fall/death, step, spring | **not reused** |

Why not reused: the recordings are the sound effects of NS-SHAFT (Nagi-P Soft), distributed as
freeware, which does not grant redistribution rights for its assets. They are re-hosted on a
course site and GitHub Pages, and neither the hosts nor the CodePen state any license or permission.
A public URL is not a license, so they were used only as listening references (length, loudness
envelope and pitch range were measured in the browser; nothing was downloaded into the project).

What ships instead: three **original** sound effects synthesised in code in `audio.js` (pulse,
triangle and noise oscillators with pitch sweeps), written for this project and released under the
repository's Apache-2.0 license. No third-party audio is included. Platform, spring, conveyor and
background-music sounds from the reference were not part of this request and are not implemented.

## Tests

`tests/audio-tests.js` (run in the page console): spike damage once with no repeats while standing
on spikes, both players at once, ceiling hits, fatal hit → death only, fall below the playfield,
both falling, repeat guard, and an analyser check that the output is audible, silent when muted
and scaled by volume.
