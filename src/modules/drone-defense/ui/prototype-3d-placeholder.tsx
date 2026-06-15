"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";

function PlannedModelPreview() {
  const groupRef = useRef<Group | null>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.28;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.04;
  });

  return (
    <group ref={groupRef} rotation={[0.18, -0.45, 0]}>
      <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.1, 72]} />
        <meshStandardMaterial color="#e8f0f8" roughness={0.88} metalness={0.04} />
      </mesh>
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.22, 96]} />
        <meshStandardMaterial color="#7aa7d9" roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.24, 0.92]} />
        <meshStandardMaterial color="#d9e5ef" roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh position={[-0.28, 0.12, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.72, 0.42]} />
        <meshStandardMaterial color="#f8fbfd" roughness={0.66} metalness={0.06} />
      </mesh>
      <mesh position={[0.34, 0.04, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.56, 0.5]} />
        <meshStandardMaterial color="#c6d7e8" roughness={0.7} metalness={0.07} />
      </mesh>
      <mesh position={[0.8, -0.08, -0.36]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.72, 32]} />
        <meshStandardMaterial color="#eef5fb" roughness={0.64} metalness={0.05} />
      </mesh>
      <mesh position={[0.8, 0.33, -0.36]} castShadow>
        <sphereGeometry args={[0.2, 32, 16]} />
        <meshStandardMaterial color="#2f80ed" roughness={0.42} metalness={0.16} />
      </mesh>
      <mesh position={[-0.8, -0.16, 0.48]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.2, 0.42, 32]} />
        <meshStandardMaterial color="#bdd0e2" roughness={0.72} metalness={0.06} />
      </mesh>
    </group>
  );
}

export function Prototype3DPlaceholder() {
  return (
    <section className="flex min-h-full items-center justify-center bg-[#eef3f8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex min-h-[22rem] items-center justify-center border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/60 p-4 lg:border-b-0 lg:border-r">
          <div className="relative h-[18rem] w-full max-w-[30rem] sm:h-[22rem]">
            <Canvas
              camera={{ position: [3.2, 2.35, 4.2], fov: 38 }}
              dpr={[1, 1.5]}
              shadows
              gl={{ antialias: true, alpha: true }}
            >
              <ambientLight intensity={0.78} />
              <directionalLight position={[3.5, 4, 3]} intensity={1.35} castShadow />
              <pointLight position={[-3, 2.5, -2]} intensity={0.42} color="#7dd3fc" />
              <PlannedModelPreview />
            </Canvas>
            <div className="pointer-events-none absolute inset-x-10 bottom-8 h-8 rounded-full bg-slate-900/10 blur-xl" />
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
          <p className="font-mono text-[11px] font-semibold uppercase text-blue-600">
            3D-модель Fortis
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Раздел в разработке
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            3D-модель объекта будет доступна в следующих версиях Fortis. Сейчас основной рабочий контур — 2D GIS-конструктор.
          </p>
          <div className="mt-7 grid gap-4 border-t border-slate-200 pt-5 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-900">Текущий фокус</p>
              <p className="mt-1 leading-6">Карта, эшелоны, размещение объектов и расчёт конфигурации.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Следующий этап</p>
              <p className="mt-1 leading-6">Единое 3D-представление той же цифровой модели защиты.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
