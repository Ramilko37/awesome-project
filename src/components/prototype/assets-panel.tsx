"use client";

import {
  BuildOutlined,
  CameraOutlined,
  ColumnHeightOutlined,
  DragOutlined,
  FilterOutlined,
  GatewayOutlined,
  RadarChartOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { assetCatalog, type AssetCatalogItem, type ObjectKind } from "./types";
import styles from "./drone-defense-prototype.module.css";

function AssetIcon({ kind }: { kind: AssetCatalogItem["kind"] }) {
  if (kind === "facility") return <BuildOutlined />;
  if (kind === "sensor") return <ColumnHeightOutlined />;
  if (kind === "camera") return <CameraOutlined />;
  if (kind === "shield") return <RadarChartOutlined />;
  if (kind === "post") return <GatewayOutlined />;
  return <SafetyCertificateOutlined />;
}

export function AssetsPanel({ onAddObject }: { onAddObject: (kind: ObjectKind) => void }) {
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
            disabled={item.kind === "facility"}
            onClick={() => item.kind !== "facility" && onAddObject(item.kind)}
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
        <p>Drag &amp; drop assets onto the map</p>
      </div>
    </aside>
  );
}
