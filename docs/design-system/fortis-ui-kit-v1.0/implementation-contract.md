# Fortis Unified Design System — implementation contract

**Версия:** 1.0.0
**Статус:** implementation-ready дизайн-контракт, не готовая React-библиотека
**Источники истины:** `index.html` (визуальное направление), `ui-kit.html` (production UI-kit), `gis-workspace-flow.html` (эталонный продуктовый поток), `design-tokens.json`, `component-contracts.json`, `screen-contracts.json`
**Frontend audit:** `/Users/rr/Documents/Fortis/frontend`, read-only, 22 июля 2026

Этот документ фиксирует целевой контракт. Он не запускает массовую миграцию и не меняет frontend. Ссылки на существующие примитивы ниже подтверждены по коду; отсутствие найденного примитива помечено `not verified`, а не заполняется догадками.

## 1. Принципы Fortis Design System

1. **Аналитическая ясность.** Интерфейс помогает сравнивать структуру, покрытие, бюджет и состояние проекта; декор не конкурирует с данными.
2. **Светлая рабочая поверхность.** Навигация, расчёты, таблицы, дерево и инспектор остаются светлыми. Тёмная тема локальна для карты и не становится темой приложения.
3. **Холодные нейтрали + один action-акцент.** Синий обозначает действие, выбранное состояние и keyboard focus. Статусы используют отдельные semantic roles.
4. **Смысл не кодируется только цветом.** Status, warning, coverage и save state всегда содержат текст и semantic sign/Icon slot.
5. **Плотность без микротекста.** Compact уменьшает высоты и интервалы, но не делает пояснения и табличные данные нечитаемыми.
6. **Native semantics first.** Нативные Button, Input, Select и Table предпочтительны, пока сложность не требует composite widget.
7. **Один компонент — один контракт.** Ant, shadcn/Radix и custom UI могут временно сосуществовать как реализации, но наружу получают единый Fortis API и токены.
8. **Спокойное движение.** Enter 200 ms, exit 140 ms, единый ease-out; `prefers-reduced-motion` отключает необязательные переходы.

## 2. Naming conventions

- React-компоненты и типы: `PascalCase` (`SaveIndicator`, `SaveIndicatorProps`).
- Props, events и token keys в TypeScript: `camelCase` (`onStateChange`, `ariaLabel`).
- CSS variables: `--fortis-<layer>-<role>-<state>`, например `--fortis-color-action-primary-hover`.
- JSON token paths: dot-separated references внутри `{...}`, например `{semantic.color.action.primary}`.
- Component tokens не повторяют primitive значения: `component.button.primary.bg → semantic.color.action.primary`.
- Domain names каноничны и не переводятся в коде: `AssetCard`, `EchelonTreeItem`, `ObjectInspector`, `BudgetMetric`, `CoverageStatus`, `WarningStack`, `SaveIndicator`, `VersionIndicator`.
- Semantic Icon names берутся из экспортируемого Lucide name, например `Search`, `ChevronDown`, `TriangleAlert`. Бизнес-алиасы допускаются только в одном typed mapping (`warning → TriangleAlert`).
- Event API: controlled state через `value/onValueChange` или `open/onOpenChange`; пользовательские DOM-like события не переименовываются в `handle*` в публичном API.
- Boolean props имеют положительную форму (`disabled`, `loading`, `selected`); двойные отрицания запрещены.

## 3. Token architecture

Архитектура четырёхуровневая:

1. **Primitive:** фактическая холодная neutral scale, blue action scale, status/data palette, шрифтовые семейства и базовые числа.
2. **Semantic:** роли поверхности, текста, границы, действия, статуса, selection и focus. Тема заменяет semantic aliases, не component CSS.
3. **Component:** минимальные aliases для размеров/частей конкретного компонента. Компонент не читает primitive color напрямую.
4. **Context:** `light` — глобальный контекст, `darkMap` — локальный контекст карты. Панели поверх карты остаются на light/overlay roles, если специально не являются картографическим контролом.

Рекомендуемый bridge для текущего Tailwind 4:

- сгенерировать CSS custom properties из `design-tokens.json` в отдельный Fortis token stylesheet;
- импортировать stylesheet до module styles;
- при необходимости экспортировать ключевые semantic roles через `@theme inline` в `globals.css`, не копируя primitive hex в компоненты;
- сохранить текущие dashboard tokens до отдельной миграции: по аудиту в `globals.css` явно сосуществуют две дизайн-системы;
- не менять `index.html`: это утверждённая визуальная документация, не source для runtime CSS generation.

## 4. Component API conventions

- Базовые элементы используют `forwardRef`, передают native attributes и поддерживают `className` только как аварийный layout hook, не как способ переписать внутреннюю анатомию.
- Controlled и uncontrolled режимы не смешиваются в одном экземпляре.
- `loading` сохраняет геометрию, устанавливает `aria-busy` на owning control/region и предотвращает повторное действие.
- `invalid` всегда сопровождается `aria-invalid` и связанным сообщением; ошибка объясняет способ исправления.
- `disabled` применяют только к недоступному действию. Для читаемых неизменяемых данных используют `readOnly`.
- Overlay API обязан иметь `open`, `onOpenChange`, `initialFocus?`, `returnFocus?` и явную dismissal policy.
- Composite widgets следуют WAI-ARIA Authoring Practices; если полная keyboard model не нужна, используется более простой native primitive.
- Component contracts из `component-contracts.json` являются acceptance API. Реализация может использовать Radix или Ant внутри, если внешний API, семантика и визуальный контракт не протекают.

## 5. Density contract

| Mode | Control / row target | Typical spacing | Typography rule |
|---|---:|---:|---|
| compact | 40 px minimum | 4–8 px | labels/data ≥ 12–13 px; body ≥ 14 px |
| default | 44 px minimum | 8–12 px | labels/data ≥ 13 px; body ≥ 14–16 px |
| comfortable | 52 px | 12–16 px | typography usually unchanged; more air, not inflated headings |

- Density is inherited from one application/provider attribute and may be overridden only for a bounded data region.
- Hit area changes independently from the pictogram size.
- Compact is not a mobile mode. At touch breakpoints default/comfortable targets remain preferred.
- Table, tree and inspector rows share the same density source to preserve rhythm.
- Modal/Drawer outer geometry does not collapse in compact; their internal controls inherit density.
- Toolbar labels never drop below 13 px. The GIS toolbar is 40 px minimum in compact and 44 px in default.

## 6. Responsive contract

- Desktop-first composition preserves `структура → карта → инспектор`.
- At 1440/1280 px all three GIS regions may remain simultaneous, with inspector at least 280 px.
- At 1024 px tree/inspector may narrow or become an explicit overlay while map remains primary.
- At 768 px panels become sequential or Drawer-based; the map does not squeeze both sidebars into unreadable columns.
- Documentation domain cards: 4 columns only when container width permits approximately 320 px per card; 2 columns at medium desktop/tablet; 1 column at narrow width.
- Page-level horizontal scrolling is a failure. A labelled data table region may scroll horizontally when column priority cannot preserve meaning.
- Use `min-width: 0`, fluid tracks, `clamp()` where needed, and container queries for reusable panels.
- At browser zoom 200%, a 1440 px device behaves approximately like a 720 CSS-pixel viewport. No information may depend on hover or a fixed viewport height.

## 7. Accessibility acceptance criteria

Release acceptance requires:

- text and essential controls meet intended WCAG 2.2 AA contrast using computed values, not visual screenshots alone;
- complete keyboard path without focus loss or hidden controls;
- visible `:focus-visible` distinct from hover, selected and active states;
- one `aria-current` item per Navigation context;
- labels for every field and icon-only control;
- target minimums from density contract;
- validation links error text via `aria-describedby` and moves failed submit to the first invalid control or summary;
- dynamic toast/save/result messages use correctly scoped live regions without repeated announcements;
- Modal and modal Drawer trap focus, close by Escape when dismissible, make the background inert and restore focus;
- Tabs, Select, DropdownMenu and Tree implement their complete keyboard model;
- status is redundant by sign/Icon name, text and color;
- `prefers-reduced-motion: reduce` removes non-essential animation and replaces animated loading with a static sign plus text.

The RC visual review is not a claim of full WCAG conformance. Final conformance requires browser/assistive-technology tests in React, computed contrast, content at real localization lengths and automated plus manual audits.

## 8. Icon policy

Frontend audit confirms `lucide-react` as the configured shadcn icon library and shows existing imports from both `lucide-react` and `@ant-design/icons`.

- **Canonical target:** Lucide semantic names through a typed `Icon` wrapper.
- `Icon` accepts `name`, `size`, `strokeWidth`, `decorative`, `label?`; product code does not import a second library for a new component.
- Decorative icons are `aria-hidden`; icon-only actions require an accessible label on their Button.
- No letters, emoji, ASCII symbols, CSS pseudo-glyphs or handmade SVG are accepted as control icons.
- Text labels remain for map toolbar actions unless meaning is universally understood and a tooltip/accessibility label exists.
- Existing Ant icons are migration inputs, not a reason for a permanent second icon contract.
- Asset/weapon domain pictograms need a separate approved asset package. Until one exists, use text/type labels or an empty typed slot; do not invent drawings.

Provisional migration map: `SaveOutlined → Save`, `CloseOutlined → X`, `MoreOutlined → Ellipsis`, `WarningOutlined → TriangleAlert`, `Search emoji → Search`, `▾ → ChevronDown`. Exact substitutions require visual review in the real frontend.

## 9. Правила использования карты

- `darkMap` применяется только к картографическому canvas и непосредственно связанным map controls.
- Tree, ObjectInspector, BudgetMetric, calculations and alerts use light surfaces even when adjacent to the map.
- A selected map object gains structural emphasis (selection ring/border and corresponding tree/inspector state), not a decorative card/glow.
- Map toolbar targets follow density contract; labels remain readable and keyboard-accessible.
- Primary coverage warning is visually stronger than secondary warnings and uses WarningStack/Alert semantics.
- Map pins may use short object identifiers such as `M1` when they are data labels, not substitutes for generic icons; the accessible name contains the full object name/type.
- Overlay labels stay entirely inside one safe corner with consistent inset. If no safe area exists, move them into the adjacent panel.
- Budget and coverage calculations are not rendered as map chrome when they require extended reading.
- A real implementation should use existing MapLibre/deck.gl integrations already present in `GisBoard`, not recreate the map in the design-system package.

## 10. Storybook structure

Storybook was **not found** in the audited frontend: no `.storybook`, dependencies or `*.stories.*` files were confirmed. Proposed structure (requires team decision):

```text
.storybook/
  main.ts
  preview.tsx
src/shared/ui/fortis/
  button/Button.tsx
  button/Button.stories.tsx
  button/Button.test.tsx
  table/Table.tsx
  table/Table.stories.tsx
src/modules/drone-defense/ui/
  asset-card/AssetCard.stories.tsx
  gis-workspace/GisWorkspace.stories.tsx
```

Each story set: overview/anatomy, variants, all states, three densities, keyboard/focus, long Russian content, narrow container, reduced motion, high contrast where supported. Domain stories use deterministic fixtures, never invented production metrics. GIS Workspace gets a composed story with structure/map/inspector and save-state controls in a clearly labelled docs-only decorator.

## 11. Visual regression strategy

- Capture deterministic component stories and composed GIS Workspace at 1440, 1280, 1024 and 768 CSS px.
- Capture compact/default/comfortable for data-heavy primitives and GIS.
- Include 200% zoom equivalent viewport plus an actual browser zoom manual pass.
- Freeze time, random IDs, MapLibre camera and network responses. Use a deterministic map fixture or stable image/canvas snapshot for layout tests, with separate behavior tests for MapLibre.
- Baseline focus-visible, invalid, selected, warning, saved/saving/conflict/offline, modal and drawer states.
- Run axe as a regression signal, plus manual keyboard and screen-reader smoke tests; passing axe does not equal WCAG conformance.
- Use Playwright already present in frontend after implementation. This handoff does not add tests or dependencies.

## 12. Порядок внедрения во frontend

1. Approve token JSON → CSS/Tailwind bridge and IBM Plex Sans loading strategy.
2. Establish one `Icon` wrapper and new-code Lucide policy.
3. Implement foundations: focus ring, density provider, Button/IconButton, fields, Status/InlineMessage.
4. Implement overlays through existing Radix/Ant capability behind Fortis APIs; add focus trap/return tests.
5. Implement navigation/Tabs/Dropdown/Select keyboard models.
6. Implement Table and states, then migrate one real calculator/report table as a pilot.
7. Implement Domain components by extracting behavior from `drone-defense`, starting with SaveIndicator and ObjectInspector.
8. Compose GIS Workspace vertical slice against real stores and MapLibre/deck.gl.
9. Add Storybook and visual regression only after ownership/tooling approval.
10. Migrate remaining custom/Ant/shadcn surfaces incrementally; do not big-bang replace the frontend.

## 13. Migration rules for existing components

- Preserve user-visible behavior and data flow before visual migration.
- Wrap or adapt existing primitives first; remove an old implementation only after call-site parity and tests.
- Do not globally replace dashboard design tokens with Fortis tokens. Scope Fortis provider to the Fortis product/module until product ownership confirms convergence.
- Move shared primitives toward the repository-guided `src/shared/ui` layer; current `src/components/ui` aliases are real but conflict with the documented architecture and need a planned bridge, not an opportunistic move.
- Do not import module internals into shared primitives. Domain components may compose shared Core components; Core components never import `drone-defense` stores/types.
- Ant Modal/Input/Alert/Tag can remain temporary internals if Fortis API, focus behavior and tokens are enforced. New public APIs must not expose Ant props.
- Existing Plus Jakarta/Syne/Manrope typography remains untouched outside Fortis scope until typography ownership is decided.
- Remove emoji/ASCII/CSS glyph icons only when the semantic Icon replacement and accessible label are in place.
- Every migration PR identifies before/after screenshots, affected keyboard flow, token changes and rollback path.

## 14. Definition of Done for a new component

- Canonical name and purpose match `component-contracts.json`.
- Uses semantic/component tokens; no direct color hex in component styles.
- Supports required variants, densities and visual states.
- Has native or correct ARIA semantics and documented keyboard behavior.
- Has distinct hover, active/selected and focus-visible.
- Covers loading, empty, error and disabled where applicable.
- Meets target sizes and readable typography at compact/default/comfortable.
- Passes 1440/1280/1024/768 and 200% zoom layout checks.
- Handles Russian long content without clipping.
- Honors reduced motion.
- Includes unit/interaction tests and visual stories once Storybook is approved.
- Has no emoji, ASCII, text-letter or handmade SVG icons.
- Is piloted in at least one real Fortis flow before the old implementation is removed.

## 15. Открытые решения и риски

1. **Package ownership:** final home for Fortis shared primitives is not confirmed. Repository guidance points to `src/shared/ui`, while current shadcn aliases point to `src/components/ui`.
2. **Two design systems:** `globals.css` documents coexisting dashboard and prototype themes. Global token replacement would be high risk.
3. **Typography:** IBM Plex Mono is loaded, IBM Plex Sans was not confirmed in `layout.tsx`; decide local/font package and loading budget.
4. **Icon convergence:** Lucide is configured, but drone-defense uses Ant Icons and several text/emoji glyphs. Approve a staged mapping and any domain pictogram source.
5. **Overlay engine:** Ant Modal exists; Radix packages exist. Choose one implementation owner while keeping the Fortis public contract stable.
6. **Storybook:** absent and requires tooling/CI ownership approval.
7. **Accessibility:** several custom controls and small-text/HUD-like prototype styles need real DOM and assistive-technology testing; the HTML RC is evidence, not certification.
8. **GIS data semantics:** coverage thresholds, cost currency/precision and conflict-resolution policy must be confirmed by product/domain owners.
9. **Responsive GIS behavior:** exact 768 px panel transition (Drawer vs route/panel) requires testing with real map gestures and data volume.
10. **Visual regression:** MapLibre/deck.gl snapshots need deterministic camera/data strategy to avoid flaky diffs.

## Frontend correspondence and migration matrix

`Owner` below is a **proposed responsibility**, not a confirmed person/team assignment.

| Fortis component | Existing frontend primitive | Required changes | Owner | Migration priority |
|---|---|---|---|---|
| Button | `src/components/ui/button.tsx` | Fortis tokens; 40/44/52 sizes; loading contract | Shared UI (proposed) | P0 |
| IconButton | Button icon sizes + Lucide/Ant icon imports | Typed Icon; accessible name; target sizes | Shared UI (proposed) | P0 |
| Input | Ant `Input` in `VariantsModal` | Fortis field wrapper; label/help/error | Shared UI (proposed) | P0 |
| Textarea | not verified | Native Fortis field implementation | Shared UI (proposed) | P1 |
| Select | Native select in `GisBoard`; Ant Select usage not verified | Native simple select + accessible composite only when needed | Shared UI (proposed) | P0 |
| Search | Native input in `AssetsPanel` | Remove emoji; add clear/results semantics | Shared UI + GIS (proposed) | P0 |
| Checkbox | not verified | Native/Radix wrapper | Shared UI (proposed) | P1 |
| Radio | not verified | Native group wrapper | Shared UI (proposed) | P1 |
| Switch | not verified | Accessible switch primitive | Shared UI (proposed) | P1 |
| Tabs | Custom scenario/calculator tabs | Consolidate; tab ARIA/roving focus | Shared UI (proposed) | P0 |
| SegmentedControl | Custom grouped buttons only | Separate from Tabs; radio semantics | Shared UI (proposed) | P1 |
| Badge | `src/components/ui/badge.tsx` | Fortis status/category roles; readable size | Shared UI (proposed) | P1 |
| Status | `StatusBanner.tsx` | Remove glow/pulse default; text/sign/color | Shared UI (proposed) | P0 |
| Tag | Ant `Tag` in `VariantsModal` | Fortis style and accessible remove | Shared UI (proposed) | P1 |
| Alert | Ant `Alert` in `VariantsModal` | Fortis hierarchy/tokens/roles | Shared UI (proposed) | P0 |
| Toast | not verified | Select one provider; live region/queue | Shared UI (proposed) | P1 |
| InlineMessage | Custom `prototypeNotice*` styles | Consolidate variants/ARIA | Shared UI (proposed) | P0 |
| Tooltip | `src/components/ui/tooltip.tsx` (Radix) | Fortis tokens/motion | Shared UI (proposed) | P1 |
| DropdownMenu | Custom basemap menu in `GisBoard` | Shared Radix wrapper; keyboard/return focus | Shared UI + GIS (proposed) | P0 |
| Popover | not verified | Radix wrapper with collision/focus policy | Shared UI (proposed) | P1 |
| Modal | Ant `Modal` in `VariantsModal` | Fortis API/tokens; trap/Escape/return tests | Shared UI (proposed) | P0 |
| Drawer | `DeviceDrawer` content; overlay shell not verified | Shared shell; focus behavior; responsive | Shared UI + Alert module (proposed) | P0 |
| Table | Native tables across calculator/report/catalog | Shared semantic table; sort/select states | Shared UI + consuming module (proposed) | P0 |
| Pagination | not verified | Shared nav primitive | Shared UI (proposed) | P2 |
| EmptyState | not verified | Shared state composition | Shared UI (proposed) | P1 |
| LoadingState | Ant Spin + custom loading styles | Unified aria-busy/reduced motion | Shared UI (proposed) | P0 |
| ErrorState | Ad hoc error text only | Shared recoverable/blocking state | Shared UI (proposed) | P1 |
| SuccessState | not verified | Shared completion state | Shared UI (proposed) | P2 |
| Navigation | Custom `Topbar`, scenario nav, sidebar | Separate links/actions/Tabs; aria-current | Shared UI + Shell (proposed) | P0 |
| Breadcrumbs | not verified | Semantic navigation primitive | Shared UI (proposed) | P2 |
| PageHeader | Custom module headers | Reusable composition | Shared UI + Modules (proposed) | P1 |
| AssetCard | `DefenseAssetCard`, `DefenseToolIcon`, legacy AssetsPanel card | Consolidate anatomy/icons/selection | Drone-defense UI (proposed) | P0 |
| EchelonTreeItem | `EchelonObjectsList` | Canonical tree behavior/ARIA | Drone-defense UI (proposed) | P0 |
| ObjectInspector | `PropertiesPanel`; `DeviceDrawer` partial | Canonical inspector; validation; responsive Drawer | Drone-defense UI (proposed) | P0 |
| BudgetMetric | `StatusBar` metric; calculator budget UI | Typed formatter/status thresholds | Drone-defense domain + UI (proposed) | P0 |
| CoverageStatus | `StatusBar`, CoverageBar, map layers | Unified status and threshold source | Drone-defense domain + UI (proposed) | P0 |
| WarningStack | not verified; scattered warnings | Canonical primary/secondary stack | Drone-defense UI (proposed) | P0 |
| SaveIndicator | `VariantStatusButton`, `VariantSaveButton`, variant store | Canonical state machine/live semantics | Drone-defense domain + UI (proposed) | P0 |
| VersionIndicator | `VariantStatusButton`, `VariantsModal` rows | Separate version from save state | Drone-defense UI (proposed) | P1 |

## Verification boundary for this handoff

The HTML Final is checked as a design contract and interactive reference. Before production adoption, the real React frontend still needs: font loading verification, generated token integration, chosen overlay implementation, focus trap/return tests in DOM, screen-reader passes, computed contrast tests, MapLibre gesture/responsive tests, localization stress tests and approval of domain thresholds/pictograms.

## GIS Workspace v1.0 Final implementation addendum

### Screen-to-component mapping

| Screen region / state | Canonical composition | Frontend evidence | Verification status |
|---|---|---|---|
| AppHeader | Navigation + PageHeader + VersionIndicator + SaveIndicator + DropdownMenu + Button | `defense-studio-shell.tsx`, `variant-selector.tsx` | partially verified |
| SideNavigation | Navigation inside Drawer below 1280 | Existing app sidebar/navigation patterns; exact Fortis Drawer not found | not verified |
| ProjectTree | Search + EchelonTreeItem + EmptyState/LoadingState | `EchelonObjectsList`, project-driven `selectedPlacementId` | partially verified |
| MapCanvas | Existing `GisBoard` + marker buttons + map layers | MapLibre/deck.gl implementation and contract tests are present | verified implementation base; final a11y not verified |
| MapToolbar | Button/SegmentedControl/DropdownMenu in toolbar pattern | Custom controls in `GisBoard` | partially verified |
| ObjectInspector | ObjectInspector + Input + CoverageStatus + BudgetMetric + WarningStack + SaveIndicator | `PropertiesPanel` exists but is not the final editable contract | partially verified |
| Initial loading | LoadingState across tree/map/inspector | Module loading states exist in several forms | partially verified |
| Empty project | Coordinated EmptyState in tree and map | No canonical shared EmptyState confirmed | not verified |
| Selection | EchelonTreeItem ↔ Map marker ↔ ObjectInspector | Shared selected placement wiring confirmed | verified |
| Validation warning | Input + InlineMessage + WarningStack + CoverageStatus | Exact thresholds/backend response not confirmed | design contract |
| Saving / Saved | Button + SaveIndicator + VersionIndicator + Toast | `saveStatus: saving|idle` confirmed | partially verified; saved acknowledgement semantics require review |
| Version conflict | Alert + SaveIndicator + VersionIndicator + Modal + comparison Table | `conflictState` and reload-current action confirmed | partially verified |
| Offline/local copy | SaveIndicator + VersionIndicator + InlineMessage + retry Button | Mock data has offline status; persistence flow not found | not verified |
| Blocking error | ErrorState + Alert + retry Button | Ad hoc error handling exists | design contract |

No new universal component is required for the reference flow. `Conflict comparison` is a Product Pattern composed from existing components, not a new single-purpose component. `ContextBar` is layout composition of Status/Badge/VersionIndicator, not a public component until a second independent product use appears.

### Responsive transformations

| Region | ≥1280 CSS px | 1024 CSS px | 768 / effective 720 CSS px |
|---|---|---|---|
| AppHeader | Full project identity, version, save state and direct primary actions | Navigation collapses; project title, SaveIndicator, Inspector and Save stay direct | Header wraps; timestamp/detail hides before label; secondary actions move to overflow |
| SideNavigation | Docked 224px | Modal Drawer | Full-height modal Drawer; background inert |
| ProjectTree | Docked 240–272px | Docked 240px | Left Drawer; selected L2/object remain visible in ContextBar |
| MapCanvas | Flexible center column | Primary region beside tree | Full-width primary region; page never scrolls horizontally |
| MapToolbar | Full primary tool set | Secondary tools may overflow locally | One 44px row with local horizontal scroll; labels remain visible |
| ObjectInspector | Docked 320–360px | Right Drawer 420–480px | Full-width modal Drawer with sticky header/footer |
| WarningStack | Full list in Inspector | Full list in Drawer + summary in ContextBar | Count/severity text in ContextBar; full actions inside Drawer |
| BudgetMetric | Full values | Full values in Drawer | Single-column reflow; numeric value wraps before unit only |
| SaveIndicator | Label + timestamp/version | Label remains; detail may hide | Text label remains; never color/icon-only |
| VersionIndicator | Version + state/history context | Compact version stays visible | Version remains visible during conflict/offline; history moves to overflow |

The prototype uses a page-level `overflow-x: hidden` safety boundary. This does not authorize clipping: only `MapToolbar` and explicitly labelled Table regions may have local horizontal overflow.

### Selection and interaction contract

`selectedEchelonId` and `selectedObjectId` are the only selection sources of truth. Tree and map render the same state; selecting in one surface updates the other without programmatic focus movement. ObjectInspector consumes the same selected object and never creates a second selection.

Flow:

1. Route entry announces loading without moving focus.
2. L2 selection remains focused in ProjectTree; map layer de-emphasizes unrelated objects.
3. MOG-001 selection remains focused at its origin; ContextBar exposes both L2 and object name.
4. Inspector opens docked at ≥1280 or as a modal Drawer below 1280.
5. A changed field sets `dirty`; SaveIndicator cannot show saved while dirty.
6. Save enters `saving` immediately at the UI layer and disables duplicate submission.
7. Only a confirmed acknowledgement renders `saved` and advances VersionIndicator.
8. Validation, conflict, offline and error outcomes are explicit branches, not Toast-only feedback.

The contract intentionally does not define backend request shapes, queue storage, ETags or conflict payloads.

### Focus, keyboard and overlay contract

- Tab order: navigation trigger → header project actions → ProjectTree trigger/tree → ContextBar → MapToolbar → map markers → warning summary → ObjectInspector trigger/content.
- Tree: roving tabindex; Up/Down visible items; Right expands or enters the first child; Left collapses or returns to parent; Home/End; typeahead; Enter activates.
- MapToolbar: `role=toolbar`, one tab stop, Left/Right/Home/End navigation. Tool labels remain text.
- Map markers: button group with a separate roving tab stop. Arrow navigation remains inside marker group; Enter selects; a second explicit action opens Inspector.
- Modal and modal Drawer trap Tab/Shift+Tab, make the background inert, close on Escape when dismissal is safe and return focus to the invoking control.
- Dirty Inspector: Escape does not discard edits. It announces the required Save/Cancel choice and focuses the in-Drawer action.
- Conflict Modal: Escape closes comparison without resolving the conflict and returns focus to «Сравнить версии».
- Reduced motion removes smooth scrolling, spinner rotation and overlay movement while retaining static labels and immediate state changes.

### Live-region contract

| Channel | States | Rule |
|---|---|---|
| `polite` workspace status | loading, selection, validation warning, saving, saved | One announcement per transition; does not move focus |
| `assertive` recovery status | version conflict, offline/local copy, blocking error | Announce once when the state becomes consequential |
| Toast `status` | confirmed routine completion only | Never the sole carrier of error/conflict/offline information |
| Visible Alert | persistent context and recovery action | Do not duplicate identical text through a second assertive region |

### Status-role boundaries

- **Status**: compact read-only state with text/sign/color.
- **SaveIndicator**: canonical project persistence state; it owns clean/dirty/saving/saved/conflict/offline.
- **InlineMessage**: local explanation associated with a field or compact section.
- **Alert**: persistent consequential message with recovery action.
- **Toast**: transient confirmation after an already successful action.

Using Alert + Toast for the same error, or Toast as the only conflict/offline message, is forbidden.

### Implementation verification ledger

**Verified from frontend code**

- Map and tree use project-driven selected placement state.
- `GisBoard` receives layer, placement and selection callbacks.
- Zustand variants store exposes `saving`, error and version `conflictState`.
- Existing conflict recovery can load the current server version.
- Lucide is configured while Ant Icons remain in drone-defense.

**Partially verified**

- Ant Modal supplies an overlay base, but Fortis trap/restore and visual token integration need tests.
- `PropertiesPanel` supplies object details, but final edit/validation behavior needs implementation.
- Existing map controls are clickable; the complete toolbar/marker roving model needs React DOM tests.

**Not verified**

- Offline queue/local-copy persistence and reconnect merge policy.
- Optimistic versus confirmed backend acknowledgement details.
- Coverage threshold ownership and which warnings are blocking.
- IBM Plex Sans loading in the current root layout.
- Real browser zoom 200%, screen-reader announcements, forced-colors and cross-browser inert behavior.
