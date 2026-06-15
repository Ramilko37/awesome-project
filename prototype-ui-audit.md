# Prototype UI audit

## Найденные расхождения

- Левая библиотека уже задает базовый паттерн: компактная белая карточка, `8px` radius, тонкий `slate` border, `text-xs/text-sm`, мягкий `blue/emerald` selected state.
- Верхний контекст библиотеки и поиск были собраны прямыми Tailwind-классами и отличались от карточек по отступам, высоте и focus/hover состояниям.
- Панель объектов эшелона использовала отдельную карточную систему: `rounded-2xl`, более крупные тени, другие статусы и кнопки.
- Нижняя панель эшелонов была визуально тяжелее библиотеки: крупнее radius, крупные цифры, negative letter spacing, другие icon button states.
- Drawer настройки МОГ выглядел как отдельный продукт: `rounded-[1.75rem]`, большие секции `rounded-3xl`, pill controls и full-height drawer с другой плотностью.
- Coordinate placement и layer wizard дублировали input/button styles и использовали radius/цвета, не связанные с карточками библиотеки.

## Локальные primitives

- `prototypePanel`, `prototypeSectionHeader`, `prototypeCard`, `prototypeField`, `prototypeButton*`, `prototypeIconButton`, `prototypeBadge`.
- `prototypeCounter`, `prototypeNotice`, `prototypeDrawer`, `prototypeDrawerSection`, `prototypeLayerCard`.
- Общие CSS custom properties для radius, border, muted text, Fortis blue, success/warning/danger и compact control heights.

## Сделанные изменения

- Визуальные токены вынесены в CSS-модуль `/prototype`, без глобального UI-переезда.
- Sidebar controls, карточки/формы управления библиотекой, object panel, нижняя панель эшелонов, coordinate panel, layer wizard и МОГ drawer приведены к единой плотности.
- Кнопки `primary/secondary/ghost/danger/icon`, input/select/textarea и counter controls используют одну шкалу высоты, radius и state styles.
- Бизнес-логика `DefenseProject`, drag-to-map, МОГ-настройки, эшелоны и расчеты стоимости не менялись.
