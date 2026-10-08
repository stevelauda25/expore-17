# Document editor integration handoff

The completed source Phase 4 editor has been integrated as the fourth exploration in `stevelauda25/expore-17`. Source work was preserved in place; implementation took place in a separate checkout. Header remains the initial tab.

## Integration boundaries

- The switcher adds `document-editor` after Profile and reuses its existing measured indicator, roving focus, arrow/Home/End handling and ARIA tab relationships.
- `React.lazy` loads `DocumentEditorDemo` on the first activation. Its EditorApp remains mounted afterward inside a hidden/inert tab panel. Document, selection, scroll, comments and panel drafts retain their original controllers and state.
- `EditorEnvironment` supplies active state and an editor-owned portal root. Save/search/formatting document listeners suspend while inactive. Pending Explain requests abort without destroying the completed result/source context. Question drafts live above the transient popover.
- The formatting BubbleMenu remains mounted. Remounting it around an existing selection triggered its library cleanup frame to detach a newly shown menu under StrictMode; explicit hiding avoids that lifecycle race while preserving the original toolbar APIs.
- CSS modules remain; global resets/tokens are scoped to `.document-editor-scope`. Inter is renamed `Proposal Inter` and uses unmodified source font binaries/license. Floating portals inherit the same scope. No existing exploration CSS or component behavior changed.
- `App.tsx` inside the editor accepts a required production runtime; unused presentation fallback paths were removed. No source fixture entry points are copied. The inherited DEV adapter remains compile-time gated; production scanning and browser checks verify it is inert/absent.
- App size stays at most 1440 × 860, measured columns remain 54/246/300px with a flexible center, and the existing bottom switcher retains its desktop positioning. At 900px height the app is 782px tall; at 640px/480px additional internal scrolling and floating bounds preserve access to both UI layers.
- All pre-existing lockfile resolutions remain unchanged. Only missing editor/runtime and test dependencies were added. The TypeScript parameter-property syntax in DocumentStore was expanded to match the target's existing `erasableSyntaxOnly` policy; persistence behavior is unchanged.

## Supported behavior and limits

Editing/formatting/undo, native clipboard, search, outline, autosave/errors/recovery, Explain/cancellation/staleness, comments/replies/resolution/detached anchors, revision preview/guarded restoration and source close controls retain the completed Phase 4 behavior. See [usage](../../README.md) and [QA](../qa/document-editor/README.md).

Persistence is browser/origin local. Reload begins on Header, with the saved editor loaded when activated. Transient drafts, dismissed controls and Explain results are not persisted across reload. Explain is deterministic local prototype logic; there is no multi-user backend or mobile editor redesign. Source font rasterization differences from Figma remain documented. The lazy editor chunk still exceeds Vite's advisory 500kB threshold.

## Deployment

The repository already uses Vercel's Git integration for Production from `main`, with alias https://expore-17.vercel.app/ and project `expore-17` in `eng-5163s-projects`. No Vercel project/configuration changes or new repository were made. Push is non-forced. GitHub deployment records and the actual public alias are the verification sources.

Direct dashboard inspection was unavailable: automatic approval review rejected a Vercel plugin login redirect into Google account content outside the authorized scope. The existing Git-linked setup was preserved, with no further login attempt.

The deployment commit/status and public-browser evidence are recorded in the accompanying QA evidence and final delivery report.
