# UI exploration playground

React, TypeScript and Vite playground with five explorations: **Header**, **Date picker**, **Profile**, **Document editor**, and **Facility app**. Header is selected initially. The existing switcher supports Arrow Left/Right, Home/End, linked tab panels, roving focus and its moving indicator.

## Run and verify

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The editor loads only on its first activation and then stays mounted. No iframe, external editor server or localhost dependency is used in production.

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run preview
# Install browser binaries once when needed:
npx playwright install chromium firefox webkit
# Complete integration acceptance gate (local test server uses port 5190):
npm run audit:integration
```

The existing Vercel project deploys the repository's `main` branch. Its production alias is [expore-17.vercel.app](https://expore-17.vercel.app/). No project/build settings were changed for this integration.

## Document editor usage

- Click **Document editor** after Profile. Type directly in the proposal. Select text for Bold, Italic, Underline, Strikethrough, Text color, Highlight or Ask AI. F10/Tab enters the selection toolbar; arrows and Home/End move among its controls. Escape dismisses floating tools and restores focus. Standard editor undo/redo and rich-text clipboard behavior are supported.
- Use Search or Cmd/Ctrl+F for document search. Enter/Shift+Enter moves through results. The outline follows document headings and scrolls internally. Cmd/Ctrl+S or **Save changes** saves immediately; edits also autosave after 800ms of inactivity. Errors remain visible with retry controls. Recovery of malformed/conflicting local data requires a successful raw backup before replacement.
- The blue orb opens Explain and its approved mode. Annotated clauses and paragraph hover controls open Explain for their source text; Ask AI uses the current selection. Summary, Key points, Simplify, Rewrite, question and suggestion actions use the original deterministic local prototype. Rewrite changes the document only after **Apply** and can be undone. Cancellation and stale-source checks prevent obsolete results from applying.
- In **Comments**, enter a comment and choose **Add document comment** or **Comment on selection**. Replies, resolve/reopen and mapped quote anchors persist. Deleted anchors retain their original quote and show **Detached**. **Show quoted text** returns to an attached passage.
- In **History**, open a timestamped revision for a non-mutating preview and explicitly restore it. The current document and comments must save successfully before restoration proceeds. Revisions retain the existing deduplication and 50-snapshot limit.
- Close the editing banner or document tools with their close buttons. The orb reopens Explain. Switching among playground tabs retains content, selection context, scroll, Comments/History state and unsubmitted comment/reply/question drafts. Hidden editor shortcuts and floating surfaces are suspended; hidden pending Explain requests are cancelled. Completed results survive switching.

The editor uses its own scoped tokens, CSS modules, `Proposal Inter` font family and portal container. Source artwork, font binaries/license, October 6, 2026 date, proposal copy and the approved Scope of Work, Timeline, Budget and Next Step additions are preserved. Its gray frame and maximum 1440 × 860 app remain. At 900px viewport height the app uses 782px with internal scrolling so the existing bottom switcher never covers editor controls. Reduced-motion preferences are respected.

Persistence is local to each browser/origin under `proposal-editor:document:v1`; this is not a server-backed collaboration service. Unsubmitted drafts and Explain results survive tab switching, but reset on reload; saved document/comments/revisions survive reload. Explain is a local prototype. Navigation/authentication destinations remain demonstration interactions. The approved layout targets desktop sizes; no mobile editor redesign is included.

## Components and assets

- `src/App.tsx`, `src/components/ExplorationSwitcher.tsx`: four-tab playground and lazy, persistent editor mounting.
- `src/components/header`, `date-picker`, `profile`: existing explorations, preserved unchanged.
- `src/document-editor`: integrated production EditorApp, existing editor/selection/persistence logic, Comments and History, plus an active-state/portal boundary. Presentation fixtures were excluded.
- `public/assets/document-editor`, `public/fonts/document-editor`: original editor artwork, Inter fonts and OFL license, isolated from existing assets and `@fontsource/inter`.
- `tests/editor`: inherited Phase 2–4 functional/visual tests and cross-browser core smoke tests. `tests/integration*.spec.ts`: tab integration, lazy loading, retention, isolation and layout checks. DEV-only test adapters are removed from production builds.

[Integration QA and evidence](docs/qa/document-editor/README.md) records commands, inherited coverage, exact visual metrics and limitations. [Integration handoff](docs/handoffs/document-editor-integration.md) describes implementation boundaries and deployment verification. `node_modules`, `dist` and transient browser results are ignored.

## Design source

[Blissful Design — linked Header frame](https://www.figma.com/design/GdagXhVqcEZsgr2PAskZh6/Blissful-Design---Team-Exploration?node-id=2850-953)

Inspected through Figma MCP: root **2850:953** (`Products`), Header **2850:954**, dropdown **2850:971**, nested product/icon/text frames, referenced logo component **2780:1024**, and switcher **2855:3115**. No Date picker or Profile frames were searched or inspected. The supplied screenshot provided the overall playground and tab reference.

At the source 1440 × 900 viewport:

| Element | Figma measurement |
| --- | --- |
| Canvas | `#08090a` |
| Header | 1440 × 74; 128px horizontal padding; 20px vertical padding |
| Center navigation | x=535.5, y=20; 369 × 34 |
| Products pill | 92 × 34 |
| Authentication group | x=1146; 166 × 34; 10px gap |
| Sign up | 83 × 34 |
| Dropdown | x=340, y=65; 760 × 208; 12px radius |
| Product area | 760 × 160; 16px padding; two 348px columns; 32px between columns |
| Product card | 348 × 60; 8px padding; 12px icon/text gap; 8px between rows |
| Product icons | 44 × 44 containers; 24 × 24 exported glyphs |
| Utility row | 48px high; 14px glyphs; 32px link gap |
| Switcher | x=592, y=814; 256 × 38; 48px bottom offset |

The menu is centered relative to the Header container, matching its Figma CENTER constraint. The design contains an open Products state and a hovered AI Agent card, without separate interaction variants for the navigation or cards. Hover/focus styles extend those treatments. Figma's decorative cursor is omitted in favor of the real pointer. The measured 22px text line boxes are preserved in product cards.

## Interaction and responsive behavior

Products opens on mouse hover; clicking toggles its current state. A pointer bridge and 150ms close grace period allow travel into the menu. Outside pointer presses, Escape, and focus leaving the disclosure close it. Enter/Space toggle; ArrowDown opens and focuses the first link. Tab follows every link normally without a focus trap. Escape and prototype link activation return focus safely when needed. The nonmodal popup uses matching `aria-haspopup="dialog"` and `role="dialog"` semantics, `aria-expanded`, `aria-controls`, and `inert` while closed.

Motion uses 160ms entry, 120ms exit, and 140ms hover transitions. Reduced-motion preferences remove the dropdown transition. At narrower widths, the navigation wraps into a second row and product columns stack; no hamburger navigation is introduced. The menu is viewport-constrained and scrolls on small/short screens, reserving space for the switcher.

## Facility app — Phase 1

The fifth tab is the actual Phase 1 Afterhours / Cedar Campus application, imported from source commit `c0721e579d703765312372213c1ec7daed5e6b2e`. It loads on first activation and remains mounted, including its internal scroll position. Its source layout stays at least 1440 × 734; narrower/shorter hosts scroll inside the panel. A separate bottom area keeps the shared switcher clear of Facility controls.

AHU-03 / Library East and Sites remain the static defaults. Selection, menus, navigation, inspection/control-log panels and additional keyboard behavior belong to a later Phase 2 task. Original local artwork and Inter 3.19/OFL are preserved under `public/facility-app`; production has no source dev entry point or fixture.

[Facility handoff](docs/handoffs/facility-app-integration.md) includes the source mapping and future update path. [Facility QA](docs/qa/facility-app/README.md) records the gate, screenshots and deployment verification.
