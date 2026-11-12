# Phase 1 rollback baseline

Recorded before implementation on 2026-11-13 (Asia/Taipei).

- Repository baseline: `8fc7181f97a2a8662d12f89f4d2d0b89fb733c88`.
- Last gameplay-engine commit: `1756930` (subsequent commits contain Phase 0 preview work only).
- Existing untracked `design-preview/screenshots.zip` is excluded from Phase 1.
- Temporary immutable source copy: `/tmp/shot-phase1/baseline`, created with `git archive` before production edits. Used by the browser test server for deterministic before/after comparisons.
- Phase 0 B and `docs/PIXEL_UI_DESIGN.md` remain the visual source of truth.

Rollback: revert the Phase 1 implementation commit to restore the production files to this baseline. Inspect `git diff 8fc7181 -- game.js sprites.js index.html arcade-visuals.js` to review rendering integration. Do not reset unrelated user changes.

Phase 2 screens are excluded from Phase 1 authorization.
