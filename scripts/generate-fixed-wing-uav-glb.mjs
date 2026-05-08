import { writeFile, mkdir } from "node:fs/promises";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const OUTPUT_PATH = "public/models/fixed-wing-uav-reference.glb";

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const scene = new THREE.Scene();
scene.name = "Fixed Wing UAV Reference";

const silver = new THREE.MeshStandardMaterial({
  name: "satin silver airframe",
  color: "#bfc7cb",
  metalness: 0.55,
  roughness: 0.32,
});

const darkSilver = new THREE.MeshStandardMaterial({
  name: "dark landing gear metal",
  color: "#2f3438",
  metalness: 0.5,
  roughness: 0.42,
});

const black = new THREE.MeshStandardMaterial({
  name: "matte black propeller and tires",
  color: "#0b0c0e",
  metalness: 0.08,
  roughness: 0.7,
});

const glass = new THREE.MeshStandardMaterial({
  name: "dark sensor glass",
  color: "#05070a",
  metalness: 0.15,
  roughness: 0.18,
});

const amber = new THREE.MeshStandardMaterial({
  name: "small amber nose light",
  color: "#e0c949",
  emissive: "#b99518",
  emissiveIntensity: 0.45,
  roughness: 0.28,
});

const red = new THREE.MeshStandardMaterial({
  name: "red service marker",
  color: "#d9442f",
  roughness: 0.45,
});

function addMesh(name, geometry, material, transform = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  if (transform.position) mesh.position.set(...transform.position);
  if (transform.rotation) mesh.rotation.set(...transform.rotation);
  if (transform.scale) mesh.scale.set(...transform.scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function makeTaperedWing(span, rootChord, tipChord, thickness, sweep = 0.15) {
  const half = span / 2;
  const yTop = thickness / 2;
  const yBottom = -thickness / 2;
  const vertices = [
    0, yTop, -rootChord / 2,
    0, yTop, rootChord / 2,
    half, yTop, sweep - tipChord / 2,
    half, yTop, sweep + tipChord / 2,
    0, yBottom, -rootChord / 2,
    0, yBottom, rootChord / 2,
    half, yBottom, sweep - tipChord / 2,
    half, yBottom, sweep + tipChord / 2,
  ];
  const indices = [
    0, 1, 2, 1, 3, 2,
    4, 6, 5, 5, 6, 7,
    0, 2, 4, 2, 6, 4,
    1, 5, 3, 3, 5, 7,
    2, 3, 6, 3, 7, 6,
    0, 4, 1, 1, 4, 5,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addWheel(name, x, y, z, radius = 0.22) {
  addMesh(`${name} tire`, new THREE.TorusGeometry(radius, 0.065, 12, 28), black, {
    position: [x, y, z],
    rotation: [Math.PI / 2, 0, 0],
  });
  addMesh(`${name} hub`, new THREE.CylinderGeometry(radius * 0.42, radius * 0.42, 0.06, 20), silver, {
    position: [x, y, z],
    rotation: [Math.PI / 2, 0, 0],
  });
}

function addStrut(name, start, end, radius = 0.035) {
  const direction = new THREE.Vector3().subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start));
  const length = direction.length();
  const midpoint = new THREE.Vector3(...start).addScaledVector(direction, 0.5);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), darkSilver);
  mesh.name = name;
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  scene.add(mesh);
}

// Long satin fuselage: a cylinder core, rounded nose, and tapered aft section.
addMesh("rounded nose", new THREE.SphereGeometry(0.64, 48, 24), silver, {
  position: [0, 0.45, -2.05],
  scale: [0.86, 0.72, 1.28],
});
addMesh("main fuselage barrel", new THREE.CylinderGeometry(0.6, 0.68, 3.1, 48), silver, {
  position: [0, 0.47, -0.38],
  rotation: [Math.PI / 2, 0, 0],
  scale: [1.02, 0.92, 1],
});
addMesh("tapered rear fuselage", new THREE.CylinderGeometry(0.34, 0.6, 1.45, 48), silver, {
  position: [0, 0.45, 1.9],
  rotation: [Math.PI / 2, 0, 0],
});

// Slightly raised upper fairing visible on the reference aircraft.
addMesh("upper dorsal fairing", new THREE.SphereGeometry(0.48, 32, 16), silver, {
  position: [0, 0.86, -0.55],
  scale: [0.9, 0.34, 1.85],
});
addMesh("small top antenna", new THREE.CylinderGeometry(0.025, 0.025, 0.22, 10), black, {
  position: [0.18, 1.2, -0.2],
});

// Main high-aspect-ratio wings.
const leftWing = addMesh("left long tapered wing", makeTaperedWing(5.6, 0.82, 0.32, 0.07, -0.18), silver, {
  position: [0.42, 0.47, 0.12],
  rotation: [0, -0.04, 0.02],
});
leftWing.userData.note = "Mirrored from centerline; long straight wing from the photo reference.";
const rightWing = addMesh("right long tapered wing", makeTaperedWing(5.6, 0.82, 0.32, 0.07, -0.18), silver, {
  position: [-0.42, 0.47, 0.12],
  rotation: [0, Math.PI + 0.04, -0.02],
});
rightWing.userData.note = "Mirrored from centerline; long straight wing from the photo reference.";

// Tail boom, horizontal stabilizers, and angled V-tail fins.
addMesh("rear tail boom", new THREE.CylinderGeometry(0.09, 0.14, 2.05, 18), silver, {
  position: [0, 0.54, 2.85],
  rotation: [Math.PI / 2, 0, 0],
});
addMesh("left tail plane", makeTaperedWing(1.25, 0.45, 0.22, 0.045, 0.08), silver, {
  position: [0.25, 0.58, 3.72],
  rotation: [0, -0.02, 0.02],
});
addMesh("right tail plane", makeTaperedWing(1.25, 0.45, 0.22, 0.045, 0.08), silver, {
  position: [-0.25, 0.58, 3.72],
  rotation: [0, Math.PI + 0.02, -0.02],
});
addMesh("left angled tail fin", makeTaperedWing(0.92, 0.42, 0.18, 0.04, 0.06), silver, {
  position: [0.26, 0.82, 3.25],
  rotation: [0.42, -0.25, -0.88],
});
addMesh("right angled tail fin", makeTaperedWing(0.92, 0.42, 0.18, 0.04, 0.06), silver, {
  position: [-0.26, 0.82, 3.25],
  rotation: [0.42, Math.PI + 0.25, 0.88],
});

// Rear pusher propeller with black blades.
addMesh("rear propeller spinner", new THREE.CylinderGeometry(0.18, 0.24, 0.28, 24), black, {
  position: [0, 0.52, 2.58],
  rotation: [Math.PI / 2, 0, 0],
});
for (let index = 0; index < 2; index += 1) {
  addMesh(`black propeller blade ${index + 1}`, new THREE.BoxGeometry(0.18, 0.055, 1.2), black, {
    position: [0, 0.52, 2.42],
    rotation: [0, 0, index * Math.PI + 0.7],
  });
}

// Nose sensors, marker lights, and small details.
addMesh("left black nose intake", new THREE.CylinderGeometry(0.13, 0.13, 0.045, 24), glass, {
  position: [-0.33, 0.5, -2.72],
  rotation: [Math.PI / 2, 0, 0],
});
addMesh("right black nose intake", new THREE.CylinderGeometry(0.13, 0.13, 0.045, 24), glass, {
  position: [0.33, 0.5, -2.72],
  rotation: [Math.PI / 2, 0, 0],
});
addMesh("small nose probe", new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8), darkSilver, {
  position: [0, 0.43, -2.92],
  rotation: [Math.PI / 2, 0, 0],
});
addMesh("amber nose light", new THREE.SphereGeometry(0.07, 16, 8), amber, {
  position: [0.32, 0.3, -2.63],
});
addMesh("red side service marker", new THREE.BoxGeometry(0.045, 0.12, 0.09), red, {
  position: [0.62, 0.48, -0.72],
});

// Tricycle landing gear.
addStrut("left main landing strut", [-0.72, 0.1, -0.05], [-1.04, -0.78, 0.45], 0.04);
addStrut("right main landing strut", [0.72, 0.1, -0.05], [1.04, -0.78, 0.45], 0.04);
addStrut("nose landing strut", [0, 0.04, -2.05], [0, -0.86, -2.13], 0.035);
addWheel("left main wheel", -1.04, -0.86, 0.45, 0.22);
addWheel("right main wheel", 1.04, -0.86, 0.45, 0.22);
addWheel("front nose wheel", 0, -0.96, -2.13, 0.2);

// A subtle shadow-catching reference base, useful when previewing the GLB.
const base = addMesh("thin display shadow base", new THREE.CylinderGeometry(3.6, 3.6, 0.015, 96), new THREE.MeshStandardMaterial({
  name: "transparent preview base",
  color: "#111111",
  transparent: true,
  opacity: 0.12,
  roughness: 0.9,
}), {
  position: [0, -1.2, 0.25],
});
base.userData.removable = true;

scene.userData = {
  source: "Generated from user-provided photo reference",
  description: "Approximate fixed-wing UAV GLB: satin silver fuselage, long wings, rear pusher propeller, V-tail, tricycle landing gear.",
};

const exporter = new GLTFExporter();
const arrayBuffer = await exporter.parseAsync(scene, { binary: true });
await mkdir("public/models", { recursive: true });
await writeFile(OUTPUT_PATH, Buffer.from(arrayBuffer));
console.log(`Wrote ${OUTPUT_PATH}`);
