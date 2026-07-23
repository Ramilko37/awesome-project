import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { useState } from "react";

import { Alert, AssetCard, Badge, Breadcrumbs, BudgetMetric, Button, Checkbox, CoverageStatus, Drawer, DropdownMenu, EchelonTreeItem, EmptyState, ErrorState, IconButton, InlineMessage, Input, LoadingState, Modal, Navigation, ObjectInspector, PageHeader, Pagination, Popover, RadioGroup, SaveIndicator, Search, SegmentedControl, Select, Status, SuccessState, Switch, Table, Tabs, Tag, Textarea, Toast, Tooltip, VersionIndicator, WarningStack } from "./index";

const meta = { title: "Components/Individual" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const panel = (children: ReactNode) => <section className="fortis-storybook-panel">{children}</section>;

export const ButtonStory: Story = { name: "Button", render: () => panel(<><h1>Button</h1><Button>Сохранить проект</Button></>) };
export const IconButtonStory: Story = { name: "IconButton", render: () => panel(<><h1>IconButton</h1><IconButton icon="action.locate" label="Центрировать карту" /></>) };
export const InputStory: Story = { name: "Input", render: () => panel(<Input defaultValue="Завод Альфа" label="Название объекта" message="Используется в отчётах." />) };
export const TextareaStory: Story = { name: "Textarea", render: () => panel(<Textarea defaultValue="Уточнено покрытие северного сектора." label="Комментарий к версии" />) };
export const SelectStory: Story = { name: "Select", render: () => panel(<Select defaultValue="base" label="Сценарий расчёта" options={[{ label: "Базовый · L1–L4", value: "base" }, { label: "Расширенный · L1–L5", value: "extended" }]} />) };
function SearchExample() { const [value, setValue] = useState("МОГ"); return <Search label="Поиск по активам" onChange={(event) => setValue(event.target.value)} onClear={() => setValue("")} value={value} />; }
export const SearchStory: Story = { name: "Search", render: () => panel(<SearchExample />) };
function CheckboxExample() { const [checked, setChecked] = useState(true); return <Checkbox checked={checked} label="Показывать зоны покрытия" onCheckedChange={setChecked} />; }
export const CheckboxStory: Story = { name: "Checkbox", render: () => panel(<CheckboxExample />) };
function RadioExample() { const [value, setValue] = useState("current"); return <RadioGroup label="Версия" onValueChange={setValue} options={[{ label: "Текущая версия", value: "current" }, { label: "Сравнение с v11", value: "compare" }]} value={value} />; }
export const RadioStory: Story = { name: "Radio", render: () => panel(<RadioExample />) };
function SwitchExample() { const [checked, setChecked] = useState(true); return <Switch checked={checked} label="Автосохранение проекта" onCheckedChange={setChecked} />; }
export const SwitchStory: Story = { name: "Switch", render: () => panel(<SwitchExample />) };
function TabsExample() { const [value, setValue] = useState("object"); return <Tabs onValueChange={setValue} value={value} items={[{ content: "МОГ — пост №1", id: "object", label: "Объект" }, { content: "L1–L4", id: "layers", label: "Эшелоны" }]} />; }
export const TabsStory: Story = { name: "Tabs", render: () => panel(<TabsExample />) };
function SegmentedExample() { const [value, setValue] = useState("scheme"); return <SegmentedControl items={[{ label: "Схема", value: "scheme" }, { label: "Таблица", value: "table" }]} onValueChange={setValue} value={value} />; }
export const SegmentedControlStory: Story = { name: "SegmentedControl", render: () => panel(<SegmentedExample />) };
export const BadgeStory: Story = { name: "Badge", render: () => panel(<Badge tone="accent">L2 · Ближняя зона</Badge>) };
export const StatusStory: Story = { name: "Status", render: () => panel(<Status label="Покрытие требует проверки" tone="warning" />) };
export const TagStory: Story = { name: "Tag", render: () => panel(<Tag label="Покрытие" onRemove={() => undefined} selected />) };
export const AlertStory: Story = { name: "Alert", render: () => panel(<Alert title="Версия готова к проверке" tone="warning">Покрытие северного сектора — 71%.</Alert>) };
function ToastExample() { const [visible, setVisible] = useState(true); return <>{visible ? <Toast duration={60000} message="Версия 12 сохранена" onClose={() => setVisible(false)} /> : <Button onClick={() => setVisible(true)}>Показать уведомление</Button>}</>; }
export const ToastStory: Story = { name: "Toast", render: () => panel(<ToastExample />) };
export const InlineMessageStory: Story = { name: "InlineMessage", render: () => panel(<InlineMessage tone="warning">Покрытие северного сектора — 71%</InlineMessage>) };
export const TooltipStory: Story = { name: "Tooltip", render: () => panel(<Tooltip label="Показывает долю защищённой площади"><Button variant="secondary">Покрытие</Button></Tooltip>) };
export const DropdownMenuStory: Story = { name: "DropdownMenu", render: () => panel(<DropdownMenu items={[{ label: "Сравнить версии", onSelect: () => undefined }, { danger: true, label: "Удалить расчёт", onSelect: () => undefined }]} />) };
export const PopoverStory: Story = { name: "Popover", render: () => panel(<Popover label="О расчёте"><strong>Покрытие</strong><p>Доля защищённой площади.</p></Popover>) };
function ModalExample() { const [open, setOpen] = useState(false); return <><Button onClick={() => setOpen(true)}>Открыть окно</Button><Modal onClose={() => setOpen(false)} open={open} title="Сохранить версию"><p>Сохранить текущие изменения?</p></Modal></>; }
export const ModalStory: Story = { name: "Modal", render: () => panel(<ModalExample />) };
function DrawerExample() { const [open, setOpen] = useState(false); return <><Button onClick={() => setOpen(true)}>Открыть панель</Button><Drawer onClose={() => setOpen(false)} open={open} title="Инспектор объекта"><p>МОГ — пост №1 · L2</p></Drawer></>; }
export const DrawerStory: Story = { name: "Drawer", render: () => panel(<DrawerExample />) };
export const TableStory: Story = { name: "Table", render: () => panel(<Table columns={[{ key: "asset", label: "Актив" }, { key: "state", label: "Статус" }]} rows={[{ asset: "МОГ — пост №1", id: "mog", state: "В проекте" }]} />) };
function PaginationExample() { const [page, setPage] = useState(2); return <Pagination onPageChange={setPage} page={page} pageCount={3} />; }
export const PaginationStory: Story = { name: "Pagination", render: () => panel(<PaginationExample />) };
export const EmptyStateStory: Story = { name: "EmptyState", render: () => panel(<EmptyState description="Добавьте первый актив в выбранный эшелон." title="Нет активов" />) };
export const LoadingStateStory: Story = { name: "LoadingState", render: () => panel(<LoadingState label="Считаем покрытие" />) };
export const ErrorStateStory: Story = { name: "ErrorState", render: () => panel(<ErrorState description="Проверьте соединение и повторите запрос." onRetry={() => undefined} title="Данные недоступны" />) };
export const SuccessStateStory: Story = { name: "SuccessState", render: () => panel(<SuccessState description="v12 · Андрей Морозов · 14:32" title="Версия сохранена" />) };
export const NavigationStory: Story = { name: "Navigation", render: () => panel(<Navigation currentId="gis" items={[{ href: "#", id: "overview", label: "Обзор" }, { href: "#", id: "gis", label: "GIS Workspace" }]} />) };
export const BreadcrumbsStory: Story = { name: "Breadcrumbs", render: () => panel(<Breadcrumbs items={[{ href: "#", label: "Проекты" }, { label: "Завод Альфа" }]} />) };
export const PageHeaderStory: Story = { name: "PageHeader", render: () => panel(<PageHeader description="21 актив · 4 эшелона" eyebrow="FP-ALPHA-012 · v12" title="Завод Альфа" />) };
export const AssetCardStory: Story = { name: "AssetCard", render: () => panel(<AssetCard meta="Мобильная огневая группа · 3,2 км" selected status="Активен" title="МОГ — пост №1" />) };
export const EchelonTreeItemStory: Story = { name: "EchelonTreeItem", render: () => panel(<div role="tree"><EchelonTreeItem count={9} label="Ближняя зона" level="L2" selected /></div>) };
export const ObjectInspectorStory: Story = { name: "ObjectInspector", render: () => panel(<ObjectInspector assetCode="MOG-001 · L2" title="МОГ — пост №1" />) };
export const BudgetMetricStory: Story = { name: "BudgetMetric", render: () => panel(<BudgetMetric comparison="92% лимита" label="Стоимость конфигурации" status="warning" value="₽ 184 760 000" />) };
export const CoverageStatusStory: Story = { name: "CoverageStatus", render: () => panel(<CoverageStatus entries={[{ label: "L1 · Периметр", pattern: "solid", value: "96%" }, { label: "L2 · Ближняя", pattern: "dashed", value: "87%" }]} />) };
export const WarningStackStory: Story = { name: "WarningStack", render: () => panel(<WarningStack warnings={[{ detail: "Северный сектор", title: "Покрытие 71%" }]} />) };
export const SaveIndicatorStory: Story = { name: "SaveIndicator", render: () => panel(<SaveIndicator detail="14:32" state="saved" />) };
export const VersionIndicatorStory: Story = { name: "VersionIndicator", render: () => panel(<VersionIndicator status="current" version="v12" />) };
