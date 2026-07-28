"use client";

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { Button, IconButton } from "./core";
import { Icon, type FortisIconName } from "./icon";

type Tone = "info" | "success" | "warning" | "danger";
const alertIcon = { danger: "status.error", info: "status.info", success: "status.success", warning: "status.warning" } as const;

export function Alert({ action, children, dismissible, onDismiss, title, tone = "info" }: { action?: ReactNode; children: ReactNode; dismissible?: boolean; onDismiss?: () => void; title: string; tone?: Tone }) { return <section className="fortis-alert" data-tone={tone} role={tone === "danger" ? "alert" : "status"}><Icon decorative name={alertIcon[tone]} size={20} /><div><strong>{title}</strong><p>{children}</p>{action}</div>{dismissible ? <IconButton icon="action.close" label="Закрыть сообщение" onClick={onDismiss} size="sm" variant="quiet" /> : null}</section>; }

function FocusOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  const previousFocus = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { const focusToRestore = previousFocus.current; const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); }; document.addEventListener("keydown", handleKey); return () => { document.removeEventListener("keydown", handleKey); focusToRestore?.focus(); }; }, []);
  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => { if (event.key !== "Tab") return; const focusable = [...(overlayRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])].filter((item) => !item.hasAttribute("hidden")); if (!focusable.length) { event.preventDefault(); return; } const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } };
  return <div className="fortis-overlay-backdrop" onKeyDown={trapFocus} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }} ref={overlayRef}>{children}</div>;
}

type OverlayProps = { children: ReactNode; description?: string; onClose: () => void; open: boolean; title: string };
export function Modal({ children, description, onClose, open, title }: OverlayProps) { if (!open) return null; return <FocusOverlay onClose={onClose}><section aria-describedby={description ? "fortis-modal-description" : undefined} aria-labelledby="fortis-modal-title" aria-modal="true" className="fortis-modal" role="dialog"><div className="fortis-overlay__header"><div><h2 id="fortis-modal-title">{title}</h2>{description ? <p id="fortis-modal-description">{description}</p> : null}</div><IconButton autoFocus icon="action.close" label="Закрыть окно" onClick={onClose} size="sm" variant="quiet" /></div>{children}</section></FocusOverlay>; }
export function Drawer({ children, description, onClose, open, title }: OverlayProps) { if (!open) return null; return <FocusOverlay onClose={onClose}><aside aria-describedby={description ? "fortis-drawer-description" : undefined} aria-labelledby="fortis-drawer-title" aria-modal="true" className="fortis-drawer" role="dialog"><div className="fortis-overlay__header"><div><h2 id="fortis-drawer-title">{title}</h2>{description ? <p id="fortis-drawer-description">{description}</p> : null}</div><IconButton autoFocus icon="action.close" label="Закрыть панель" onClick={onClose} size="sm" variant="quiet" /></div>{children}</aside></FocusOverlay>; }

export function Tooltip({ children, label }: { children: ReactNode; label: string }) { return <span className="fortis-tooltip">{children}<span className="fortis-tooltip__bubble" role="tooltip">{label}</span></span>; }
type DropdownMenuItem = {
  danger?: boolean;
  disabled?: boolean;
  id?: string;
  label: ReactNode;
  onSelect: () => void;
};

function dropdownMenuItemKey(item: DropdownMenuItem) {
  if (item.id) return item.id;
  if (typeof item.label === "string" || typeof item.label === "number") return `label:${item.label}`;
  return `label:${String(item.label)}`;
}

export function DropdownMenu({
  icon,
  iconOnly = false,
  items,
  label = "Действия",
}: {
  icon?: FortisIconName;
  iconOnly?: boolean;
  items: DropdownMenuItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledIndexes = items.flatMap((item, index) => item.disabled ? [] : [index]);

  const focusItem = (index: number) => {
    setActiveIndex(index);
    requestAnimationFrame(() => itemRefs.current[index]?.focus());
  };
  const openAt = (index: number) => {
    setOpen(true);
    focusItem(index);
  };
  const close = (restoreTrigger = false) => {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreTrigger) requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const toggle = () => {
    if (open) {
      close();
      return;
    }
    const firstIndex = enabledIndexes[0];
    setOpen(true);
    if (firstIndex !== undefined) focusItem(firstIndex);
  };
  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const firstIndex = enabledIndexes[0];
    const lastIndex = enabledIndexes.at(-1);
    if (event.key === "ArrowDown" && firstIndex !== undefined) {
      event.preventDefault();
      openAt(firstIndex);
    } else if (event.key === "ArrowUp" && lastIndex !== undefined) {
      event.preventDefault();
      openAt(lastIndex);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
    }
  };
  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      close();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !enabledIndexes.length) return;
    event.preventDefault();
    const currentPosition = enabledIndexes.indexOf(activeIndex);
    if (event.key === "Home") {
      focusItem(enabledIndexes[0]);
    } else if (event.key === "End") {
      focusItem(enabledIndexes[enabledIndexes.length - 1]);
    } else if (event.key === "ArrowDown") {
      focusItem(enabledIndexes[(currentPosition + 1 + enabledIndexes.length) % enabledIndexes.length]);
    } else {
      focusItem(enabledIndexes[(currentPosition - 1 + enabledIndexes.length) % enabledIndexes.length]);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) close();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <span className="fortis-menu-wrap" ref={wrapperRef}>
      {iconOnly && icon ? (
        <IconButton
          aria-controls={menuId}
          aria-expanded={open}
          aria-haspopup="menu"
          icon={icon}
          label={label}
          onClick={toggle}
          onKeyDown={handleTriggerKeyDown}
          ref={triggerRef}
          variant="quiet"
        />
      ) : (
        <Button
          aria-controls={menuId}
          aria-expanded={open}
          aria-haspopup="menu"
          leadingIcon={icon ? <Icon decorative name={icon} size={16} /> : undefined}
          onClick={toggle}
          onKeyDown={handleTriggerKeyDown}
          ref={triggerRef}
          trailingIcon={<Icon decorative name="navigation.chevron-down" size={16} />}
          variant="secondary"
        >
          {label}
        </Button>
      )}
      {open ? (
        <span className="fortis-menu" id={menuId} onKeyDown={handleMenuKeyDown} role="menu">
          {items.map((item, index) => (
            <button
              data-danger={item.danger || undefined}
              disabled={item.disabled}
              key={dropdownMenuItemKey(item)}
              onClick={() => {
                item.onSelect();
                close(true);
              }}
              onFocus={() => setActiveIndex(index)}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
export function Popover({ children, label }: { children: ReactNode; label: string }) { const [open, setOpen] = useState(false); return <span className="fortis-menu-wrap"><Button aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)} variant="secondary">{label}</Button>{open ? <span className="fortis-menu" role="dialog">{children}</span> : null}</span>; }
