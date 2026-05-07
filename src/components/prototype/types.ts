export type ObjectKind = "sensor" | "camera" | "shield" | "post" | "barrier";
export type ScenarioId = "baseline" | "perimeter" | "assets" | "night";

export type SceneObject = {
  id: string;
  kind: ObjectKind;
  label: string;
  position: [number, number, number];
  radius: number;
  elevation: number;
  zones: number;
  assignment: string;
};

export type AssetCatalogItem = {
  kind: ObjectKind | "facility";
  label: string;
  tone: string;
};

export const scenarioLabels: Record<ScenarioId, string> = {
  baseline: "Baseline",
  perimeter: "Reinforced Perimeter",
  assets: "Critical Assets",
  night: "Night Mode",
};

export const kindLabel: Record<ObjectKind, string> = {
  sensor: "Sensor Mast",
  camera: "Camera",
  shield: "Signal Shield",
  post: "Control Post",
  barrier: "Barrier",
};

export const kindColor: Record<ObjectKind, string> = {
  sensor: "#4cc8ff",
  camera: "#5cc7f5",
  shield: "#f4c24e",
  post: "#9cc9e5",
  barrier: "#d8b16c",
};

export const assetCatalog: AssetCatalogItem[] = [
  { kind: "facility", label: "Industrial Facility", tone: "facility" },
  { kind: "sensor", label: "Sensor", tone: "cyan" },
  { kind: "camera", label: "Camera", tone: "cyan" },
  { kind: "shield", label: "Signal Shield", tone: "amber" },
  { kind: "post", label: "Control Post", tone: "steel" },
  { kind: "barrier", label: "Barrier", tone: "amber" },
];

export const scenarioPresets: Record<ScenarioId, SceneObject[]> = {
  baseline: [
    { id: "sensor-07", kind: "sensor", label: "Sensor Mast 07", position: [-7.4, 0, -3.8], radius: 4.8, elevation: 18, zones: 2, assignment: "North Post" },
    { id: "sensor-02", kind: "sensor", label: "Sensor Mast 02", position: [7.8, 0, -3.2], radius: 4.5, elevation: 17, zones: 2, assignment: "East Post" },
    { id: "sensor-11", kind: "sensor", label: "Sensor Mast 11", position: [1.2, 0, 6.3], radius: 5.2, elevation: 20, zones: 3, assignment: "South Post" },
    { id: "camera-04", kind: "camera", label: "Camera 04", position: [-9.6, 0, 2.5], radius: 4.2, elevation: 10, zones: 1, assignment: "Gate Alpha" },
    { id: "camera-09", kind: "camera", label: "Camera 09", position: [5.1, 0, 1.4], radius: 4.6, elevation: 12, zones: 1, assignment: "Inner Yard" },
    { id: "shield-03", kind: "shield", label: "Signal Shield 03", position: [-2.1, 0, -2.2], radius: 5.6, elevation: 6, zones: 2, assignment: "Process Core" },
    { id: "post-01", kind: "post", label: "Control Post 01", position: [-10.2, 0, -6.5], radius: 2.2, elevation: 14, zones: 1, assignment: "North Post" },
    { id: "post-04", kind: "post", label: "Control Post 04", position: [9.8, 0, 5.9], radius: 2.2, elevation: 14, zones: 1, assignment: "Grid Alpha" },
  ],
  perimeter: [
    { id: "sensor-01", kind: "sensor", label: "Sensor Mast 01", position: [-9.6, 0, -5.2], radius: 5.3, elevation: 19, zones: 2, assignment: "West Fence" },
    { id: "sensor-02", kind: "sensor", label: "Sensor Mast 02", position: [9.2, 0, -5.4], radius: 5.3, elevation: 19, zones: 2, assignment: "East Fence" },
    { id: "sensor-03", kind: "sensor", label: "Sensor Mast 03", position: [-9.2, 0, 5.5], radius: 5.3, elevation: 19, zones: 2, assignment: "West Fence" },
    { id: "sensor-04", kind: "sensor", label: "Sensor Mast 04", position: [9.4, 0, 5.3], radius: 5.3, elevation: 19, zones: 2, assignment: "East Fence" },
    { id: "camera-01", kind: "camera", label: "Camera 01", position: [-5.4, 0, 1.1], radius: 4.2, elevation: 11, zones: 1, assignment: "Inner Yard" },
    { id: "camera-02", kind: "camera", label: "Camera 02", position: [4.8, 0, -0.3], radius: 4.2, elevation: 11, zones: 1, assignment: "Inner Yard" },
    { id: "shield-01", kind: "shield", label: "Signal Shield 01", position: [0, 0, 5.8], radius: 5.8, elevation: 7, zones: 2, assignment: "South Yard" },
  ],
  assets: [
    { id: "sensor-core", kind: "sensor", label: "Sensor Mast Core", position: [-2.4, 0, -2.5], radius: 6.2, elevation: 21, zones: 3, assignment: "Process Core" },
    { id: "sensor-tank", kind: "sensor", label: "Sensor Mast Tank", position: [4.8, 0, -3.8], radius: 5.6, elevation: 20, zones: 3, assignment: "Tank Farm" },
    { id: "camera-core", kind: "camera", label: "Camera Core", position: [-5, 0, 1.5], radius: 4.4, elevation: 12, zones: 1, assignment: "Critical Bay" },
    { id: "shield-core", kind: "shield", label: "Signal Shield Core", position: [0.8, 0, -0.6], radius: 6.2, elevation: 7, zones: 3, assignment: "Critical Bay" },
    { id: "post-core", kind: "post", label: "Control Post Core", position: [7.7, 0, 4.1], radius: 2.2, elevation: 14, zones: 1, assignment: "Grid Alpha" },
  ],
  night: [
    { id: "sensor-night-n", kind: "sensor", label: "Sensor Mast Night N", position: [-6.8, 0, -4.2], radius: 5.5, elevation: 19, zones: 3, assignment: "North Post" },
    { id: "sensor-night-e", kind: "sensor", label: "Sensor Mast Night E", position: [8.3, 0, -1.8], radius: 5.4, elevation: 18, zones: 2, assignment: "East Post" },
    { id: "sensor-night-s", kind: "sensor", label: "Sensor Mast Night S", position: [1.1, 0, 6.1], radius: 5.8, elevation: 20, zones: 3, assignment: "South Post" },
    { id: "camera-night-1", kind: "camera", label: "Camera Night 01", position: [-9.4, 0, 1.9], radius: 4.5, elevation: 12, zones: 1, assignment: "West Gate" },
    { id: "camera-night-2", kind: "camera", label: "Camera Night 02", position: [5.5, 0, 2.2], radius: 4.5, elevation: 12, zones: 1, assignment: "Truck Bay" },
    { id: "shield-night", kind: "shield", label: "Signal Shield Night", position: [-1, 0, -1], radius: 6.1, elevation: 8, zones: 3, assignment: "Process Core" },
  ],
};

export function cloneScenario(id: ScenarioId) {
  return scenarioPresets[id].map((item) => ({ ...item }));
}

export function snapToGrid(value: number, step = 0.5) {
  return Math.round(value / step) * step;
}
