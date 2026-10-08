# Document editor integration QA

Integration of the completed Phase 4 source into the existing `stevelauda25/expore-17` playground. The source project was preserved. Work started from `394ae6803d36a3a7a2b9be5c6abf6e89c8ce9293` in a separate checkout. See [handoff](../../handoffs/document-editor-integration.md), [usage](../../../README.md), and the [source Phase 4 handoff copy](source-phase-4-handoff.md).

## Reproduce the acceptance gate

```sh
npm ci
npx playwright install chromium firefox webkit
set -o pipefail
npm run audit:integration 2>&1 | tee docs/qa/document-editor/audit.log
```

The single gate runs ESLint, TypeScript (including tests), inherited Date picker unit tests, editor unit tests, production build, static/runtime production isolation, the complete inherited/integration browser suite, and pixel comparisons. Playwright uses port 5180 and a single worker. The built-app check serves `dist` on a temporary loopback port and closes that server afterward. The public deployment smoke is independently repeatable:

```sh
node scripts/production-smoke.mjs https://expore-17.vercel.app
```

That smoke uses an isolated browser profile and saves only origin-local test data; it does not change a server document or a user's existing browser data.

## Coverage and results

| Check | Result / evidence |
| --- | --- |
| ESLint and application/test TypeScript | Passed; [audit.log](audit.log). |
| Unit tests | 18 inherited Date picker tests + 21 editor tests passed. Includes anchor mapping/detachment, revision limit/deduplication and both restoration-write failure paths. |
| Complete browser suite | 66 passed: 52 Chromium, 7 Firefox, 7 WebKit. |
| Production build | Passed with existing Vite 7.3.6 and TypeScript 5.9.3; lazy editor chunk 671.53kB minified / 215.84kB gzip. Advisory chunk-size warning remains. |
| Production isolation | All chunks scanned for adapters/failure injection/fixtures/localhost URLs. Built app verifies native editing, save/reload, Comments/History, Explain, keyboard tabs, hidden shortcuts, draft/scroll retention, loaded fonts/assets and inert injected DEV adapter; [runtime result](production-local-verification.json), [screenshot](production-local-verified.png). |
| Source/lock preservation | [preservation.json](preservation.json): 387 source files unchanged, exact proposal copy/assets/font binaries retained, no pre-existing package-lock resolution changed. |
| Existing exploration isolation | Header, Date picker and Profile checked before integration and after editor activation at all four sizes. Zero differing pixels outside the intentionally expanded switcher. |
| Editor visual gate | Original 2% Figma-frame / 4% component ceilings and 0.1% source-comparison ceiling retained, pixelmatch threshold 0.1 with AA excluded. [Exact results](comparison.json). |

Inherited browser coverage includes editing, all formatting controls and undo/redo; search; outline changes/navigation; autosave/refresh/pagehide; quota and malformed-storage recovery; native rich clipboard; all Explain actions/suggestions/question flow; cancellation/errors/retry/stale-source protection; explicit rewrite Apply and undo; document/selected comments, mapped and detached anchors, replies, resolve/reopen and persistence; non-mutating revision preview, explicit restoration and pre-save failure; internal tabs, close controls/focus, and reduced-motion/150ms states. Source presentation-fixture tests are intentionally excluded because the integrated application has no fixture entry points.

New integration checks cover all four tabs and Header initial state, lazy first load, moving indicator, Arrow/Home/End switching and focus, editor DOM identity, mapped selection and workspace scroll retention, posted comments and unsubmitted comment/reply/question drafts, hidden autosave and refresh persistence, inactive shortcuts/popovers, cancellation of hidden pending Explain, retained completed results, old Header/Date picker/Profile interactions after activation, and viewport resizing while a floating surface is open.

## Visual review

Chromium at 1640 × 1060, 1280 × 900, 1440 × 900 and 1920 × 1080. `inherited-phase-3/` contains default, annotated, selection/Explain, edge-scroll and generated states. `inherited-phase-4/` contains Comments, detached threads, History, active formatting and closed controls. Full frames and header/document/empty-state/menu/toolbar crops and differences were reviewed.

| 1640 × 1060 state | Figma difference excluding added switcher/cursor | Raw full-frame difference including switcher |
| --- | ---: | ---: |
| Default | 1.0179% | 1.8159% |
| Annotated | 1.0280% | 1.8259% |
| Selection / Explain | 1.2201% | 2.0238% |

Largest component difference: 2.6283%, below the unchanged 4% ceiling. Differences match the source Phase 4 rasterization: fractional glyph positioning, text antialiasing, shadows/strokes and native selection fragments. No pixel-identical-to-Figma claim is made. The original source presentation cursor mask is retained. An explicit 500 × 56 margin rectangle excludes the newly added/expanded switcher from preserved-content comparisons; raw full-frame values remain in `comparison.json`. No editor content is masked by that rectangle at the comparison sizes.

Against immutable source Phase 4 browser captures, the editor has **zero changed pixels** at 1640 × 1060 and 1920 × 1080 outside the added switcher. The old three explorations likewise have zero changes outside their expanded switcher. `baseline-*`, `integrated-*`, and `isolation-*-diff.png` record those comparisons.

At 1280/1440 × 900, intentional integration geometry uses y=16 and height=782 instead of the source's centered 860px shell. This reserves the existing switcher at y=814. Pixel identity with a differently sized source frame is not asserted. Gray margins, 54/246/300px columns, max816px paper/max550px text column, internal scrolling, and full floating-menu access were checked through screenshots and geometry assertions. At 1640/1920 the original maximum 1440 × 860 geometry remains unchanged. Additional 1280 × 640 and live-resize-to-480 checks cover internal menu scrolling and switcher accessibility. No horizontal or page overflow and no runtime errors were observed.

Representative evidence: [default 1640](inherited-phase-3/default-1640.png), [selection 1280](inherited-phase-3/selection-explain-1280.png), [selection 1440](inherited-phase-3/selection-explain-1440.png), [selection 1920](inherited-phase-3/selection-explain-1920.png), [Comments 1280](inherited-phase-4/comments-1280.png), [History 1440](inherited-phase-4/history-1440.png).

## Fixes verified during integration

Focused checks found a StrictMode BubbleMenu remount cleanup race, focus behavior on returning to Explain, and a draft that lived inside a transient question form. The toolbar now remains mounted while inactive events/UI are suspended, floating focus respects the outer tablist, and question draft state remains mounted. Short-height floating bounds recalculate on viewport resize. Initial test-harness failures from Vite's first dependency optimization and an incorrect comment button selector were corrected; final tests exercise the real label and warmed normal dev server. The final gate includes removal of unused presentation fallback code from the production shell.

## Deployment and remaining limits

The existing Vercel Git integration deploys `main` to [expore-17.vercel.app](https://expore-17.vercel.app/), project `expore-17`, scope `eng-5163s-projects`. No Vercel settings, project or repository were created or replaced. GitHub deployment records and a browser check of the real alias establish deployment success; the final delivery report gives the exact commit. Post-deployment evidence is written to `deployment-verification.json` and `deployed-verified.png` in the integration checkout.

Automatic approval review rejected the Vercel plugin's Google-login redirect as outside the authorized scope. Dashboard-only settings could not be inspected; the existing Git-linked setup is preserved.

Persistence remains per-browser/origin; drafts and Explain results survive switching but not reload. Explain remains a deterministic local prototype. Comments/History retain minimal source-token styling, and the four approved sample additions remain. Desktop support is tested at the approved sizes; no new mobile layout or formal screen-reader certification is claimed. The existing development dependency audit finding was not addressed through unrelated upgrades; the production dependency audit reports zero vulnerabilities.
