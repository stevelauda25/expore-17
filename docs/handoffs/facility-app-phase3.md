# Facility app — Phase 3 final verification

8 October 2026 (Asia/Jakarta). **PHASE 3 COMPLETE — Gate: PASS — READY FOR REVIEW.**

## Baseline and scope

This fresh session read the complete primary implementation handoff (the Downloads copy is identical to the copy in Explore Web app 2) and `docs/handoffs/facility-app-phase2.md` before inspecting implementation. The initial chat workspace did not contain these files. The verified repository was `/Users/themustofano/ChatGPT/expore-17`, remote `https://github.com/stevelauda25/expore-17.git`, clean branch `feat/facility-phase-2`, HEAD `e8566ea`.

Dependencies were installed and `npm ls --depth=0` reported a valid installation, so `npm ci` was unnecessary. The unmodified committed application started successfully on a newly started local Vite server. Baseline lint, typecheck, 43 unit tests, production build and all 45 existing Facility browser cases passed before the product correction.

Only Facility final verification was performed. No redesign, new product behavior, data/copy changes, shared-shell changes or work on other explorations occurred. Earlier handoff phase restrictions were superseded only by the explicit Phase 3 request.

## Finding and focused correction

**Verified defect:** Andrew's account button occupies `(0, 686, 180, 48)` at the canonical viewport. Its inherited 2px outline with 3px outward offset extended outside the viewport, clipping the keyboard focus ring. The added continuous keyboard pass and a screenshot reproduced this.

**Fix:** one scoped rule in `src/facility-app/styles/interactions.css` sets `.account-area:focus-visible { outline-offset: -3px; }`. The full focus ring now fits inside the button. This changes only keyboard focus appearance; resting geometry, assets and styles remain unchanged. There were no other verified application defects.

The initial supplemental test run also exposed audit-harness assumptions: a synchronous color assertion sampled the normal row transition before completion; menu arrow keys could run before asynchronous focus entry; programmatically establishing the first control did not necessarily enter keyboard modality; macOS WebKit's default Tab behavior skips native buttons. The tests now await CSS/focus outcomes and establish actual keyboard focus. The WebKit traversal uses its Option+Tab / Option+Shift+Tab full-navigation shortcuts. No app changes were made for these test-environment effects. Initial results and the confirmation run remain in the evidence directory for transparency.

Workflow completed: baseline verification → findings → one focused product correction → targeted recheck → final gate. The targeted recheck passed all 12 additional browser cases.

## Visual verification

A fresh Figma MCP screenshot was fetched directly from file `GdagXhVqcEZsgr2PAskZh6`, node `3061:6417`, at its native 1440 × 734 size. SHA-256: `9e5849f1f470f655d452947af81674f645e062cbc1ba57f9a452fe4d945ed7d6`. It is identical to the preserved authoritative reference. No implementation screenshot substituted for Figma.

Final canonical capture: 1440 × 734 CSS px, DPR 1, default browser zoom 100%, Sites active, AHU-03 / Library East selected, all floating UI closed, no pressed/hover state, pointer away, fonts and images loaded. The existing switcher shortcut hid the shared overlay solely for capture.

| Reference | Exact changed pixels | Pixelmatch differences | Mean absolute RGB difference / 255 |
| --- | ---: | ---: | ---: |
| Protected pre-Phase-2 integrated default | **0** | **0** | **0** |
| Accepted Phase 2 default | **0** | **0** | **0** |
| Original Phase 1 source | 111,496 | 131 (0.012394%) | 0.126628 |
| Fresh Figma source | 155,772 | 3,337 (0.315717%) | 0.747829 |

The original Phase 1/Figma differences are unchanged from Phase 2. Pixelmatch uses the existing threshold 0.1 and excludes antialias-only differences; exact counts and mean differences are also recorded, so these diagnostic counts do not imply literal Figma pixel identity. No threshold was relaxed or region masked. Both protected integrated defaults are enforced with exact zero-change assertions.

The visual audit followed the requested order: overall canvas, sidebar, breadcrumb, heading, metrics, runtime table bounds, columns, row heights, selected indicator, heatmap colors, right cards, AI artwork, equipment card, review context, bottom bar, then typography, wrapping, original icons/assets, borders, radii, shadows, gradients and 0.5px strokes. Side-by-side, 50% overlay and unmasked difference images were inspected. Major region/row/cell geometry remains within the existing 0.02px source gate. Canonical wrapping remains unchanged. DPR 2 and the existing larger/narrower host checks also pass. Controlled narrow-host and drawer scrolling remain intentional.

## Functional and accessibility results

Final Facility suite: **57 / 57 cases passed**, 19 each in Chromium, Firefox and WebKit.

- All eight rows select by pointer, Enter and Space; exactly one selected row and green indicator; selected card, schedule, coverage, footer, Inspect label and context remain synchronized without geometry movement. Campus finding remains AHU-03-specific.
- All 56 heatmap cells, including 0, 0.5, 1, 2, 3, 4, 5 and 10, retain source colors and correct tooltip content. Hover/leave, focus/blur, Escape, bounds and stable table geometry pass.
- Every equipment drawer contains the correct type, area, schedule, daily runtime, issue, excess use and coverage. AHU-03 includes the relevant log; other equipment does not inherit stale log data. Close button, Escape, modal focus entry/containment and trigger restoration pass. Backdrop blocks interaction with underlying content. The drawer intentionally remains open on backdrop click and closes with Escape or its close button. Its final fact remains reachable through internal scrolling with no horizontal overflow.
- CL-203 remains associated with AHU-03 and OV-882, enabled 22 Sep, end timestamp None, source Manual override. Open, outside click, Escape, focus restoration, placement and non-occlusion pass.
- Faults, Sites, Plans and Logs retain their hover, pressed, visible-focus and active states. Placeholders remain minimal. Selection survives leaving/returning and switching explorations.
- Workspace contains Afterhours, Cedar Campus and Account settings. Notifications contain “1 unresolved finding” and “AHU-03 override may still be active.” Account contains Andrew, Profile, Preferences and Sign out. Every menu action is exercised, including keyboard activation and focus return. Account actions remain prototype notices.
- Both breadcrumb buttons work by pointer and keyboard, retaining Facilities as current page.
- Full workspace → notifications → account → control log → Inspect sequence passes with normal and reduced motion. Previous compact surfaces dismiss; repeated Escape is predictable. Outside-click dismissal and restoration pass on all compact surfaces.
- Continuous forward/reverse keyboard traversal covers all **75 Facility controls** with visible, unclipped focus, all rows reached, keyboard selection, Inspect activation, drawer containment and return. Chromium/Firefox use Tab/Shift+Tab; macOS WebKit uses Option+Tab equivalents to include native buttons under its default preference. Enter, Space, Escape, menu Arrow/Home/End paths pass. No dead `aria-disabled` remains.
- Reduced motion suppresses CSS animation/transitions and menu translation while preserving selection, menus, popovers, tooltips and the drawer. Normal drawer entrance remains 210ms. No layout movement is introduced.

Semantics and keyboard/focus behavior were verified; this is not a full assistive-technology or WCAG certification. Native table and modal semantics remain intact.

## Fonts, assets, console and network

Chromium's `CSS.getPlatformFontsForNode` reports custom **Inter** / **Inter_Medium**, rather than a fallback, for heading, booked schedule, row button and metric value. Computed weights are 400 and 500. Local Inter 3.19 checksum matches the source manifest: `85f08b5f51e36ca7e961a033c6bb61d7f0e44aa0984646383ecac648e98fdcc8`; its license is present.

All original visible SVG/PNG asset hashes, loaded instances and expected slots pass. All protected source assets and Phase 1/Phase 2 evidence remain byte-identical. Facility source contains no HTTP URLs, temporary Figma asset URLs or stale aria-disabled controls. No broken images, failed asset/font requests, 404s, meaningful console errors, unexpected React warnings or runtime exceptions were recorded in the browser gate.

Known non-blocking warnings are kept separate: Floating UI 0.27.20's Firefox `MouseEvent.mozInputSource` deprecation, the existing large Document editor production chunk warning, and the test runner's NO_COLOR/FORCE_COLOR environment warning. No dependencies or out-of-scope bundles were changed.

## Final technical gate

| Check | Result |
| --- | --- |
| Clean committed app startup | PASS |
| Lint | PASS |
| Application and browser-test typecheck | PASS |
| Unit tests | PASS — 22 Node + 21 Vitest = 43 |
| Facility browser tests | PASS — 57 across three engines |
| Production build | PASS; existing chunk warning only |
| Exact protected default regression | PASS — zero pixels |
| Keyboard/focus and reduced motion | PASS |
| Assets/fonts, console/network, overflow | PASS |
| `git diff --check` | PASS |
| Other explorations and prior evidence unchanged | PASS |

## Changed files and evidence

- `src/facility-app/styles/interactions.css`: the account focus-outline correction only.
- `tests/facility.spec.ts`: optional `FACILITY_QA_OUTPUT`, supplemental final verification cases, shared console monitoring for them, and transition-aware selected-color assertion.
- `scripts/compare-facility.mjs`: optional output directory and explicit protected Phase 2 comparison in addition to pre-Phase-2, Phase 1 and Figma.
- `docs/handoffs/facility-app-phase3.md`: this final report.
- `docs/qa/facility-app/phase3/`: final captures, geometry, comparison images, font/source audits, keyboard results and gate logs. `artifact-manifest.json` lists all evidence with checksums.

Reproduce from the repository root:

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run build
FACILITY_QA_OUTPUT=docs/qa/facility-app/phase3 npx playwright test tests/facility.spec.ts
FACILITY_QA_OUTPUT=docs/qa/facility-app/phase3 node scripts/compare-facility.mjs
```

The output directory and saved fresh Figma reference are checked in. The comparison never updates historical baselines when invoked with the Phase 3 output directory.

## Git and final status

Branch remains **`feat/facility-phase-2`**. Initial parent was **`e8566ea`**. A clean local Phase 3 commit contains this report, the verified focus fix, tests and evidence; use `git log -1 --oneline -- docs/handoffs/facility-app-phase3.md` to identify its hash. The closing response records the exact hash and confirms post-commit working-tree status.

No unresolved in-scope defects or blockers remain. Residual limitations are the existing prototype-only context/actions, prior browser/Figma rasterization differences, documented harmless warnings, macOS WebKit's keyboard-navigation preference and the absence of a full screen-reader certification. Mobile redesign and real authentication/backend controls remain outside scope.

**Nothing was pushed or deployed. No PR was created. Other explorations were untouched. STOP: Phase 3 final verification is complete.**
