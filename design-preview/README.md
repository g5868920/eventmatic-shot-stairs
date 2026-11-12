# Eventmatic Pixel Arcade — Phase 0

**B — Playful Pixel Arcade is approved. Production integration remains pending plan approval.** Local-only design laboratory. No production scripts, configuration, audio, physics or collision code are loaded. Existing portrait/character PNGs are read from `../assets/`; new artwork is drawn with integer canvas rectangles.

From the repository root:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open **http://127.0.0.1:8766/design-preview/**. No dependencies or build step. Keep this folder within the repository so existing character images resolve. `index.html` can also be opened directly for visual review; HTTP is recommended for consistent local asset loading.

- Review B as the visual source of truth. A/C remain archived historical comparisons; no new theme work is authorized.
- Select gameplay, title, how-to, pause, countdown or result. The title is an alternative ready-state presentation, not an additional mandatory screen.
- Focus the scene: Space pauses/resumes; Escape opens/cancels quit; Enter starts/rematches. The primary pixel buttons are clickable; equivalent native HTML buttons sit below the scene for keyboard and screen-reader access.
- Trigger any of six cosmetic effects; Replay repeats the last one. Hold frame pins a representative effect pose for comparison and screenshots; release it to replay normally. Each restores the shared sample. Reduced motion keeps a static feedback pose with no particles or portrait displacement.
- Edit player names or select the unchanged classic/Gina/Rae assets. Local portrait selection stays in memory and is not uploaded. Switching the character preset clears custom selections.
- Actual 1× is the authoritative art review mode. 2× scrolls within the stage when necessary. Fit is convenient but fractional pixels are explicitly labeled. The comparison strip keeps all three canvases at 1× and scrolls horizontally.
- 16:9 stage creates a pillarboxed viewing frame; it is not a mobile gameplay mode. It uses the largest integer scale that fits, falling back below 1× only on small displays. Escape/Exit closes it.
- Saved screenshots opens the bundled review gallery.
- Review URLs support `?style=A|B|C&screen=gameplay|title|howto|pause|countdown|over`.

The center HUD says SHOT POOL / SHOTS; 034 FLOORS remains a separate indicator.

Run `python3 design-preview/audit_rules.py` to check the displayed defaults against production source. Beer is +3 by default, and safe landing is +1, yielding up to +4 total. The beer storyboard shows 8 → 9 → 12 and clamped cases are documented in the design system. `?beerHeal=4` and runtime settings can override the production default; the preview does not apply overrides or change gameplay.

Sustain push contact · 3s repeatedly samples a mock contact, displays one visual burst, and rearms only after separation. This is a visual observer test, not a collision simulation. Flip markers are platform-local; spring feedback uses a tiny side arrow. Chinese names use larger cached solid-pixel glyphs with exact width measurement.

The live sample is frozen at 1P Rae 18 floors / 7 LIFE, 2P Gina 16 floors / 9 LIFE, 34 combined floors / 1.5 shots. The result sample assumes a fall off-screen, so LIFE can remain above zero. SHOT feedback temporarily shows the clearly labeled 40-floor / 2.0-shot sample. It does not calculate or mutate a production score.

See [the design system](../docs/PIXEL_UI_DESIGN.md), [verification notes](../docs/PIXEL_UI_VERIFICATION.md), and [screenshots](screenshots/).

## Ownership and integration boundary

`preview.js` owns the demo renderers and disposable local state. `pixel-font.js` is a scoped copy of the repository's Apache-2.0 bitmap font, with the production loader removed. Character assets retain their existing repository provenance; see `docs/LICENSES.md` and `docs/CHARACTERS.md`. Original platform/icon drawings in this folder are Eventmatic work under the repository license.

This folder is intentionally not imported or linked from production. Do not promote it wholesale. Approval of the integration plan is required before Phase 1 / Phase 2 production integration. See `docs/PIXEL_UI_INTEGRATION_PLAN.md`.
