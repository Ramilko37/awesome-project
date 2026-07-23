# GIS UI Kit final review fixes — addendum

Date: 2026-07-24
Baseline: `0bca6c78179d4d87eea93c3c51313b8dc622ad2c`

## Result

The whole-branch review blockers found after Task 5 are fixed without changing
the GIS domain model, API contracts, or the user-owned `tsconfig.json`.

| Review finding | Resolution |
|---|---|
| Stale source contracts | Sidebar motion now asserts the fluid `clamp()` width and the catalog toggle inside the responsive map toolbar. Copy checks now assert `prototypeRu` localization ownership and required Russian workspace/card/basemap copy. |
| Library manager actions scroll away | Refresh/create/edit and their management header are fixed siblings of the catalog scroll region. Feedback, empty state, and cards remain independently scrollable. |
| Focus restoration on parent rerender | `FocusOverlay` keeps the latest `onClose` in a ref while its key listener and restore cleanup are mounted only once. The pre-overlay focus target is captured before `autoFocus`. |
| Incomplete `DropdownMenu` behavior | The Fortis menu now implements menu/menuitem semantics, roving focus, disabled-item skipping, ArrowUp/ArrowDown/Home/End navigation, Escape focus restoration, Tab close, item close, and outside-pointer dismissal. |
| Nested card/button keyboard interception | `DefenseToolIcon` ignores card drag/selection handlers when events originate from nested interactive controls. Enter and Space now belong to the coordinate action. |

## TDD evidence

RED was observed before each runtime fix:

- stale sidebar test: `Catalog sidebar must animate desktop width instead of unmounting`;
- stale copy test: CSS class text was incorrectly classified as legacy user copy;
- library geometry: refresh action had viewport ratio `0` after catalog scroll;
- FocusOverlay: the focused modal action became inactive after an inline
  `onClose` parent rerender;
- DropdownMenu: ArrowDown from the trigger did not open a menu;
- DefenseToolIcon: Enter on `Ввести координаты` did not open the coordinate
  form because the card handler prevented the nested button action.

GREEN runtime coverage:

```text
pnpm exec playwright test --config test/playwright/fortis-overlays.config.ts
2 passed

pnpm exec playwright test --config test/playwright/asset-library-form.config.ts
4 passed
```

The library geometry test runs at `1280×600`, reaches the last long-catalog
card, and compares the exact pre/post-scroll bounding boxes of the library
heading, search, refresh, create, and edit controls. It also retains the error,
empty-result, create-form focus, validation, cancel, reopen, internal body
scroll, and fixed form-footer assertions.

## Final verification

```text
pnpm exec tsx --test <all source tests changed by the GIS UI Kit branch>
35 passed, 0 failed

pnpm exec eslint <all review-fix source and test files>
exit 0

pnpm exec playwright test --config test/playwright/stage-5.config.ts
11 passed

pnpm exec playwright test --config test/playwright/workspace-inspector.config.ts
6 passed

pnpm exec playwright test --config test/playwright/workspace-p1p2.config.ts
2 passed

pnpm build-storybook
exit 0

pnpm build
exit 0
27/27 static pages generated

git diff --check
exit 0
```

Stage 5 includes the four required desktop viewports and all committed visual
baselines. No baseline update was required: the pinned-control change affects
the long-list scrolled state, while the canonical initial-state images remain
unchanged.

The user-owned TypeScript configuration was restored after Next.js attempted
to append an E2E dist-directory include:

```text
07b72d1e983a98a5f2c87069de0c3199203cdd4d  tsconfig.json
```

Known non-fatal verification warnings remain unchanged:

- deck.gl development glyph warnings for several Cyrillic characters;
- Node 26 `[DEP0205] module.register()` deprecation warning;
- Storybook's existing large-chunk advisory.

## Files

Runtime:

- `src/modules/drone-defense/ui/asset-library-manager.tsx`
- `src/modules/drone-defense/ui/defense-tool-icon.tsx`
- `src/modules/drone-defense/ui/drone-defense-prototype.module.css`
- `src/shared/ui/fortis/overlays.tsx`

Contracts and runtime tests:

- `src/modules/drone-defense/domain/catalog-sidebar-motion-contract.test.mjs`
- `src/modules/drone-defense/domain/user-facing-copy-contract.test.ts`
- `src/modules/drone-defense/ui/asset-library-layout.test.ts`
- `src/shared/ui/fortis/overlays.stories.tsx`
- `test/playwright/asset-library-form.spec.ts`
- `test/playwright/fortis-overlays.config.ts`
- `test/playwright/fortis-overlays.spec.ts`

## Preview authority blocker

No deploy or push was attempted, as required by the review-fix scope. The
previous preview URL is not authoritative for this local fix commit. Completing
the original plan's preview Definition of Done requires an authorized Vercel
deployment of this exact frontend commit followed by browser validation of the
library scroll geometry and overlay/menu keyboard scenarios.
