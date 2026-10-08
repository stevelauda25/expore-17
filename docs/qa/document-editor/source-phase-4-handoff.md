# Phase 4 handoff — complete

Completed October 8, 2026. Read the Phase 3 handoff, approved implementation plan, design README, and Phase 3 QA evidence before implementing **Phase 4 only**. The final acceptance gate passes. **Stop here.** No new chat, Git initialization, commit, push, or deployment was created.

## Delivered behavior

- **Comments:** document comments and explicit selected-text comments, replies, resolve/reopen, persistence through the existing document controller, and live mapped anchors. ProseMirror maps anchors through edits; full removal/replacement detaches the thread while preserving its original quote. “Show quoted text” restores the mapped editor selection. Unknown legacy metadata is retained.
- **History:** timestamped local revisions, a formatted read-only preview that does not mutate the editor, and explicit restoration of document plus comments. The current snapshot is saved first. If that save fails, restoration stops visibly before editor mutation. If the subsequent replacement write fails, the current document remains in memory and durable storage. The existing 50-distinct-snapshot limit and deduplication remain. Successful restoration returns keyboard focus to History; closing a preview returns focus to its revision entry.
- **Tabs:** linked tab/tabpanel semantics, roving tab stops, Arrow Left/Right and Home/End navigation. The same editor remains mounted, preserving document, scroll, selection, and coherent Explain context. Completed Explain results survive a tab switch; hiding pending generation cancels it. Source staleness continues to be tracked while hidden. Panel components remain mounted to retain unsubmitted drafts while switching.
- **Close controls:** dismiss the editing banner with editor focus restoration; close the right panel with focus restored to the orb. The orb reopens Explain and enables/preserves mode. While Explain is visible, the next orb click retains the approved mode-off behavior. Ask AI can also reopen the Explain tab for the current selection.
- **Polish:** accessible control names, disabled semantics, hover/active states, visible focus, 150 ms ease-out color/opacity transitions, and reduced-motion support. Source columns, gray framing, 1440 × 860 maximum app, growing paper, internal scroll areas, and viewport-safe floating surfaces remain intact.

Exact source proposal copy, **October 6, 2026**, source artwork, and typography remain unchanged. **Scope of Work, Timeline, Budget, and Next Step are the four approved sample additions beyond Figma**, with their approved copy unchanged. Comments/History and non-source interaction states use minimal existing tokens. No dependencies were added.

## Implementation areas

| Files | Purpose |
|---|---|
| `src/editor/comments.ts`, `comments.test.ts` | Thread model, safe display guard, mapped anchors, sticky detachment, retained opaque metadata, mapping tests. |
| `src/editor/DocumentPanels.tsx`, `Panels.module.css` | Comments/replies/resolution UI, revision list/preview/restore, focus restoration, minimal token styling and internal scrolling. |
| `src/persistence/documentStore.ts`, `documentStore.test.ts` | Persist comment snapshots; expose revisions; return write success; preserve current content before guarded restoration; test both restoration write failures and retention. |
| `src/App.tsx`, `App.module.css`, `src/tokens.css` | Functional tabs, banner/panel close controls, flexible central column, global interaction/focus/motion states, one-pixel outline overflow fix without changing measured rows. |
| `src/editor/EditorApp.tsx`, `uiState.tsx` | Existing editor/store/selection integration; tab/panel/banner state; orb behavior and mounted editor preservation. |
| `src/editor/useExplain.ts`, `ExplainPopover.tsx`, `explainPlugin.ts` | Suspend/cancel hidden work; preserve coherent pinned context; rebuild source clause ranges only on explicit whole-document restoration. Ordinary edit mapping stays unchanged. |
| `tests/phase-4.spec.ts`, `phase-4-visual.spec.ts`, `editor-smoke.spec.ts` | New functional, responsive, persistence/failure, reduced-motion and shared cross-browser coverage. |
| `scripts/check-production.mjs` | Existing bundle scan plus built-app runtime checks for normal/fixture URLs and an inert DEV adapter. |
| `scripts/compare-phase3.mjs`, `compare-phase4.mjs`, `package.json` | Reuse the comparison engine and complete-suite captures for Phase 4 with unchanged thresholds; consolidated audit command. |
| `README.md`, `docs/qa/phase-4/`, this handoff | Usage, supported scope, logs, screenshots, metrics, and limitations. |

The gate regenerates inherited Phase 1–3 implementation screenshots/comparison artifacts, `dist/`, and TypeScript build metadata. Immutable Figma references, font binaries, source artwork, proposal copy, and dependencies were not changed. Source checksums and validation output are in Phase 4 QA.

## Final gate and evidence

```sh
set -o pipefail
npm run audit:phase4 2>&1 | tee docs/qa/phase-4/audit.log
```

**Passed:** ESLint, TypeScript, **21 unit tests**, production build, static/runtime production isolation, the complete **62-test browser suite** (**56 Chromium, 3 Firefox, 3 WebKit**), inherited visual gates, and Phase 4 comparisons. The browser suite covers all eight approved journeys, comment persistence/detachment/replies/resolution, revision preview/guarded restoration, storage failures/retry, Explain cancellation/stale protection, native clipboard, and reduced motion.

The first full run passed. Final review identified focus loss when restoration deduplication removed the preview's old revision ID; the fix restores focus to the History tab. The strengthened shared browser assertion and complete gate passed again. Both gate logs are retained. Earlier focused checks fixed replacement-anchor detachment, lost Explain markers after restoration, and a one-pixel outline scroll range. No production code changed after the final passing gate.

[Phase 4 QA](../qa/phase-4/README.md) contains the full test matrix, commands, review notes, screenshots, limits, and [exact metrics](../qa/phase-4/comparison.json). At **1640 × 1060**, Figma full-frame differences are **1.0179% default**, **1.0280% annotated**, and **1.2201% selection/Explain**. These match Phase 3. All components pass the 4% ceiling (largest 2.6283%); all frames pass 2%; all live/fixture comparisons pass the stricter 0.1% ceiling. No thresholds changed. Only the source presentation cursor is masked.

Also checked **1280 × 900, 1440 × 900, 1920 × 1080**, plus the inherited **1280 × 640** floating-menu stress case. Structural anchors remain within 1 CSS px; there is no measured horizontal overflow or runtime error. Full frames and component differences were reviewed. Remaining rasterization, fractional glyph positioning, shadow/stroke antialiasing, and native selection-fragment differences are documented honestly; no pixel-identical claim is made.

## Preview and usage

Verified preview: [http://127.0.0.1:5173/](http://127.0.0.1:5173/). The existing Vite server was reused and left available. If it stops:

```sh
npm run dev
```

For a production preview, run `npm run build` then `npm run preview` (normally port 4173). The final gate separately served the built output on a temporary loopback port, verified three routes, and closed that temporary server. Production fixture URLs load the normal editor; fixture modules and test adapters are absent from production bundles.

See [usage instructions](../../README.md) for editing, Explain, Comments, History, keyboard controls, autosave/retry, and the exact local-only scope.

## Remaining differences and limitations

- Comments/History, generated results, and non-default interaction treatments are approved minimal token-based extensions because Figma does not define them. The four approved added sections remain content beyond Figma.
- Persistence is per browser/origin; there is no backend or multi-user comment service. Page-hide saving is best effort. Malformed/conflicting data still requires the existing successful raw backup before replacement.
- Unsubmitted comment/reply drafts persist across tabs only. Active tab, dismissed controls, and Explain results reset on reload. Detached threads retain their quote and stay detached if matching text is later typed; a restored revision restores its own saved comment anchors. Text undo does not undo comment metadata.
- Explain is a deterministic local prototype. No mobile redesign or formal screen-reader certification is included.
- Vite's existing non-blocking large-chunk warning remains: **882.37 kB minified / 278.49 kB gzip** main JavaScript.

There is no next implementation phase in the approved plan. Stop after the final report; do not create another chat or perform Git or deployment actions automatically.
