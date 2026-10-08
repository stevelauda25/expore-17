# Product Usage local integration — 2026-10-08

## Checkout and scope

- Repository: `/Users/themustofano/ChatGPT/expore-17`
- Branch: `main`
- Fast-forwarded from `394ae6803d36a3a7a2b9be5c6abf6e89c8ce9293` to origin/main `6dee68653ad7ef31a1cfa01035ea40037b5c1e01`.
- The existing checkout was clean. No re-clone, reset, discarded user work, commit, push, PR, merge, deployment, or production modification.
- Source prototype: `/Users/themustofano/ChatGPT/Explore (Web app)`; preserved in place.
- Local preview: `http://127.0.0.1:5191/` (select **Product usage**). Restart with `npm run dev -- --host 127.0.0.1 --port 5191`.

## Implementation

The existing six-tab order is Header → Date picker → Profile → Document editor → Facility app → Product usage. Product Usage uses the host's existing lazy/Suspense, visited-state, hidden/inert tabpanel pattern and remains mounted after first activation. There is one React root, no iframe, no nested app package or Vite setup, and no navigation reload.

The source is a dependency-free vanilla DOM prototype. `src/product-usage/ProductUsageDemo.tsx` provides the React lifecycle boundary; its static local `template.html` and `controller.js` preserve the source markup and interactions. The adapter scopes DOM queries, releases global listeners/observers/timers on cleanup, gates global listeners while inactive, refreshes existing segmented indicators after font load/reactivation, and handles WebKit's focusable-tabpanel behavior during popup pointer clicks. The wrapper does not create another React root.

`data.js`, `feature-details.js`, `figma-artwork.js`, `product-usage.css`, `controller.d.ts`, and the source data tests are colocated in `src/product-usage/`. CSS selectors are scoped to `.product-usage-demo`; root typography, rendering defaults, custom properties, font face and animation names are isolated without changing the source values. Fixed popups retain their source z-index and placement. Product Usage content scrolls separately with clearance measured from the shared switcher's actual height.

All 36 source asset/manifest files are copied byte-for-byte to `public/product-usage/assets/`. Runtime asset references use this permanent local namespace. The exact SF Pro file and accompanying license are copied to `public/product-usage/fonts/`, remain Git-ignored, and match the source bytes. See that directory's README for checkout portability.

## Existing files changed

- `src/App.tsx`: lazy import, visited state, and accessible Product Usage panel.
- `src/components/ExplorationSwitcher.tsx`: sixth union member/config entry; observe container wrapping and expose measured height. The existing shared indicator, tab dimensions, colors, shadows, typography, keyboard logic, transitions, and reduced-motion handling remain intact.
- `src/styles.css`: Product Usage host framing and extension of the switcher's existing wrap breakpoint to fit six original-size tabs.
- `.gitignore`: local SF Pro/font-license exclusions.
- `package.json`: include the four inherited Product Usage data tests in `test:unit`.
- `playwright.config.ts`: run Product Usage regressions in Chromium, Firefox and WebKit.
- `tests/integration.spec.ts`, `tests/facility.spec.ts`: update last-tab/keyboard assumptions for six tabs.
- `tests/integration-visual.spec.ts`: load Product Usage before existing-page CSS isolation checks.
- `scripts/production-smoke.mjs`: six-tab and Product Usage checks for the **local build**.
- `scripts/compare-integration.mjs`: widen the existing switcher-only mask from 600 to 660px for the sixth label. All comparison thresholds and page-content regions are unchanged.
- Added `tests/product-usage.spec.ts`: nine cases per browser, covering navigation, state persistence, lazy loading, visibility/inert behavior, font/layout, all chart segments and tooltip connectors, search, all six hover-only popup variants, menus/export, and 360–1200px switcher fit.

No existing Header, Date picker, Profile, Document editor or Facility app feature source or design files changed. No dependencies were added, upgraded or removed; `package-lock.json` is unchanged.

## Verification

Baseline: `npm ci`, lint, typecheck, build, 39 unit tests and 12 Chromium integration/browser tests passed before source changes. The source prototype's syntax check and four data tests passed.

Final: `npm run audit:integration` **passed**: lint, typecheck, 43 unit tests, build, local bundled-build smoke, all 117 browser tests (Chromium, Firefox, WebKit), editor/host visual comparisons, and Facility comparisons. Results and full logs are preserved under `docs/qa/product-usage.local/` (ignored local evidence).

The four original prototype browser suites were also run against the integrated page, adapting navigation, asset namespaces, scoped comparison markup and the scroll-container hover harness. They passed all source assertions, including all six feature popup fixtures, exact shadows/strokes/geometry, proportional action data, animated sliding controls, hover/focus search borders, CSV export, and tooltip connector/dot positioning. The inherited harness excludes only the host's pre-existing automatic favicon request.

A direct same-browser before/after screenshot comparison at 1200 × 900 found zero differing pixels for Product Usage's default, AI popup and chart tooltip content regions. The five host pages also had zero differences outside the intentionally changed switcher. Source/integrated WebKit popup geometries match exactly. Asset and font byte equality is recorded in `asset-preservation.json`.

Manual in-app browser QA traversed all six pages forward and backward, used End to return to Product Usage, exercised Day/Week/Month, Features/User segments and search, and left Product Usage open. No new application runtime errors or React warnings were found.

## Preserved limitations and baseline notices

- SF Pro remains local and Git-ignored as in the source. Another checkout needs the same local font/license files to reproduce the exact typography. It was not substituted with Inter.
- WebKit's source AI description wraps to three lines (353px popup versus 332px in Chromium); this is preserved and covered by an engine-specific source expectation.
- The host already omits a favicon, so Chrome may log an automatic `/favicon.ico` 404. Firefox emits existing React/browser deprecation warnings (`Window.fullScreen`, `InstallTrigger`), and Motion may emit its reduced-motion notice. These are documented, not redesigned or broadly suppressed in application code.
- `npm ci` reported one existing high-severity dependency advisory; the existing editor bundle still triggers Vite's >500kB warning. No unrelated dependency changes were made.
- The inherited User segments view remains its existing empty state; all data and actions remain local prototype behavior.
