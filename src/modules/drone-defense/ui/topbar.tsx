"use client";

import Link from "next/link";
import {
  ArrowLeftOutlined,
  CompassOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { scenarioLabels, type ScenarioId } from "../domain/prototype-types";
import styles from "./drone-defense-prototype.module.css";

const VISIBLE_SCENARIOS: ScenarioId[] = ["baseline", "balanced", "reinforced"];

export function Topbar({
  scenario,
  onScenarioChange,
  title = "3D drill-down выбранной конфигурации",
  demoMode = false,
  onToggleDemo,
}: {
  scenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  title?: string;
  demoMode?: boolean;
  onToggleDemo?: () => void;
}) {
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
          <span className={styles.brandSubtitle}>{title}</span>
        </div>
      </div>

      <nav className={styles.scenarioTabs} aria-label="Сценарий и разделы">
        {VISIBLE_SCENARIOS.map((id) => (
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
        {onToggleDemo ? (
          <button
            className={styles.scenarioLaunchButton}
            type="button"
            onClick={onToggleDemo}
            aria-pressed={demoMode}
          >
            {demoMode ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            <span>{demoMode ? "Остановить сценарий" : "Запустить сценарий"}</span>
          </button>
        ) : null}
      </nav>
    </header>
  );
}
