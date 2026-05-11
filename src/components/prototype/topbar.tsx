"use client";

import Link from "next/link";
import {
  ArrowLeftOutlined,
  CompassOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { scenarioLabels, type ScenarioId } from "./types";
import styles from "./drone-defense-prototype.module.css";

export function Topbar({
  scenario,
  onScenarioChange,
}: {
  scenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
}) {
  const visibleScenarios: ScenarioId[] = ["unprotected", "baseline", "perimeter"];

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
          <span>Сценарное 3D-демо защиты объекта</span>
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
    </header>
  );
}
