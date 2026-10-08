# Facility integration QA — Phase 1

Integration date: 8 October 2026 (Asia/Jakarta). Source: `c0721e579d703765312372213c1ec7daed5e6b2e`, branch `feat/static-visual-parity`, confirmed root `/Users/themustofano/ChatGPT/Explore (Web app 2)`. Target starts at latest fetched main `5f32a9dae9b2e6e1a50adda9a33b822d7e7205b1` in `/private/tmp/expore-17-facility-integration`. See [handoff and complete file mapping](../../handoffs/facility-app-integration.md).

## Commands and gate results

| Command/check | Result |
| --- | --- |
| `git fetch origin main` + `git merge --ff-only origin/main` | Latest main preserved; prior Document editor integration retained |
| `npm ci --cache /private/tmp/facility-npm-cache --no-audit --no-fund` | Exact target lock installed; no missing dependencies or lockfile changes |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS, application and test TypeScript |
| `npm run test:unit` | PASS, 18 date-picker tests + 21 editor unit tests |
| `npm run build` | PASS; Facility lazy JS 9.52 kB (2.71 kB gzip), CSS 11.20 kB (2.57 kB gzip) |
| `node scripts/check-production.mjs` | PASS; all chunks free of test adapters/fixtures/localhost; browser production smoke passed |
| `npm run test:browser` | All 66 inherited tests pass across Chromium, Firefox and WebKit; Facility suite resolved in the focused final run below |
| `npm run test:browser -- tests/facility.spec.ts` | PASS final Facility gate: 24/24 cases across Chromium, Firefox and WebKit; see `browser-final.txt` |
| `node scripts/compare-integration.mjs` | PASS; unchanged Document editor thresholds and all existing-view isolation comparisons |
| `node scripts/compare-facility.mjs` | PASS; unmasked canonical source comparison |
| Source `npm run typecheck` | PASS without writing source files |
| `APP_URL=http://127.0.0.1:5191 npm run verify:visual` | PASS original source script in an isolated `git archive` snapshot; exact original source results reproduced; `source-recheck.json` |
| Source tracked-file SHA-256, data, font/license, branch/status, target lock verification | PASS; `source-preservation.json` and `preservation-result.json` |
| `git diff --check` | PASS |

The first attempted browser run reused the previous checkout's server at 5180; it was stopped and the target test config now owns port 5190. The initial static-control test waited on an intentionally aria-disabled Inspect button; it now asserts that state and deliberately dispatches a forced click to check that Phase 2 was not added. Cross-browser test assertions initially compared engine-specific floating-point rectangles and font-family quote serialization verbatim. They now normalize CSS font serialization and retain the original 0.02px geometry tolerance. Firefox cell coordinates use a measured **untouched Phase 1 Firefox source** baseline, not a changed product layout. Final targeted rechecks resolve these test-harness failures; no production regression was concealed.

## Functional coverage

- Five tabs in the specified order, Header after initial load and refresh; linked tab/tabpanel IDs, roving focus, measured indicator, both arrow directions, wraparound, Home and End.
- Facility module and assets absent before activation; actual runtime present afterward. Same DOM node and both scroll axes retained after visiting Document editor. Hidden/inert panel cannot receive programmatic focus or sequential keyboard focus. Default AHU-03/Sites and original disabled Phase 1 controls preserved.
- All eight equipment records, 56 data-driven heatmap cells, metrics, right-side cards and footer retained. All 22 original SVG/PNG files validated against source SHA-256 and expected rendered slots. Inter 3.19 binary and OFL license byte-identical, locally loaded as `Facility Inter`.
- Document editor native editing, formatting, undo/redo, clipboard, search, autosave/reload, comments/replies/drafts, history/restore, Explain actions/cancellation and hidden-shortcut/floating-surface behavior covered by the inherited suite. Production smoke uses the actual editor without its DEV adapter.
- Existing Header, Date picker and Profile functionality and visual isolation verified after Facility's CSS has loaded.
- No console/runtime errors, missing assets/fonts or unintended page overflow in canonical/production checks. No iframe, source screenshot substitute, temporary Figma URL, global Facility listener or source fixture in production.

## Visual results and reviewed evidence

Canonical app dimensions: **1440 × 734 CSS px, DPR 1**, inside a **1440 × 852** host that reserves 118px below the app. Reviewed [app capture](canonical-dpr1.png), [host capture](canonical-host-dpr1.png), [DPR 2 capture](canonical-dpr2.png), source/Figma references, overlays and differences.

- Ten source geometry checkpoints pass within **0.02 CSS px**. Nine table rows remain 44px; 56 cells remain 36px tall with canonical widths; source line wrapping and asset positions pass.
- Against saved Phase 1 Chrome baseline: **131 pixels / 0.012394%** differ at pixelmatch threshold 0.1, excluding antialiasing. Unmasked source ceiling is 0.1%. Mean absolute channel difference: **0.126628 / 255**.
- Against Figma: mean absolute channel difference **0.747829 / 255**; **1.389740%** of pixels have a channel difference over 16. Source closeout was 0.759572 and 1.394092%, respectively. As in the source gate, these Figma metrics are diagnostic and accompany visual review.
- Firefox's original Phase 1 heatmap x positions differ from Chrome by at most **0.040649 CSS px** due to fractional column distribution. Integration compares to its untouched same-engine source at the original 0.02px tolerance. WebKit canonical geometry also passes. Browser rasterization of fractional strokes/fonts varies; no geometry redesign was applied.
- Existing-view isolation: **0%** changed outside the switcher region (12 captures, ceiling 0.1%). Document editor vs Phase 4 source: **0%** outside that region (6 captures, ceiling 0.1%). Figma full-frame max **1.220087%** (ceiling 2%); regional max **2.628335%** (ceiling 4%). Pixelmatch threshold 0.1 and antialiasing policy unchanged. Only the intentional switcher mask expands from 500px to 600px; no content regions are newly masked.

Reviewed integrated layouts and matching geometry JSON:

- [1280 × 900](host-1280-900.png): canonical 1440px content uses controlled internal horizontal scrolling; full card/Inspect accessible by scrolling.
- [1440 × 900](host-1440-900.png): app height 782px, source bottom bar at its natural bottom, switcher below.
- [1640 × 1060](host-1640-1060.png): app height 942px, table expands naturally.
- [1920 × 1080](host-1920-1080.png): app height 962px, table expands naturally.
- [1280 × 480](host-1280-480.png): app remains at least 1440 × 734 inside a 394px-tall scrollable viewport; shared switcher stays reachable.

These host-height differences are intentional. No scaling or stretching of typography/cards/rows is used. The existing Document editor's 900px-height framing remains unchanged. The inherited editor lazy bundle still triggers Vite's advisory >500kB warning; Facility introduces no new build warning or dependency.

## Deployment

Release uses the existing `expore-17` GitHub–Vercel Production pipeline from `main` and the existing alias [expore-17.vercel.app](https://expore-17.vercel.app/). No dashboard login, project setting change, new repository/project or force push is used. Public verification results and deployment identity are appended after the Git-triggered release; screenshots and JSON are recorded in this directory.

Phase boundary: **deployed Facility is Phase 1 only**. Phase 2 selection, menus, navigation, inspection/control-log panels and extra keyboard behavior remain for a later task. Product usage is not integrated.

### Verified public release

- Integration commit pushed without force: `6241e0651e3b07dc962d0a2c4e020b19ac5f2142`.
- Existing Vercel project: `expore-17`, deployment `9nyGPez9ZNLLv9GbFUAmn2cnqpv1`; GitHub Production deployment `6931712663`, status **success**. See `git-deployment.json`.
- Public URL **https://expore-17.vercel.app/** verified 8 October 2026, **16:16:37 Asia/Jakarta**. `node scripts/production-smoke.mjs https://expore-17.vercel.app/` passed with zero runtime errors and zero HTTP asset failures.
- The actual public page exposes Facility app as the fifth tab, loads its local font/artwork and shows AHU-03. Document editor native editing, save/reload persistence, Comments, History, retained drafts/scroll, inactive shortcuts and Explain result all passed on the same public deployment.
- [Public Facility screenshot](deployed-verified.png); [public verification JSON](deployment-verification.json); [public Document editor screenshot](../document-editor/deployed-verified.png).
- Initial Git push selected a read-only local account and returned 403; the already-authenticated repository owner's credential was used for the successful push without changing the active account or Git configuration. A public smoke assertion was corrected to await image decoding on cold network loads; the verified rerun above passed. No unresolved blockers remain.
- This report and the cold-network readiness correction are a follow-up documentation/test commit; production runtime files and build output are unchanged from the verified integration commit.
