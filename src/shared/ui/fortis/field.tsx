import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface FieldSharedProps {
  error?: string;
  helpText?: string;
  invalid?: boolean;
  label: string;
}

const labelClassName = "text-sm font-medium text-[var(--fortis-semantic-light-text-primary)]";
const fieldClassName =
  "w-full min-w-0 rounded-[var(--fortis-component-field-radius)] border border-[var(--fortis-component-field-border)] bg-[var(--fortis-component-field-surface)] px-3 text-sm text-[var(--fortis-semantic-light-text-primary)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--fortis-semantic-light-text-secondary)] hover:border-[var(--fortis-component-field-hover-border)] focus-visible:border-[var(--fortis-semantic-light-border-interactive)] focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)] focus-visible:ring-offset-1 read-only:bg-[var(--fortis-semantic-light-background-subtle)] disabled:cursor-not-allowed disabled:opacity-[var(--fortis-semantic-light-state-disabled-opacity)] aria-[invalid=true]:border-[var(--fortis-component-field-invalid-border)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--fortis-component-field-invalid-border)]";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">, FieldSharedProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, helpText, id, invalid = false, label, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error ?? helpText;
  const messageId = message ? `${inputId}-description` : undefined;

  return (
    <div className="grid min-w-0 gap-1.5">
      <label className={labelClassName} htmlFor={inputId}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        ref={ref}
        aria-describedby={messageId}
        aria-invalid={invalid || Boolean(error) || undefined}
        className={cn(fieldClassName, "min-h-[var(--fortis-component-field-height)]", className)}
        id={inputId}
        required={required}
        {...props}
      />
      {message ? (
        <p className={cn("text-[0.8125rem]", error ? "text-[var(--fortis-semantic-light-status-danger-text)]" : "text-[var(--fortis-semantic-light-text-secondary)]")} id={messageId}>
          {message}
        </p>
      ) : null}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldSharedProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, helpText, id, invalid = false, label, maxLength, required, value, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const message = error ?? helpText;
  const messageId = message ? `${textareaId}-description` : undefined;
  const counterId = maxLength ? `${textareaId}-counter` : undefined;
  const describedBy = [messageId, counterId].filter(Boolean).join(" ") || undefined;
  const valueLength = typeof value === "string" ? value.length : 0;

  return (
    <div className="grid min-w-0 gap-1.5">
      <label className={labelClassName} htmlFor={textareaId}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <textarea
        ref={ref}
        aria-describedby={describedBy}
        aria-invalid={invalid || Boolean(error) || undefined}
        className={cn(fieldClassName, "min-h-[6.5rem] py-2.5", className)}
        id={textareaId}
        maxLength={maxLength}
        required={required}
        value={value}
        {...props}
      />
      <div className="flex min-w-0 items-start justify-between gap-3">
        {message ? (
          <p className={cn("text-[0.8125rem]", error ? "text-[var(--fortis-semantic-light-status-danger-text)]" : "text-[var(--fortis-semantic-light-text-secondary)]")} id={messageId}>
            {message}
          </p>
        ) : <span />}
        {maxLength ? (
          <p className="shrink-0 text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]" id={counterId}>
            {valueLength}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
});
