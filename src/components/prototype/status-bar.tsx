"use client";

import {
  AimOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  RadarChartOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { scenarioLabels, type DefenseStats, type ScenarioId } from "./types";
import styles from "./drone-defense-prototype.module.css";

export function StatusBar({
  stats,
  scenario,
  demoMode,
  autoDemoRunning,
  onScenarioReset,
  onToggleDemo,
  onToggleAutoDemo,
}: {
  stats: DefenseStats;
  scenario: ScenarioId;
  demoMode: boolean;
  autoDemoRunning: boolean;
  onScenarioReset: () => void;
  onToggleDemo: () => void;
  onToggleAutoDemo: () => void;
}) {
  return (
    <footer className={styles.statusBar}>
      <button className={styles.scenarioCrumb} type="button" onClick={onScenarioReset}>
        <span>Сценарий:</span>
        <strong>{scenarioLabels[scenario]}</strong>
        <span>›</span>
      </button>
      <div className={styles.metric}>
        <SafetyCertificateOutlined />
        <strong>{stats.protectedObjects}/{stats.protectedObjectsTotal}</strong>
        <span>Защищено объектов</span>
      </div>
      <div className={styles.metric}>
        <RadarChartOutlined />
        <strong>{stats.perimeterCoveredPercent}%</strong>
        <span>Периметр перекрыт</span>
      </div>
      <div className={styles.metric}>
        <ThunderboltOutlined />
        <strong>{stats.attacksRepelled}/{stats.attacksTotal}</strong>
        <span>Отражено атак</span>
      </div>
      <div className={styles.metric}>
        <AimOutlined />
        <strong>{stats.residualRiskPercent}%</strong>
        <span>Остаточный риск</span>
      </div>
      <div className={styles.metric}>
        <DollarOutlined />
        <strong>{stats.capexMln}</strong>
        <span>CAPEX, млн ₽</span>
      </div>
      <button className={styles.simulationButton} type="button" onClick={onToggleDemo}>
        <PlayCircleOutlined />
        {demoMode ? "Пауза симуляции" : "Запустить симуляцию"}
      </button>
      <button className={styles.autoDemoButton} type="button" onClick={onToggleAutoDemo}>
        <PlayCircleOutlined />
        {autoDemoRunning ? "Остановить автодемо" : "Автодемо"}
      </button>
    </footer>
  );
}
