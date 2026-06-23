# Prototype UI Audit: Migration Complete

Дата завершения: 2026-06-23

Старый аудит закрыт. Каноническая Studio UI kit-поверхность теперь описана в `docs/product/fortis-studio-styleguide.md` и реализована в `src/modules/drone-defense/ui/drone-defense-prototype.module.css` через `--studio-*` токены и `studio*` primitives.

## Что заменено

- Desktop left rail заменён верхним Fortis Studio app bar.
- Нижняя полоса эшелонов заменена левым деревом `Эшелоны`.
- Библиотека средств переехала во вкладку `Библиотека`.
- Floating panel объектов заменена правым `Инспектором объекта`.
- МОГ-редактор сохранён как детальный flow из инспектора.
- `/calculator` приведён к compact Studio sibling layout.

## Что сохраняется

- Real MapLibre/Deck.gl map stack.
- `DefenseProject` как source of truth.
- Существующие save/load и backend contracts.
- Drag/drop, coordinate placement, layer wizard и print/PDF report.
