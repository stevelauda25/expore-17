# UI exploration playground

React 19.3, TypeScript 5.9, Vite 7.3, and plain CSS. This workspace was empty when inspected; the scaffold was created here with the user's approval. There was no existing repository, router, design system, component library, or application code to modify.

## Run

```sh
npm install
npm run dev
```

Use the local URL printed by Vite. `/` renders the playground. Header is selected by default. React state switches panels without navigation or reloading. No routing, icon, or animation libraries are needed. Inter Regular and Medium are bundled locally using `@fontsource/inter`; the logo and icon exports live in `public/assets/figma`.

```sh
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Components

- `App`: playground and selected exploration state.
- `ExplorationSwitcher`: accessible bottom tablist with ArrowLeft/ArrowRight, Home/End, and roving tab stops.
- `EmptyDemo`: empty light panel used for Date picker and Profile.
- `HeaderDemo` and `HeaderNav`: Header preview, navigation, and disclosure behavior.
- `ProductsDropdown`, `ProductMenuItem`, and `UtilityLink`: data-driven product columns and utility row.

### Created files

```text
.gitignore
README.md
package.json
package-lock.json
index.html
vite.config.ts
eslint.config.js
tsconfig.json
tsconfig.app.json
tsconfig.node.json
src/main.tsx
src/App.tsx
src/styles.css
src/components/EmptyDemo.tsx
src/components/ExplorationSwitcher.tsx
src/components/ExplorationSwitcher.css
src/components/header/HeaderDemo.tsx
src/components/header/HeaderNav.tsx
src/components/header/ProductsDropdown.tsx
src/components/header/ProductMenuItem.tsx
src/components/header/UtilityLink.tsx
src/components/header/header.css
public/assets/figma/logo.svg
public/assets/figma/ai-agent.svg
public/assets/figma/knowledge-base.svg
public/assets/figma/workflow-builder.svg
public/assets/figma/analytics.svg
public/assets/figma/api-documentation.svg
public/assets/figma/help-center.svg
public/assets/figma/product-updates.svg
public/assets/figma/icon-noise.png
```

No pre-existing files were modified. `node_modules` and `dist` are generated and ignored.

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

## Validation

TypeScript, ESLint, and the production build pass. Browser checks covered the default tab; hover opening; trigger-to-menu travel; click toggles; item hover; outside click; Escape and focus restoration; Enter/Space; full Tab order; tab switching and return to Header; switcher keyboard controls; and loaded assets. No application console errors or warnings were observed.

Compared the rendered Header with Figma at 1440 × 900. Browser geometry matches the Header, central navigation, authentication, dropdown, cards, icons, utility row, and switcher measurements above. Responsive bounds were checked at 1280, 768, 720, 560, 390, and 320px widths, plus short landscape layouts.

## Deferred

Date picker and Profile contain only empty white shells. Their actual components and Figma inspections are deferred until separate frames are supplied. Navigation destinations and authentication flows are outside this UI exploration: navigation links do not navigate, and Log in/Sign up are visual interaction previews.
