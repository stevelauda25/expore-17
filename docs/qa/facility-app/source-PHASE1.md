# Phase 1 closeout

Completed 7 October 2026. Scope: static visual parity only.

## Implementation

React + TypeScript + Vite with plain CSS custom properties. The complete app shell, sidebar, breadcrumb, heading, metrics, eight-row runtime heatmap, finding card, selected-equipment card, review context, and bottom action bar are implemented. The canonical state is Sites active, AHU-03 / Library East selected, and no overlays or hover treatments.

The main composition uses Grid and Flexbox. Absolute positioning is reserved for decoration and selection indicators. Table markup maps typed equipment data. Metrics derive from that data. No interaction layer has been added.

## Files

Foundation: `.gitignore`, `package.json`, `package-lock.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `README.md`.

Application:

- `src/main.tsx`, `src/App.tsx`
- `src/data/equipment.ts`
- `src/components/AppShell.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Breadcrumb.tsx`
- `src/components/BottomActionBar.tsx`
- `src/components/MetricSummary.tsx`
- `src/components/RuntimeHeatmap.tsx`
- `src/components/ContextPanel.tsx`
- `src/components/Icon.tsx`
- `src/styles/tokens.css`, `src/styles/app.css`, `src/styles/components.css`

Assets: 18 untouched SVGs and four original PNGs in `public/assets/figma/`; copied original logo for `public/favicon.svg`; `public/fonts/Inter.var.woff2` and `OFL.txt`.

Verification: `scripts/verify-visual.mjs`; `verification/asset-manifest.json`, `font-manifest.json`, `gate-report.json`, `figma-reference.png`, `phase1-baseline.png`, `implementation-dpr1.png`, `implementation-dpr2.png`, `side-by-side.png`, `overlay-50.png`, `difference.png`, `dpr2-detail.png`.

Documentation: this file and `docs/PHASE2_HANDOFF.md`.

## Source details that must survive Phase 2

- Figma screenshot was retrieved directly from MCP at 1440 × 734. It is outside the public assets.
- The original individual assets have SHA-256 hashes, Figma node IDs, and expected rendered slots recorded in the asset manifest. SVG roots remain unchanged: 12 × 12 icons, 10.9091 × 11 logomark.
- Figma text specifies Inter with weight/slant variation axes. Installed Inter 4.001 instead used optical-size/weight axes and produced visibly different metrics. Official Inter 3.19 is now bundled locally; it matches the weight/slant axes and restores the reference wrapping. There are no remote font requests.
- Figma source inspection showed the concentric graphics group has 12% opacity. Each exported PNG already includes its ellipse's 40% opacity. Apply 12% to the composited group. Applying the generated context's approximate 5% individually would double-apply opacity and dim the texture.
- Figma fractional strokes are painted inside bounds with inset shadows so they do not consume layout space.
- Breadcrumb text boxes are exactly 61px, 85px, and 50px. The Inspect button is 129 × 28px.
- Selected-row indicator is 2 × 46px, starting 1px above the 44px row.

## Gate result

PASS for Phase 1 static parity. The full screen was built before the gate audit, followed by a focused correction and targeted recheck.

- `npm run build` and TypeScript pass.
- Canonical Chrome capture: 1440 × 734 CSS pixels, DPR 1, 100% zoom, fonts/images ready, pointer outside controls.
- All ten major geometry checkpoints pass within 0.02 CSS px. All nine table rows including the header are 44px; all 56 heatmap cells are 503/7px wide and 36px tall.
- All 22 original assets are nonempty, unmodified, loaded, and rendered in their Figma slots. SVG dimensions and placement are checked automatically.
- Context paragraphs wrap to the reference lines after the font correction. Side-by-side, overlay, and difference images were visually reviewed.
- DPR 2 capture and table detail inspected for fractional strokes and icons.
- No console/runtime errors, failed requests, broken images, missing fonts, or canonical overflow.
- No temporary Figma asset URLs remain in project files.
- All overlays and interaction behavior remain unimplemented, as required for this phase.

Remaining differences are small browser/Figma rasterization differences at glyph edges, shadows, and raster texture sampling. The image comparison is not byte-identical: mean absolute channel difference 0.760/255; 1.394% of pixels have a channel difference above 16/255. These values are diagnostic, not an automatic visual approval threshold. No known geometry, content, asset substitution, or line-wrapping deviations remain.

## Git and runtime

Repository initialized on `feat/static-visual-parity`; no worktrees or remote were created. Phase 1 is checkpointed in a local commit. The original workspace was empty, so no user changes were overwritten.

Local server: http://127.0.0.1:5187. Port 5173 was occupied by an unrelated process and was left alone. No deployment was performed. No unresolved blockers.
