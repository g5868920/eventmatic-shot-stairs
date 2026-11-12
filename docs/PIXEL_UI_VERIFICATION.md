# Pixel UI preview verification

Date: 2026-11-12 (Asia/Taipei). Scope: Phase 0 visual laboratory only.

## Approved B corrections — latest review

B is approved as the primary visual direction. Production integration is pending approval of [the integration plan](PIXEL_UI_INTEGRATION_PLAN.md). Earlier A/C captures below are archived exploration, not additional theme work.

- Center HUD now reads **SHOT POOL / 1.5 / SHOTS**. **034 FLOORS** remains separate.
- `python3 design-preview/audit_rules.py` passes against current `config.js` and `game.js` hashes. Snapshot: `design-preview/rules-audit.json`. The audit verifies current defaults and landing/beer ordering without executing production logic.
- Verified default beer +3, safe landing +1, max LIFE 12. Beer landing storyboard is 8→9→12 (+4 total). At pre-landing 9 LIFE, clamping gives 9→10→12 (+3 total, only +2 from beer). Prior +4 reports could reflect combined landing recovery or a configuration override; their exact runtime configuration was not supplied.
- Other displayed values checked: spike −4, ceiling −5, 80 px platforms, 396 × 532 canvas, controls, and 34→1.5 / 40→2 SHOT conversion. Production custom formula/cap/URL/runtime settings remain authoritative at integration time.
- All six effects exercised and captured. Flip cue sits beneath brackets on its affected brown platform. Spring uses a tiny side arrow, with no floating BOING text or particles over the action. Chinese badges size to content; push name markers separate vertically.
- The sustained-contact scenario produced **181 samples / 1 visual burst**. A new contact after separation produced a new burst. Repeated Push clicks during the same active contact did not restart the effect. The latch observes mock visual contact only and cannot affect production collision or audio.
- Chinese names 吉娜 / 小蕊 were checked at native 1× and projector 2×. Cached 14 × 16 px raster cells, thresholded solid pixels and a 15 px advance improve legibility. Existing Latin artwork remains intact. Complex glyph rendering can vary by installed system font.
- Projector result and Chinese names checked at requested 1920 × 1080: measured canvas **792 × 1064**, ratio 396:532; at 1280 × 720: **396 × 532**. Pillarboxes remain; neither axis stretches. The result quantity is 168 px tall at 2×, 84 px at 1×; HUD quantity is 42/21 px. Small secondary labels still need actual venue-distance/brightness verification.
- Browser console recorded no warnings/errors after corrected feedback/name checks. Reduced-motion spring treatment was checked. L3 screen geometry, palette and interaction structure are preserved.
- Updated captures are in `design-preview/screenshots/approved-B/` and lead the gallery. Earlier captures are retained as history. No production behavior tests were rerun because production code was not changed; source audit and browser preview checks are the evidence for this correction.

## Story verified

A reviewer selects a direction → the shared renderer applies its tokens and art details → the same gameplay sample, screen layouts and cosmetic feedback are shown → comparison and projector views display those same renderers. There is no API, backend, production runtime or persisted game state in this workflow.

## Browser evidence

| Check | Result / evidence |
| --- | --- |
| Static page and local assets | Local HTTP server served the page, CSS, two preview-only scripts and four character PNGs successfully; captured browser console had no warnings or errors in the final A/B/C pass |
| Direction switch | A/B/C update the palette, HUD treatment, frames, field texture and inspector while preserving 396 × 532 geometry and sample data; `A-desktop.jpg`, `B-desktop.jpg`, `C-desktop.jpg` |
| Parallel comparison | Three native-size canvases render the same selected state; `ABC-comparison.jpg` and `ABC-results.jpg` |
| Title / How to Play | Both render; clicking the title's canvas Start action returns to the sample; How to Play includes controls and default rule values |
| Pause / quit / resume | Focused scene: Space → pause; Escape → quit confirmation; Escape → pause; Space → countdown; countdown completes back to gameplay |
| Result / rematch | Result quantity dominates; draw selector updates the outcome; Enter rematches to the sample; native HTML and canvas actions are available |
| Name configuration | Long Latin name and CJK name render without escaping the result frame; full value retained in accessible canvas description; `B-unicode-name.jpg` |
| Character preset | Gina/Rae and classic character sets visibly switch using the existing PNGs |
| Beer / damage / spring / flip / SHOT / push | Six triggers exercised and captured; Hold frame pins the sample pose; releasing restores normal preview timing |
| Reduced motion | Static spring feedback inspected with reduced motion enabled; particles and animated portrait displacement are removed |
| SHOT consistency | Temporary 40-floor / 2.0-shot sample changes the floor marker and counter together; restores the base 34 / 1.5 sample |
| 1080p projector | At requested 1920 × 1080 viewport, measured canvas CSS bounds are exactly **792 × 1064** (2×); gameplay and result screenshots included |
| 720p projector | At requested 1280 × 720 viewport, measured bounds are exactly **396 × 532** (1×); result screenshot included |
| Tablet | Requested 768 × 1024; native canvas measured 396 × 532; document width 753 px excluding scrollbar gutter, with no page-wide overflow |
| Phone | Requested 390 × 844; Fit measured approximately 325 × 436.6 before full-page capture; document width 375 px excluding scrollbar gutter, with no page-wide overflow. Fit responds to available width; native art remains inspectable by scrolling |
| Projector focus | Main/header become inert, Exit receives focus, Escape closes, and focus returns to the launch button |

Screenshots: [browser gallery](../design-preview/screenshots/index.html). The capture API returns JPEG; filenames reflect that format. Full-page images may be taller than the requested viewport and exclude scrollbar width. The gallery explains these capture conventions.

## Color contrast calculation

Calculated sRGB relative-luminance contrast against each direction's panel fill:

| Direction | Main text | Muted text | SHOT gold | 1P | 2P |
| --- | ---: | ---: | ---: | ---: | ---: |
| A | 13.48:1 | 6.55:1 | 10.44:1 | 7.56:1 | 6.90:1 |
| B | 12.50:1 | 6.46:1 | 9.01:1 | 8.83:1 | 7.45:1 |
| C | 14.70:1 | 8.04:1 | 13.08:1 | 11.11:1 | 7.86:1 |

These text-token pairs exceed 4.5:1. This is a focused token check, not a full accessibility conformance audit. Low-contrast walls are decorative. Physical projector brightness and viewing distance remain venue checks.

## Isolation and scope

The preview HTML loads only `pixel-font.js` and `preview.js`. Production assets are referenced read-only; there are no production script imports. The renderer owns disposable sample state, with no physics or collision implementation. Production game files and `eventmatic-rae-birthday` are outside the change set.

Existing production work was present when the task began and was left untouched. That work was independently committed during the preview task; the preview commit must include only `design-preview/`, `docs/PIXEL_UI_DESIGN.md`, and this verification note.

## Fixes made during verification

- Made temporary SHOT feedback show 40 floors consistently with 2.0 shots.
- Removed a neon border line that crossed the central HUD context label.
- Kept Unicode result names separate from the LOSES label so outcome text remains visible.
- Added a held storyboard pose for reliable feedback comparison, then corrected browser asset caching with explicit preview asset versions.
- Placed projector controls in side gutters to permit a true 2× canvas at 1080p.
- Increased narrow-screen native-control text sizes.
- Replaced an optional download control with the bundled screenshot-gallery link after the embedded browser's download verification timed out. Screenshot delivery does not depend on browser downloads.

## Deliberate limits

- This is a visual storyboard, not a second playable game. Movement, collisions, physics, real health changes and audio are not run.
- The lab supports local portrait selection; automated native-file-chooser verification was not performed. Existing Gina/Rae and classic assets were visually verified.
- Only a right-moving conveyor is in the representative scene. Both directions and all width configurations must be covered in Phase 1.
- Native small labels retain the existing 52 px HUD constraint. Phone Fit is a review convenience, not a claim of playable/readable mobile gameplay.
- No production behavior tests were needed or run: production code was neither imported nor modified. Existing regressions are mandatory when an approved direction is integrated.
- B visual direction is approved. No production deployment, integration or push is authorized by that visual approval; the integration plan awaits approval.
