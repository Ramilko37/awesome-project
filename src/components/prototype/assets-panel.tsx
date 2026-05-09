"use client";

import {
  DragOutlined,
  FilterOutlined,
  SearchOutlined,
  BuildOutlined,
  BorderOuterOutlined,
  ApartmentOutlined,
  DeploymentUnitOutlined,
  GatewayOutlined,
} from "@ant-design/icons";
import { assetCatalog, type AssetCatalogItem, type ObjectKind, type ProtectiveObjectKind } from "./types";
import styles from "./drone-defense-prototype.module.css";

function AssetIcon({ kind }: { kind: AssetCatalogItem["kind"] }) {
  if (kind === "facility") return <BuildOutlined />;
  if (kind === "operator_substation") return <ApartmentOutlined />;
  if (kind === "scaffolding") return <DeploymentUnitOutlined />;
  if (kind === "fbs_enclosure") return <GatewayOutlined />;
  if (kind === "perimeter_barrier") return <BorderOuterOutlined />;
  return <BuildOutlined />;
}

export function AssetsPanel({
  onSelectAsset,
  placingKind,
  onCancelPlacement,
}: {
  onSelectAsset: (kind: ObjectKind) => void;
  placingKind: ObjectKind | null;
  onCancelPlacement: () => void;
}) {
  return (
    <aside className={styles.assetsPanel} aria-label="Assets">
      <div className={styles.panelHeader}>
        <h2>Assets</h2>
      </div>
      <div className={styles.searchRow}>
        <SearchOutlined />
        <input aria-label="Search assets" placeholder="Search assets..." />
        <FilterOutlined />
      </div>
      <div className={styles.assetList}>
        {assetCatalog.map((item) => (
          <button
            key={item.kind}
            className={`${styles.assetItem} ${styles[item.tone]}`}
            type="button"
            onClick={() => onSelectAsset(item.kind as ProtectiveObjectKind)}
          >
            <span className={styles.assetGlyph}>
              <AssetIcon kind={item.kind} />
            </span>
            <span>{item.label}</span>
            <DragOutlined className={styles.dragHandle} />
          </button>
        ))}
      </div>
      <div className={styles.dragHint}>
        <span className={styles.mouseGlyph} />
        <p>
          {placingKind ? "Click on map to place asset" : "Pick asset, then click map"}
        </p>
      </div>
      {placingKind ? (
        <button className={styles.performanceButton} type="button" onClick={onCancelPlacement}>
          Cancel Placement
        </button>
      ) : null}
    </aside>
  );
}
