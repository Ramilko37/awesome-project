"use client";

import type { ReactNode } from "react";
import {
  BuildOutlined,
  CameraOutlined,
  ColumnHeightOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  GatewayOutlined,
  RadarChartOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { kindLabel, scenarioLabels, type AssetCatalogItem, type ObjectKind, type ScenarioId, type SceneObject } from "./types";
import styles from "./drone-defense-prototype.module.css";

function AssetIcon({ kind }: { kind: AssetCatalogItem["kind"] | ObjectKind }) {
  if (kind === "facility") return <BuildOutlined />;
  if (kind === "operator_substation") return <BuildOutlined />;
  if (kind === "scaffolding") return <ColumnHeightOutlined />;
  if (kind === "fbs_enclosure") return <SafetyCertificateOutlined />;
  if (kind === "perimeter_barrier") return <GatewayOutlined />;
  if (kind === "cable_mesh") return <CameraOutlined />;
  if (kind === "sensor") return <ColumnHeightOutlined />;
  if (kind === "camera") return <CameraOutlined />;
  if (kind === "shield") return <RadarChartOutlined />;
  if (kind === "post") return <GatewayOutlined />;
  return <SafetyCertificateOutlined />;
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className={styles.iconButton} type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function PropertyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.propertyRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function PropertiesPanel({
  selectedObject,
  scenario,
  onDuplicate,
  onDelete,
  onClose,
}: {
  selectedObject: SceneObject | null;
  scenario: ScenarioId;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <aside className={styles.propertiesPanel} aria-label="Properties">
      <div className={styles.panelHeader}>
        <h2>Properties</h2>
        <button type="button" aria-label="Close properties" onClick={onClose}>
          ×
        </button>
      </div>

      {selectedObject ? (
        <>
          <div className={styles.selectedSummary}>
            <span className={styles.summaryIcon}>
              <AssetIcon kind={selectedObject.kind} />
            </span>
            <div>
              <strong>{selectedObject.label.toUpperCase()}</strong>
              <span>
                <i /> Active
              </span>
            </div>
          </div>

          <div className={styles.actionStrip}>
            <IconButton label="Edit asset">
              <EditOutlined />
            </IconButton>
            <IconButton label="Duplicate asset" onClick={onDuplicate}>
              <CopyOutlined />
            </IconButton>
            <IconButton label="Delete asset" onClick={onDelete}>
              <DeleteOutlined />
            </IconButton>
          </div>

          <div className={styles.propertyGroup}>
            <h3>Overview</h3>
            <PropertyRow label="Type" value={kindLabel[selectedObject.kind]} />
            <PropertyRow
              label="Status"
              value={
                <span className={styles.online}>
                  <i /> Active
                </span>
              }
            />
            <PropertyRow label="Scenario" value={scenarioLabels[scenario]} />
          </div>

          <div className={styles.propertyGroup}>
            <h3>Coverage</h3>
            <PropertyRow label="Coverage Radius" value={`${Math.round(selectedObject.radius * 22)} m`} />
            <PropertyRow label="Detection Zones" value={selectedObject.zones} />
          </div>

          <div className={styles.propertyGroup}>
            <h3>Position</h3>
            <PropertyRow label="Elevation" value={`${selectedObject.elevation} m`} />
            <PropertyRow label="Relative Height" value={selectedObject.elevation > 16 ? "Medium" : "Low"} />
          </div>

          <div className={styles.propertyGroup}>
            <h3>Assignment</h3>
            <PropertyRow label="Control Post" value={selectedObject.assignment} />
            <PropertyRow label="Network" value="Grid Alpha" />
          </div>

          <div className={styles.propertyGroup}>
            <h3>System</h3>
            <PropertyRow
              label="Power"
              value={
                <span className={styles.online}>
                  <i /> Normal
                </span>
              }
            />
            <PropertyRow
              label="Link Status"
              value={
                <span className={styles.online}>
                  <i /> Stable
                </span>
              }
            />
          </div>

          <button className={styles.performanceButton} type="button">
            <RadarChartOutlined /> View Performance
          </button>
        </>
      ) : (
        <p className={styles.emptyState}>Select an object on the map to inspect its configuration.</p>
      )}
    </aside>
  );
}
