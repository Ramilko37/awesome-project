"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, ContactShadows, Grid, OrbitControls, useGLTF } from "@react-three/drei";
import { Box, Check, Cuboid, Download, Gauge, Maximize2, Rotate3D, Ruler, Shield } from "lucide-react";
import { withBasePath } from "@/shared/lib/base-path";
import styles from "./model-library-page.module.css";

type ModelAsset = {
  id: string;
  name: string;
  subtitle: string;
  src: string;
  format: string;
  size: string;
  category: string;
  scaleHint: string;
  description: string;
  tags: string[];
};

const modelAssets: ModelAsset[] = [
  {
    id: "fixed-wing-uav",
    name: "Fixed-wing UAV",
    subtitle: "Silver reconnaissance drone",
    src: withBasePath("/models/fixed-wing-uav-reference.glb"),
    format: "GLB",
    size: "249 KB",
    category: "Airframe",
    scaleHint: "Approx. 6 m wingspan",
    description:
      "Procedural model generated from the photo reference: satin silver fuselage, long tapered wings, rear pusher propeller, V-tail and tricycle landing gear.",
    tags: ["UAV", "Pusher prop", "Landing gear", "V-tail"],
  },
  {
    id: "silent-sky-scout",
    name: "Silent Sky Scout",
    subtitle: "Meshy textured recon UAV",
    src: withBasePath("/models/meshy-silent-sky-scout.glb"),
    format: "GLB",
    size: "32 MB",
    category: "Airframe",
    scaleHint: "As exported from Meshy",
    description:
      "Textured GLB generated in Meshy AI. This variant is heavier and higher detail, intended for close preview and material checks.",
    tags: ["Meshy", "Textured", "Recon", "UAV"],
  },
];

function ModelPrimitive({ src }: { src: string }) {
  const gltf = useGLTF(src);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return (
    <Center top position={[0, -1.05, 0]}>
      <primitive object={scene} rotation={[0, -Math.PI / 8, 0]} scale={1.25} />
    </Center>
  );
}

function ModelCanvas({ model }: { model: ModelAsset }) {
  return (
    <Canvas camera={{ position: [6, 3.2, 7], fov: 38 }} shadows className={styles.canvas}>
      <color attach="background" args={["#081016"]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[5, 7, 5]}
        intensity={2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight position={[-5, 4, -4]} angle={0.55} intensity={1.3} color="#56d7ff" />
      <Suspense fallback={null}>
        <ModelPrimitive src={model.src} />
      </Suspense>
      <Grid
        args={[12, 12]}
        position={[0, -1.21, 0]}
        cellSize={0.4}
        cellThickness={0.45}
        cellColor="#1f4b5a"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#4ecfff"
        fadeDistance={18}
        fadeStrength={1.3}
      />
      <ContactShadows position={[0, -1.18, 0]} opacity={0.4} scale={7} blur={2.2} />
      <OrbitControls makeDefault enableDamping minDistance={2.6} maxDistance={16} />
    </Canvas>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export function ModelLibraryPage() {
  const [selectedId, setSelectedId] = useState(modelAssets[0].id);
  const selectedModel = useMemo(
    () => modelAssets.find((model) => model.id === selectedId) ?? modelAssets[0],
    [selectedId],
  );

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar} aria-label="Model library">
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Shield size={20} />
          </span>
          <div>
            <strong>FORTIS Models</strong>
            <small>GLB Asset Viewer</small>
          </div>
        </div>

        <div className={styles.sidebarHeader}>
          <span>Library</span>
          <strong>{modelAssets.length}</strong>
        </div>

        <div className={styles.tiles}>
          {modelAssets.map((model) => {
            const active = model.id === selectedModel.id;
            return (
              <button
                key={model.id}
                type="button"
                className={active ? styles.activeTile : styles.tile}
                onClick={() => setSelectedId(model.id)}
                aria-pressed={active}
              >
                <span className={styles.tilePreview}>
                  <Cuboid size={24} />
                </span>
                <span className={styles.tileText}>
                  <strong>{model.name}</strong>
                  <small>{model.subtitle}</small>
                </span>
                {active ? <Check size={18} className={styles.checkIcon} /> : null}
              </button>
            );
          })}
        </div>
      </aside>

      <section className={styles.viewerShell}>
        <header className={styles.topbar}>
          <div>
            <p>Selected model</p>
            <h1>{selectedModel.name}</h1>
          </div>
          <a className={styles.downloadButton} href={selectedModel.src} download>
            <Download size={18} />
            Download GLB
          </a>
        </header>

        <section className={styles.stage} aria-label={`${selectedModel.name} 3D preview`}>
          <ModelCanvas model={selectedModel} />
          <div className={styles.stageHud}>
            <span>
              <Rotate3D size={16} /> Orbit
            </span>
            <span>
              <Maximize2 size={16} /> Zoom
            </span>
            <span>
              <Box size={16} /> GLB
            </span>
          </div>
        </section>

        <section className={styles.details}>
          <div className={styles.descriptionCard}>
            <h2>Model notes</h2>
            <p>{selectedModel.description}</p>
            <div className={styles.tags}>
              {selectedModel.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className={styles.statsGrid}>
            <Stat icon={<Box size={18} />} label="Format" value={selectedModel.format} />
            <Stat icon={<Gauge size={18} />} label="File size" value={selectedModel.size} />
            <Stat icon={<Cuboid size={18} />} label="Category" value={selectedModel.category} />
            <Stat icon={<Ruler size={18} />} label="Scale hint" value={selectedModel.scaleHint} />
          </div>
        </section>
      </section>
    </main>
  );
}

modelAssets.forEach((asset) => {
  useGLTF.preload(asset.src);
});
