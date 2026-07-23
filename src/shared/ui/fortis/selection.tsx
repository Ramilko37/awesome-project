"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

import { Icon } from "./icon";

export function Checkbox({ checked, description, disabled, invalid, label, onCheckedChange }: { checked?: boolean; description?: string; disabled?: boolean; invalid?: boolean; label: string; onCheckedChange?: (checked: boolean) => void }) {
  const id = useId();
  return <label className="fortis-choice" data-invalid={invalid || undefined} htmlFor={id}><input aria-invalid={invalid || undefined} checked={checked} disabled={disabled} id={id} onChange={(event) => onCheckedChange?.(event.target.checked)} type="checkbox" /><span><span>{label}</span>{description ? <small>{description}</small> : null}</span></label>;
}

export function RadioGroup({ label, onValueChange, options, value }: { label: string; onValueChange?: (value: string) => void; options: { disabled?: boolean; label: string; value: string }[]; value?: string }) {
  const groupId = useId();
  return <fieldset style={{ border: 0, display: "grid", margin: 0, padding: 0 }}><legend className="fortis-field__label">{label}</legend>{options.map((option) => <label className="fortis-choice" htmlFor={`${groupId}-${option.value}`} key={option.value}><input checked={option.value === value} disabled={option.disabled} id={`${groupId}-${option.value}`} name={groupId} onChange={() => onValueChange?.(option.value)} type="radio" value={option.value} /><span>{option.label}</span></label>)}</fieldset>;
}

export function Switch({ checked = false, disabled, label, loading, onCheckedChange }: { checked?: boolean; disabled?: boolean; label: string; loading?: boolean; onCheckedChange?: (checked: boolean) => void }) {
  return <span className="fortis-choice"><button aria-busy={loading || undefined} aria-checked={checked} aria-label={label} className="fortis-switch" data-checked={checked} disabled={disabled || loading} onClick={() => onCheckedChange?.(!checked)} role="switch" type="button"><span className="fortis-switch__thumb" /></button><span>{label}</span></span>;
}

export function Tabs({ items, onValueChange, value }: { items: { content: ReactNode; disabled?: boolean; id: string; label: string }[]; onValueChange?: (value: string) => void; value: string }) {
  const active = items.find((item) => item.id === value) ?? items[0];
  return <div><div aria-label="Раздел" className="fortis-tabs" role="tablist">{items.map((item) => <button aria-controls={`fortis-panel-${item.id}`} aria-selected={item.id === active?.id} className="fortis-tab" disabled={item.disabled} id={`fortis-tab-${item.id}`} key={item.id} onClick={() => onValueChange?.(item.id)} role="tab" type="button">{item.label}</button>)}</div>{active ? <div aria-labelledby={`fortis-tab-${active.id}`} id={`fortis-panel-${active.id}`} role="tabpanel" style={{ paddingTop: "var(--fortis-space-3)" }}>{active.content}</div> : null}</div>;
}

export function SegmentedControl({ items, onValueChange, value }: { items: { disabled?: boolean; label: string; value: string }[]; onValueChange?: (value: string) => void; value: string }) {
  return <div aria-label="Представление данных" className="fortis-segmented" role="group">{items.map((item) => <button aria-pressed={item.value === value} disabled={item.disabled} key={item.value} onClick={() => onValueChange?.(item.value)} type="button">{item.label}</button>)}</div>;
}

export function Tag({ disabled, label, onRemove, selected = false }: { disabled?: boolean; label: string; onRemove?: () => void; selected?: boolean }) {
  return <span className="fortis-tag" data-tone={selected ? "selected" : "neutral"}><span>{label}</span>{onRemove ? <button aria-label={`Удалить фильтр ${label}`} className="fortis-tag__remove" disabled={disabled} onClick={onRemove} type="button"><Icon decorative name="action.close" size={14} /></button> : null}</span>;
}

export function SelectionExample() {
  const [tab, setTab] = useState("object");
  return <Tabs onValueChange={setTab} value={tab} items={[{ content: "МОГ — пост №1 · MOG-001 · активен", id: "object", label: "Объект" }, { content: "L1–L4", id: "layers", label: "Эшелоны" }, { content: "₽ 184 760 000", id: "cost", label: "Стоимость" }]} />;
}
