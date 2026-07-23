"use client";

import { Icon } from "@/shared/ui/fortis";
import { scenarioLabels, type DefenseStats, type ScenarioId } from "../domain/prototype-types";
import styles from "./drone-defense-prototype.module.css";

export function StatusBar({
  stats,
  scenario,
  demoMode,
  onScenarioReset,
  onToggleDemo,
}: {
  stats: DefenseStats;
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
        <Icon decorative name="asset.protection" />
        <strong>{stats.protectedObjects}/{stats.protectedObjectsTotal}</strong>
        <span>Защищено объектов</span>
      </div>
      <div className={styles.metric}>
        <Icon decorative name="asset.detection" />
        <strong>{stats.perimeterCoveredPercent}%</strong>
        <span>Периметр перекрыт</span>
      </div>
      <div className={styles.metric}>
        <Icon decorative name="metric.response" />
        <strong>{stats.attacksRepelled}/{stats.attacksTotal}</strong>
        <span>Отражено атак</span>
      </div>
      <div className={styles.metric}>
        <Icon decorative name="asset.interceptor" />
        <strong>{stats.residualRiskPercent}%</strong>
        <span>Остаточный риск</span>
      </div>
      <div className={styles.metric}>
        <Icon decorative name="metric.cost" />
        <strong>{stats.capexMln}</strong>
        <span>CAPEX, млн ₽</span>
      </div>
      <button className={styles.simulationButton} type="button" onClick={onToggleDemo}>
        <Icon decorative name={demoMode ? "action.pause" : "action.play"} />
        {demoMode ? "Остановить сценарий" : "Запустить сценарий"}
      </button>
    </footer>
  );
}
