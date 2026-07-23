"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef, useId } from "react";

import { Icon, type FortisIconName } from "./icon";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
type ControlSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  leadingIcon?: ReactNode;
  loading?: boolean;
  size?: ControlSize;
  trailingIcon?: ReactNode;
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, disabled, leadingIcon, loading = false, size = "md", trailingIcon, type = "button", variant = "primary", ...props },
  ref,
) {
  return (
    <button aria-busy={loading || undefined} className={`fortis-button ${className ?? ""}`} data-size={size} data-variant={variant} disabled={disabled || loading} ref={ref} type={type} {...props}>
      {loading ? <Icon decorative className="fortis-spinner" name="status.loading" size={16} /> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
});

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: FortisIconName;
  label: string;
  loading?: boolean;
  size?: ControlSize;
  variant?: "default" | "quiet" | "danger";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, disabled, icon, label, loading = false, size = "md", type = "button", variant = "default", ...props },
  ref,
) {
  return <button aria-busy={loading || undefined} aria-label={label} className={`fortis-icon-button ${className ?? ""}`} data-size={size} data-variant={variant} disabled={disabled || loading} ref={ref} title={label} type={type} {...props}>{loading ? <Icon decorative className="fortis-spinner" name="status.loading" size={16} /> : <Icon decorative name={icon} size={16} />}</button>;
});

type FieldBase = { invalid?: boolean; label?: string; message?: string };
type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldBase;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, id, invalid = false, label, message, ...props }, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = message ? `${inputId}-message` : undefined;
  return <label className="fortis-field" data-invalid={invalid || undefined} htmlFor={inputId}><span className="fortis-field__label">{label}</span><input aria-describedby={messageId} aria-invalid={invalid || undefined} className={`fortis-input ${className ?? ""}`} id={inputId} ref={ref} {...props} />{message ? <span className="fortis-field__message" id={messageId}>{message}</span> : null}</label>;
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldBase;
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, id, invalid = false, label, message, ...props }, ref) {
  const generatedId = useId(); const inputId = id ?? generatedId; const messageId = message ? `${inputId}-message` : undefined;
  return <label className="fortis-field" data-invalid={invalid || undefined} htmlFor={inputId}><span className="fortis-field__label">{label}</span><textarea aria-describedby={messageId} aria-invalid={invalid || undefined} className={`fortis-textarea ${className ?? ""}`} id={inputId} ref={ref} {...props} />{message ? <span className="fortis-field__message" id={messageId}>{message}</span> : null}</label>;
});

type Option = { disabled?: boolean; label: string; value: string };
type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & FieldBase & { options: Option[]; placeholder?: string };
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, id, invalid = false, label, message, options, placeholder, ...props }, ref) {
  const generatedId = useId(); const inputId = id ?? generatedId; const messageId = message ? `${inputId}-message` : undefined;
  return <label className="fortis-field" data-invalid={invalid || undefined} htmlFor={inputId}><span className="fortis-field__label">{label}</span><select aria-describedby={messageId} aria-invalid={invalid || undefined} className={`fortis-select ${className ?? ""}`} id={inputId} ref={ref} {...props}>{placeholder ? <option value="">{placeholder}</option> : null}{options.map((option) => <option disabled={option.disabled} key={option.value} value={option.value}>{option.label}</option>)}</select>{message ? <span className="fortis-field__message" id={messageId}>{message}</span> : null}</label>;
});

type SearchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; onClear?: () => void };
export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search({ className, label, onClear, value, ...props }, ref) {
  const hasValue = typeof value === "string" && value.length > 0;
  return <label className={`fortis-field ${className ?? ""}`}><span className="fortis-field__label">{label}</span><span className="fortis-search"><Icon decorative className="fortis-search__icon" name="action.search" size={16} /><input className="fortis-input" ref={ref} type="search" value={value} {...props} />{hasValue && onClear ? <IconButton className="fortis-search__clear" icon="action.close" label="Очистить поиск" onClick={onClear} size="sm" variant="quiet" /> : null}</span></label>;
});

export function Badge({ children, tone, variant }: { children: ReactNode; tone?: "neutral" | "accent"; variant?: "neutral" | "accent" }) { return <span className="fortis-badge" data-tone={tone ?? variant ?? "neutral"}>{children}</span>; }

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";
const statusIcons: Record<Exclude<StatusTone, "neutral">, FortisIconName> = { danger: "status.error", info: "status.info", success: "status.success", warning: "status.warning" };
export function Status({ detail, label, tone = "neutral" }: { detail?: string; label: string; tone?: StatusTone }) { return <span aria-live={tone === "danger" ? "assertive" : "polite"} className="fortis-status" data-tone={tone} role="status">{tone !== "neutral" ? <Icon decorative name={statusIcons[tone]} size={16} /> : null}<span>{label}</span>{detail ? <span>· {detail}</span> : null}</span>; }

export function InlineMessage({ action, children, tone = "info" }: { action?: ReactNode; children: ReactNode; tone?: "info" | "warning" | "error" }) { const icon = tone === "error" ? "status.error" : tone === "warning" ? "status.warning" : "status.info"; return <div className="fortis-inline-message" data-tone={tone}><Icon decorative name={icon} size={16} /><span>{children}</span>{action}</div>; }
