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
const DRAG_ICON_SIZE = 32;
const DRAG_ICON_OFFSET = DRAG_ICON_SIZE / 2;

type AssetInfo = { imageUrl: string };

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
  recommendationLabel?: string;
  placementType: DefenseAssetLibraryItem["placementType"];
  imageUrl: string;
  previewImageUrl: string;
  installedCount: number;
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
    target.closest("button,input,select,textarea,a"),
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
  recommendationLabel,
  placementType,
  previewImageUrl,
  installedCount,
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
  const protectionBadge = protectionType;

  const rootRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const cleanupDragRef = useRef<(() => void) | null>(null);
  const dragPreviewInfo = useMemo<AssetInfo>(
    () => ({ imageUrl: withBasePath(previewImageUrl) }),
    [previewImageUrl],
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

  function createDragIconElement() {
    const g = document.createElement("div");
    g.style.cssText =
      `width:${DRAG_ICON_SIZE}px;height:${DRAG_ICON_SIZE}px;border-radius:4px;` +
      "display:grid;place-items:center;overflow:hidden;border:1px solid rgba(255,255,255,0.92);" +
      "background:#fff;box-shadow:0 8px 18px rgba(15,23,42,0.28);pointer-events:none;";
    const img = document.createElement("img");
    img.src = dragPreviewInfo.imageUrl;
    img.alt = "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    g.appendChild(img);
    return g;
  }

  function createNativeDragImage() {
    const g = createDragIconElement();
    g.style.position = "fixed";
    g.style.left = "-9999px";
    g.style.top = "-9999px";
    g.style.zIndex = "99999";
    document.body.appendChild(g);
    return g;
  }

  function createGhost(clientX: number, clientY: number) {
    destroyGhost();
    const g = createDragIconElement();
    g.style.position = "fixed";
    g.style.left = "0";
    g.style.top = "0";
    g.style.zIndex = "99999";
    g.style.willChange = "transform";
    document.body.appendChild(g);
    ghostRef.current = g;
    moveGhost(clientX, clientY);
  }

  function moveGhost(clientX: number, clientY: number) {
    const g = ghostRef.current;
    if (!g) return;
    g.style.left = `${clientX - DRAG_ICON_OFFSET}px`;
    g.style.top = `${clientY - DRAG_ICON_OFFSET}px`;
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
      title={title}
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault();
          return;
        }
        const dragImage = createNativeDragImage();
        event.dataTransfer.setDragImage(dragImage, DRAG_ICON_OFFSET, DRAG_ICON_OFFSET);
        window.setTimeout(() => dragImage.remove(), 0);
        onDragAsset(event);
      }}
      onPointerDown={handlePointerDown}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (canDrag && !isControlTarget(target)) onMouseDragAsset(event);
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
          {recommendationLabel ? (
            <span className={styles.recommendationBadge}>{recommendationLabel}</span>
          ) : null}
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
          if (event.altKey) {
            onOpenCoordinates();
            return;
          }
          onSelect();
        }}
        title="Разместить"
        aria-label="Разместить"
      >
        {isZoneObject ? <AimOutlined /> : <EnvironmentOutlined />}
      </button>
    </div>
  );
}
