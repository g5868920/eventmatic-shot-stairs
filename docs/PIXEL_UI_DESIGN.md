# Eventmatic Pixel Arcade UI System

Phase 0 · design exploration · 2026-11-12 · **B visual direction approved; production integration awaiting plan approval**

## Approved direction

**B — Playful Pixel Arcade is approved as the primary Eventmatic direction.** A/C remain archived exploration only. Preserve B’s existing palette, pixel art, HUD hierarchy and L3 layouts; do not explore more themes. Its warm cream text, lilac frames, peach/pink accents, small heart LIFE segments and ticket-like panels suit a social game featuring friends. Keep the party personality around important information: expressive mugs, badges and short local effects. Keep the platform colors and silhouettes literal.

| Direction | Identity | Strength | Trade-off |
| --- | --- | --- | --- |
| A — Classic Pixel+ | Cool purple stonework, blue/pink highlights, segmented meters | Familiarity, conservative migration, quiet playfield | Least differentiated from the original; personality relies on characters |
| B — Playful Pixel Arcade | Warm ticket panels, candy colors, heart segments, tiny expressions | Best fit for custom friends and a reusable Eventmatic party identity | Decorative faces and particles need a strict density budget |
| C — Neon Pixel Party | Dark grid, cyan rails, magenta corners, yellow score | Strong hierarchy and dramatic result screens | More visually intense; brightest accents need restraint in sustained play |

The three directions use the same geometry, character files, sample data, text, platform positions and interface structure. These are comparable skins, not different game concepts. No direction has blur, glow, glass, gradients, rounded cards, camera shake or interpolated pixel movement.

## Preview and review procedure

Run `python3 -m http.server 8766 --bind 127.0.0.1` from the repository root and open `/design-preview/`. Start with approved B at **Actual · 1×** before using the convenient Fit setting. A/C comparison remains available as historical context only. Select every screen and trigger all six effects. Open the comparison strip for simultaneous, native-resolution views. Review the 16:9 stage for projector framing. Source and run instructions: `design-preview/README.md`.

The sample is 396 × 532 logical pixels, matching the current game: 52 px HUD; 360 × 480 playable shaft; 18 px decorative wall on either side; default platforms 80 × 12 px. 1P Rae occupies the right HUD, with 18 floors and 7/12 LIFE; 2P Gina occupies the left HUD, with 16 floors and 9/12 LIFE. Combined 34 floors produce 1.5 shots. The result demonstrates a fall loss; nonzero LIFE at round end is valid. Names can change without changing controls, IDs or sides.

SHOT feedback briefly uses 1P 22 + 2P 18 = 40 floors and 2.0 shots, then returns to the shared sample. All other effects also reset. Hold frame can pin the 45% storyboard pose for inspection; it does not run or pause any gameplay. The lab never loads `game.js`, `config.js`, `sprites.js`, `audio.js` or `eventmatic-bridge.js`, and never writes to production state. Its only production dependencies are read-only PNG character images. The bitmap font has a scoped preview copy.

## Verified gameplay values and the +3 / +4 distinction

`python3 design-preview/audit_rules.py` checks the read-only snapshot against current production source hashes and values. `rules-audit.json` records the sources and exact defaults; it must be reviewed again when production configuration changes. No production scripts are loaded into this preview.

- `config.js` and the engine default both set `beer.healAmount = 3`. `Floor.landing()` calls `hero.regain()` (+1) before `onLand()` calls `hero.heal(CONFIG.beer.healAmount)` (+3). A default safe beer landing can therefore restore +4 total.
- Example: 8 → 9 from landing → 12 from beer. At 9 LIFE before landing: 9 → 10 → 12, so beer contributes only +2 and the net gain is +3. This is clamping, not a different configured beer amount.
- Prior +4 test reports cannot alone establish a beer setting of 4. They may include landing recovery; `?beerHeal=4` or runtime configuration can also override the default. A future renderer must use the effective `ShotStairs.getConfig()` and observed HP delta, never copy the preview's default into gameplay.
- Other verified displayed defaults: LIFE maximum 12; spike −4; ceiling −5; default platform width 80; 1P ←/→, 2P Z/C; 396 × 532 canvas; floor penalty `floor(total / 10) × 0.5`, no default cap/custom formula. 34 floors = 1.5 shots; 40 floors = 2 shots. Configured units remain shot/shots.
- Production spring compression is 100 ms and launch occurs at 200 ms; temporary state transitions begin at 300 ms and 600 ms. The lab's 900 ms effect-inspection timeline is cosmetic only and must not retime these mechanics.

## Color tokens

Use semantic names in a future renderer. Do not hardcode a selected palette throughout gameplay. The values below map directly to the preview theme definitions.

| Token | A — Classic Pixel+ | B — Playful Pixel Arcade | C — Neon Pixel Party | Role |
| --- | --- | --- | --- | --- |
| `bg` | `#181630` | `#211B38` | `#101326` | Shaft, opaque overlay backing |
| `panel` | `#282240` | `#342747` | `#191E38` | HUD and screen panels |
| `border` | `#9E8DFF` | `#B4A1FF` | `#4EE9F2` | Pixel frame, interactive focus |
| `ink` | `#F8EFFF` | `#FFF3DA` | `#F4F1FF` | Primary text and brightest highlights |
| `muted` | `#B3A4CF` | `#C1A9D2` | `#A8B6D6` | Secondary labels, rule explanations |
| `accent` | `#EF91CE` | `#FF86A9` | `#FA65CE` | Party decoration and emphasis |
| `gold` | `#FFD077` | `#FFC95C` | `#FFE66D` | SHOT and primary action fill |
| `p1` | `#72BEFF` | `#8CDAF7` | `#4EE9F2` | 1P identity, always accompanied by ID |
| `p2` | `#EF91CE` | `#FFA4C6` | `#FA90DC` | 2P identity, always accompanied by ID |
| `blue` | `#397CC7` | `#408BC9` | `#397FCA` | Stable brick body |
| `blueHi` | `#90C8FA` | `#A4DEF8` | `#6ACFF4` | Stable brick highlight |
| `brown` | `#987147` | `#AD8052` | `#A27850` | Temporary plank/stone body |
| `brownHi` | `#DBB38A` | `#EFD0A0` | `#E5BF8F` | Temporary seams and hinge highlights |
| `green` | `#73CF89` | `#9CDE83` | `#80E59A` | Spring and positive HP feedback |
| `steel` | `#A5B9D2` | `#BAC4D5` | `#A7C7D6` | Rollers and sharp metal |
| `danger` | `#FF7C98` | `#FF7B8D` | `#FF79B4` | Damage number, spike underside |
| `wall` | `#39305C` | `#4C365D` | `#242442` | Low-contrast architectural texture |
| `wallHi` | `#5D4C85` | `#805271` | `#3B3D6E` | Mortar, fine separators, decorative detail |

Golden SHOT means **penalty**, not healing. Beer healing is communicated by the mug silhouette and a green **+3 BEER** cue under current default settings. A separate **+1 LAND** cue explains the existing safe-landing recovery; both are capped at LIFE 12. Avoid using a second mug as the only identifier of the penalty; the central HUD explicitly says SHOT.

The lab surround uses paper `#F1EEF6`, ink `#29243E`, muted `#70687E` and lines `#CBC5D7` so the dark game canvas can be judged neutrally. The surround is a design tool, not a proposed in-game menu.

## Typography

- Use the existing 5 × 7 uppercase bitmap alphabet, with a one-pixel inter-glyph gap. Its isolated preview copy is `design-preview/pixel-font.js`, under the repository's Apache-2.0 license.
- Rasterize with filled pixel rectangles at integer coordinates and integer type scales. No font smoothing, faux italics, CSS transforms or fractional glyph sizes on the game canvas.
- Suggested scale ladder: 1× (7 px) for secondary labels; 2× (14 px) for actions/rules where space permits; 3× (21 px) for screen headings; 4× (28 px) for SHOTS; 10× title word; 12× (84 px tall) for the result quantity.
- The 52 px HUD is constrained. Preserve 12 segments, numeric LIFE and the 21 px central SHOT number. Move explanations to How to Play or results, not into a taller HUD.
- Names are data, never layout. Choose an integer type size that fits; abbreviate only as a last resort, keeping the underlying value and accessible name intact. Preserve player IDs. Keep outcome wording readable, even with long names.
- Chinese/non-bitmap name glyphs use a cached 14 × 16 logical-pixel raster cell from a local CJK system font (PingFang TC, Microsoft JhengHei, Noto Sans TC, then sans-serif). Alpha is thresholded to solid pixels, then drawn at integer scale. Mixed names retain the existing 5 × 7 Latin glyphs. Measurements and truncation use the same 15 px CJK advance as rendering. The HUD fits the larger glyphs above the hearts; floating CJK badges size to their content, up to 72 px and separate vertically during the push storyboard. Result names retain a separate LOSES line. No fonts are downloaded or copied; glyph appearance can vary by installed font. Verify unfamiliar/complex Chinese names at 1× and 2× before production integration.
- The preview's surrounding controls use native monospace text and HTML labels for legibility and accessibility; they are not character art.

## Pixel grid, scaling and surfaces

- One logical pixel is the smallest art unit. Main spacing follows a 4 px grid; textures and outlines may use 1–2 px details. Snap all animated positions and dimensions to whole logical pixels.
- Default surface: 2 px border, 2 px dark inset, opaque fill, 3 px right / 4 px down hard shadow. Never add a soft CSS shadow to canvas components.
- A uses continuous frames and restrained stone speckles. B adds gold corner pins and small ticket perforations. C adds cyan frames with magenta edge cuts, plus a subdued orthogonal shaft grid.
- Keep field texture low contrast and sparse. Silhouettes, character feet, spike tips and landing edges must be uninterrupted by decorative particles.
- Decorative wall pixels live outside the 360 px gameplay area. Decorative frame changes do not alter the logical shaft or collision bounds.
- `imageSmoothingEnabled = false` for drawing; `image-rendering: pixelated` for CSS scaling. Preserve the 396:532 aspect at every viewport.

## Iconography and characters

Original canvas primitives provide reusable blue bricks, temporary planks, metallic rollers, spring coils, sharp spike teeth, heart segments, plus signs, stars and foamy beer mugs. They are procedural pixel assets, not emoji or platform-dependent icon fonts.

Use a two-part icon grammar: **silhouette identifies the object; color reinforces it**. A direction arrow is part of the conveyor; a green plus accompanies HP recovery; player ID and a pointer remain with the name. Do not recolor an unchanged Gina/Rae portrait to make it match a skin.

The preview reuses `assets/characters/custom/gina-48.png`, `rae-48.png`, and the first 32 × 32 frames of `assets/kid-p1.png` / `kid-p2.png`. It does not edit or regenerate those files. The production animation sheets and foot anchors remain untouched. Local portrait trials fit inside 48 × 48 px and exist only in memory. A later integration must preserve the existing renderer's anchor metadata and 26 × 26 collision box; the lab's centered static display is not an asset pipeline replacement.

## HUD components

**Player block:** fixed left 2P and right 1P identity, configurable name, 12 discrete LIFE segments, current/max numeric label. A uses beveled bars, B uses twelve small hearts with baseline ticks, C uses energy cells. Empty segments have an explicit contrasting silhouette. Keep the count numeric; color alone must never convey health.

**Central SHOT:** constant-width 108 × 44 px compartment; **SHOT POOL** label above, numeric quantity below, **SHOTS** unit below the number. The separate **034 FLOORS** marker identifies combined floors; it must never label the 1.5-shot quantity. Values do not move neighboring LIFE blocks. B adds ticket slots; C uses paired neon rules. Production must fit longer/capped/custom penalty values without clipping and retain correct units. The lab intentionally uses one comparable sample, not every possible configuration.

**In-world player marker:** compact ID/name label and downward pointer. Identity stays with the player when positions swap. Names in a narrow floating marker may abbreviate; the HUD and accessible summary retain the identity. Avoid permanent outlines around the entire character art.

## Platform skin conventions — mechanics are immutable

| Object | Required visual reading | Cosmetic direction changes allowed | Unchanged behavior |
| --- | --- | --- | --- |
| Stable | Blue body, horizontal brick courses, flat top | Brick highlights, grout texture, small corner details | Stable landing; existing safe-landing healing |
| Temporary / flipping | Beige/brown segments and hinge/seam cues | Grain, bevels, compression/flip frames | Existing flip activation and timing |
| Conveyor | Metallic roller wheels and directional chevrons | Roller shine, metal trim | Existing direction and velocity; support both left/right in Phase 1 |
| Spring | Green top, open coils, bounce arrow | Coil silhouette and highlight | Existing compression, release and impulse |
| Spikes | Pale metallic sharp tips above a solid base | Tip highlights, danger-colored underside | Existing damage and collision surface |
| Beer | Foamy mug, amber body, visible handle | Face detail in B; static glints in A/C | HP recovery only; configured amount and cap |

The sample shows a right-moving conveyor; its mirrored direction is a required Phase 1 variant. All three previews keep default 80 px platform width and 12 px baseline art envelope. A spring's art may compress or expand while the mechanics remain authoritative. Spikes must retain visible pointed tips; do not turn them into cute, blunt decorations. Do not turn temporary platforms blue. Do not animate a stable platform as though it will disappear.

## Feedback and animation principles

All feedback in Phase 0 is a self-resetting visual storyboard. No collisions are tested and no game objects, physics, clocks, damage values or velocities are mutated. The effect triggers deliberately stage characters at the relevant object for inspection; these relocations are not proposed movement mechanics.

| Trigger | Preview grammar | Preview duration | Production principle |
| --- | --- | --- | --- |
| Beer | LIFE 8 → 9 (+1 landing) → 12 (+3 beer); separate small +1 LAND / +3 BEER labels | 1,100 ms | Measure beer delta after landing recovery; never change SHOT |
| Spike | Local outline, −4 HP, LIFE 7 → 3 | 900 ms | Emit on the existing damage event; no added damage, delay or invulnerability |
| Spring | Five integer compression/release poses; tiny arrow beside the spring, no floating BOING text | 900 ms | Keep cues outside character/HUD/hazard silhouettes; observe the existing spring phase |
| Temporary | 12 → 8 → 3 → 8 → 12 px art poses; brackets and small FLIP marker below that platform | 900 ms | Anchor feedback to that platform’s render coordinates; respect existing collision/state timing |
| SHOT | Immediate 1.5 → 2.0, +0.5 SHOT callout | 1,400 ms | Numeric value updates immediately; decoration never delays the result |
| Push | One local BUMP puff on contact onset; sustained-contact samples cannot retrigger it | 900 ms | Per-pair visual latch, reset on separation; no gameplay cooldown, damage, stun or force |

These deliberately readable lab timings are **not gameplay timing specifications**. Proposed production accents: 80–120 ms pose steps, 160–240 ms particles, 500–700 ms numeric labels; cap local decorative occupancy to roughly 24 px from the event. The authoritative object state always wins, even if that cuts an animation short. Avoid full-screen flashes, trailing sprites that obscure hazards and effects that hide a second collision.

The preview's reduced-motion option respects the operating-system preference by default. It uses a single static feedback pose without particles or portrait displacement. Numeric changes remain visible. No looping ambient animation is required for any direction. The resume countdown is the existing three one-second beats; it is not an added input delay.

## Screen hierarchy and interaction contract

1. **Title / Start:** large SHOT wordmark, small Eventmatic identity, character pair and one primary Enter action. An alternative styling of the current ready state, not a new forced step.
2. **How to Play:** controls paired with the actual player identities; descending/pushing, healing and damage, first-loss rule, then combined-floor penalty. Current defaults are shown explicitly: safe landing +1, beer +3, spike −4, ceiling −5, max LIFE 12. Enter starts.
3. **Pause:** GAME PAUSED, current total floors, current SHOT pool, Space resume, Escape quit. No movement is simulated behind the lab panel.
4. **Quit confirmation:** retain the existing confirm/cancel branch, “no winner, no penalty”; Enter quits to ready, Escape returns to pause.
5. **Resume:** GET READY and a large 3 → 2 → 1. Existing game clock remains paused until the current production transition completes.
6. **Game Over:** result identity, explicit LOSER'S PENALTY (or PENALTY for a draw), huge quantity, unit, floor breakdown, then Play Again / Enter. The quantity outranks the celebratory treatment. Rematch uses the existing restart path.

The preview supplies native HTML equivalents for primary canvas actions. Focus the canvas to test game keys; form fields and controls retain their normal keyboard behavior. The laboratory has no audio, so its M instruction describes the existing production mute control rather than playing or muting sound in the lab.

Production copy must continue to derive penalty rules, healing amounts, units, names and controls from configuration. The lab's sample defaults must not become hardcoded production rules. Preserve custom penalty `compute`, `maxShots`, `floorsPerStep` and `shotsPerStep` behavior.

## Responsive and projector rules

- Desktop: use the original portrait gameplay canvas. The preview lab can rearrange its inspector and cast controls independently from the art.
- Pixel review: 1× is authoritative; 2× must be an exact integer multiple. Use internal scrolling when that exceeds the available stage. Never crop a platform or stretch the shaft to fit 16:9.
- 16:9 projector: pillarbox the portrait canvas. The lab uses the largest integer scale fitting its presentation frame; controls sit in the side gutters. A 1920 × 1080 frame holds 2× (792 × 1064) with a narrow vertical margin. A 1280 × 720 frame holds 1×.
- Fit mode: a labeled fractional scale is permitted for convenience, with nearest-neighbor sampling. It can create uneven pixel widths; use integer mode for final visual sign-off.
- Tablet: move component inspectors below the stage; keep comparison canvases at 1× in a horizontal strip.
- Phone: navigation and controls stack. Actual 1× remains inspectable through stage scrolling. Fit can show the entire scene, but tiny gameplay labels are not promised readable below 1×. The surrounding semantic descriptions and native controls remain readable.
- Tablet/phone viewing is **design review only**. Do not add touch movement buttons or imply supported mobile gameplay.

## Accessibility and readability

- Keep player IDs, direction arrows, silhouettes, LIFE numbers and explicit +/− HP labels. Do not rely on hue alone.
- Main text, SHOT and UI labels should reach at least 4.5:1 contrast on their opaque surfaces; large display text should reach at least 3:1. Inactive LIFE segments are visible shapes, not hidden states. Very low-contrast architecture is decorative only.
- Provide native controls, clear focus rings, descriptive labels, canvas summaries and live effect announcements. Trap focus within the projector view by making the rest of the page inert; return focus to the launch button on exit.
- A fixed descriptive canvas summary makes the visual lab navigable; it is not a claim that real-time gameplay is fully screen-reader accessible. Live effects have separate status descriptions.
- Reduced motion removes particles and positional effects. No strobe, blur, constant screen shake or audio is needed to understand any state.
- A 7 px bitmap label is not ideal for distant audiences. Keep critical result quantities large; verify on the actual venue projector before rollout. The 52 px HUD is an inherited constraint and cannot be fixed by decorative contrast alone.
- Preserve CJK/Unicode names, measure rendered width, and abbreviate visually only. Verify bright and dim projector modes, grayscale platform recognition and custom characters with light/dark clothing before production approval.

## Production integration plan — approval pending

See [PIXEL_UI_INTEGRATION_PLAN.md](PIXEL_UI_INTEGRATION_PLAN.md) for the concise approval artifact. Phase 1 covers L1/L2; Phase 2 covers L3. Direction approval does not authorize production edits. This preview and this design system remain the visual source of truth.

## Reuse across Eventmatic party games

Reusable: palette roles, bitmap type ladder, hard frame primitives, player identity blocks, numeric result hierarchy, icon grammar, event-local feedback, reduced motion and viewport fitting.

Game-specific: SHOT label and formula, twelve LIFE segments, platform categories, descending floors, controls and character anchors. Keep these in a SHOT-specific adapter. Another Eventmatic game should supply its own score, state and rules to the shared presentation primitives rather than inherit staircase mechanics.
