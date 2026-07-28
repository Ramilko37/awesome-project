"use client";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Button, Status } from "./core";
import { Icon } from "./icon";

export function Table<T extends Record<string, ReactNode>>({ columns, rows }: { columns: { key: keyof T; label: string }[]; rows: (T & { disabled?: boolean; id: string; selected?: boolean })[] }) { return <div className="fortis-table-wrap"><table className="fortis-table"><thead><tr>{columns.map((column) => <th key={String(column.key)} scope="col">{column.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr data-disabled={row.disabled || undefined} data-selected={row.selected || undefined} key={row.id}>{columns.map((column) => <td key={String(column.key)}>{row[column.key]}</td>)}</tr>)}</tbody></table></div>; }
export function Pagination({ onPageChange, page, pageCount }: { onPageChange?: (page: number) => void; page: number; pageCount: number }) { return <nav aria-label="Страницы таблицы" className="fortis-pagination"><span className="fortis-mono">Страница {page} из {pageCount}</span><span className="fortis-pagination__actions"><Button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} size="sm" variant="secondary">Назад</Button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => <Button aria-current={item === page ? "page" : undefined} key={item} onClick={() => onPageChange?.(item)} size="sm" variant={item === page ? "primary" : "secondary"}>{item}</Button>)}<Button disabled={page >= pageCount} onClick={() => onPageChange?.(page + 1)} size="sm" variant="secondary">Далее</Button></span></nav>; }
export function EmptyState({ action, description, title }: { action?: ReactNode; description: string; title: string }) { return <section className="fortis-state"><Icon decorative name="status.info" size={28} /><h2>{title}</h2><p>{description}</p>{action}</section>; }
export function LoadingState({ label }: { label: string }) { return <section aria-live="polite" className="fortis-state" role="status"><Icon decorative className="fortis-spinner" name="status.loading" size={28} /><h2>{label}</h2></section>; }
export function ErrorState({ onRetry, description, title }: { description: string; onRetry?: () => void; title: string }) { return <section aria-live="assertive" className="fortis-state" role="alert"><Icon decorative name="status.error" size={28} /><h2>{title}</h2><p>{description}</p>{onRetry ? <Button onClick={onRetry}>Повторить</Button> : null}</section>; }
export function SuccessState({ action, description, title }: { action?: ReactNode; description?: string; title: string }) { return <section className="fortis-state"><Icon decorative name="status.success" size={28} /><h2>{title}</h2>{description ? <p>{description}</p> : null}{action}</section>; }
export function Navigation({ currentId, items }: { currentId: string; items: { href: string; id: string; label: string }[] }) { return <nav aria-label="Навигация проекта" className="fortis-navigation">{items.map((item) => <a aria-current={currentId === item.id ? "page" : undefined} href={item.href} key={item.id}>{item.label}</a>)}</nav>; }
export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) { return <nav aria-label="Хлебные крошки"><ol className="fortis-breadcrumbs">{items.map((item, index) => <li key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}{index < items.length - 1 ? <span aria-hidden="true"> / </span> : null}</li>)}</ol></nav>; }
export function PageHeader({ actions, description, eyebrow, title }: { actions?: ReactNode; description?: string; eyebrow?: string; title: string }) { return <header className="fortis-page-header">{eyebrow ? <span className="fortis-mono">{eyebrow}</span> : null}<h1>{title}</h1>{description ? <p>{description}</p> : null}{actions ? <div className="fortis-page-header__actions">{actions}</div> : null}</header>; }
type AssetCardProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  children?: ReactNode;
  conflict?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  meta: string;
  onSelect?: () => void;
  selected?: boolean;
  status?: ReactNode;
  title: string;
  tooltip?: string;
  warning?: boolean;
};

export function AssetCard({
  actions,
  children,
  className,
  conflict,
  disabled,
  leading,
  meta,
  onSelect,
  selected,
  status,
  title,
  tooltip,
  warning,
  ...props
}: AssetCardProps) {
  return (
    <article
      className={`fortis-card ${className ?? ""}`}
      data-conflict={conflict || undefined}
      data-disabled={disabled || undefined}
      data-selected={selected || undefined}
      data-warning={warning || undefined}
      title={tooltip}
      {...props}
    >
      <div className="fortis-card__title">
        <span className="fortis-card__identity">{leading}<strong title={title}>{title}</strong></span>
        {status}
      </div>
      <span className="fortis-card__meta">{meta}</span>
      {children ? <div className="fortis-card__content">{children}</div> : null}
      {actions || onSelect ? (
        <div className="fortis-card__actions">
          {actions ?? <Button disabled={disabled} onClick={onSelect} variant="secondary">Выбрать</Button>}
        </div>
      ) : null}
    </article>
  );
}

type EchelonTreeItemProps = {
  color?: string;
  count: string | number;
  current?: boolean;
  detail?: string;
  disabled?: boolean;
  hidden?: boolean;
  label: string;
  level: string;
  onSelect?: () => void;
  pattern?: "solid" | "dashed" | "dotted";
  selected?: boolean;
  title?: string;
  warning?: boolean;
};

const ECHELON_TREE_LEVEL_COLORS: Record<string, string> = {
  A: "var(--fortis-cyan-500)",
  L1: "var(--fortis-blue-500)",
  L2: "var(--fortis-cyan-500)",
  L3: "var(--fortis-violet-500)",
  L4: "var(--fortis-amber-600)",
};

const COVERAGE_STATUS_COLORS = [
  "var(--fortis-blue-500)",
  "var(--fortis-cyan-500)",
  "var(--fortis-violet-500)",
  "var(--fortis-amber-600)",
];

export function EchelonTreeItem({
  color,
  count,
  current,
  detail,
  disabled,
  hidden,
  label,
  level,
  onSelect,
  pattern = "solid",
  selected,
  title,
  warning,
}: EchelonTreeItemProps) {
  return (
    <button
      aria-current={current ? "true" : undefined}
      aria-selected={selected ?? false}
      className="fortis-tree-item"
      data-hidden={hidden || undefined}
      data-pattern={pattern}
      data-selected={selected || undefined}
      data-warning={warning || undefined}
      disabled={disabled}
      onClick={onSelect}
      role="treeitem"
      style={{ "--fortis-level": color ?? ECHELON_TREE_LEVEL_COLORS[level] ?? "var(--fortis-blue-500)" } as CSSProperties}
      title={title}
      type="button"
    >
      <span className="fortis-tree-item__copy">
        <span className="fortis-tree-item__identity">
          <span className="fortis-badge" data-tone="neutral">{level}</span>
          <span className="fortis-tree-item__label" title={title ?? label}>{label}</span>
        </span>
        {detail ? <small>{detail}</small> : null}
      </span>
      <span className="fortis-mono">{count}{warning ? " !" : ""}</span>
    </button>
  );
}
export function BudgetMetric({ comparison, label, status = "neutral", value }: { comparison?: string; label: string; status?: "neutral" | "warning" | "danger"; value: string }) { return <section className="fortis-metric"><span>{label}</span><strong className="fortis-metric__value">{value}</strong>{comparison ? <Status label={comparison} tone={status === "danger" ? "danger" : status === "warning" ? "warning" : "neutral"} /> : null}</section>; }
export function CoverageStatus({ entries }: { entries: { label: string; pattern: "solid" | "dashed" | "dotted"; value: string }[] }) { return <section className="fortis-card">{entries.map((entry, index) => <div className="fortis-coverage-row" key={entry.label}><span><i className="fortis-line-key" data-pattern={entry.pattern} style={{ "--fortis-level": COVERAGE_STATUS_COLORS[index] } as CSSProperties} /> {entry.label}</span><strong className="fortis-mono">{entry.value}</strong></div>)}</section>; }
export function WarningStack({ warnings }: { warnings: { action?: ReactNode; detail: string; title: string }[] }) { return <section className="fortis-warning-stack">{warnings.map((warning) => <div className="fortis-card__title" key={warning.title}><span><strong>{warning.title}</strong><br /><small>{warning.detail}</small></span>{warning.action}</div>)}</section>; }
