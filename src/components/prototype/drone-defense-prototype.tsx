"use client";

import { createRef, useMemo, useState } from "react";
import { Button, Card, Divider, Space, Typography, Input, Segmented, message } from "antd";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import styles from "./drone-defense-prototype.module.css";

type ObjectKind = "radar" | "jammer" | "camera";

type SceneObject = {
  id: string;
  kind: ObjectKind;
  position: [number, number, number];
};

type ScenarioId = "perimeter" | "production" | "warehouse";

const { TextArea } = Input;

const kindColor: Record<ObjectKind, string> = {
  radar: "#2f6fed",
  jammer: "#ef8f00",
  camera: "#2f9e44",
};

const kindLabel: Record<ObjectKind, string> = {
  radar: "Радар",
  jammer: "Глушилка",
  camera: "Камера",
};

const levelPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

const scenarioPresets: Record<ScenarioId, SceneObject[]> = {
  perimeter: [
    { id: "obj-radar-1", kind: "radar", position: [-5.5, 0.65, -3.5] },
    { id: "obj-radar-2", kind: "radar", position: [5.5, 0.65, -3.5] },
    { id: "obj-jammer-1", kind: "jammer", position: [0, 0.65, 1.5] },
    { id: "obj-camera-1", kind: "camera", position: [-3, 0.65, 4.5] },
    { id: "obj-camera-2", kind: "camera", position: [3, 0.65, 4.5] },
  ],
  production: [
    { id: "obj-radar-1", kind: "radar", position: [-6, 0.65, -1] },
    { id: "obj-jammer-1", kind: "jammer", position: [-1, 0.65, 2.5] },
    { id: "obj-jammer-2", kind: "jammer", position: [4, 0.65, -0.5] },
    { id: "obj-camera-1", kind: "camera", position: [-3, 0.65, 5] },
    { id: "obj-camera-2", kind: "camera", position: [2, 0.65, 5] },
  ],
  warehouse: [
    { id: "obj-radar-1", kind: "radar", position: [0, 0.65, -5] },
    { id: "obj-jammer-1", kind: "jammer", position: [-4.5, 0.65, 0] },
    { id: "obj-jammer-2", kind: "jammer", position: [4.5, 0.65, 0] },
    { id: "obj-camera-1", kind: "camera", position: [-2.5, 0.65, 4] },
    { id: "obj-camera-2", kind: "camera", position: [2.5, 0.65, 4] },
  ],
};

function getDefaultScenario() {
  return scenarioPresets.perimeter.map((item) => ({ ...item }));
}

function snapToGrid(value: number, step = 0.5) {
  return Math.round(value / step) * step;
}

function SceneUnit({
  item,
  selected,
  onSelect,
  onMove,
}: {
  item: SceneObject;
  selected: boolean;
  onSelect: () => void;
  onMove: (id: string, x: number, z: number) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setDragging(true);
    onSelect();
    (event.target as Element).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    event.stopPropagation();

    const intersection = new THREE.Vector3();
    if (event.ray.intersectPlane(levelPlane, intersection)) {
      onMove(item.id, snapToGrid(intersection.x), snapToGrid(intersection.z));
    }
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setDragging(false);
    (event.target as Element).releasePointerCapture(event.pointerId);
  };

  return (
    <mesh
      position={item.position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      castShadow
    >
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial
        color={kindColor[item.kind]}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.12 : 0}
      />
    </mesh>
  );
}

function CoverageDisk({ item }: { item: SceneObject }) {
  const radius = item.kind === "radar" ? 8 : item.kind === "jammer" ? 5.5 : 4;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[item.position[0], 0.02, item.position[2]]}
    >
      <ringGeometry args={[radius - 0.08, radius, 64]} />
      <meshBasicMaterial color={kindColor[item.kind]} transparent opacity={0.3} />
    </mesh>
  );
}

function DemoDrones({ enabled }: { enabled: boolean }) {
  const refs = useMemo(() => Array.from({ length: 6 }, () => createRef<THREE.Mesh>()), []);

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.getElapsedTime();

    refs.forEach((meshRef, index) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const phase = index * 0.85;
      const x = 16 - ((t * 1.8 + index * 2.8) % 34);
      const z = -7 + index * 2.5 + Math.sin(t * 0.8 + phase) * 0.7;
      const y = 5 + Math.sin(t * 1.6 + phase) * 0.5;
      mesh.position.set(x, y, z);
      mesh.rotation.y = -Math.PI / 2;
    });
  });

  if (!enabled) return null;

  return (
    <group>
      {refs.map((ref, idx) => (
        <mesh key={idx} ref={ref} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#b11f1f" emissive="#ff5f5f" emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function PrototypeScene({
  objects,
  selectedId,
  setSelectedId,
  updateObjectPosition,
  demoMode,
}: {
  objects: SceneObject[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateObjectPosition: (id: string, x: number, z: number) => void;
  demoMode: boolean;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [14, 12, 14], fov: 42 }}
      onPointerMissed={() => setSelectedId(null)}
      className={styles.canvas}
    >
      <color attach="background" args={["#f2efe5"]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={1}
        position={[8, 20, 6]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#e3dcc9" />
      </mesh>

      <Grid
        args={[120, 120]}
        position={[0, 0.01, 0]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#8d8576"
        sectionSize={5}
        sectionThickness={1.3}
        sectionColor="#5f5646"
        fadeDistance={70}
        fadeStrength={1}
        infiniteGrid
      />

      {objects.map((item) => (
        <group key={item.id}>
          <CoverageDisk item={item} />
          <SceneUnit
            item={item}
            selected={selectedId === item.id}
            onSelect={() => setSelectedId(item.id)}
            onMove={updateObjectPosition}
          />
        </group>
      ))}

      <DemoDrones enabled={demoMode} />

      <OrbitControls makeDefault maxPolarAngle={Math.PI * 0.49} minDistance={6} maxDistance={50} />
    </Canvas>
  );
}

export function DroneDefensePrototype() {
  const [objects, setObjects] = useState<SceneObject[]>(getDefaultScenario());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioId>("perimeter");
  const [demoMode, setDemoMode] = useState(false);
  const [jsonValue, setJsonValue] = useState<string>(JSON.stringify(getDefaultScenario(), null, 2));
  const [messageApi, contextHolder] = message.useMessage();

  const selectedObject = useMemo(
    () => objects.find((item) => item.id === selectedId) ?? null,
    [objects, selectedId],
  );

  const updateObjectPosition = (id: string, x: number, z: number) => {
    setObjects((prev) =>
      prev.map((item) => (item.id === id ? { ...item, position: [x, item.position[1], z] } : item)),
    );
  };

  const addObject = (kind: ObjectKind) => {
    const id = `obj-${kind}-${Date.now()}`;
    const offset = objects.length % 6;

    setObjects((prev) => [
      ...prev,
      {
        id,
        kind,
        position: [-4 + offset * 1.8, 0.65, 5],
      },
    ]);
    setSelectedId(id);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setObjects((prev) => prev.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const applyScenario = (value: string | number) => {
    const id = value as ScenarioId;
    setScenario(id);
    setObjects(scenarioPresets[id].map((item) => ({ ...item })));
    setSelectedId(null);
    setJsonValue(JSON.stringify(scenarioPresets[id], null, 2));
  };

  const exportJson = async () => {
    const payload = JSON.stringify(objects, null, 2);
    setJsonValue(payload);

    try {
      await navigator.clipboard.writeText(payload);
      messageApi.success("JSON скопирован в буфер обмена");
    } catch {
      messageApi.info("JSON обновлен в поле ниже");
    }
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonValue) as SceneObject[];
      const valid = parsed.every(
        (item) =>
          typeof item.id === "string" &&
          (item.kind === "radar" || item.kind === "jammer" || item.kind === "camera") &&
          Array.isArray(item.position) &&
          item.position.length === 3 &&
          item.position.every((v) => typeof v === "number"),
      );

      if (!valid) {
        messageApi.error("Некорректная структура JSON");
        return;
      }

      setObjects(parsed.map((item) => ({ ...item, position: [item.position[0], 0.65, item.position[2]] })));
      setSelectedId(null);
      messageApi.success("Конфигурация загружена");
    } catch {
      messageApi.error("Ошибка парсинга JSON");
    }
  };

  return (
    <main className={styles.page}>
      {contextHolder}

      <section className={styles.header}>
        <Typography.Title level={2} className={styles.title}>
          3D прототип защиты объекта
        </Typography.Title>
        <Typography.Text className={styles.subtitle}>
          База для демо: перемещайте объекты мышью, вращайте камеру, масштабируйте колесом.
        </Typography.Text>
      </section>

      <section className={styles.toolbar}>
        <Space wrap>
          <Typography.Text strong>Сценарий:</Typography.Text>
          <Segmented
            value={scenario}
            onChange={applyScenario}
            options={[
              { label: "Периметр", value: "perimeter" },
              { label: "Производство", value: "production" },
              { label: "Склад", value: "warehouse" },
            ]}
          />
          <Button type={demoMode ? "primary" : "default"} onClick={() => setDemoMode((prev) => !prev)}>
            {demoMode ? "Остановить демо налета" : "Запустить демо налета"}
          </Button>
        </Space>
      </section>

      <section className={styles.layout}>
        <Card className={styles.sidebar} title="Объекты" bordered={false}>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Button block onClick={() => addObject("radar")}>Добавить радар</Button>
            <Button block onClick={() => addObject("jammer")}>Добавить глушилку</Button>
            <Button block onClick={() => addObject("camera")}>Добавить камеру</Button>
            <Divider style={{ margin: "8px 0" }} />
            <Button danger block disabled={!selectedId} onClick={removeSelected}>
              Удалить выбранный
            </Button>
          </Space>
        </Card>

        <Card className={styles.sceneCard} bordered={false}>
          <PrototypeScene
            objects={objects}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            updateObjectPosition={updateObjectPosition}
            demoMode={demoMode}
          />
        </Card>

        <Card className={styles.sidebar} title="Инспектор" bordered={false}>
          {selectedObject ? (
            <Space direction="vertical" size={4}>
              <Typography.Text>
                <b>ID:</b> {selectedObject.id}
              </Typography.Text>
              <Typography.Text>
                <b>Тип:</b> {kindLabel[selectedObject.kind]}
              </Typography.Text>
              <Typography.Text>
                <b>Позиция:</b> X {selectedObject.position[0].toFixed(1)} | Z {selectedObject.position[2].toFixed(1)}
              </Typography.Text>
            </Space>
          ) : (
            <Typography.Text className={styles.hint}>
              Выберите объект на сцене, чтобы посмотреть параметры.
            </Typography.Text>
          )}

          <Divider style={{ margin: "12px 0" }} />
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Typography.Text strong>JSON конфигурации</Typography.Text>
            <TextArea rows={10} value={jsonValue} onChange={(event) => setJsonValue(event.target.value)} />
            <Space wrap>
              <Button onClick={exportJson}>Экспорт</Button>
              <Button type="primary" onClick={importJson}>Импорт</Button>
            </Space>
          </Space>
        </Card>
      </section>
    </main>
  );
}
