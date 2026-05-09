"use client";

import { Suspense, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { Grid, Line, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  plantSite,
  plantZones,
  type PlantMapConnection,
  type PlantMapObject,
} from "./plant-map";
import { kindColor, snapToGrid, type ObjectKind, type SceneObject } from "./types";
import styles from "./drone-defense-prototype.module.css";

const levelPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function zoneShape(points: [number, number][]) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  return shape;
}

function dimensionsFor(item: PlantMapObject) {
  const dims = item.dimensions;
  const width = dims.width ?? dims.length ?? dims.protectedWidth ?? dims.diameter ?? 12;
  const depth = dims.depth ?? dims.protectedDepth ?? dims.width ?? dims.diameter ?? 12;
  const height = dims.height ?? Math.max(4, (dims.diameter ?? 10) * 0.7);
  const length = dims.length ?? dims.width ?? dims.depth ?? 20;
  const diameter = dims.diameter ?? Math.min(width, depth);
  return { width, depth, height, length, diameter };
}

function FenceFromPerimeter() {
  const [a, b, c, d] = plantSite.perimeterPoints;
  const fenceHeight = plantSite.fenceHeight;
  const segments = [
    { pos: [(a[0] + b[0]) / 2, 0, a[1]], size: [Math.abs(b[0] - a[0]), fenceHeight, 0.35] as [number, number, number] },
    { pos: [(d[0] + c[0]) / 2, 0, d[1]], size: [Math.abs(c[0] - d[0]), fenceHeight, 0.35] as [number, number, number] },
    { pos: [a[0], 0, (a[1] + d[1]) / 2], size: [0.35, fenceHeight, Math.abs(d[1] - a[1])] as [number, number, number] },
    { pos: [b[0], 0, (b[1] + c[1]) / 2], size: [0.35, fenceHeight, Math.abs(c[1] - b[1])] as [number, number, number] },
  ];

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh key={index} position={[segment.pos[0], fenceHeight / 2, segment.pos[2]]}>
          <boxGeometry args={segment.size} />
          <meshStandardMaterial color="#8793a2" metalness={0.18} roughness={0.58} />
        </mesh>
      ))}
    </group>
  );
}

function BuildingBlock({ width, depth, height, color }: { width: number; depth: number; height: number; color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.72} metalness={0.12} />
      </mesh>
      <mesh position={[0, height + 0.18, 0]}>
        <boxGeometry args={[width * 1.04, 0.32, depth * 1.03]} />
        <meshStandardMaterial color="#c0c8d4" roughness={0.86} metalness={0.04} />
      </mesh>
    </group>
  );
}

function RailUnit({ length }: { length: number }) {
  const sleeperCount = Math.max(10, Math.floor(length / 3.4));
  return (
    <group>
      <mesh position={[0, 0.16, -1]}>
        <boxGeometry args={[length, 0.1, 0.12]} />
        <meshStandardMaterial color="#6a7382" metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.16, 1]}>
        <boxGeometry args={[length, 0.1, 0.12]} />
        <meshStandardMaterial color="#6a7382" metalness={0.45} roughness={0.42} />
      </mesh>
      {Array.from({ length: sleeperCount }).map((_, idx) => {
        const x = -length / 2 + (idx / Math.max(1, sleeperCount - 1)) * length;
        return (
          <mesh key={idx} position={[x, 0.08, 0]}>
            <boxGeometry args={[0.28, 0.08, 2.6]} />
            <meshStandardMaterial color="#8f8a82" roughness={0.86} />
          </mesh>
        );
      })}
    </group>
  );
}

function PipeRackUnit({ length, width, height }: { length: number; width: number; height: number }) {
  const postCount = Math.max(3, Math.floor(length / 16));
  return (
    <group>
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[length, 0.3, width]} />
        <meshStandardMaterial color="#8792a3" metalness={0.24} roughness={0.52} />
      </mesh>
      {Array.from({ length: postCount }).map((_, idx) => {
        const x = -length / 2 + (idx / Math.max(1, postCount - 1)) * length;
        return (
          <group key={idx} position={[x, 0, 0]}>
            <mesh position={[0, height / 2, -width / 2 + 0.45]}>
              <boxGeometry args={[0.45, height, 0.45]} />
              <meshStandardMaterial color="#758194" metalness={0.2} roughness={0.56} />
            </mesh>
            <mesh position={[0, height / 2, width / 2 - 0.45]}>
              <boxGeometry args={[0.45, height, 0.45]} />
              <meshStandardMaterial color="#758194" metalness={0.2} roughness={0.56} />
            </mesh>
          </group>
        );
      })}
      {[-1.2, 0, 1.2].map((zOffset) => (
        <mesh key={zOffset} position={[0, height + 0.45, zOffset]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, length, 12]} />
          <meshStandardMaterial color="#666f7d" metalness={0.36} roughness={0.46} />
        </mesh>
      ))}
    </group>
  );
}

function PlantObjectMesh({ item }: { item: PlantMapObject }) {
  const { width, depth, height, length, diameter } = dimensionsFor(item);

  if (item.type === "road") {
    return (
      <mesh receiveShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[width, 0.06, depth]} />
        <meshStandardMaterial color="#a7b1bf" roughness={0.95} />
      </mesh>
    );
  }

  if (item.type === "railway") {
    return <RailUnit length={length} />;
  }

  if (item.type === "parking_area") {
    return (
      <mesh receiveShadow position={[0, 0.045, 0]}>
        <boxGeometry args={[width, 0.03, depth]} />
        <meshStandardMaterial color="#bbc3cf" roughness={0.95} />
      </mesh>
    );
  }

  if (item.type === "tank" || item.type === "tank_protected") {
    const radius = diameter / 2;
    return (
      <group>
        <mesh castShadow position={[0, height / 2, 0]}>
          <cylinderGeometry args={[radius, radius * 1.02, height, 18]} />
          <meshStandardMaterial color="#9aa3b1" metalness={0.2} roughness={0.56} />
        </mesh>
        <mesh position={[0, height + 0.2, 0]}>
          <cylinderGeometry args={[radius * 1.03, radius * 1.03, 0.3, 18]} />
          <meshStandardMaterial color="#c4ccd8" />
        </mesh>
        {item.type === "tank_protected" ? (
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[width, height + 1.2, depth]} />
            <meshStandardMaterial color="#66707f" transparent opacity={0.11} />
          </mesh>
        ) : null}
      </group>
    );
  }

  if (item.type === "protected_column") {
    return (
      <group>
        <mesh castShadow position={[0, height / 2, 0]}>
          <cylinderGeometry args={[diameter * 0.25, diameter * 0.32, height, 14]} />
          <meshStandardMaterial color="#8f99a8" metalness={0.25} roughness={0.55} />
        </mesh>
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[width, height + 0.8, depth]} />
          <meshStandardMaterial color="#636d7a" transparent opacity={0.1} />
        </mesh>
      </group>
    );
  }

  if (item.type === "protected_column_group") {
    return (
      <group>
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => [x, z] as const)).map(([gx, gz], idx) => (
          <mesh key={idx} castShadow position={[gx * width * 0.22, height * 0.45, gz * depth * 0.2]}>
            <cylinderGeometry args={[2.2, 2.5, height * 0.9, 12]} />
            <meshStandardMaterial color="#8f9aa9" metalness={0.2} roughness={0.56} />
          </mesh>
        ))}
        <mesh position={[0, height * 0.45, 0]}>
          <boxGeometry args={[width, height * 0.92, depth]} />
          <meshStandardMaterial color="#616a77" transparent opacity={0.1} />
        </mesh>
      </group>
    );
  }

  if (item.type === "reactor_unit") {
    return (
      <group>
        <mesh castShadow position={[0, height * 0.45, 0]}>
          <cylinderGeometry args={[width * 0.22, width * 0.26, height * 0.9, 14]} />
          <meshStandardMaterial color="#909aa8" metalness={0.25} roughness={0.55} />
        </mesh>
        <mesh castShadow position={[-width * 0.28, height * 0.35, 0]}>
          <boxGeometry args={[width * 0.26, height * 0.7, depth * 0.4]} />
          <meshStandardMaterial color="#a4aebb" />
        </mesh>
        <mesh castShadow position={[width * 0.28, height * 0.32, 0]}>
          <boxGeometry args={[width * 0.26, height * 0.64, depth * 0.4]} />
          <meshStandardMaterial color="#a4aebb" />
        </mesh>
      </group>
    );
  }

  if (item.type === "pipe_rack") {
    return <PipeRackUnit length={length} width={width} height={height} />;
  }

  if (item.type === "mesh_screen") {
    const postCount = Math.max(3, Math.floor(width / 8));
    return (
      <group>
        <mesh position={[0, height / 2, 0]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color="#6f7887" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: postCount }).map((_, idx) => {
          const x = -width / 2 + (idx / Math.max(1, postCount - 1)) * width;
          return (
            <mesh key={idx} position={[x, height / 2, 0]}>
              <boxGeometry args={[0.35, height, 0.35]} />
              <meshStandardMaterial color="#7d8796" />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (item.type === "fbs_barrier") {
    const blockLength = 2.4;
    const count = Math.max(2, Math.floor(length / blockLength));
    return (
      <group>
        {Array.from({ length: count }).map((_, idx) => {
          const x = -length / 2 + blockLength * 0.5 + idx * blockLength;
          return (
            <mesh key={idx} position={[x, height * 0.5, 0]}>
              <boxGeometry args={[blockLength - 0.1, height, 1.8]} />
              <meshStandardMaterial color="#acb4c0" roughness={0.86} />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (item.type === "scaffold_protection") {
    return (
      <group>
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color="#777f8c" transparent opacity={0.14} />
        </mesh>
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[width * 0.82, height * 0.7, depth * 0.82]} />
          <meshStandardMaterial color="#9ea8b5" />
        </mesh>
      </group>
    );
  }

  if (
    item.type === "checkpoint" ||
    item.type === "building" ||
    item.type === "operator_station" ||
    item.type === "pump_station" ||
    item.type === "compressor_station" ||
    item.type === "electrical_substation" ||
    item.type === "water_treatment" ||
    item.type === "warehouse" ||
    item.type === "loading_station"
  ) {
    return <BuildingBlock width={width} depth={depth} height={height} color="#9ca6b3" />;
  }

  return (
    <mesh castShadow position={[0, height / 2, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color="#9ca6b3" />
    </mesh>
  );
}

function PlantObjectUnit({
  item,
  onSelect,
}: {
  item: PlantMapObject;
  onSelect: () => void;
}) {
  return (
    <group
      position={item.position}
      rotation={item.rotation}
      scale={item.scale}
      onPointerOver={() => {
        if (item.selectable) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
      onClick={(event) => {
        if (!item.selectable) return;
        event.stopPropagation();
        onSelect();
      }}
    >
      <PlantObjectMesh item={item} />
    </group>
  );
}

function PipelineConnection({ item }: { item: PlantMapConnection }) {
  const path = useMemo(
    () => item.points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    [item.points],
  );
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path), [path]);
  const radius = item.diameter ? Math.max(0.08, item.diameter * 0.5) : 0.12;
  return (
    <mesh>
      <tubeGeometry args={[curve, 64, radius, 12, false]} />
      <meshStandardMaterial color="#6c7480" metalness={0.42} roughness={0.48} />
    </mesh>
  );
}

function RouteConnection({ item, color }: { item: PlantMapConnection; color: string }) {
  return (
    <Line
      points={item.points}
      color={color}
      lineWidth={2}
      dashed={item.type !== "route"}
      dashScale={3}
      dashSize={0.6}
      gapSize={0.45}
      transparent
      opacity={0.7}
    />
  );
}

function Coverage({ item, selected }: { item: SceneObject; selected: boolean }) {
  const color = item.kind === "fbs_enclosure" || item.kind === "perimeter_barrier" ? "#f7b84a" : "#42bfff";
  const coverageScale = 1.22;
  return (
    <group position={item.position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[item.radius * 0.78 * coverageScale, item.radius * coverageScale, 72]} />
        <meshBasicMaterial color={selected ? "#00b6ff" : color} transparent opacity={0.52} />
      </mesh>
    </group>
  );
}

function ProtectiveAssetModel({
  kind,
  selected,
  ghost = false,
}: {
  kind: SceneObject["kind"];
  selected: boolean;
  ghost?: boolean;
}) {
  const operatorSubstation = useGLTF("/models/protective/operator_substation_protected.glb");
  const scaffolding = useGLTF("/models/protective/protective_scaffolding_with_equipment.glb");
  const fbsEnclosure = useGLTF("/models/protective/fbs_protection_enclosure.glb");
  const perimeterBarrier = useGLTF("/models/protective/perimeter_fbs_cable_barrier.glb");
  const cableMesh = useGLTF("/models/protective/cable_mesh_curtain_module.glb");

  const config = useMemo(() => {
    const legacy = {
      scene: null,
      scale: 2.2,
      y: 0.8,
    };

    if (kind === "operator_substation") {
      return { scene: operatorSubstation.scene, scale: 1.55 };
    }
    if (kind === "scaffolding") {
      return { scene: scaffolding.scene, scale: 1.65 };
    }
    if (kind === "fbs_enclosure") {
      return { scene: fbsEnclosure.scene, scale: 1.48 };
    }
    if (kind === "perimeter_barrier") {
      return { scene: perimeterBarrier.scene, scale: 1.6 };
    }
    if (kind === "cable_mesh") {
      return { scene: cableMesh.scene, scale: 1.52 };
    }

    return legacy;
  }, [cableMesh.scene, fbsEnclosure.scene, kind, operatorSubstation.scene, perimeterBarrier.scene, scaffolding.scene]);

  const rotatedModel = useMemo(() => {
    if (!config.scene) return null;
    const model = config.scene.clone(true);
    // All supplied GLB assets are Z-up, rotate once to Y-up for three.js scenes.
    model.rotation.set(-Math.PI / 2, 0, 0);
    if (ghost) {
      model.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (!mesh.material) return;
        const material = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const tuned = material.map((mat) => {
          const next = mat.clone() as THREE.Material & {
            transparent?: boolean;
            opacity?: number;
            depthWrite?: boolean;
            emissive?: THREE.Color;
            emissiveIntensity?: number;
          };
          next.transparent = true;
          next.opacity = 0.35;
          next.depthWrite = false;
          if ("emissive" in next && next.emissive) {
            next.emissive = new THREE.Color("#00b6ff");
            next.emissiveIntensity = 0.45;
          }
          return next;
        });
        mesh.material = Array.isArray(mesh.material) ? tuned : tuned[0];
      });
    }
    return model;
  }, [config.scene, ghost]);

  if (!config.scene) {
    return (
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.35, 0.42, 2.4, 10]} />
        <meshStandardMaterial
          color="#5abdf4"
          emissive={selected ? "#22aef5" : "#0b3e5a"}
          emissiveIntensity={selected ? 0.55 : 0.2}
          metalness={0.28}
          roughness={0.38}
        />
      </mesh>
    );
  }

  if (!rotatedModel) {
    return null;
  }

  return (
    <primitive
      object={rotatedModel}
      scale={config.scale}
      position={[0, 0, 0]}
    />
  );
}

function PlacementPreview({
  kind,
  point,
}: {
  kind: ObjectKind;
  point: [number, number, number];
}) {
  return (
    <group position={point}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.05, 2.4, 48]} />
        <meshBasicMaterial color="#00b6ff" transparent opacity={0.6} />
      </mesh>
      <ProtectiveAssetModel kind={kind} selected={false} ghost />
    </group>
  );
}

function SceneUnit({
  item,
  selected,
  onSelect,
  onMove,
  onDragStart,
  onDragEnd,
  placementActive,
}: {
  item: SceneObject;
  selected: boolean;
  onSelect: () => void;
  onMove: (id: string, x: number, z: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  placementActive: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const markerScale = 2.9;
  const markerInnerRadius = 0.85 * markerScale;
  const markerOuterRadius = (selected ? 1.02 : 0.95) * markerScale;

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setDragging(true);
    onDragStart();
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
    onDragEnd();
    (event.target as Element).releasePointerCapture(event.pointerId);
  };

  return (
    <group
      position={item.position}
      onPointerOver={() => {
        document.body.style.cursor = placementActive ? "crosshair" : "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
      onPointerDown={placementActive ? undefined : handlePointerDown}
      onPointerMove={placementActive ? undefined : handlePointerMove}
      onPointerUp={placementActive ? undefined : handlePointerUp}
      onClick={
        placementActive
          ? undefined
          : (event) => {
              event.stopPropagation();
              onSelect();
            }
      }
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[markerInnerRadius, markerOuterRadius, 56]} />
        <meshBasicMaterial color={selected ? "#00b6ff" : kindColor[item.kind]} transparent opacity={0.88} />
      </mesh>
      <ProtectiveAssetModel kind={item.kind} selected={selected} />
    </group>
  );
}

function DroneSwarm({ enabled }: { enabled: boolean }) {
  const gltf = useGLTF("/models/chaklun-v2-drone.glb");
  const drones = useMemo(
    () =>
      [
        {
          id: "drone-track-01",
          from: new THREE.Vector3(-180, 26, -72),
          to: new THREE.Vector3(180, 26, -72),
          altitude: 26,
          phase: 0,
        },
        {
          id: "drone-track-02",
          from: new THREE.Vector3(-180, 29, -18),
          to: new THREE.Vector3(180, 29, -18),
          altitude: 29,
          phase: 0.33,
        },
        {
          id: "drone-track-03",
          from: new THREE.Vector3(-180, 24, 44),
          to: new THREE.Vector3(180, 24, 44),
          altitude: 24,
          phase: 0.66,
        },
      ].map((track) => ({ ...track, model: gltf.scene.clone(true) })),
    [gltf.scene],
  );
  const refs = useRef<Array<THREE.Group | null>>([]);

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.getElapsedTime();
    drones.forEach((drone, index) => {
      const node = refs.current[index];
      if (!node) return;
      const speed = 0.055 + index * 0.008;
      const progress = (t * speed + drone.phase) % 1;
      const next = drone.from.clone().lerp(drone.to, progress);
      next.y = drone.altitude;
      node.position.copy(next);

      const dir = drone.to.clone().sub(drone.from).normalize();
      // Meshy model local forward axis correction to keep nose aligned with motion.
      const headingOffset = Math.PI / 2;
      const yaw = Math.atan2(dir.x, dir.z);
      node.rotation.set(0, yaw + headingOffset, 0);
    });
  });

  if (!enabled) return null;

  return (
    <group>
      {drones.map((drone) => (
        <Line
          key={`${drone.id}-path`}
          points={[drone.from.toArray(), drone.to.toArray()]}
          color="#50bfff"
          lineWidth={1.2}
          dashed
          dashScale={3}
          dashSize={0.5}
          gapSize={0.35}
          transparent
          opacity={0.45}
        />
      ))}
      {drones.map((drone, index) => (
        <group key={drone.id} ref={(node) => { refs.current[index] = node; }} scale={4.8}>
          <primitive object={drone.model} />
        </group>
      ))}
    </group>
  );
}

function CameraClamp({
  orbitRef,
  minHeight = 36,
}: {
  orbitRef: RefObject<{ target: THREE.Vector3 } | null>;
  minHeight?: number;
}) {
  useFrame(({ camera }) => {
    if (!orbitRef.current) return;
    orbitRef.current.target.y = 0;
    if (camera.position.y < minHeight) {
      camera.position.y = minHeight;
    }
  });

  return null;
}

export function PrototypeScene({
  objects,
  plantObjects,
  plantConnections,
  selectedId,
  setSelectedId,
  updateObjectPosition,
  demoMode,
  theme,
  placingKind,
  placementPoint,
  onPlacementMove,
  onPlacePending,
  onCancelPlacement,
}: {
  objects: SceneObject[];
  plantObjects: PlantMapObject[];
  plantConnections: PlantMapConnection[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateObjectPosition: (id: string, x: number, z: number) => void;
  demoMode: boolean;
  theme: "light" | "dark";
  placingKind: ObjectKind | null;
  placementPoint: [number, number, number];
  onPlacementMove: (x: number, z: number) => void;
  onPlacePending: () => void;
  onCancelPlacement: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orbitRef = useRef<any>(null);
  const mapHalfX = plantSite.width / 2 + 40;
  const mapHalfZ = plantSite.depth / 2 + 40;
  const mapHalf = Math.max(mapHalfX, mapHalfZ);
  const showZoneOverlay = false;
  const isDark = theme === "dark";
  const sceneBackground = isDark ? "#0b1218" : "#f4f8ff";
  const fogColor = isDark ? "#0b1218" : "#f4f8ff";
  const gridCellColor = isDark ? "#4f89d5" : "#2f7dd3";
  const gridSectionColor = isDark ? "#79a8e2" : "#1f5fa6";
  const groundColor = isDark ? "#213140" : plantSite.groundColor;

  const handleDragStart = () => {
    if (orbitRef.current) orbitRef.current.enabled = false;
  };

  const handleDragEnd = () => {
    if (orbitRef.current) orbitRef.current.enabled = true;
  };

  const handlePlacementMove = (event: ThreeEvent<PointerEvent>) => {
    if (!placingKind) return;
    const intersection = new THREE.Vector3();
    if (event.ray.intersectPlane(levelPlane, intersection)) {
      onPlacementMove(snapToGrid(intersection.x), snapToGrid(intersection.z));
    }
  };

  return (
    <Canvas
      shadows
      gl={{ antialias: true, logarithmicDepthBuffer: true }}
      camera={{ position: [260, 185, 260], fov: 38, near: 0.1, far: 2600 }}
      onPointerMissed={() => setSelectedId(null)}
      className={styles.canvas}
    >
      <color attach="background" args={[sceneBackground]} />
      <fog attach="fog" args={[fogColor, 520, 1700]} />
      <ambientLight intensity={isDark ? 0.62 : demoMode ? 0.9 : 0.82} />
      <directionalLight
        castShadow
        intensity={isDark ? 1.15 : 1.45}
        position={[160, 220, 120]}
        color="#ffffff"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]} receiveShadow>
        <planeGeometry args={[plantSite.width, plantSite.depth]} />
        <meshStandardMaterial color={groundColor} roughness={plantSite.groundRoughness} metalness={0.02} />
      </mesh>
      <Grid
        args={[mapHalf * 2, mapHalf * 2]}
        position={[0, -0.06, 0]}
        cellSize={2}
        cellThickness={0.28}
        cellColor={gridCellColor}
        sectionSize={20}
        sectionThickness={0.7}
        sectionColor={gridSectionColor}
        fadeDistance={100000}
        fadeStrength={0}
      />
      {placingKind ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.08, 0]}
          onPointerMove={handlePlacementMove}
          onClick={(event) => {
            event.stopPropagation();
            onPlacePending();
          }}
          onContextMenu={(event) => {
            event.stopPropagation();
            onCancelPlacement();
          }}
        >
          <planeGeometry args={[mapHalf * 2, mapHalf * 2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {showZoneOverlay
        ? plantZones.map((zone) => (
            <mesh key={zone.id} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <shapeGeometry args={[zoneShape(zone.polygon)]} />
              <meshBasicMaterial
                color={zone.color}
                transparent
                opacity={Math.min(0.08, zone.opacity)}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={2}
                polygonOffsetUnits={2}
              />
            </mesh>
          ))
        : null}

      <FenceFromPerimeter />

      {plantObjects.map((item) => (
        <PlantObjectUnit
          key={item.id}
          item={item}
          onSelect={() => setSelectedId(item.id)}
        />
      ))}

      {plantConnections.map((item) => {
        if (item.type === "pipeline") return <PipelineConnection key={item.id} item={item} />;
        if (item.type === "route") return <RouteConnection key={item.id} item={item} color="#7d8797" />;
        return <RouteConnection key={item.id} item={item} color="#8e99aa" />;
      })}

      <Suspense fallback={null}>
        <DroneSwarm enabled={demoMode} />
      </Suspense>

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
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          placementActive={Boolean(placingKind)}
        />
      ))}
      {placingKind ? <PlacementPreview kind={placingKind} point={placementPoint} /> : null}

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableRotate={false}
        enablePan
        screenSpacePanning={false}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI * 0.34}
        minPolarAngle={Math.PI * 0.34}
        minDistance={190}
        maxDistance={560}
      />
      <CameraClamp orbitRef={orbitRef} minHeight={36} />
    </Canvas>
  );
}

useGLTF.preload("/models/chaklun-v2-drone.glb");
useGLTF.preload("/models/protective/operator_substation_protected.glb");
useGLTF.preload("/models/protective/protective_scaffolding_with_equipment.glb");
useGLTF.preload("/models/protective/fbs_protection_enclosure.glb");
useGLTF.preload("/models/protective/perimeter_fbs_cable_barrier.glb");
useGLTF.preload("/models/protective/cable_mesh_curtain_module.glb");
