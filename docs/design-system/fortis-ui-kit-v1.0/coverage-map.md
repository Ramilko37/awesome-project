# Fortis UI Kit v1.0 — HTML → React → Storybook coverage

Source reference is the local Open Design handoff retained in the frontend Git history at `dbc6139:docs/design-system/fortis-ui-kit-v1.0/`. The HTML, token JSON and screen contracts take precedence over existing application styles.

| HTML block / contract | React component | Story group | Variants / states | Status |
|---|---|---|---|---|
| Actions / Button | `Button` | Components/Actions | primary, secondary, quiet, danger; 40/44/52; loading, disabled | Foundations implemented |
| Actions / IconButton | `IconButton` + `Icon` | Components/Actions | default, quiet, danger, toggle; 40/44/52 | Foundations implemented |
| Forms / Input | `Input` | Components/Forms | text, readonly, invalid, disabled; 40/44/52 | Foundations implemented |
| Forms / Textarea | `Textarea` | Components/Forms | resizable, fixed, invalid, disabled | Foundations implemented |
| Forms / Select | `Select` | Components/Forms | native list, invalid, disabled | Foundations implemented |
| Forms / Search | `Search` | Components/Forms | empty, filled, loading, no results | Foundations implemented |
| Forms / Checkbox | `Checkbox` | Components/Forms | unchecked, checked, mixed, invalid, disabled | Planned |
| Forms / Radio | `RadioGroup` | Components/Forms | stacked, inline, selected, disabled | Planned |
| Forms / Switch | `Switch` | Components/Forms | on, off, loading, disabled | Planned |
| Selection / Tabs | `Tabs` | Components/Selection | line, contained, active, disabled, overflow | Planned |
| Selection / Segmented | `SegmentedControl` | Components/Selection | 2–4 options, selected, disabled | Planned |
| Metadata / Badge | `Badge` | Components/Feedback | neutral, accent | Foundations implemented |
| Metadata / Status | `Status` | Components/Feedback | neutral, info, success, warning, danger | Foundations implemented |
| Metadata / Tag | `Tag` | Components/Feedback | neutral, selected, removable, disabled | Planned |
| Feedback / Alert | `Alert` | Components/Feedback | info, success, warning, danger, dismissible | Planned |
| Feedback / Toast | `Toast` | Components/Feedback | info, success, error, timed close | Planned |
| Feedback / Inline message | `InlineMessage` | Components/Feedback | info, warning, error | Foundations implemented |
| Overlay / Tooltip | `Tooltip` | Components/Overlays | hover, focus | Planned |
| Overlay / Dropdown menu | `DropdownMenu` | Components/Overlays | default, disabled, danger, keyboard | Planned |
| Overlay / Popover | `Popover` | Components/Overlays | information, form | Planned |
| Overlay / Modal | `Modal` | Components/Overlays | default, danger, loading; focus trap/Escape | Planned |
| Overlay / Drawer | `Drawer` | Components/Overlays | right, full; focus trap/Escape | Planned |
| Data / Table | `Table` | Components/Data | default, hover, selected, warning, disabled, loading, empty | Planned |
| Data / Pagination | `Pagination` | Components/Data | first/middle/last, loading, disabled | Planned |
| States / Empty | `EmptyState` | Components/States | first use, no result, filtered | Planned |
| States / Loading | `LoadingState` | Components/States | inline, skeleton, reduced motion | Planned |
| States / Error | `ErrorState` | Components/States | recoverable, blocking, retry | Planned |
| States / Success | `SuccessState` | Components/States | confirmation, completion | Planned |
| Navigation | `Navigation` | Components/Navigation | horizontal, sidebar, collapsed | Planned |
| Navigation / Breadcrumbs | `Breadcrumbs` | Components/Navigation | default, collapsed | Planned |
| Navigation / Page header | `PageHeader` | Components/Navigation | default, compact | Planned |
| Domain / Asset card | `AssetCard` | Components/Domain | default, selected, unavailable, warning | Planned |
| Domain / Echelon tree | `EchelonTreeItem` | Components/Domain | default, selected, expanded, warning, disabled | Planned |
| Domain / Inspector | `ObjectInspector` | Components/Domain | empty, selected, editing, invalid, dirty | Planned |
| Domain / Budget | `BudgetMetric` | Components/Domain | budget, cost, remaining, delta, warning | Planned |
| Domain / Coverage | `CoverageStatus` | Components/Domain | good, below target, unknown, recalculating | Planned |
| Domain / Warnings | `WarningStack` | Components/Domain | inline, panel, map summary, collapsed | Planned |
| Domain / Save | `SaveIndicator` | Components/Domain | saved, saving, conflict, offline, error | Foundations implemented |
| Domain / Version | `VersionIndicator` | Components/Domain | current, draft, archived, conflict | Foundations implemented |
| GIS Workspace flow | `GisWorkspaceStory` composition | Patterns/GIS Workspace | all 12 screen states; 720/768/1024/1280/1440 | Planned |

## Exact foundation rules extracted from the HTML

- Canvas `#F6F8FA`, surface `#FFFFFF`, primary text `#10171D`, border `#DCE2E7`, primary action `#155F8D`.
- IBM Plex Sans / IBM Plex Mono stack, control heights `40 / 44 / 52px`, radius `4 / 6 / 10px`.
- Focus ring is `3px #0A78B9` with `2px` offset. Disabled opacity is `44%`.
- Enter/exit motion is `200 / 140ms`, `cubic-bezier(.23,1,.32,1)`.
- GIS data colors are L1 `#2176A8` solid, L2 `#178A9D` dashed, L3 `#6F6AA8` dotted, L4 `#936200` dashed.
- At `<1024px` the inspector is a drawer; at `<1280px` side navigation is a drawer; at `<768px` project tree is also a drawer.
