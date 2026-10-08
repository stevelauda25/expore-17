# Facility app integration handoff — Phase 1 only

The real Phase 1 Facility app is the fifth playground tab after Document editor. Header remains the initial tab. Phase 2 and Product usage are not included.

## Provenance and checkout

- Source root confirmed with `pwd` and Git: `/Users/themustofano/ChatGPT/Explore (Web app 2)`.
- Source branch `feat/static-visual-parity`, commit `c0721e579d703765312372213c1ec7daed5e6b2e`.
- Read the original Phase 0 implementation plan in chat `01a116aa-bdd3-7f62-9e8c-9cb625e4fbbc`, source README, Phase 1 closeout, saved Phase 2 next-session handoff, geometry/asset/font manifests, and saved visual evidence. The later Phase 1 opacity/font corrections supersede the original plan's estimates. No applicable AGENTS.md exists at source/target or their parent paths.
- Previous `/private/tmp/expore-17-document-editor` checkout had the correct origin but two untracked deployment-evidence files; it was preserved.
- Separate checkout: `/private/tmp/expore-17-facility-integration`, origin `https://github.com/stevelauda25/expore-17.git`. Seeded from existing local Git objects after a stalled network clone, then fetched and fast-forwarded to latest `origin/main`: `5f32a9dae9b2e6e1a50adda9a33b822d7e7205b1`. No source files, branch or commits changed.

## Runtime boundary

`src/App.tsx` uses `React.lazy` for `FacilityAppDemo`, activated only after the first visit and retained thereafter. Its tabpanel uses both `hidden` and `inert`. The switcher keeps the existing indicator measurement, roving focus, wrapping Arrow keys and Home/End behavior; End now correctly lands on Facility.

The Facility scope owns its CSS resets, tokens (`--facility-*`), font (`Facility Inter`), IDs, local asset paths, and scroll container. The source application shell, components, data, copy, default selection and aria-disabled controls are preserved. No global shortcuts, portals, menus or other floating surfaces exist in source Phase 1. `active` is passed into the boundary and exposed as `data-facility-active` for the later interaction integration.

Source minimum dimensions remain 1440 × 734; wider desktop layouts expand the table naturally. The app receives viewport height minus 118px (86px at heights ≤500px), reserving the existing switcher and clearance. The source `100dvh` shell height becomes `100%` of this host. Short/narrow hosts scroll internally; there is no UI scaling or page overflow. At a 1440 × 852 host, the app is exactly the canonical 1440 × 734.

Document editor production code is untouched. Its existing retained state, autosave, activity/portal boundary, hidden shortcut handling and Explain cancellation remain in place. Existing views' application geometry and styles are unchanged. Tests intentionally account for the larger shared switcher only.

## Source-to-integration mapping

| Source | Target | Adaptation |
| --- | --- | --- |
| `src/App.tsx` | `src/facility-app/App.tsx` | Unchanged |
| `src/data/equipment.ts` | `src/facility-app/data/equipment.ts` | Unchanged |
| `src/components/AppShell.tsx` | `src/facility-app/components/AppShell.tsx` | Unchanged |
| `src/components/BottomActionBar.tsx` | `src/facility-app/components/BottomActionBar.tsx` | Unchanged |
| `src/components/Breadcrumb.tsx` | `src/facility-app/components/Breadcrumb.tsx` | Unchanged |
| `src/components/MetricSummary.tsx` | `src/facility-app/components/MetricSummary.tsx` | Unchanged |
| `src/components/RuntimeHeatmap.tsx` | `src/facility-app/components/RuntimeHeatmap.tsx` | Prefix label IDs with `facility-` |
| `src/components/ContextPanel.tsx` | `src/facility-app/components/ContextPanel.tsx` | Prefix label IDs; relocate PNG URLs |
| `src/components/Icon.tsx` | `src/facility-app/components/Icon.tsx` | Relocate SVG URLs |
| `src/components/Sidebar.tsx` | `src/facility-app/components/Sidebar.tsx` | Relocate logo URL |
| `src/styles/tokens.css` | `src/facility-app/styles/tokens.css` | Scope root, prefix tokens, rename font/path; explicitly restore source text rendering and light color scheme |
| `src/styles/app.css` | `src/facility-app/styles/app.css` | Scope every selector/reset, prefix tokens; host-relative shell height |
| `src/styles/components.css` | `src/facility-app/styles/components.css` | Scope selectors and prefix tokens |
| `public/assets/figma/*` | `public/facility-app/assets/figma/*` | All 22 binaries unchanged |
| `public/fonts/*` | `public/facility-app/fonts/*` | Inter 3.19 binary and OFL unchanged |
| `verification/*` | `docs/qa/facility-app/source/*` | Immutable source evidence, never served as application UI |
| `docs/PHASE1.md`, `docs/PHASE2_HANDOFF.md` | `docs/qa/facility-app/source-PHASE1.md`, `source-PHASE2_HANDOFF.md` | Historical reference only |
| `src/main.tsx`, root config, favicon, source scripts/dev dependencies | Not copied into production | Target entry/build/test setup retained |
| New host boundary | `src/facility-app/FacilityAppDemo.tsx`, `host.css`, host rules in `src/styles.css` | Lazy runtime, scoped internal scrolling and switcher clearance |

No runtime or development dependency was required; package-lock.json remains unchanged. Source's React code compiles under target React/TypeScript/Vite versions. The audit script now includes Facility pixel comparison; Playwright uses dedicated port 5190 to avoid the previous integration server.

## Future Phase 2 incorporation

Start a separately authorized Phase 2 task in the original Facility source workspace, using its saved handoff. Finish and gate that source phase before integrating its diff from `c0721e5` into the mapped target files. Do not overwrite the target root configuration or other explorations.

Retain the scoped font/assets/tokens and host-relative layout when porting changes. Add interaction state inside the retained Facility runtime. Any new document/window listeners must subscribe only while `active`; dismiss or suspend transient floating UI when inactive. New portal containers must live inside `.facility-app-scope` and the hidden/inert panel, with the same tokens/font. Test cancellation and focus return on tab changes. Re-run the source default-state comparison and the full inherited target gate, including Document editor, before the next Git-linked deployment.

## Deployment and evidence

Use only the existing `expore-17` GitHub → Vercel production pipeline on main, without force push or project setting changes. See [QA report](../qa/facility-app/README.md) and its deployment verification JSON/screenshots for the final public verification. This integration stops at Phase 1.
