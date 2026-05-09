"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getAssetDimensions, type AssetType } from "@/config/assetDimensions";

type ScaleMode = "exact" | "uniformByHeight";
type UpAxis = "Y" | "Z";

type ScaledGlbModelProps = {
  url: string;
  assetType: AssetType;
  targetDimensions?: {
    width: number;
    depth: number;
    height: number;
  };
  upAxis?: UpAxis;
  position?: [number, number, number];
  rotation?: [number, number, number];
  modelRotation?: [number, number, number];
  scaleMode?: ScaleMode;
  showBounds?: boolean;
  ghost?: boolean;
};

const EPSILON = 1e-5;

export function getUpAxisCorrection(upAxis?: "Y" | "Z"): [number, number, number] {
  if (upAxis === "Z") return [-Math.PI / 2, 0, 0];
  return [0, 0, 0];
}

export function ScaledGlbModel({
  url,
  assetType,
  targetDimensions,
  upAxis = "Y",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  modelRotation = [0, 0, 0],
  scaleMode = "exact",
  showBounds = false,
  ghost = false,
}: ScaledGlbModelProps) {
  const gltf = useGLTF(url);
  const defaults = getAssetDimensions(assetType);
  const dimensions = targetDimensions ?? defaults;

  const scaledModel = useMemo(() => {
    if (!gltf?.scene) return null;
    const cloned = gltf.scene.clone(true);
    cloned.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (!node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((mat) => {
        const material = mat as THREE.MeshStandardMaterial;

        if (material.map) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          if (
            material.color &&
            Math.max(material.color.r, material.color.g, material.color.b) < 0.05
          ) {
            material.color.setRGB(1, 1, 1);
          }
          material.map.needsUpdate = true;
        }

        if (material.transparent || material.alphaMap) {
          material.transparent = true;
          material.alphaTest = Math.max(material.alphaTest ?? 0, 0.08);
          material.side = THREE.DoubleSide;
          material.depthWrite = false;
        }

        material.needsUpdate = true;
      });
    });

    const [corrX, corrY, corrZ] = getUpAxisCorrection(upAxis);
    const [mrX, mrY, mrZ] = modelRotation;
    const correctionQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(corrX, corrY, corrZ, "XYZ"),
    );
    const modelQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(mrX, mrY, mrZ, "XYZ"),
    );
    cloned.quaternion.copy(correctionQuaternion).multiply(modelQuaternion);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    if (size.x < EPSILON || size.y < EPSILON || size.z < EPSILON) {
      return null;
    }

    const center = box.getCenter(new THREE.Vector3());
    const minY = box.min.y;
    cloned.position.x -= center.x;
    cloned.position.z -= center.z;
    cloned.position.y -= minY;

    if (ghost) {
      cloned.traverse((node) => {
        if (!(node instanceof THREE.Mesh) || !node.material) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        const tuned = materials.map((mat) => {
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
            next.emissiveIntensity = 0.42;
          }
          return next;
        });
        node.material = Array.isArray(node.material) ? tuned : tuned[0];
      });
    }

    let modelScale: [number, number, number];
    if (scaleMode === "uniformByHeight") {
      const uniformScale = dimensions.height / size.y;
      modelScale = [uniformScale, uniformScale, uniformScale];
    } else {
      modelScale = [
        dimensions.width / size.x,
        dimensions.height / size.y,
        dimensions.depth / size.z,
      ];
    }

    return {
      model: cloned,
      scale: modelScale,
    };
  }, [dimensions.depth, dimensions.height, dimensions.width, ghost, gltf, modelRotation, scaleMode, upAxis]);

  if (!gltf?.scene || !scaledModel) {
    return (
      <group position={position} rotation={rotation}>
        <mesh position={[0, dimensions.height / 2, 0]}>
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshStandardMaterial color="#93a4bc" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      {showBounds ? (
        <mesh position={[0, dimensions.height / 2, 0]}>
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshBasicMaterial color="#00AEEF" wireframe transparent opacity={0.25} />
        </mesh>
      ) : null}
      <primitive object={scaledModel.model} scale={scaledModel.scale} />
    </group>
  );
}
