# React Doctor Maintainability Review — 2026-07-28

## Scope

FRT follow-up cleanup for `src/app/page.tsx`, `jsx-max-depth`, changed-scope giant components, and disputed `deslop/unused-file` findings.

## Decisions

| Finding | Decision | Notes |
| --- | --- | --- |
| `src/components/ui/tooltip.tsx` | `delete` | Unreachable shadcn tooltip wrapper. Fortis runtime uses `src/shared/ui/fortis/overlays.tsx`. |
| `src/modules/drone-defense/ui/data/threat-types.ts` | `delete` | Only used by unreachable `DefenseCatalogTab`. |
| `src/modules/drone-defense/ui/defense-catalog/defense-catalog-tab.tsx` | `delete` | No runtime/storybook entrypoint; deleting also removes one full-scan giant component. |
| `src/modules/drone-defense/ui/prototype-3d-placeholder.tsx` | `delete` | Current `/prototype?view=3d` contract renders `FacilityDrilldown`; placeholder is explicitly not used. |
| `src/shared/config/prototype-ru.ts` | `wire into entrypoint` | Runtime now reads workspace and compact-card copy from `prototypeRu`. |
| `src/modules/drone-defense/domain/protection-visibility.ts` | `wire into entrypoint` | Runtime map placement filter now uses default-visible MOG visibility helper without changing current behavior. |

## Deferred

Full React Doctor still reports live giant components in:

- `src/modules/drone-defense/ui/drone-defense-prototype.tsx`
- `src/modules/drone-defense/ui/gis-board.tsx`

These need a separate UI decomposition review because the next extraction touches the map shell, DeckGL layer construction, and prototype workflow boundaries.
