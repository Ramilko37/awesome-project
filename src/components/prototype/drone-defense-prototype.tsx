"use client";

import { createRef, type ReactNode, useMemo, useState } from "react";
import {
  AimOutlined,
  BellOutlined,
  BuildOutlined,
  CameraOutlined,
  CloudOutlined,
  ColumnHeightOutlined,
  CompassOutlined,
  ControlOutlined,
  CopyOutlined,
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  GatewayOutlined,
  PlayCircleOutlined,
  RadarChartOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { Grid, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import styles from "./drone-defense-prototype.module.css";

type ObjectKind = "sensor" | "camera" | "shield" | "post" | "barrier";
type ScenarioId = "baseline" | "perimeter" | "assets" | "night";

type SceneObject = {
  id: string;
  kind: ObjectKind;
  label: string;
  position: [number, number, number];
  radius: number;
  elevation: number;
  zones: number;
  assignment: string;
};

type AssetCatalogItem = {
  kind: ObjectKind | "facility";
  label: string;
  tone: string;
};

const levelPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

const scenarioLabels: Record<ScenarioId, string> = {
  baseline: "Baseline",
  perimeter: "Reinforced Perimeter",
  assets: "Critical Assets",
  night: "Night Mode",
};

const kindLabel: Record<ObjectKind, string> = {
  sensor: "Sensor Mast",
  camera: "Camera",
  shield: "Signal Shield",
  post: "Control Post",
  barrier: "Barrier",
};

const kindColor: Record<ObjectKind, string> = {
  sensor: "#4cc8ff",
  camera: "#5cc7f5",
  shield: "#f4c24e",
  post: "#9cc9e5",
  barrier: "#d8b16c",
};

const assetCatalog: AssetCatalogItem[] = [
  { kind: "facility", label: "Industrial Facility", tone: "facility" },
  { kind: "sensor", label: "Sensor", tone: "cyan" },
  { kind: "camera", label: "Camera", tone: "cyan" },
  { kind: "shield", label: "Signal Shield", tone: "amber" },
  { kind: "post", label: "Control Post", tone: "steel" },
  { kind: "barrier", label: "Barrier", tone: "amber" },
];

const scenarioPresets: Record<ScenarioId, SceneObject[]> = {
  baseline: [
    {
      id: "sensor-07",
      kind: "sensor",
      label: "Sensor Mast 07",
      position: [-7.4, 0, -3.8],
      radius: 4.8,
      elevation: 18,
      zones: 2,
      assignment: "North Post",
    },
    {
      id: "sensor-02",
      kind: "sensor",
      label: "Sensor Mast 02",
      position: [7.8, 0, -3.2],
      radius: 4.5,
      elevation: 17,
      zones: 2,
      assignment: "East Post",
    },
    {
      id: "sensor-11",
      kind: "sensor",
      label: "Sensor Mast 11",
      position: [1.2, 0, 6.3],
      radius: 5.2,
      elevation: 20,
      zones: 3,
      assignment: "South Post",
    },
    {
      id: "camera-04",
      kind: "camera",
      label: "Camera 04",
      position: [-9.6, 0, 2.5],
      radius: 4.2,
      elevation: 10,
      zones: 1,
      assignment: "Gate Alpha",
    },
    {
      id: "camera-09",
      kind: "camera",
      label: "Camera 09",
      position: [5.1, 0, 1.4],
      radius: 4.6,
      elevation: 12,
      zones: 1,
      assignment: "Inner Yard",
    },
    {
      id: "shield-03",
      kind: "shield",
      label: "Signal Shield 03",
      position: [-2.1, 0, -2.2],
      radius: 5.6,
      elevation: 6,
      zones: 2,
      assignment: "Process Core",
    },
    {
      id: "post-01",
      kind: "post",
      label: "Control Post 01",
      position: [-10.2, 0, -6.5],
      radius: 2.2,
      elevation: 14,
      zones: 1,
      assignment: "North Post",
    },
    {
      id: "post-04",
      kind: "post",
      label: "Control Post 04",
      position: [9.8, 0, 5.9],
      radius: 2.2,
      elevation: 14,
      zones: 1,
      assignment: "Grid Alpha",
    },
  ],
  perimeter: [
    {
      id: "sensor-01",
      kind: "sensor",
      label: "Sensor Mast 01",
      position: [-9.6, 0, -5.2],
      radius: 5.3,
      elevation: 19,
      zones: 2,
      assignment: "West Fence",
    },
    {
      id: "sensor-02",
      kind: "sensor",
      label: "Sensor Mast 02",
      position: [9.2, 0, -5.4],
      radius: 5.3,
      elevation: 19,
      zones: 2,
      assignment: "East Fence",
    },
    {
      id: "sensor-03",
      kind: "sensor",
      label: "Sensor Mast 03",
      position: [-9.2, 0, 5.5],
      radius: 5.3,
      elevation: 19,
      zones: 2,
      assignment: "West Fence",
    },
    {
      id: "sensor-04",
      kind: "sensor",
      label: "Sensor Mast 04",
      position: [9.4, 0, 5.3],
      radius: 5.3,
      elevation: 19,
      zones: 2,
      assignment: "East Fence",
    },
    {
      id: "camera-01",
      kind: "camera",
      label: "Camera 01",
      position: [-5.4, 0, 1.1],
      radius: 4.2,
      elevation: 11,
      zones: 1,
      assignment: "Inner Yard",
    },
    {
      id: "camera-02",
      kind: "camera",
      label: "Camera 02",
      position: [4.8, 0, -0.3],
      radius: 4.2,
      elevation: 11,
      zones: 1,
      assignment: "Inner Yard",
    },
    {
      id: "shield-01",
      kind: "shield",
      label: "Signal Shield 01",
      position: [0, 0, 5.8],
      radius: 5.8,
      elevation: 7,
      zones: 2,
      assignment: "South Yard",
    },
  ],
  assets: [
    {
      id: "sensor-core",
      kind: "sensor",
      label: "Sensor Mast Core",
      position: [-2.4, 0, -2.5],
      radius: 6.2,
      elevation: 21,
      zones: 3,
      assignment: "Process Core",
    },
    {
      id: "sensor-tank",
      kind: "sensor",
      label: "Sensor Mast Tank",
      position: [4.8, 0, -3.8],
      radius: 5.6,
      elevation: 20,
      zones: 3,
      assignment: "Tank Farm",
    },
    {
      id: "camera-core",
      kind: "camera",
      label: "Camera Core",
      position: [-5, 0, 1.5],
      radius: 4.4,
      elevation: 12,
      zones: 1,
      assignment: "Critical Bay",
    },
    {
      id: "shield-core",
      kind: "shield",
      label: "Signal Shield Core",
      position: [0.8, 0, -0.6],
      radius: 6.2,
      elevation: 7,
      zones: 3,
      assignment: "Critical Bay",
    },
    {
      id: "post-core",
      kind: "post",
      label: "Control Post Core",
      position: [7.7, 0, 4.1],
      radius: 2.2,
      elevation: 14,
      zones: 1,
      assignment: "Grid Alpha",
    },
  ],
  night: [
    {
      id: "sensor-night-n",
      kind: "sensor",
      label: "Sensor Mast Night N",
      position: [-6.8, 0, -4.2],
      radius: 5.5,
      elevation: 19,
      zones: 3,
      assignment: "North Post",
    },
    {
      id: "sensor-night-e",
      kind: "sensor",
      label: "Sensor Mast Night E",
      position: [8.3, 0, -1.8],
      radius: 5.4,
      elevation: 18,
      zones: 2,
      assignment: "East Post",
    },
    {
      id: "sensor-night-s",
      kind: "sensor",
      label: "Sensor Mast Night S",
      position: [1.1, 0, 6.1],
      radius: 5.8,
      elevation: 20,
      zones: 3,
      assignment: "South Post",
    },
    {
      id: "camera-night-1",
      kind: "camera",
      label: "Camera Night 01",
      position: [-9.4, 0, 1.9],
      radius: 4.5,
      elevation: 12,
      zones: 1,
      assignment: "West Gate",
    },
    {
      id: "camera-night-2",
      kind: "camera",
      label: "Camera Night 02",
      position: [5.5, 0, 2.2],
      radius: 4.5,
      elevation: 12,
      zones: 1,
      assignment: "Truck Bay",
    },
    {
      id: "shield-night",
      kind: "shield",
      label: "Signal Shield Night",
      position: [-1, 0, -1],
      radius: 6.1,
      elevation: 8,
      zones: 3,
      assignment: "Process Core",
    },
  ],
};

function cloneScenario(id: ScenarioId) {
  return scenarioPresets[id].map((item) => ({ ...item }));
}

function snapToGrid(value: number, step = 0.5) {
  return Math.round(value / step) * step;
}

function AssetIcon({ kind }: { kind: AssetCatalogItem["kind"] }) {
  if (kind === "facility") return <BuildOutlined />;
  if (kind === "sensor") return <ColumnHeightOutlined />;
  if (kind === "camera") return <CameraOutlined />;
  if (kind === "shield") return <RadarChartOutlined />;
  if (kind === "post") return <GatewayOutlined />;
  return <SafetyCertificateOutlined />;
}

function Building({
  position,
  size,
  roof = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  roof?: boolean;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#28333a" roughness={0.72} metalness={0.16} />
      </mesh>
      <mesh castShadow position={[0, size[1] + 0.12, 0]}>
        <boxGeometry args={[size[0] + 0.28, 0.24, size[2] + 0.22]} />
        <meshStandardMaterial color={roof ? "#58606a" : "#3b444d"} roughness={0.68} metalness={0.3} />
      </mesh>
      {[-0.38, 0, 0.38].map((offset) => (
        <mesh key={offset} position={[-size[0] / 2 - 0.015, size[1] * 0.48, offset * size[2]]}>
          <boxGeometry args={[0.03, 0.18, 0.72]} />
          <meshStandardMaterial
            color="#f5b952"
            emissive="#f5a623"
            emissiveIntensity={0.48}
            roughness={0.55}
          />
        </mesh>
      ))}
      {[-0.36, 0.05, 0.45].map((offset) => (
        <mesh key={offset} position={[size[0] / 2 + 0.015, size[1] * 0.46, offset * size[2]]}>
          <boxGeometry args={[0.03, 0.18, 0.66]} />
          <meshStandardMaterial
            color="#f5b952"
            emissive="#f5a623"
            emissiveIntensity={0.42}
            roughness={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

function Tower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 2.7, 8]} />
        <meshStandardMaterial color="#c3ccd2" metalness={0.4} roughness={0.36} />
      </mesh>
      <mesh castShadow position={[0, 2.85, 0]}>
        <boxGeometry args={[0.88, 0.52, 0.88]} />
        <meshStandardMaterial color="#384149" metalness={0.2} roughness={0.55} />
      </mesh>
      <mesh position={[0, 3.18, 0]}>
        <boxGeometry args={[1.08, 0.08, 1.08]} />
        <meshStandardMaterial color="#f2b55c" emissive="#db8624" emissiveIntensity={0.22} />
      </mesh>
    </group>
  );
}

function Fence() {
  const posts = useMemo(() => {
    const values: [number, number, number][] = [];
    for (let x = -12; x <= 12; x += 2) {
      values.push([x, 0, -7.6], [x, 0, 7.6]);
    }
    for (let z = -6; z <= 6; z += 2) {
      values.push([-12.4, 0, z], [12.4, 0, z]);
    }
    return values;
  }, []);

  return (
    <group>
      <mesh position={[0, 0.08, -7.6]}>
        <boxGeometry args={[25, 0.08, 0.1]} />
        <meshStandardMaterial color="#d59743" emissive="#d0872f" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 0.08, 7.6]}>
        <boxGeometry args={[25, 0.08, 0.1]} />
        <meshStandardMaterial color="#d59743" emissive="#d0872f" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-12.4, 0.08, 0]}>
        <boxGeometry args={[0.1, 0.08, 15.3]} />
        <meshStandardMaterial color="#d59743" emissive="#d0872f" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[12.4, 0.08, 0]}>
        <boxGeometry args={[0.1, 0.08, 15.3]} />
        <meshStandardMaterial color="#d59743" emissive="#d0872f" emissiveIntensity={0.45} />
      </mesh>
      {posts.map((position, index) => (
        <mesh key={`${position.join("-")}-${index}`} castShadow position={[position[0], 0.56, position[2]]}>
          <boxGeometry args={[0.1, 1.12, 0.1]} />
          <meshStandardMaterial color="#8e98a0" metalness={0.35} roughness={0.38} />
        </mesh>
      ))}
    </group>
  );
}

function FacilityModel() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[24.8, 15.2]} />
        <meshStandardMaterial color="#1d2529" roughness={0.86} metalness={0.05} />
      </mesh>

      {[-6, -2, 2, 6].map((x) => (
        <mesh key={`lane-${x}`} position={[x, 0.025, 0]}>
          <boxGeometry args={[0.055, 0.035, 14.7]} />
          <meshStandardMaterial color="#bd883b" emissive="#ad762d" emissiveIntensity={0.32} />
        </mesh>
      ))}
      {[-5.8, -2.2, 2.2, 5.8].map((z) => (
        <mesh key={`cross-${z}`} position={[0, 0.026, z]}>
          <boxGeometry args={[23.6, 0.035, 0.055]} />
          <meshStandardMaterial color="#bd883b" emissive="#ad762d" emissiveIntensity={0.26} />
        </mesh>
      ))}

      <Building position={[0.8, 0, -0.5]} size={[6.4, 1.7, 4.2]} roof />
      <Building position={[-4.8, 0, 3.2]} size={[4.2, 1.15, 2.55]} />
      <Building position={[5.6, 0, 4.25]} size={[2.8, 1.05, 1.9]} />
      <Building position={[-7.2, 0, -4.8]} size={[2.2, 0.9, 1.7]} />

      {[-1.3, 0, 1.3].map((x) => (
        <mesh key={`roof-rib-${x}`} position={[x + 0.8, 1.93, -0.5]}>
          <boxGeometry args={[0.12, 0.18, 4.55]} />
          <meshStandardMaterial color="#6e7880" metalness={0.34} roughness={0.48} />
        </mesh>
      ))}

      {[3.8, 4.8, 6].map((x, index) => (
        <group key={`stack-${x}`} position={[x, 0, -3.4 + index * 0.35]}>
          <mesh castShadow position={[0, 1.25, 0]}>
            <cylinderGeometry args={[0.34, 0.38, 2.5, 24]} />
            <meshStandardMaterial color="#aab2b8" metalness={0.22} roughness={0.48} />
          </mesh>
          <mesh position={[0, 2.05, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.12, 24]} />
            <meshStandardMaterial color="#d26b4c" emissive="#9e351d" emissiveIntensity={0.24} />
          </mesh>
        </group>
      ))}

      {[-1.9, -0.9, 3.1].map((x) => (
        <mesh key={`tank-${x}`} castShadow position={[x, 0.72, -3.7]}>
          <cylinderGeometry args={[0.62, 0.62, 1.44, 32]} />
          <meshStandardMaterial color="#9ba8ae" metalness={0.3} roughness={0.46} />
        </mesh>
      ))}

      {[
        [-10.4, -6.4],
        [10.3, -6.2],
        [-10.2, 6.2],
        [10.4, 6.3],
        [0.4, 7],
      ].map(([x, z]) => (
        <Tower key={`tower-${x}-${z}`} position={[x, 0, z]} />
      ))}

      {[
        [-6.2, 5.5],
        [-3.3, 5.8],
        [3.4, 5.8],
        [6.5, 5.2],
        [-8.2, -1.5],
        [8.4, 0.8],
      ].map(([x, z]) => (
        <group key={`crate-${x}-${z}`} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.22, 0]}>
            <boxGeometry args={[0.9, 0.44, 0.72]} />
            <meshStandardMaterial color="#59646c" roughness={0.62} metalness={0.16} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[0.92, 0.06, 0.74]} />
            <meshStandardMaterial color="#d79a3f" emissive="#a86b25" emissiveIntensity={0.24} />
          </mesh>
        </group>
      ))}

      <Fence />
    </group>
  );
}

function Coverage({ item, selected }: { item: SceneObject; selected: boolean }) {
  const color = item.kind === "shield" ? "#f0bf4f" : "#43c9ff";
  const opacity = selected ? 0.28 : 0.18;

  if (item.kind === "camera") {
    return (
      <group position={item.position}>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI * 0.16]} position={[0, 0.08, item.radius * 0.45]}>
          <circleGeometry args={[item.radius, 44, -0.48, 0.96]} />
          <meshBasicMaterial color={color} transparent opacity={0.34} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
          <ringGeometry args={[item.radius - 0.06, item.radius, 72]} />
          <meshBasicMaterial color="#f2c85d" transparent opacity={0.34} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={item.position}>
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[item.radius, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[item.radius - 0.08, item.radius, 96]} />
        <meshBasicMaterial color="#f1c45e" transparent opacity={0.42} depthWrite={false} />
      </mesh>
      {item.kind === "sensor" ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[item.radius * 0.52, item.radius * 0.55, 96]} />
          <meshBasicMaterial color="#47d1ff" transparent opacity={0.36} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function SensorMast({ selected }: { selected: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.58, 0.66, 0.22, 32]} />
        <meshStandardMaterial color="#29353c" metalness={0.32} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.055, 0.08, 2.1, 12]} />
        <meshStandardMaterial color="#d8e1e6" metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh castShadow position={[0, 2.18, 0]}>
        <boxGeometry args={[0.36, 0.32, 0.36]} />
        <meshStandardMaterial
          color="#dfe7eb"
          emissive={selected ? "#4ad7ff" : "#1e8fb5"}
          emissiveIntensity={selected ? 0.36 : 0.12}
        />
      </mesh>
      <mesh position={[0, 1.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.018, 10, 40]} />
        <meshStandardMaterial color="#4bd6ff" emissive="#28bbed" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function CameraUnit({ selected }: { selected: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.6, 10]} />
        <meshStandardMaterial color="#c5d1d7" metalness={0.42} roughness={0.33} />
      </mesh>
      <mesh castShadow position={[0, 1.72, 0.22]} rotation={[0, 0.08, 0]}>
        <boxGeometry args={[0.72, 0.28, 0.38]} />
        <meshStandardMaterial
          color="#cbd6dc"
          emissive={selected ? "#49d7ff" : "#1f6f86"}
          emissiveIntensity={selected ? 0.28 : 0.08}
        />
      </mesh>
      <mesh position={[0, 1.72, 0.48]}>
        <cylinderGeometry args={[0.11, 0.11, 0.08, 18]} />
        <meshStandardMaterial color="#28c9ff" emissive="#19a9d8" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function ShieldUnit({ selected }: { selected: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.66, 0.82, 0.44, 36]} />
        <meshStandardMaterial color="#3c454a" metalness={0.24} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#9fb5bf"
          transparent
          opacity={0.62}
          emissive={selected ? "#f0bd4b" : "#8a6321"}
          emissiveIntensity={selected ? 0.28 : 0.08}
          roughness={0.24}
        />
      </mesh>
    </group>
  );
}

function ControlPost({ selected }: { selected: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.72, 0]}>
        <boxGeometry args={[0.72, 1.44, 0.72]} />
        <meshStandardMaterial color="#6f7d86" metalness={0.2} roughness={0.44} />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[1.16, 0.42, 1.16]} />
        <meshStandardMaterial
          color="#263039"
          emissive={selected ? "#42cfff" : "#0d2933"}
          emissiveIntensity={selected ? 0.2 : 0.04}
        />
      </mesh>
      <mesh position={[0, 1.88, 0]}>
        <boxGeometry args={[1.34, 0.08, 1.34]} />
        <meshStandardMaterial color="#e8a84b" emissive="#bf7a2c" emissiveIntensity={0.26} />
      </mesh>
    </group>
  );
}

function BarrierUnit({ selected }: { selected: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[2.2, 0.12, 0.12]} />
        <meshStandardMaterial
          color="#aab3b8"
          emissive={selected ? "#d78f38" : "#4b331b"}
          emissiveIntensity={selected ? 0.22 : 0.06}
        />
      </mesh>
      {[-0.9, 0, 0.9].map((x) => (
        <mesh key={x} castShadow position={[x, 0.42, 0]}>
          <boxGeometry args={[0.1, 0.84, 0.1]} />
          <meshStandardMaterial color="#aab3b8" metalness={0.2} roughness={0.38} />
        </mesh>
      ))}
    </group>
  );
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
    <group
      position={item.position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[0.75, selected ? 0.88 : 0.82, 48]} />
        <meshBasicMaterial color={selected ? "#53d7ff" : kindColor[item.kind]} transparent opacity={0.78} />
      </mesh>
      {item.kind === "sensor" ? <SensorMast selected={selected} /> : null}
      {item.kind === "camera" ? <CameraUnit selected={selected} /> : null}
      {item.kind === "shield" ? <ShieldUnit selected={selected} /> : null}
      {item.kind === "post" ? <ControlPost selected={selected} /> : null}
      {item.kind === "barrier" ? <BarrierUnit selected={selected} /> : null}
    </group>
  );
}

function DemoDrones({ enabled }: { enabled: boolean }) {
  const refs = useMemo(() => Array.from({ length: 3 }, () => createRef<THREE.Mesh>()), []);
  const paths = useMemo(
    () => [
      [
        [-7.4, 4.6, -7.6],
        [-2.4, 5.1, -6.4],
        [1.5, 5.4, -5.4],
      ],
      [
        [2.4, 5, -8.1],
        [6.7, 4.8, -6.2],
        [10, 4.6, -4.5],
      ],
      [
        [-2.8, 4.2, -7.5],
        [-6.7, 4.6, -5.1],
        [-9.1, 4.1, -3.5],
      ],
    ] as [number, number, number][][],
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.forEach((meshRef, index) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const phase = enabled ? t * 0.48 + index * 0.22 : index * 0.2;
      const startX = [-7.4, 2.4, -2.8][index];
      const endX = [-0.8, 10, -9.1][index];
      const startZ = [-7.6, -8.1, -7.5][index];
      const endZ = [-5.2, -4.5, -3.5][index];
      const progress = (Math.sin(phase) + 1) / 2;
      mesh.position.set(
        THREE.MathUtils.lerp(startX, endX, progress),
        4.7 + Math.sin(t + index) * 0.18,
        THREE.MathUtils.lerp(startZ, endZ, progress),
      );
      mesh.rotation.set(0, Math.PI * 0.08, -Math.PI / 2);
    });
  });

  return (
    <group>
      {paths.map((path, index) => (
        <Line
          key={`path-${index}`}
          points={path}
          color="#ff3838"
          lineWidth={1.6}
          dashed
          dashScale={4}
          dashSize={0.55}
          gapSize={0.42}
          transparent
          opacity={enabled ? 0.9 : 0.45}
        />
      ))}
      {refs.map((ref, index) => (
        <mesh key={`drone-${index}`} ref={ref} castShadow>
          <coneGeometry args={[0.24, 0.76, 3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff2727" emissiveIntensity={0.72} />
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
      orthographic
      camera={{ position: [17.5, 14.2, 17.5], zoom: 44, near: 0.1, far: 120 }}
      onPointerMissed={() => setSelectedId(null)}
      className={styles.canvas}
    >
      <color attach="background" args={["#10161a"]} />
      <fog attach="fog" args={["#10161a", 24, 54]} />
      <ambientLight intensity={0.72} />
      <directionalLight
        castShadow
        intensity={1.85}
        position={[8, 18, 7]}
        color="#f6d397"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-8, 4, 5]} intensity={3.8} color="#46cfff" distance={12} />
      <pointLight position={[8, 3, -4]} intensity={2.6} color="#f0a341" distance={14} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#0d1417" roughness={0.95} metalness={0.03} />
      </mesh>
      <Grid
        args={[90, 90]}
        position={[0, -0.04, 0]}
        cellSize={0.75}
        cellThickness={0.32}
        cellColor="#43311f"
        sectionSize={4.5}
        sectionThickness={0.7}
        sectionColor="#a46c2e"
        fadeDistance={42}
        fadeStrength={1.7}
        infiniteGrid
      />

      <FacilityModel />

      {objects.map((item) => (
        <Coverage key={`coverage-${item.id}`} item={item} selected={selectedId === item.id} />
      ))}
      {objects.map((item) => (
        <SceneUnit
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onSelect={() => setSelectedId(item.id)}
          onMove={updateObjectPosition}
        />
      ))}

      <DemoDrones enabled={demoMode} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={Math.PI * 0.18}
        minZoom={26}
        maxZoom={72}
      />
    </Canvas>
  );
}

function PropertyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.propertyRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button className={styles.iconButton} type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

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

    return {
      sensorCount,
      cameraCount,
      postCount,
      coverage,
      perimeter: scenario === "perimeter" ? "3.1 km" : "2.4 km",
    };
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
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.shieldMark}>
            <SafetyCertificateOutlined />
          </div>
          <div>
            <strong>FORTIS</strong>
            <span>Site Protection Configurator</span>
          </div>
        </div>

        <nav className={styles.scenarioTabs} aria-label="Scenario">
          {(Object.keys(scenarioLabels) as ScenarioId[]).map((id) => (
            <button
              key={id}
              className={id === scenario ? styles.activeTab : styles.tab}
              type="button"
              onClick={() => applyScenario(id)}
            >
              {id === "baseline" ? <CompassOutlined /> : id === "perimeter" ? <AimOutlined /> : id === "assets" ? <ControlOutlined /> : <EyeOutlined />}
              <span>{scenarioLabels[id]}</span>
            </button>
          ))}
        </nav>

        <div className={styles.topActions}>
          <IconButton label="Sync to cloud">
            <CloudOutlined />
          </IconButton>
          <IconButton label="Settings">
            <SettingOutlined />
          </IconButton>
          <IconButton label="Notifications">
            <BellOutlined />
          </IconButton>
          <button className={styles.profileButton} type="button" aria-label="Account">
            AD
          </button>
        </div>
      </header>

      <section className={styles.workspace}>
        <aside className={styles.assetsPanel} aria-label="Assets">
          <div className={styles.panelHeader}>
            <h2>Assets</h2>
          </div>
          <div className={styles.searchRow}>
            <SearchOutlined />
            <input aria-label="Search assets" placeholder="Search assets..." />
            <FilterOutlined />
          </div>
          <div className={styles.assetList}>
            {assetCatalog.map((item) => (
              <button
                key={item.kind}
                className={`${styles.assetItem} ${styles[item.tone]}`}
                type="button"
                disabled={item.kind === "facility"}
                onClick={() => item.kind !== "facility" && addObject(item.kind)}
              >
                <span className={styles.assetGlyph}>
                  <AssetIcon kind={item.kind} />
                </span>
                <span>{item.label}</span>
                <DragOutlined className={styles.dragHandle} />
              </button>
            ))}
          </div>
          <div className={styles.dragHint}>
            <span className={styles.mouseGlyph} />
            <p>Drag &amp; drop assets onto the map</p>
          </div>
        </aside>

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
            <span>
              <CompassOutlined /> Orbit
            </span>
            <span>
              <DragOutlined /> Pan
            </span>
            <span>
              <SearchOutlined /> Zoom
            </span>
            <span>
              <ControlOutlined /> Move Objects
            </span>
          </div>
        </section>

        <aside className={styles.propertiesPanel} aria-label="Properties">
          <div className={styles.panelHeader}>
            <h2>Properties</h2>
            <button type="button" aria-label="Close properties">×</button>
          </div>

          {selectedObject ? (
            <>
              <div className={styles.selectedSummary}>
                <span className={styles.summaryIcon}>
                  <AssetIcon kind={selectedObject.kind} />
                </span>
                <div>
                  <strong>{selectedObject.label.toUpperCase()}</strong>
                  <span>
                    <i /> Active
                  </span>
                </div>
              </div>

              <div className={styles.actionStrip}>
                <IconButton label="Edit asset">
                  <EditOutlined />
                </IconButton>
                <IconButton label="Duplicate asset" onClick={duplicateSelected}>
                  <CopyOutlined />
                </IconButton>
                <IconButton label="Delete asset" onClick={deleteSelected}>
                  <DeleteOutlined />
                </IconButton>
              </div>

              <div className={styles.propertyGroup}>
                <h3>Overview</h3>
                <PropertyRow label="Type" value={kindLabel[selectedObject.kind]} />
                <PropertyRow
                  label="Status"
                  value={
                    <span className={styles.online}>
                      <i /> Active
                    </span>
                  }
                />
                <PropertyRow label="Scenario" value={scenarioLabels[scenario]} />
              </div>

              <div className={styles.propertyGroup}>
                <h3>Coverage</h3>
                <PropertyRow label="Coverage Radius" value={`${Math.round(selectedObject.radius * 22)} m`} />
                <PropertyRow label="Detection Zones" value={selectedObject.zones} />
              </div>

              <div className={styles.propertyGroup}>
                <h3>Position</h3>
                <PropertyRow label="Elevation" value={`${selectedObject.elevation} m`} />
                <PropertyRow label="Relative Height" value={selectedObject.elevation > 16 ? "Medium" : "Low"} />
              </div>

              <div className={styles.propertyGroup}>
                <h3>Assignment</h3>
                <PropertyRow label="Control Post" value={selectedObject.assignment} />
                <PropertyRow label="Network" value="Grid Alpha" />
              </div>

              <div className={styles.propertyGroup}>
                <h3>System</h3>
                <PropertyRow
                  label="Power"
                  value={
                    <span className={styles.online}>
                      <i /> Normal
                    </span>
                  }
                />
                <PropertyRow
                  label="Link Status"
                  value={
                    <span className={styles.online}>
                      <i /> Stable
                    </span>
                  }
                />
              </div>

              <button className={styles.performanceButton} type="button">
                <RadarChartOutlined /> View Performance
              </button>
            </>
          ) : (
            <p className={styles.emptyState}>Select an object on the map to inspect its configuration.</p>
          )}
        </aside>
      </section>

      <footer className={styles.statusBar}>
        <button className={styles.scenarioCrumb} type="button" onClick={() => applyScenario(scenario)}>
          <span>Scenario:</span>
          <strong>{scenarioLabels[scenario]}</strong>
          <span>›</span>
        </button>
        <div className={styles.metric}>
          <RadarChartOutlined />
          <strong>{stats.sensorCount}</strong>
          <span>Sensors</span>
        </div>
        <div className={styles.metric}>
          <CameraOutlined />
          <strong>{stats.cameraCount}</strong>
          <span>Cameras</span>
        </div>
        <div className={styles.metric}>
          <GatewayOutlined />
          <strong>{stats.postCount}</strong>
          <span>Control Posts</span>
        </div>
        <div className={styles.metric}>
          <SafetyCertificateOutlined />
          <strong>{stats.perimeter}</strong>
          <span>Perimeter</span>
        </div>
        <div className={styles.metric}>
          <AimOutlined />
          <strong>{stats.coverage}%</strong>
          <span>Coverage</span>
        </div>
        <button className={styles.simulationButton} type="button" onClick={() => setDemoMode((prev) => !prev)}>
          <PlayCircleOutlined />
          {demoMode ? "Pause Simulation" : "Run Simulation"}
        </button>
      </footer>
    </main>
  );
}
