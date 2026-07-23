"use client";

import Link from "next/link";
import { Icon } from "@/shared/ui/fortis";
import { scenarioLabels, type ScenarioId } from "../domain/prototype-types";
import styles from "./drone-defense-prototype.module.css";

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
  const visibleScenarios: ScenarioId[] = ["baseline", "balanced", "reinforced"];

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <Link href="/dashboard" className={styles.backButton} aria-label="Назад к панели">
          <Icon decorative name="navigation.back" />
        </Link>
        <div className={styles.shieldMark}>
          <Icon decorative name="asset.protection" />
        </div>
        <div>
          <strong>FORTIS</strong>
          <span className={styles.brandSubtitle}>{title}</span>
        </div>
      </div>

      <nav className={styles.scenarioTabs} aria-label="Сценарий и разделы">
        {visibleScenarios.map((id) => (
          <button
            key={id}
            className={id === scenario ? styles.activeTab : styles.tab}
            type="button"
            onClick={() => onScenarioChange(id)}
          >
            <Icon decorative name="navigation.scenario" />
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
            <Icon decorative name={demoMode ? "action.pause" : "action.play"} />
            <span>{demoMode ? "Остановить сценарий" : "Запустить сценарий"}</span>
          </button>
        ) : null}
      </nav>
    </header>
  );
}
