"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CompassOutlined,
  ControlOutlined,
  DragOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import { cloneScenario, kindLabel, type ObjectKind, type ScenarioId, type SceneObject } from "./types";
import { defaultPlantConnections, defaultPlantMapObjects, type PlantMapObject } from "./plant-map";
import { PrototypeScene } from "./scene";
import { Topbar } from "./topbar";
import { AssetsPanel } from "./assets-panel";
import { PropertiesPanel } from "./properties-panel";
import { StatusBar } from "./status-bar";
import styles from "./drone-defense-prototype.module.css";

export function DroneDefensePrototype() {
  const [objects, setObjects] = useState<SceneObject[]>(() => cloneScenario("baseline"));
  const [plantObjects] = useState<PlantMapObject[]>(() =>
    defaultPlantMapObjects.map((item) => ({ ...item, selectable: false })),
  );
  const [plantConnections, setPlantConnections] = useState(defaultPlantConnections);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const storedTheme = window.localStorage.getItem("prototype-theme");
    return storedTheme === "dark" ? "dark" : "light";
  });
  const [scenario, setScenario] = useState<ScenarioId>("baseline");
  const [demoMode, setDemoMode] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [idCounter, setIdCounter] = useState(100);
  const [placingKind, setPlacingKind] = useState<ObjectKind | null>(null);
  const [placementPoint, setPlacementPoint] = useState<[number, number, number]>([0, 0, 0]);
  const [messageApi, contextHolder] = message.useMessage();

  const selectedObject = useMemo(() => objects.find((item) => item.id === selectedId) ?? null, [objects, selectedId]);

  const stats = useMemo(() => {
    const sensorCount = objects.filter((item) => item.kind === "operator_substation").length;
    const cameraCount = objects.filter((item) => item.kind === "scaffolding").length;
    const postCount = objects.filter((item) => item.kind === "fbs_enclosure").length;
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
    setSelectedId(null);
  };

  const buildObject = (kind: ObjectKind, position: [number, number, number], nextCounter: number): SceneObject => {
    const count = objects.filter((item) => item.kind === kind).length + 1;
    return {
      id: `${kind}-${nextCounter}`,
      kind,
      label: `${kindLabel[kind]} ${String(count).padStart(2, "0")}`,
      position,
      radius:
        kind === "operator_substation"
          ? 5.6
          : kind === "scaffolding"
            ? 5.2
            : kind === "fbs_enclosure"
              ? 5
              : kind === "perimeter_barrier"
                ? 6
                : 4.8,
      elevation:
        kind === "operator_substation"
          ? 12
          : kind === "scaffolding"
            ? 10
            : kind === "fbs_enclosure"
              ? 9
              : kind === "perimeter_barrier"
                ? 8
                : 10,
      zones: kind === "perimeter_barrier" || kind === "operator_substation" ? 2 : 1,
      assignment: "Grid Alpha",
    };
  };

  const addObjectAtPosition = (kind: ObjectKind, position: [number, number, number]) => {
    const nextCounter = idCounter + 1;
    const next = buildObject(kind, position, nextCounter);
    setObjects((prev) => [...prev, next]);
    setIdCounter(nextCounter);
    setSelectedId(next.id);
    setIsPropertiesOpen(true);
    messageApi.success(`${kindLabel[kind]} added to map`);
  };

  const startPlacing = (kind: ObjectKind) => {
    setPlacingKind(kind);
    setSelectedId(null);
    messageApi.info(`Placement mode: ${kindLabel[kind]}`);
  };

  const placePendingObject = () => {
    if (!placingKind) return;
    addObjectAtPosition(placingKind, placementPoint);
    setPlacingKind(null);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const objectToDelete = objects.find((item) => item.id === selectedId);
    if (!objectToDelete) return;
    setObjects((prev) => prev.filter((item) => item.id !== selectedId));
    setPlantConnections((prev) =>
      prev.filter((item) => item.fromObjectId !== selectedId && item.toObjectId !== selectedId),
    );
    setSelectedId(null);
    const removedLabel = objectToDelete.label;
    messageApi.info(`${removedLabel} removed`);
  }, [messageApi, objects, selectedId]);

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
    setIsPropertiesOpen(true);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget = tagName === "input" || tagName === "textarea" || target?.isContentEditable;
      if (isTypingTarget) return;
      if (!selectedId) return;
      event.preventDefault();
      deleteSelected();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, selectedId]);

  useEffect(() => {
    window.localStorage.setItem("prototype-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPlacingKind(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className={`${styles.page} ${theme === "dark" ? styles.pageDark : ""}`.trim()}>
      {contextHolder}

      <Topbar
        scenario={scenario}
        onScenarioChange={applyScenario}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      />

      <section className={`${styles.workspace} ${!isPropertiesOpen ? styles.workspaceNoProperties : ""}`.trim()}>
        <AssetsPanel
          onSelectAsset={startPlacing}
          placingKind={placingKind}
          onCancelPlacement={() => setPlacingKind(null)}
        />

        <section className={styles.sceneShell} aria-label="Industrial site map">
          <PrototypeScene
            objects={objects}
            plantObjects={plantObjects}
            plantConnections={plantConnections}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            updateObjectPosition={updateObjectPosition}
            demoMode={demoMode}
            theme={theme}
            placingKind={placingKind}
            placementPoint={placementPoint}
            onPlacementMove={(x, z) => setPlacementPoint([x, 0, z])}
            onPlacePending={placePendingObject}
            onCancelPlacement={() => setPlacingKind(null)}
          />
          <div className={styles.sceneVignette} />
          <div className={styles.controlLegend}>
            <span><CompassOutlined /> Orbit</span>
            <span><DragOutlined /> Pan</span>
            <span><SearchOutlined /> Zoom</span>
            <span><ControlOutlined /> Move Objects</span>
          </div>
        </section>

        {isPropertiesOpen ? (
          <PropertiesPanel
            selectedObject={selectedObject}
            scenario={scenario}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
            onClose={() => setIsPropertiesOpen(false)}
          />
        ) : null}
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
