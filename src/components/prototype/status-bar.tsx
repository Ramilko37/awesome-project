"use client";

import {
  AimOutlined,
  CameraOutlined,
  GatewayOutlined,
  PlayCircleOutlined,
  RadarChartOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { scenarioLabels, type ScenarioId } from "./types";
import styles from "./drone-defense-prototype.module.css";

type Stats = {
  sensorCount: number;
  cameraCount: number;
  postCount: number;
  coverage: number;
  perimeter: string;
};

export function StatusBar({
  stats,
  scenario,
  demoMode,
  onScenarioReset,
  onToggleDemo,
}: {
  stats: Stats;
  scenario: ScenarioId;
  demoMode: boolean;
  onScenarioReset: () => void;
  onToggleDemo: () => void;
}) {
  return (
    <footer className={styles.statusBar}>
      <button className={styles.scenarioCrumb} type="button" onClick={onScenarioReset}>
        <span>Сценарий:</span>
        <strong>{scenarioLabels[scenario]}</strong>
        <span>›</span>
      </button>
      <div className={styles.metric}>
        <RadarChartOutlined />
        <strong>{stats.sensorCount}</strong>
        <span>Сенсоры</span>
      </div>
      <div className={styles.metric}>
        <CameraOutlined />
        <strong>{stats.cameraCount}</strong>
        <span>Камеры</span>
      </div>
      <div className={styles.metric}>
        <GatewayOutlined />
        <strong>{stats.postCount}</strong>
        <span>Посты управления</span>
      </div>
      <div className={styles.metric}>
        <SafetyCertificateOutlined />
        <strong>{stats.perimeter}</strong>
        <span>Периметр</span>
      </div>
      <div className={styles.metric}>
        <AimOutlined />
        <strong>{stats.coverage}%</strong>
        <span>Покрытие</span>
      </div>
      <button className={styles.simulationButton} type="button" onClick={onToggleDemo}>
        <PlayCircleOutlined />
        {demoMode ? "Пауза симуляции" : "Запустить симуляцию"}
      </button>
    </footer>
  );
}
