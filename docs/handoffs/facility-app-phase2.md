# Facility app — Phase 2 closeout and Phase 3 handoff

8 October 2026 (Asia/Jakarta). **PHASE 2 COMPLETE — Gate: PASS.**

Only Phase 2 — Interaction & State was implemented. Phase 3 has not begun.

## Repository and authority

- Repository: https://github.com/stevelauda25/expore-17.git
- Actual checkout: `/Users/themustofano/ChatGPT/expore-17`. The chat's initial workspace was a different non-Git project; it was not changed.
- Initial state: clean `main`, commit `24a4a3e7caa635dfa6c20e3dcc87fdb9e5259a2c`.
- Working branch: `feat/facility-phase-2`; local Phase 2 checkpoint includes this handoff. No push, deployment, branch deletion, worktree creation, or unrelated changes.
- Primary handoff `/Users/themustofano/Downloads/FIGMA_IMPLEMENTATION_HANDOFF.md` was read completely before editing. Its historical Phase 1-only authorization was superseded by the user's explicit Phase 2 request.
- Figma design context and a fresh 1440 × 734 render were retrieved for `GdagXhVqcEZsgr2PAskZh6`, node `3061:6417`. The fresh reference has the same SHA-256 as the preserved reference: `9e5849f1f470f655d452947af81674f645e062cbc1ba57f9a452fe4d945ed7d6`.

## Implemented interactions

1. Every AHU row selects by pointer; a native row-header button selects with Enter/Space. Focusable runtime cells also support Enter/Space selection. Native table, row, column-heading and cell semantics remain intact. `aria-pressed` exposes selected state; only one selected background and green indicator exists.
2. One `selectedEquipmentId` derives the selected object from the centralized equipment array. Row treatment, selected-equipment card, schedule, coverage, footer label, Inspect label and inspection data all use it.
3. All 56 cells expose a positioned tooltip on hover/focus, including 0, 0.5 and singular 1-hour wording. Leave/blur/Escape dismiss. Resting color mapping remains untouched.
4. Inspect opens a right-side native modal dialog with equipment ID/area/type, context, booked schedule, seven daily runtime values, suspected issue, excess use, coverage and relevant log data. Close button/Escape close; initial focus, Tab/Shift+Tab containment and trigger restoration are implemented. Content scrolls within the drawer when necessary.
5. CL-203 opens a compact detail for **AHU-03**, **OV-882**, enabled **22 Sep**, end timestamp **None**, source **Manual override**. Campus finding/log stay associated with AHU-03 after other rows are selected.
6. Faults/Sites/Plans/Logs have active, hover, pressed and keyboard-focus states. Non-Sites destinations are local placeholders with Return to Sites; equipment selection persists.
7. Workspace menu: Afterhours, Cedar Campus, Account settings. Account menu: Andrew heading, Profile, Preferences, Sign out. These actions show a local prototype notice; no real account operation or external navigation occurs. Menus support keyboard activation, Arrow Up/Down, Home/End, Escape, outside dismissal and focus restoration.
8. Notifications opens “1 unresolved finding” / “AHU-03 override may still be active.”
9. Afterhours and Cedar Campus breadcrumbs return to the local Sites overview with a small dismissible context notice. Facilities retains current-page semantics.
10. One `openPopover` union coordinates workspace, notifications, account and control log; there is no redundant control-log boolean. Opening Inspect closes compact UI. Floating UI portals are rooted **inside the Facility scope**, preserving CSS and the host's hidden/inert boundary. Hiding the exploration resets transient surfaces while preserving selected equipment/navigation.
11. Restrained hover/selection/menu/drawer motion and reduced-motion overrides are implemented. The drawer uses a 210ms entrance; menus use 160ms open / 140ms close; row hover uses 120ms and selection 160ms. No layout animation or new dependencies.

## Centralized prototype data

Original row IDs, areas, runtime arrays, excess-use values, AHU-03 type/schedule/coverage, finding and log relationship are preserved. AHU-03 receives a cautious inspection summary and unverified suspected-issue description based on the supplied context.

Non-default context is explicitly local prototype data (`prototypeContext: true`), not Figma or live telemetry:

| Equipment | Type | Booked hours | Coverage | Suspected issue |
| --- | --- | --- | --- | --- |
| AHU-01 | Supply Fan | Mon–Fri 07:00–19:00; Sat–Sun 09:00–16:00 | 99% | Late shutdown |
| AHU-07 | Extract Fan | Mon–Fri 08:00–20:00; Sat–Sun 10:00–16:00 | 98% | Extended studio purge |
| AHU-04 | Supply Fan | Mon–Fri 08:00–17:00; Sat–Sun closed | 100% | Evening shutdown delay |
| AHU-05 | Extract Fan | Mon–Fri 07:00–17:00; Sat–Sun closed | 97% | Post-work ventilation |
| AHU-02 | Supply Fan | Mon–Fri 08:00–18:00; Sat 10:00–15:00; Sun closed | 99% | Short shutdown delay |
| AHU-06 | Supply Fan | Mon–Fri 08:00–18:00; Sat–Sun closed | 96% | Lecture cooldown |
| AHU-08 | Return Fan | Mon–Fri 09:00–17:00; Sat–Sun closed | 98% | Brief ventilation cycles |

## Files changed

Modified:

- `src/facility-app/App.tsx`
- `src/facility-app/FacilityAppDemo.tsx`
- `src/facility-app/components/AppShell.tsx`
- `src/facility-app/components/BottomActionBar.tsx`
- `src/facility-app/components/Breadcrumb.tsx`
- `src/facility-app/components/ContextPanel.tsx`
- `src/facility-app/components/RuntimeHeatmap.tsx`
- `src/facility-app/components/Sidebar.tsx`
- `src/facility-app/data/equipment.ts`
- `tests/facility.spec.ts` — updates obsolete static-only assertions, adds seven behavior cases, preserves source geometry/asset checks, and directs new evidence to Phase 2.
- `scripts/compare-facility.mjs` — compares the current capture with pre-Phase-2, original Phase 1 and Figma; exact pixel preservation of pre-Phase-2 is enforced.

Created:

- `src/facility-app/components/Popover.tsx`
- `src/facility-app/components/HeatmapTooltip.tsx`
- `src/facility-app/components/InspectionDrawer.tsx`
- `src/facility-app/styles/interactions.css`
- This handoff and `docs/qa/facility-app/phase2/` verification artifacts (complete list in `artifact-manifest.json`).

Existing Facility base CSS (`app.css`, `components.css`, `tokens.css`), original assets/fonts, and historical Phase 1 evidence remain unchanged. No Header, Date picker, Profile, Document editor, Product usage, shared switcher, root application, package manifest or lockfile changes.

## Verification and results

- `npm run lint`: PASS.
- `npm run typecheck`: PASS, application and browser-test types.
- `npm run build`: PASS. Existing large Document editor chunk warning remains; no bundle-size work was performed.
- `npm run test:unit`: PASS — 22 Node tests plus 21 Vitest tests (43 total).
- Functional tests: 6 cases × Chromium/Firefox/WebKit = **18 passed** (`functional-results.txt`).
- Additional hover/pressed/focus/bounds case: 3 browsers = **3 passed** (`interaction-states-results.txt`).
- Existing Facility geometry/assets/fonts/DPR/host/lifecycle cases: **24 passed** (`visual-host-results.txt`). Together these cover **45 distinct browser cases**.
- A visual inspection caught the control-log surface behind the finding card's stacking context. One focused correction moved compact surfaces to the scoped portal and added an `elementFromPoint` occlusion check. All 12 affected menu/lifecycle/motion/visibility cases passed again (`popover-recheck-results.txt`).
- Targeted canonical default recheck passed after that correction (`default-recheck-results.txt`).
- Browser checks verify every row by pointer/Enter/Space, synchronized data, all 56 tooltip values and bounds, tooltip keyboard/Escape/blur paths, every equipment drawer, focus entry/containment/return, all compact surfaces' Escape/outside-click/coordination, menu keyboard navigation, sidebar preservation, breadcrumb behavior, inactive host boundaries and reduced motion.
- Runtime monitoring: no application console errors, unexpected warnings, failed requests, missing assets or missing fonts. One known Firefox warning comes from installed `@floating-ui/react` 0.27.20 probing deprecated `MouseEvent.mozInputSource`; it is recorded in `dependency-warnings-firefox.json`, narrowly distinguished from application failures. No dependency was changed.
- No temporary Figma MCP asset URLs or stale `aria-disabled` remain in Facility source. `git diff --check` passes.

## Default-state visual gate

Canonical capture: **1440 × 734 CSS pixels, DPR 1, browser default 100% zoom**, Sites active, AHU-03 selected, all floating surfaces closed, no tooltip or pointer hover, fonts and images ready. The shared switcher was hidden with its existing shortcut solely for the canonical capture; its implementation was not changed.

The Phase 2 screenshot is **pixel-identical to the preserved pre-Phase-2 integrated screenshot: 0 changed pixels, mean absolute channel difference 0**.

Comparison with the original Phase 1 source gives the same pre-existing 131 pixelmatch differences (0.012394%) and mean channel difference 0.126628/255. Comparison with the freshly retrieved authoritative Figma gives the same pre-existing 3,337 pixelmatch differences (0.315717%) and mean channel difference 0.747829/255. These Figma numbers are diagnostic, not a relaxed acceptance threshold. The original source and integrated baseline were not byte-identical before this phase.

Canonical images, side-by-side comparisons, 50% overlays and unmasked differences were inspected. No new mismatch in shell/card/table geometry, typography, wrapping, selected row, heatmap, borders, shadows, radii, artwork or bottom bar. Major geometry/rows/cells remain within the existing 0.02px gate; original asset hashes/slots and local Inter loading pass. No canonical overflow. Screenshots of the drawer and every compact surface are included.

## Unresolved issues and blockers

No unresolved Phase 2 functional or visual defects; no blockers. Known limitations are prototype-only data/actions, existing browser/Figma rasterization differences, the recorded dependency deprecation warning in Firefox, and the existing out-of-scope build chunk warning. No authentication, backend control writes, full destination pages or new product flow were added. No claim of full screen-reader certification is made; semantics and keyboard/focus paths were verified in three browser engines.

## Git / checkpoint status

All changes are within Facility source and directly related tests, scripts, evidence and this handoff. No pre-existing user modifications existed. The completed Phase 2 work is checkpointed locally on `feat/facility-phase-2`; `git log -1` identifies the commit containing this handoff. The closing chat reports its exact hash and final working-tree status. Nothing was pushed or deployed.

## NEXT SESSION — PHASE 3 — Final Verification

Begin only in a fresh, separately authorized session. Read this handoff, the primary implementation handoff, and current Git status. Use the `expore-17` checkout on `feat/facility-phase-2`, preserving any subsequent user work. Phase 2 is complete; do not redesign or rebuild it.

Perform Phase 3 final verification only: start cleanly, verify the Figma/default render at 1440 × 734 DPR 1, confirm interactions/focus/reduced motion, assets/fonts, runtime/network, overflow and out-of-scope host preservation. Fix only observed defects. Keep the immutable original Phase 1 and pre-Phase-2 captures. Reuse `npx playwright test tests/facility.spec.ts` and `node scripts/compare-facility.mjs`, plus lint/typecheck/build and relevant existing tests. Keep portal roots within Facility; preserve the AHU-03/OV-882/CL-203 relationship and default appearance. Do not push/deploy without an explicit request.

**STOP: Phase 3 was not started in this session.**
