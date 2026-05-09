"use client";

import Link from "next/link";
import {
  ArrowLeftOutlined,
  BellOutlined,
  CloudOutlined,
  CompassOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
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
}: {
  scenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
}) {
  const visibleScenarios: ScenarioId[] = ["baseline"];

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <Link href="/dashboard" className={styles.backButton} aria-label="Назад к панели">
          <ArrowLeftOutlined />
        </Link>
        <div className={styles.shieldMark}>
          <SafetyCertificateOutlined />
        </div>
        <div>
          <strong>FORTIS</strong>
          <span>Конфигуратор защиты объекта</span>
        </div>
      </div>

      <nav className={styles.scenarioTabs} aria-label="Сценарий">
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
        <IconButton label="Синхронизация с облаком">
          <CloudOutlined />
        </IconButton>
        <IconButton label="Настройки">
          <SettingOutlined />
        </IconButton>
        <IconButton label="Уведомления">
          <BellOutlined />
        </IconButton>
        <button className={styles.profileButton} type="button" aria-label="Профиль">
          AD
        </button>
      </div>
    </header>
  );
}
