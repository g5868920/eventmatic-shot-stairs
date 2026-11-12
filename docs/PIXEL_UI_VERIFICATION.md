# Pixel UI preview verification

Date: 2026-11-12 (Asia/Taipei). Scope: Phase 0 visual laboratory only.

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
- No production deployment, integration, push, or direction approval is implied by this preview.
