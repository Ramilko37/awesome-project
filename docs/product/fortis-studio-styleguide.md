# Fortis Studio Styleguide

Дата: 2026-06-23  
Область: Defense Studio (`/prototype`, `/calculator`) и общие Studio-примитивы.

## Продуктовый тон

Fortis Studio — спокойный B2B-инструмент для GIS/finance анализа. Интерфейс должен быть плотным, прикладным и проверяемым: карта, стоимость, покрытие, статус и ограничения важнее декоративной выразительности.

Не использовать hero/marketing layout внутри Studio. Не усиливать военную стилистику: копирайтинг и визуальный язык описывают защитную конфигурацию, стоимость, покрытие, состояние и риски.

## Токены

- UI font: Manrope.
- Numeric/code font: IBM Plex Mono.
- Primary: `#2563eb`.
- App bar: `#0f172a`.
- Surface: `#ffffff`, soft surface `#f8fafc`, muted surface `#f1f5f9`.
- Borders: `#d9e2ee`, strong `#b9c8da`.
- Text: `#172033`, muted `#64748b`.
- Semantic: success `#10b981`, warning `#f59e0b`, danger `#ef4444`.
- Radius: `8px` for panels/cards/controls, `6px` for compact fields and inner controls.

Canonical CSS custom properties live in `src/modules/drone-defense/ui/drone-defense-prototype.module.css` as `--studio-*`.

## Layout

Studio uses a dark top app bar with:

- `FORTIS Studio` brand.
- Primary tabs: `Карта защиты`, `Калькулятор`, `Сценарии BETA`.
- Low-emphasis `Анализ` access.
- Disabled undo/redo placeholders.
- Save and export actions.

`/prototype` is a three-pane workspace on desktop:

- Left panel: `Эшелоны / Библиотека` tabs.
- Center: real MapLibre/Deck.gl map workspace.
- Right: selected object inspector.

On mobile, the workspace stacks panels vertically and keeps a minimum map height. No text or fixed controls should overlap map controls, warning stack, or footer.

## Components

Reusable Studio primitives should follow the existing CSS module classes:

- `studioPanel`, `studioPanelHeader`, `studioPanelBody`.
- `studioTopTabs`, `studioTabButton`.
- `studioField`, `studioFieldGroup`, `studioSegmented`.
- `studioMetricGrid`, `studioMetricCard`.
- `studioNotice`, `studioWarning`.
- `studioEchelonTree`, `studioEchelonCard`, `studioEchelonObject`.

State rules:

- Active tab/control uses Fortis blue with white text.
- Hover states use blue-tinted surface, not large shadows.
- Warning states use amber background/border.
- Danger actions use red text on a soft red surface.
- Disabled controls stay visible but low-contrast.

## Prototype Map

The map remains the production map stack: MapLibre basemap plus Deck.gl layers. Do not replace it with static SVG/mock imagery.

The Studio map exposes concept toggles:

- `showCoverage`.
- `showPlacementLabels`.
- `showConstraintWarnings`.

Map overlays:

- Toggle toolbar is compact and centered at the top.
- Warning stack is top-right and only shows real status/conflict information.
- Status footer uses dark slate and IBM Plex Mono for scan-friendly object/layer/cost data.
- Basemap and zoom controls stay on the right and remain usable above map content.

## Object Inspector

The inspector edits the selected `PlacedDefenseObject` only:

- Coordinates: latitude/longitude.
- Rotation/azimuth.
- Coverage radius and sector.
- Quantity.
- Status.
- Notes.
- Cost summary.
- Focus map, visibility toggle, delete.

МОГ composition remains a detailed edit flow opened from the inspector, not an always-open side drawer.

## Calculator

`/calculator` is a Studio sibling view, not a separate marketing page:

- Compact title and configuration summary.
- Direct `Карта защиты` navigation.
- Existing tabs: configurator, structure, budget.
- Sticky summary/budget panels remain dense and numeric.
- Existing print/PDF report behavior stays intact.

## Responsive Rules

- Desktop Studio target: 1440px with three-pane composition.
- Tablet/mobile: stack panels; preserve map min-height; remove horizontal assumptions.
- Fixed-format controls need stable dimensions.
- Avoid viewport-scaled typography.
- Keep card radius at `8px` or less unless a legacy component has not yet migrated.
