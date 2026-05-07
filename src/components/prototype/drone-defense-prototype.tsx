"use client";

import { useMemo, useState } from "react";
import {
  CompassOutlined,
  ControlOutlined,
  DragOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import { cloneScenario, kindLabel, type ObjectKind, type ScenarioId, type SceneObject } from "./types";
import { PrototypeScene } from "./scene";
import { Topbar } from "./topbar";
import { AssetsPanel } from "./assets-panel";
import { PropertiesPanel } from "./properties-panel";
import { StatusBar } from "./status-bar";
import styles from "./drone-defense-prototype.module.css";

export function DroneDefensePrototype() {
  const [objects, setObjects] = useState<SceneObject[]>(() => cloneScenario("baseline"));
  const [selectedId, setSelectedId] = useState<string | null>("sensor-07");
  const [scenario, setScenario] = useState<ScenarioId>("baseline");
  const [demoMode, setDemoMode] = useState(true);
  const [idCounter, setIdCounter] = useState(100);
  const [messageApi, contextHolder] = message.useMessage();

  const selectedObject = useMemo(
    () => objects.find((item) => item.id === selectedId) ?? objects[0] ?? null,
    [objects, selectedId],
  );

  const stats = useMemo(() => {
    const sensorCount = objects.filter((item) => item.kind === "sensor").length;
    const cameraCount = objects.filter((item) => item.kind === "camera").length;
    const postCount = objects.filter((item) => item.kind === "post").length;
    const coverage = Math.min(98, Math.round(objects.reduce((sum, item) => sum + item.radius, 0) * 1.6));
    return { sensorCount, cameraCount, postCount, coverage, perimeter: scenario === "perimeter" ? "3.1 km" : "2.4 km" };
  }, [objects, scenario]);

  const updateObjectPosition = (id: string, x: number, z: number) => {
    setObjects((prev) =>
      prev.map((item) => (item.id === id ? { ...item, position: [x, item.position[1], z] } : item)),
    );
  };

  const applyScenario = (id: ScenarioId) => {
    const next = cloneScenario(id);
    setScenario(id);
    setObjects(next);
    setSelectedId(next[0]?.id ?? null);
  };

  const addObject = (kind: ObjectKind) => {
    const count = objects.filter((item) => item.kind === kind).length + 1;
    const nextCounter = idCounter + 1;
    const id = `${kind}-${nextCounter}`;
    const next: SceneObject = {
      id,
      kind,
      label: `${kindLabel[kind]} ${String(count).padStart(2, "0")}`,
      position: [-6 + (objects.length % 7) * 1.8, 0, 5.8],
      radius: kind === "sensor" ? 4.8 : kind === "camera" ? 4.2 : kind === "shield" ? 5.3 : 2.1,
      elevation: kind === "sensor" ? 18 : kind === "camera" ? 11 : kind === "post" ? 14 : 4,
      zones: kind === "shield" || kind === "sensor" ? 2 : 1,
      assignment: "Grid Alpha",
    };
    setObjects((prev) => [...prev, next]);
    setIdCounter(nextCounter);
    setSelectedId(id);
    messageApi.success(`${kindLabel[kind]} added to map`);
  };

  const deleteSelected = () => {
    if (!selectedObject) return;
    setObjects((prev) => prev.filter((item) => item.id !== selectedObject.id));
    setSelectedId(null);
    messageApi.info(`${selectedObject.label} removed`);
  };

  const duplicateSelected = () => {
    if (!selectedObject) return;
    const nextCounter = idCounter + 1;
    const copy: SceneObject = {
      ...selectedObject,
      id: `${selectedObject.kind}-${nextCounter}`,
      label: `${selectedObject.label} Copy`,
      position: [selectedObject.position[0] + 1.4, 0, selectedObject.position[2] + 1.2],
    };
    setObjects((prev) => [...prev, copy]);
    setIdCounter(nextCounter);
    setSelectedId(copy.id);
  };

  return (
    <main className={styles.page}>
      {contextHolder}

      <Topbar scenario={scenario} onScenarioChange={applyScenario} />

      <section className={styles.workspace}>
        <AssetsPanel onAddObject={addObject} />

        <section className={styles.sceneShell} aria-label="Industrial site map">
          <PrototypeScene
            objects={objects}
            selectedId={selectedObject?.id ?? null}
            setSelectedId={setSelectedId}
            updateObjectPosition={updateObjectPosition}
            demoMode={demoMode}
          />
          <div className={styles.sceneVignette} />
          <div className={styles.controlLegend}>
            <span><CompassOutlined /> Orbit</span>
            <span><DragOutlined /> Pan</span>
            <span><SearchOutlined /> Zoom</span>
            <span><ControlOutlined /> Move Objects</span>
          </div>
        </section>

        <PropertiesPanel
          selectedObject={selectedObject}
          scenario={scenario}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelected}
        />
      </section>

      <StatusBar
        stats={stats}
        scenario={scenario}
        demoMode={demoMode}
        onScenarioReset={() => applyScenario(scenario)}
        onToggleDemo={() => setDemoMode((prev) => !prev)}
      />
    </main>
  );
}
