"use client";

import Image from "next/image";
import { withBasePath } from "@/shared/lib/base-path";
import { AssetCard, Badge, IconButton } from "@/shared/ui/fortis";
import { prototypeRu } from "@/shared/config/prototype-ru";
import type { DefenseAssetLibraryItem } from "@/shared/types/defense-project";
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useRef } from "react";

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

export function DefenseToolIcon({
  assetId,
  name,
  categoryLabel,
  rangeLabel,
  priceLabel,
  coverageLabel,
  protectionType,
  compoundProfile,
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
  const isCompoundPost = compoundProfile?.kind === "compound-post";
  const title = disabledReason ?? `${name}: ${rangeLabel}. Перетащите на карту внутри выбранного эшелона`;
  const coverageText = coverageLabel;
  const costText = `${prototypeRu.cards.basePostCost}: ${priceLabel}`;
  const counterText = isZoneObject
      ? `${prototypeRu.cards.sites}: ${installedCount}`
      : maxQuantity > 0
        ? `${prototypeRu.cards.onMap}: ${installedCount}/${maxQuantity}`
        : `${prototypeRu.cards.onMap}: ${installedCount}`;
  const placementBadge = isZoneObject ? prototypeRu.cards.zone : prototypeRu.cards.map;
  const protectionBadge = protectionType;
  const actionText = isZoneObject ? prototypeRu.cards.draw : prototypeRu.cards.drag;
  const compoundWeaponSummary = compoundProfile?.weapons
    ?.filter((item) => Number(item.quantity) > 0)
    .map((item) => `${item.label}: ${item.quantity}`)
    .join(", ");

  const ghostRef = useRef<HTMLDivElement | null>(null);
  const infoRef = useRef<AssetInfo>({ title: "", imageUrl: "" });
  infoRef.current = { title: `${name}\n${coverageLabel}`, imageUrl: withBasePath(previewImageUrl) };

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
        img.src = infoRef.current.imageUrl;
    img.style.cssText = "width:42px;height:42px;object-fit:cover;display:block;border-radius:6px;background:#f1f5f9;";
    const text = document.createElement("div");
    text.style.cssText = "min-width:0;display:grid;gap:2px;";
    const titleLine = document.createElement("strong");
    titleLine.textContent = name;
    titleLine.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;";
    const metaLine = document.createElement("span");
    metaLine.textContent = coverageLabel;
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

  // ── control target detection ─────────────────────────────────────────

  const isControlTarget = (target: HTMLElement) =>
    Boolean(
        target.closest("input,select,textarea,a") ||
        target.closest(
          'button[title="Ввести координаты"]',
        ),
    );

  // ── unified pointer handler ──────────────────────────────────────────

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDrag || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (isControlTarget(target)) return;

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

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      destroyGhost();
    };

    window.addEventListener("pointermove", onMove, { capture: true });
    window.addEventListener("pointerup", onUp, { capture: true });
  };

  // ── render ───────────────────────────────────────────────────────────

  return (
    <AssetCard
      actions={
        <IconButton
          className="fortis-tool-coordinate-action"
          disabled={!canAdd}
          icon="map.coordinates"
          label={isZoneObject ? prototypeRu.cards.drawArea : prototypeRu.cards.enterCoordinates}
          onClick={(event) => {
            event.stopPropagation();
            onOpenCoordinates();
          }}
          size="sm"
          variant="quiet"
        />
      }
      aria-label={`${name}. ${counterText}. ${prototypeRu.cards.drag} на карту`}
      aria-pressed={isSelected}
      className={`fortis-asset-library-card ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
      data-placement-type={placementType}
      data-can-drag={canDrag ? "true" : "false"}
      data-testid={`defense-tool-card-${assetId}`}
      disabled={Boolean(disabledReason)}
      draggable={canDrag}
      leading={
        <span className="fortis-asset-card__media">
          <Image
            src={withBasePath(previewImageUrl)}
            alt=""
            width={56}
            height={56}
            unoptimized
            className={isPlaceholder ? "object-contain p-2" : "object-cover"}
            draggable={false}
          />
        </span>
      }
      meta={[categoryLabel, protectionBadge, coverageText].filter(Boolean).join(" · ")}
      selected={isSelected}
      status={
        <Badge tone={installedCount > 0 ? "accent" : "neutral"}>
          {isZoneObject ? `${installedCount} уч.` : maxQuantity > 0 ? `${installedCount}/${maxQuantity}` : installedCount}
        </Badge>
      }
      title={name}
      tooltip={title}
      role="button"
      tabIndex={0}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault();
          return;
        }
        onDragAsset(event as unknown as ReactDragEvent<HTMLDivElement>);
      }}
      onPointerDown={handlePointerDown}
      onMouseDown={(event) => {
        if (canDrag) onMouseDragAsset(event as unknown as ReactMouseEvent<HTMLDivElement>);
      }}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="fortis-asset-card__details">
        {isCompoundPost ? (
          <>
            <p>
              <strong>{prototypeRu.cards.postType}:</strong> {compoundProfile.postType}
              <span aria-hidden="true">·</span>
              <strong>{prototypeRu.cards.personnel}:</strong> {compoundProfile.personnelCount}
            </p>
            <p>
              <strong>{prototypeRu.cards.accountability}:</strong> {compoundProfile.accountability}
            </p>
            <p>
              <strong>{prototypeRu.cards.weapons}:</strong>{" "}
              {compoundWeaponSummary || `${compoundProfile.armament}: ${compoundProfile.weaponUnits}`}
              <span aria-hidden="true">·</span>
              <strong>{prototypeRu.cards.sector}:</strong> {compoundProfile.sectorOrRange}
            </p>
          </>
        ) : null}
        <p className="fortis-asset-card__summary">
          <span>{isCompoundPost ? costText : priceLabel}</span>
          <Badge>{placementBadge}</Badge>
          <span data-tone={disabledReason ? "danger" : "action"}>{disabledReason ?? actionText}</span>
        </p>
      </div>
    </AssetCard>
  );
}
