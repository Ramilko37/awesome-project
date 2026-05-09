"use client";

import Link from "next/link";
import {
  ArrowLeftOutlined,
  BellOutlined,
  CloudOutlined,
  CompassOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { scenarioLabels, type ScenarioId } from "./types";
import styles from "./drone-defense-prototype.module.css";

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className={styles.iconButton} type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function Topbar({
  scenario,
  onScenarioChange,
  theme,
  onToggleTheme,
}: {
  scenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const visibleScenarios: ScenarioId[] = ["baseline"];

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
        {visibleScenarios.map((id) => (
          <button
            key={id}
            className={id === scenario ? styles.activeTab : styles.tab}
            type="button"
            onClick={() => onScenarioChange(id)}
          >
            <CompassOutlined />
            <span>{scenarioLabels[id]}</span>
          </button>
        ))}
      </nav>

      <div className={styles.topActions}>
        <IconButton
          label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          onClick={onToggleTheme}
        >
          {theme === "light" ? <MoonOutlined /> : <SunOutlined />}
        </IconButton>
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
