export type LegacyObjectKind = "sensor" | "camera" | "shield" | "post" | "barrier";
export type ProtectiveObjectKind =
  | "operator_substation"
  | "scaffolding"
  | "fbs_enclosure"
  | "perimeter_barrier"
  | "cable_mesh";

export type ObjectKind = LegacyObjectKind | ProtectiveObjectKind;
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
  kind: ProtectiveObjectKind | "facility";
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
  operator_substation: "Operator Substation",
  scaffolding: "Protective Scaffolding",
  fbs_enclosure: "FBS Protection Enclosure",
  perimeter_barrier: "Perimeter FBS Cable Barrier",
  cable_mesh: "Cable Mesh Curtain Module",

  sensor: "Sensor Mast",
  camera: "Camera",
  shield: "Signal Shield",
  post: "Control Post",
  barrier: "Barrier",
};

export const kindColor: Record<ObjectKind, string> = {
  operator_substation: "#5fb3ff",
  scaffolding: "#4fc78f",
  fbs_enclosure: "#f3b14a",
  perimeter_barrier: "#ff8d5f",
  cable_mesh: "#8f9eb5",

  sensor: "#4cc8ff",
  camera: "#5cc7f5",
  shield: "#f4c24e",
  post: "#9cc9e5",
  barrier: "#d8b16c",
};

export const assetCatalog: AssetCatalogItem[] = [
  { kind: "operator_substation", label: "Operator Substation", tone: "cyan" },
  { kind: "scaffolding", label: "Protective Scaffolding", tone: "green" },
  { kind: "fbs_enclosure", label: "FBS Enclosure", tone: "amber" },
  { kind: "perimeter_barrier", label: "Perimeter Barrier", tone: "orange" },
  { kind: "cable_mesh", label: "Cable Mesh Curtain", tone: "steel" },
];

export const scenarioPresets: Record<ScenarioId, SceneObject[]> = {
  baseline: [
    {
      id: "operator-substation-01",
      kind: "operator_substation",
      label: "Operator Substation 01",
      position: [0, 0, 0],
      radius: 5.2,
      elevation: 12,
      zones: 1,
      assignment: "Central Grid",
    },
  ],
  perimeter: [
    { id: "perimeter-barrier-01", kind: "perimeter_barrier", label: "Perimeter Barrier 01", position: [-11, 0, -7], radius: 6.2, elevation: 8, zones: 2, assignment: "West Fence" },
    { id: "perimeter-barrier-02", kind: "perimeter_barrier", label: "Perimeter Barrier 02", position: [11, 0, -7], radius: 6.2, elevation: 8, zones: 2, assignment: "East Fence" },
    { id: "perimeter-barrier-03", kind: "perimeter_barrier", label: "Perimeter Barrier 03", position: [-11, 0, 7], radius: 6.2, elevation: 8, zones: 2, assignment: "West Fence" },
    { id: "perimeter-barrier-04", kind: "perimeter_barrier", label: "Perimeter Barrier 04", position: [11, 0, 7], radius: 6.2, elevation: 8, zones: 2, assignment: "East Fence" },
    { id: "cable-mesh-01", kind: "cable_mesh", label: "Cable Mesh Curtain 01", position: [-1, 0, 8], radius: 4.6, elevation: 10, zones: 1, assignment: "South Fence" },
  ],
  assets: [
    { id: "operator-substation-core", kind: "operator_substation", label: "Operator Substation Core", position: [-3, 0, -2], radius: 5.8, elevation: 12, zones: 2, assignment: "Control Core" },
    { id: "scaffolding-core", kind: "scaffolding", label: "Scaffolding Core", position: [3, 0, -2.5], radius: 5.4, elevation: 11, zones: 2, assignment: "Process Core" },
    { id: "fbs-enclosure-core", kind: "fbs_enclosure", label: "FBS Enclosure Core", position: [0, 0, 3], radius: 5.2, elevation: 9, zones: 1, assignment: "Critical Bay" },
  ],
  night: [
    { id: "operator-substation-night", kind: "operator_substation", label: "Operator Substation Night", position: [-7, 0, -4], radius: 5.4, elevation: 12, zones: 1, assignment: "North Post" },
    { id: "scaffolding-night", kind: "scaffolding", label: "Scaffolding Night", position: [6.5, 0, -1.8], radius: 5.1, elevation: 10, zones: 1, assignment: "East Post" },
    { id: "fbs-enclosure-night", kind: "fbs_enclosure", label: "FBS Enclosure Night", position: [1.5, 0, 6], radius: 5.3, elevation: 9, zones: 1, assignment: "South Post" },
    { id: "cable-mesh-night", kind: "cable_mesh", label: "Cable Mesh Night", position: [-8.5, 0, 2], radius: 4.8, elevation: 10, zones: 1, assignment: "West Gate" },
  ],
};

export function cloneScenario(id: ScenarioId) {
  return scenarioPresets[id].map((item) => ({ ...item }));
}

export function snapToGrid(value: number, step = 0.5) {
  return Math.round(value / step) * step;
}
