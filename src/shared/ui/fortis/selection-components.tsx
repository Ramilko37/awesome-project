"use client";

import { forwardRef, useId, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { Switch as SwitchPrimitive, Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import type { FortisControlSize } from "./button";

const controlHeight: Record<FortisControlSize, string> = {
  sm: "min-h-10",
  md: "min-h-[var(--fortis-density-modes-active-control-height)]",
  lg: "min-h-[var(--fortis-density-modes-comfortable-control-height)]",
};

const fieldClassName = "w-full min-w-0 rounded-[var(--fortis-component-field-radius)] border border-[var(--fortis-component-field-border)] bg-[var(--fortis-component-field-surface)] px-3 text-sm text-[var(--fortis-semantic-light-text-primary)] outline-none transition-[border-color,box-shadow] hover:border-[var(--fortis-component-field-hover-border)] focus-visible:border-[var(--fortis-semantic-light-border-interactive)] focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-[var(--fortis-semantic-light-state-disabled-opacity)] aria-[invalid=true]:border-[var(--fortis-component-field-invalid-border)]";

export interface FortisOption { value: string; label: string; disabled?: boolean; description?: string; }

export interface SelectProps {
  label: string;
  options: FortisOption[];
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  helpText?: string;
  size?: FortisControlSize;
}

export function Select({ defaultValue, disabled, error, helpText, invalid, label, onValueChange, options, placeholder = "Выберите значение", size = "md", value }: SelectProps) {
  const id = useId();
  const message = error ?? helpText;
  const messageId = message ? `${id}-description` : undefined;
  return <label className="grid min-w-0 gap-1.5" htmlFor={id}>
    <span className="text-sm font-medium text-[var(--fortis-semantic-light-text-primary)]">{label}</span>
    <span className="relative">
      <select aria-describedby={messageId} aria-invalid={invalid || Boolean(error) || undefined} className={cn(fieldClassName, controlHeight[size], "appearance-none pr-10")} defaultValue={defaultValue} disabled={disabled} id={id} onChange={(event) => onValueChange?.(event.target.value)} value={value ?? undefined}>
        <option disabled value="">{placeholder}</option>
        {options.map((option) => <option disabled={option.disabled} key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fortis-semantic-light-text-secondary)]" decorative name="navigation.chevronDown" size={16} />
    </span>
    {message ? <span className={cn("text-[0.8125rem]", error ? "text-[var(--fortis-semantic-light-status-danger-text)]" : "text-[var(--fortis-semantic-light-text-secondary)]")} id={messageId}>{message}</span> : null}
  </label>;
}

export interface SearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "onSubmit" | "size" | "value"> {
  label: string;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  resultLabel?: string;
  loading?: boolean;
  onSubmit?: (query: string) => void;
}

export function Search({ defaultQuery = "", disabled, label, loading = false, onQueryChange, onSubmit, placeholder = "Поиск", query, resultLabel, ...props }: SearchProps) {
  const id = useId();
  const [internalQuery, setInternalQuery] = useState(defaultQuery);
  const activeQuery = query ?? internalQuery;
  const updateQuery = (nextQuery: string) => { if (query === undefined) setInternalQuery(nextQuery); onQueryChange?.(nextQuery); };
  return <form aria-label={label} className="grid min-w-0 gap-1.5" onSubmit={(event: FormEvent) => { event.preventDefault(); onSubmit?.(activeQuery); }} role="search">
    <label className="text-sm font-medium text-[var(--fortis-semantic-light-text-primary)]" htmlFor={id}>{label}</label>
    <span className="relative flex"><Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fortis-semantic-light-text-secondary)]" decorative name="action.search" size={16} />
      <input {...props} aria-busy={loading || undefined} className={cn(fieldClassName, "min-h-[var(--fortis-density-modes-active-control-height)] pl-10", activeQuery ? "pr-10" : undefined)} disabled={disabled} id={id} onChange={(event: ChangeEvent<HTMLInputElement>) => updateQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape" && activeQuery) { event.preventDefault(); updateQuery(""); } }} placeholder={placeholder} value={activeQuery} />
      {activeQuery ? <button aria-label="Очистить поиск" className="absolute right-1 top-1/2 grid min-h-10 min-w-10 -translate-y-1/2 place-items-center rounded-[var(--fortis-radii-control)] text-[var(--fortis-semantic-light-text-secondary)] outline-none hover:bg-[var(--fortis-semantic-light-state-hover-surface)] focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)]" onClick={() => updateQuery("")} type="button"><Icon decorative name="action.close" size={16} /></button> : null}
    </span>
    <span aria-live="polite" className="min-h-5 text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">{loading ? "Поиск…" : resultLabel}</span>
  </form>;
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> { label: ReactNode; description?: ReactNode; indeterminate?: boolean; invalid?: boolean; }
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ className, description, indeterminate = false, invalid = false, label, ...props }, ref) {
  const id = useId();
  return <label className="flex min-h-[var(--fortis-density-modes-active-control-height)] cursor-pointer items-start gap-3 rounded-[var(--fortis-radii-control)] py-2 text-sm text-[var(--fortis-semantic-light-text-primary)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-[var(--fortis-semantic-light-state-disabled-opacity)]" htmlFor={id}>
    <input {...props} aria-invalid={invalid || undefined} aria-checked={indeterminate ? "mixed" : undefined} className={cn("mt-0.5 h-5 w-5 shrink-0 accent-[var(--fortis-semantic-light-action-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)]", className)} id={id} ref={(node) => { if (node) node.indeterminate = indeterminate; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; }} type="checkbox" />
    <span className="grid gap-0.5"><span>{label}</span>{description ? <span className="text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">{description}</span> : null}</span>
  </label>;
});

export interface RadioOption { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean; }
export interface RadioProps { label: string; options: RadioOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; orientation?: "stacked" | "inline"; disabled?: boolean; }
export function Radio({ defaultValue, disabled, label, onValueChange, options, orientation = "stacked", value }: RadioProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? ""); const activeValue = value ?? internalValue; const name = useId();
  return <fieldset className={cn("min-w-0", orientation === "inline" ? "flex flex-wrap gap-x-5 gap-y-2" : "grid gap-1")}><legend className={cn("text-sm font-medium text-[var(--fortis-semantic-light-text-primary)]", orientation === "inline" ? "mr-2" : "mb-1")}>{label}</legend>{options.map((option) => <label className="flex min-h-[var(--fortis-density-modes-active-control-height)] cursor-pointer items-start gap-3 py-2 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-[var(--fortis-semantic-light-state-disabled-opacity)]" key={option.value}><input checked={activeValue === option.value} disabled={disabled || option.disabled} name={name} onChange={() => { if (value === undefined) setInternalValue(option.value); onValueChange?.(option.value); }} type="radio" value={option.value} /><span className="grid gap-0.5"><span>{option.label}</span>{option.description ? <span className="text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">{option.description}</span> : null}</span></label>)}</fieldset>;
}

export interface SwitchProps { label: ReactNode; checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void; disabled?: boolean; loading?: boolean; description?: ReactNode; }
export function Switch({ checked, defaultChecked = false, description, disabled, label, loading = false, onCheckedChange }: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked); const activeChecked = checked ?? internalChecked;
  return <label className="flex min-h-[var(--fortis-density-modes-active-control-height)] cursor-pointer items-center justify-between gap-4 rounded-[var(--fortis-radii-control)] py-2 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-[var(--fortis-semantic-light-state-disabled-opacity)]"><span className="grid gap-0.5"><span>{label}</span>{description ? <span className="text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">{description}</span> : null}</span><SwitchPrimitive.Root aria-busy={loading || undefined} checked={activeChecked} className="relative h-5 w-9 shrink-0 rounded-full bg-[var(--fortis-semantic-light-border-strong)] outline-none transition-colors data-[state=checked]:bg-[var(--fortis-semantic-light-action-primary)] focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)] disabled:opacity-[var(--fortis-semantic-light-state-disabled-opacity)]" disabled={disabled || loading} onCheckedChange={(nextChecked) => { if (checked === undefined) setInternalChecked(nextChecked); onCheckedChange?.(nextChecked); }}><SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[1.125rem]" /></SwitchPrimitive.Root></label>;
}

export interface TabItem { value: string; label: ReactNode; content: ReactNode; disabled?: boolean; }
export interface TabsProps { items: TabItem[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; orientation?: "horizontal" | "vertical"; variant?: "line" | "contained"; activationMode?: "automatic" | "manual"; }
export function Tabs({ activationMode = "automatic", defaultValue, items, onValueChange, orientation = "horizontal", value, variant = "line" }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value ?? ""); const activeValue = value ?? internalValue;
  return <TabsPrimitive.Root activationMode={activationMode} className={cn("grid min-w-0 gap-3", orientation === "vertical" && "grid-cols-[minmax(10rem,auto)_minmax(0,1fr)]")} onValueChange={(nextValue) => { if (value === undefined) setInternalValue(nextValue); onValueChange?.(nextValue); }} orientation={orientation} value={activeValue}><TabsPrimitive.List aria-label="Разделы" className={cn("flex min-w-0 gap-1", orientation === "horizontal" ? "overflow-x-auto border-b border-[var(--fortis-semantic-light-border-default)]" : "flex-col border-r border-[var(--fortis-semantic-light-border-default)]", variant === "contained" && "rounded-[var(--fortis-radii-control)] border bg-[var(--fortis-semantic-light-background-subtle)] p-1")}>{items.map((item) => <TabsPrimitive.Trigger className={cn("min-h-10 shrink-0 rounded-[var(--fortis-radii-control)] px-3 text-sm font-medium text-[var(--fortis-semantic-light-text-secondary)] outline-none hover:bg-[var(--fortis-semantic-light-state-hover-surface)] focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)] data-[state=active]:bg-[var(--fortis-semantic-light-background-selected)] data-[state=active]:text-[var(--fortis-semantic-light-text-link)] disabled:opacity-[var(--fortis-semantic-light-state-disabled-opacity)]", variant === "line" && "data-[state=active]:shadow-[inset_0_-2px_0_var(--fortis-semantic-light-border-selected)]") } disabled={item.disabled} key={item.value} value={item.value}>{item.label}</TabsPrimitive.Trigger>)}</TabsPrimitive.List>{items.map((item) => <TabsPrimitive.Content className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)]" key={item.value} value={item.value}>{item.content}</TabsPrimitive.Content>)}</TabsPrimitive.Root>;
}

export interface Segment { value: string; label: ReactNode; disabled?: boolean; }
export interface SegmentedControlProps { items: Segment[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; disabled?: boolean; }
export function SegmentedControl({ defaultValue, disabled, items, onValueChange, value }: SegmentedControlProps) { const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value ?? ""); const activeValue = value ?? internalValue; return <div aria-label="Переключатель режима" className="inline-flex max-w-full rounded-[var(--fortis-radii-control)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-subtle)] p-1" role="radiogroup">{items.map((item) => <button aria-checked={activeValue === item.value} className="min-h-10 min-w-0 rounded-[var(--fortis-radii-control)] px-3 text-sm font-medium text-[var(--fortis-semantic-light-text-secondary)] outline-none aria-checked:bg-[var(--fortis-semantic-light-background-surface)] aria-checked:text-[var(--fortis-semantic-light-text-primary)] aria-checked:shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)] disabled:opacity-[var(--fortis-semantic-light-state-disabled-opacity)]" disabled={disabled || item.disabled} key={item.value} onClick={() => { if (value === undefined) setInternalValue(item.value); onValueChange?.(item.value); }} role="radio" type="button">{item.label}</button>)}</div>; }

export interface TagProps { label: string; selected?: boolean; removable?: boolean; disabled?: boolean; onRemove?: () => void; }
export function Tag({ disabled, label, onRemove, removable = false, selected = false }: TagProps) { return <span className={cn("inline-flex min-h-7 max-w-full items-center gap-1 rounded-[var(--fortis-radii-badge)] border px-2 text-[0.8125rem] font-medium", selected ? "border-[var(--fortis-semantic-light-border-selected)] bg-[var(--fortis-semantic-light-background-selected)] text-[var(--fortis-semantic-light-text-link)]" : "border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-subtle)] text-[var(--fortis-semantic-light-text-secondary)]")}>{label}{removable ? <button aria-label={`Удалить ${label}`} className="-mr-1 grid min-h-6 min-w-6 place-items-center rounded outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)] disabled:opacity-40" disabled={disabled} onClick={onRemove} type="button"><Icon decorative name="action.close" size={14} /></button> : null}</span>; }
