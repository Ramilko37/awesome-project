"use client";

import Link from "next/link";
import {
  AimOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  CloudOutlined,
  CompassOutlined,
  ControlOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { scenarioLabels, type ScenarioId } from "./types";
import styles from "./drone-defense-prototype.module.css";

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button className={styles.iconButton} type="button" aria-label={label} title={label}>
      {children}
    </button>
  );
}

export function Topbar({
  scenario,
  onScenarioChange,
}: {
  scenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
}) {
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
          <ArrowLeftOutlined />
        </Link>
        <div className={styles.shieldMark}>
          <SafetyCertificateOutlined />
        </div>
        <div>
          <strong>FORTIS</strong>
          <span>Site Protection Configurator</span>
        </div>
      </div>

      <nav className={styles.scenarioTabs} aria-label="Scenario">
        {(Object.keys(scenarioLabels) as ScenarioId[]).map((id) => (
          <button
            key={id}
            className={id === scenario ? styles.activeTab : styles.tab}
            type="button"
            onClick={() => onScenarioChange(id)}
          >
            {id === "baseline" ? <CompassOutlined /> : id === "perimeter" ? <AimOutlined /> : id === "assets" ? <ControlOutlined /> : <EyeOutlined />}
            <span>{scenarioLabels[id]}</span>
          </button>
        ))}
      </nav>

      <div className={styles.topActions}>
        <IconButton label="Sync to cloud">
          <CloudOutlined />
        </IconButton>
        <IconButton label="Settings">
          <SettingOutlined />
        </IconButton>
        <IconButton label="Notifications">
          <BellOutlined />
        </IconButton>
        <button className={styles.profileButton} type="button" aria-label="Account">
          AD
        </button>
      </div>
    </header>
  );
}
