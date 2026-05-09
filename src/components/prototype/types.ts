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
  baseline: "Базовый",
  perimeter: "Усиленный периметр",
  assets: "Критические объекты",
  night: "Ночной режим",
};

export const kindLabel: Record<ObjectKind, string> = {
  operator_substation: "Операторная / подстанция",
  scaffolding: "Защитные строительные леса",
  fbs_enclosure: "ФБС-защита",
  perimeter_barrier: "Периметральная ФБС-линия",
  cable_mesh: "Сеточная тросовая завеса",

  sensor: "Сенсорная мачта",
  camera: "Камера",
  shield: "Защитный купол",
  post: "Пост управления",
  barrier: "Барьер",
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
  { kind: "operator_substation", label: "Операторная / подстанция", tone: "cyan" },
  { kind: "scaffolding", label: "Защитные леса", tone: "green" },
  { kind: "fbs_enclosure", label: "ФБС-защита", tone: "amber" },
  { kind: "perimeter_barrier", label: "Периметральный барьер", tone: "orange" },
  { kind: "cable_mesh", label: "Сеточная завеса", tone: "steel" },
];

export const scenarioPresets: Record<ScenarioId, SceneObject[]> = {
  baseline: [],
  perimeter: [],
  assets: [],
  night: [],
};

export function cloneScenario(id: ScenarioId) {
  return scenarioPresets[id].map((item) => ({ ...item }));
}

export function snapToGrid(value: number, step = 0.5) {
  return Math.round(value / step) * step;
}
