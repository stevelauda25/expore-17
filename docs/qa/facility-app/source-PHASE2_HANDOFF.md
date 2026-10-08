# NEXT SESSION HANDOFF — Phase 2: Interaction & State

Continue in a fresh session in `/Users/themustofano/ChatGPT/Explore (Web app 2)` on branch `feat/static-visual-parity`. Inspect Git status and preserve any new user changes. Phase 1 is complete; do not restart discovery or redesign the screen.

Read `README.md`, `docs/PHASE1.md`, and `verification/gate-report.json`. Preserve `verification/phase1-baseline.png` as the immutable default-state baseline. Source of truth: Figma file `GdagXhVqcEZsgr2PAskZh6`, node `3061:6417`, 1440 × 734. Load the Figma design-to-code skill before refreshing MCP context.

Add behavior WITHOUT changing the approved Phase 1 resting appearance. Use the existing React/TypeScript/Vite and plain CSS structure, local assets, Inter 3.19, and typed equipment data. Keep dependencies minimal. No worktrees are needed.

Model selectedEquipment, activeNav, openPopover, inspectionDrawerOpen, and controlLogOpen locally. Default: Sites, AHU-03 / Library East, all overlays closed.

Implement row/keyboard selection that updates the row indicator, selected-equipment context, footer and Inspect label; compact heatmap tooltips; restrained hover/focus/pressed states; workspace, notification and Andrew popovers; minimal sidebar and breadcrumb navigation preserving selection; an inspection drawer; and CL-203 details for manual override OV-882 enabled 22 Sep with no end timestamp. Keep the campus-level finding associated with AHU-03. Add sensible mock context for other equipment where needed.

Remove `aria-disabled="true"` as each control gains behavior. Support Escape, outside-click dismissal where appropriate, focus return, appropriate menu/dialog semantics, and reduced motion. Use 120–180ms row/menu transitions and 180–240ms drawer transitions without layout shifts.

Build the complete interaction layer before its gate. Test every major interaction deliberately, run the build/typecheck, check console/network errors and clipping, then perform one focused default-state visual regression audit against BOTH the preserved Phase 1 baseline and Figma. `npm run verify:visual` uses Chrome and a running server on port 5187; `APP_URL` overrides it. Do not overwrite `phase1-baseline.png`.

At the Phase 2 gate, correct identified issues, checkpoint the result, report files/checks/deviations/Git status, produce a Phase 3 handoff, and STOP. Do not begin Phase 3 in that session.
