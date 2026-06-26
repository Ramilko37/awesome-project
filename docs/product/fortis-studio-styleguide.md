# Fortis Studio UI Kit

Дата актуализации: 2026-06-25
Источник: `/Users/rr/Downloads/Fortis Studio.html` (`Fortis Studio.dc` bundle)
Область: Defense Studio (`/prototype`, `/calculator`) и общие Studio-примитивы.

## Product Tone

Fortis Studio — плотный B2B GIS/finance инструмент. Главный экран должен ощущаться как рабочая станция оператора: карта, эшелоны, размещённые объекты, стоимость, покрытие, статус и ограничения.

Не использовать marketing/hero layout внутри Studio. Не усиливать военную стилистику: язык интерфейса описывает защитную конфигурацию, экономику, состояние и риски.

## Tokens

Typography:

- Brand/display: `Syne`, weights `700/800`.
- UI: `Manrope`, weights `400/500/600/700`.
- Numeric/code: `IBM Plex Mono`, weights `400/500/600`.

Core colors:

- App bar: `#0f172a`.
- App bar surface: `#1e293b`.
- Primary blue: `#2563eb`; hover `#1d4ed8`; accent `#38bdf8`.
- Page background: `#f1f5f9`.
- Map soft background: `#eef4fb`, `#e3eaf2`, `#dbe3ee`.
- Surface: `#ffffff`; soft `#f8fafc`; selected `#eff6ff`; selected border `#bfdbfe`.
- Border: `#e2e8f0`; quiet border `#eef2f7`.
- Text: `#0f172a`; secondary `#334155`; muted `#64748b`; soft `#94a3b8`.
- Success: `#10b981`, text `#047857`, soft `#d1fae5`.
- Warning: `#f59e0b`, text `#92400e`, strong text `#b45309`, soft `#fffbeb`, border `#fde68a`.
- Danger: `#dc2626`, text `#991b1b`, soft `#fef2f2`, border `#fecaca`.

Shape and density:

- App bar height: `54px`.
- Desktop left panel: `312px`.
- Desktop inspector: `328px`.
- Control heights: `28px`, `30px`, `34px`, `36px`.
- Primary panel radius: `8-10px`; compact inner controls: `5-7px`; large summary cards only may use `14-16px`.
- Standard panel padding: `12-16px`.
- Dense row padding: `7-11px`.
- Shadow: restrained `0 4px 16px rgba(15,23,42,.08)`.

## App Bar

The Studio app bar is dark, fixed-height, and utilitarian.

Required structure:

- Brand block: blue `26x26px` mark with `F`, `FORTIS`, mono `Studio`.
- Segmented navigation on `#1e293b`: `Карта защиты`, `Калькулятор`, `Сценарии BETA`.
- Low-emphasis access: `Анализ`.
- Current facility/status chip: `Завод Альфа · Вариант A`.
- Disabled undo/redo placeholders when history is not implemented.
- `Сохранить` action with visible draft/sync state.
- Export action must either call report/export flow or be disabled with clear title.

Navigation contracts:

- Top nav items that change routes must be links.
- Disabled controls must use `disabled`, low contrast, and `cursor: not-allowed`.
- Do not make `Сценарии` look like an available production mode unless its current route/state is intentionally implemented.

## Prototype Workspace

Desktop `/prototype` uses a three-pane workspace:

- Left: `312px`, white surface, right border.
- Center: live map stage.
- Right: `328px`, white inspector, left border.
- All three panes fill the remaining height below the app bar.

The left panel has two tabs:

- `Эшелоны`
- `Библиотека`

Use real tab semantics:

- parent `role="tablist"`;
- each tab `role="tab"`;
- active tab `aria-selected="true"`;
- active tab uses a `2.5px` blue underline.

Search is compact:

- height `36px`;
- background `#f8fafc`;
- placeholder switches between `Найти эшелон или объект…` and `Найти средство…`.

## Echelon Tree

Echelon rows are compact cards, not large content cards.

Layer card anatomy:

- colored square/dot `9x9px`, radius `3px`;
- mono layer code (`L1`, `L2`, ...), width about `20px`;
- name and distance range;
- object count chip;
- caret/expand affordance;
- nested object rows.

Canonical echelon colors from the HTML source:

- `L1` Внешнее предупреждение: `#2563eb`.
- `L2` Обнаружение: `#0891b2`.
- `L3` Идентификация: `#0d9488`.
- `L4` Подавление: `#059669`.
- `L5` Средний рубеж: `#65a30d`.
- `L6` Последний рубеж: `#ca8a04`.
- `L7` Срыв точности: `#ea580c`.
- `L8` Пассивная защита: `#dc2626`.
- `L9` Hardening: `#7c3aed`.

Nested object row:

- must be a `button`;
- selected row background `#eff6ff`, border `#bfdbfe`;
- status dot: success for active, muted for planned/off, warning for conflicts;
- right side shows calculated line cost.

## Library

Library cards are compact draggable/addable rows.

Group labels from the source:

- `Обнаружение`
- `РЭБ / Подавление`
- `Огневое поражение`
- `Пассивная защита`

Card anatomy:

- glyph badge `30x30px`, dark `#0f172a`, mono uppercase;
- asset name, single-line ellipsis;
- meta line: price and range;
- drag handle or add action.

Runtime rule: library data must come from `DefenseProject.assetLibrary`. The HTML `LIBRARY` array is demo seed only.

## Map Stage

The UI kit visualizes the map as a radar-like defense board, but production `/prototype` must use the real GIS board/MapLibre/Deck flow.

Required map shell:

- center stage fills available width/height;
- top-left selected layer chip;
- top-right compact toolbar;
- warning stack above footer;
- dark status footer at bottom.

Toolbar controls:

- `Покрытие`
- `Подписи`
- `Ограничения`
- `Линейка`
- basemap selector `Карта`
- zoom `+` and `−`

Controls must be real buttons and must change viewport or display state. Zoom buttons cannot be static decoration.

Status footer copy pattern:

- coordinates: `55.1042°N · 37.0976°E`;
- scale: `Масштаб 1:240 000`;
- object/cost summary;
- draft/saved state.

## Warnings

Warning stack uses small, scan-friendly notices:

- Budget notice: blue soft surface.
- Blind sector / operational warning: amber soft surface.
- Conflict: red soft surface.

Warnings should be driven by project state or explicit demo conflict flags. Static warnings are allowed only as demo placeholders while marked and isolated.

## Object Inspector

Inspector header:

- eyebrow `Инспектор объекта`;
- close button;
- glyph badge `36x36px`;
- object name;
- layer label;
- chips for status, score and line cost.

Editable fields:

- `Широта`
- `Долгота`
- `Азимут, °`
- `Сектор, °`
- `Дальность, км`
- `Кол-во, ед.`
- `Статус`
- `Заметки`

Runtime rule: inspector edits the selected `PlacedDefenseObject` in `DefenseProject.placedObjects`; changes persist through the existing store/localStorage flow.

Actions:

- `Показать на карте` focuses the map on the object.
- `Удалить` removes the placed object from the project.
- МОГ-specific composition opens as a detailed flow, not a permanently open side drawer.

## Calculator View

`/calculator` is a Studio sibling view, not a marketing page.

Source layout:

- max content width `1080px`;
- page padding `30px 28px 60px`;
- title block with mono eyebrow `Калькулятор защиты от БПЛА`;
- large estimate card: `Итого по конфигурации`;
- configuration sync strip;
- main estimate list plus sticky summary/budget aside.

Calculator rows:

- grouped by echelon;
- top row: layer dot, code, name, range, total;
- item rows: status dot, object name, quantity, line cost.

Runtime rule: all counts and costs come from current `DefenseProject.placedObjects` and `DefenseProject.assetLibrary`.

## Mobile Rules

The source HTML is desktop-first. Implementation must adapt it:

- No horizontal overflow at `390x844`.
- App bar becomes compact mobile header plus route tabs.
- Workspace stacks in this order: map, echelon/library panel, inspector or bottom sheet.
- Inspector must not be a clipped desktop sidebar.
- Map controls remain reachable and do not overlap warning stack/footer.
- Touch targets should be at least `44px` where space allows.

## Implementation Rules

- Do not use the HTML `SEED`, `ECHELONS`, or `LIBRARY` arrays as runtime source of truth.
- Demo seed is allowed only when there is no saved/current `DefenseProject`.
- `/prototype` must read:
  - `DefenseProject.layers`;
  - `DefenseProject.placedObjects`;
  - `DefenseProject.assetLibrary`;
  - active/selected state from the defense project store.
- The production map remains MapLibre/Deck through the existing GIS board.
- Clickable rows, tabs and controls must be `button`/`link`, not clickable `div`.
- Avoid SVG-only mock map in production runtime.
