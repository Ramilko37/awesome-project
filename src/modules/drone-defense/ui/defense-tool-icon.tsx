"use client";

import { AimOutlined, DragOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Image from "next/image";
import { withBasePath } from "@/shared/lib/base-path";
import { prototypeRu } from "@/shared/config/prototype-ru";
import styles from "./defense-tool-icon.module.css";
import type { DefenseAssetLibraryItem } from "@/shared/types/defense-project";
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useMemo, useRef } from "react";

const DRAG_THRESHOLD = 6; // px before we commit to drag mode

type AssetInfo = { title: string; imageUrl: string };

type DefenseCompoundProfile = {
  kind: "compound-post";
  postType: string;
  personnelCount: string;
  accountability: string;
  armament: string;
  weaponUnits: string;
  sectorOrRange: string;
  equipment?: Array<{ id: string; label: string; quantity: string }>;
  weapons?: Array<{ id: string; label: string; quantity: string; rangeM: number }>;
  coverageWeaponId?: string;
  sectorWidthDeg?: number;
};

export type DefenseToolIconProps = {
  name: string;
  protectionType?: string;
  categoryLabel: string;
  rangeLabel: string;
  priceLabel: string;
  coverageLabel: string;
  compoundProfile?: DefenseCompoundProfile;
  placementType: DefenseAssetLibraryItem["placementType"];
  imageUrl: string;
  previewImageUrl: string;
  installedCount: number;
  maxQuantity: number;
  disabledReason?: string;
  canRemove?: boolean;
  isPlaceholder?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  onOpenCoordinates: () => void;
  onDragAsset: (event: ReactDragEvent<HTMLDivElement>) => void;
  onPointerDragAsset: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onMouseDragAsset: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onRemove: () => void;
};

function isControlTarget(target: HTMLElement) {
  return Boolean(
    target.closest("input,select,textarea,a") ||
      target.closest('button[title="Ввести координаты"]'),
  );
}

export function DefenseToolIcon({
  assetId,
  name,
  categoryLabel,
  rangeLabel,
  priceLabel,
  coverageLabel,
  protectionType,
  placementType,
  previewImageUrl,
  installedCount,
  maxQuantity,
  disabledReason,
  isPlaceholder = false,
  isSelected = false,
  onSelect,
  onOpenCoordinates,
  onDragAsset,
  onPointerDragAsset,
  onMouseDragAsset,
}: DefenseToolIconProps & { assetId: string }) {
  const canAdd = !disabledReason;
  const isZoneObject = placementType === "zone-object";
  const canDrag = canAdd;
  const title = disabledReason ?? prototypeRu.cards.dragTooltip(name, rangeLabel);
  const coverageText = coverageLabel;
  const counterText = isZoneObject
      ? `Участков: ${installedCount}`
      : maxQuantity > 0
        ? `На карте: ${installedCount}/${maxQuantity}`
        : `На карте: ${installedCount}`;
  const protectionBadge = protectionType;

  const rootRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const cleanupDragRef = useRef<(() => void) | null>(null);
  const dragPreviewInfo = useMemo<AssetInfo>(
    () => ({ title: `${name}\n${coverageLabel}`, imageUrl: withBasePath(previewImageUrl) }),
    [coverageLabel, name, previewImageUrl],
  );

  useEffect(
    () => () => {
      cleanupDragRef.current?.();
      cleanupDragRef.current = null;
      const ghost = ghostRef.current;
      if (ghost) {
        ghost.remove();
        ghostRef.current = null;
      }
    },
    [],
  );

  // ── helpers ──────────────────────────────────────────────────────────

  function createGhost(clientX: number, clientY: number) {
    destroyGhost();
    const g = document.createElement("div");
    g.style.cssText =
      "position:fixed;left:0;top:0;width:180px;min-height:52px;border-radius:8px;" +
      "border:1px solid rgba(59,130,246,0.35);overflow:hidden;z-index:99999;" +
      "display:grid;grid-template-columns:42px 1fr;gap:8px;align-items:center;padding:6px;" +
      "background:rgba(255,255,255,0.96);box-shadow:0 12px 28px rgba(15,23,42,0.24);" +
      "pointer-events:none;will-change:transform;font:12px system-ui,sans-serif;color:#0f172a;";
        const img = document.createElement("img");
        img.src = dragPreviewInfo.imageUrl;
    img.style.cssText = "width:42px;height:42px;object-fit:cover;display:block;border-radius:6px;background:#f1f5f9;";
    const text = document.createElement("div");
    text.style.cssText = "min-width:0;display:grid;gap:2px;";
    const titleLine = document.createElement("strong");
    titleLine.textContent = dragPreviewInfo.title.split("\n")[0] ?? name;
    titleLine.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;";
    const metaLine = document.createElement("span");
    metaLine.textContent = dragPreviewInfo.title.split("\n")[1] ?? coverageLabel;
    metaLine.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#64748b;font-size:11px;";
    text.appendChild(titleLine);
    text.appendChild(metaLine);
    g.appendChild(img);
    g.appendChild(text);
    document.body.appendChild(g);
    ghostRef.current = g;
    moveGhost(clientX, clientY);
  }

  function moveGhost(clientX: number, clientY: number) {
    const g = ghostRef.current;
    if (!g) return;
    g.style.left = `${clientX - 16}px`;
    g.style.top = `${clientY - 16}px`;
  }

  function destroyGhost() {
    const g = ghostRef.current;
    if (g) {
      g.remove();
      ghostRef.current = null;
    }
  }

  // ── unified pointer handler ──────────────────────────────────────────

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDrag || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (isControlTarget(target)) return;

    cleanupDragRef.current?.();
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    let dragging = false;

    const onMove = (ev: globalThis.PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY) >= DRAG_THRESHOLD) {
        dragging = true;
        createGhost(ev.clientX, ev.clientY);
        onPointerDragAsset(event);
      }
      if (dragging) {
        moveGhost(ev.clientX, ev.clientY);
      }
    };

    function cleanupPointerDrag() {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onEnd, true);
      window.removeEventListener("pointercancel", onEnd, true);
      cleanupDragRef.current = null;
      destroyGhost();
    }

    function onEnd() {
      cleanupPointerDrag();
    }

    cleanupDragRef.current = cleanupPointerDrag;
    window.addEventListener("pointermove", onMove, { capture: true });
    window.addEventListener("pointerup", onEnd, { capture: true });
    window.addEventListener("pointercancel", onEnd, { capture: true });
  };

  // ── render ───────────────────────────────────────────────────────────

  return (
    <div
      ref={rootRef}
      className={styles.assetCard}
      data-placement-type={placementType}
      data-can-drag={canDrag ? "true" : "false"}
      data-disabled={disabledReason ? "true" : "false"}
      data-installed={installedCount > 0 ? "true" : "false"}
      data-selected={isSelected ? "true" : "false"}
      data-testid={`defense-tool-card-${assetId}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={prototypeRu.cards.dragAria(name, counterText)}
      title={title}
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault();
          return;
        }
        onDragAsset(event);
      }}
      onPointerDown={handlePointerDown}
      onMouseDown={(event) => {
        if (canDrag) onMouseDragAsset(event);
      }}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <span className={styles.dragDots} aria-hidden="true">
        {canDrag ? null : <DragOutlined />}
      </span>

      <span className={styles.assetThumb}>
        <Image
          src={withBasePath(previewImageUrl)}
          alt=""
          width={56}
          height={56}
          unoptimized
          className={styles.assetImage}
          data-placeholder={isPlaceholder ? "true" : "false"}
          draggable={false}
        />
      </span>

      <div className={styles.assetCopy}>
        <div className={styles.assetHead}>
          <span className={styles.assetTitle}>{name}</span>
        </div>
        <div className={styles.assetType}>
          <span>{categoryLabel}</span>
          {protectionBadge ? <>
            <span aria-hidden="true">·</span>
            <span>{protectionBadge}</span>
          </> : null}
          <span aria-hidden="true">·</span>
            <span>{coverageText}</span>
        </div>
        <div className={styles.assetMetrics}>
          <span>{rangeLabel}</span>
          <span>{coverageText}</span>
          <span>{priceLabel}</span>
        </div>
      </div>

      <button
        type="button"
        className={styles.assetPlacement}
        disabled={!canAdd}
        onClick={(event) => {
          event.stopPropagation();
          onOpenCoordinates();
        }}
        title="Ввести координаты"
        aria-label="Ввести координаты"
      >
        {isZoneObject ? <AimOutlined /> : <EnvironmentOutlined />}
      </button>
    </div>
  );
}
