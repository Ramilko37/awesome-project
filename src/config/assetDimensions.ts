export const DEFAULT_ASSET_DIMENSIONS = {
  protected_column_apparatus: {
    width: 8,
    depth: 8,
    height: 35,
    description: "Колонный аппарат с защитным каркасом",
  },
  operator_substation_protected: {
    width: 15,
    depth: 9,
    height: 7,
    description: "Операторная / подстанция с защитой",
  },
  protective_scaffolding_with_equipment: {
    width: 10,
    depth: 10,
    height: 25,
    description: "Защитные строительные леса вокруг оборудования",
  },
  fbs_protection_enclosure: {
    width: 12,
    depth: 6,
    height: 5,
    description: "ФБС-защита / бетонное защитное ограждение",
  },
  perimeter_fbs_cable_barrier_module: {
    width: 6,
    depth: 1,
    height: 6,
    description: "Модуль периметральной линии ФБС + тросы",
  },
  cable_mesh_curtain_module: {
    width: 5,
    depth: 0.3,
    height: 5,
    description: "Модуль сетки / тросовой завесы",
  },
} as const;

export const REALISTIC_ASSET_SIZE_RANGES = {
  protected_column_apparatus: {
    widthRange: [6, 12],
    depthRange: [6, 12],
    heightRange: [20, 65],
    note: "Колонные аппараты часто бывают 15-60 м высотой, защита обычно выше аппарата на 2-5 м.",
  },
  operator_substation_protected: {
    widthRange: [8, 50],
    depthRange: [4, 20],
    heightRange: [5, 8],
    note: "Малые подстанции могут быть 6-12 x 3-6 м, крупные операторные - до 50 x 20 м.",
  },
  protective_scaffolding_with_equipment: {
    widthRange: [4, 20],
    depthRange: [4, 20],
    heightRange: [8, 60],
    note: "Размер лесов зависит от защищаемого оборудования.",
  },
  fbs_protection_enclosure: {
    widthRange: [6, 30],
    depthRange: [3, 15],
    heightRange: [3, 8],
    note: "Бетонные блоки обычно 1.2-2.4 м высотой, вместе со стойками и сеткой - 4-8 м.",
  },
  perimeter_fbs_cable_barrier_module: {
    widthRange: [3, 10],
    depthRange: [0.6, 2],
    heightRange: [4, 10],
    note: "Один пролет между стойками обычно 3-6 м, но модуль можно растягивать.",
  },
  cable_mesh_curtain_module: {
    widthRange: [3, 6],
    depthRange: [0.1, 0.6],
    heightRange: [3, 10],
    note: "Сетка почти плоская, глубина нужна только для удобства рендера и коллизий.",
  },
} as const;

export type AssetType = keyof typeof DEFAULT_ASSET_DIMENSIONS;

export type AssetDimensions = {
  width: number;
  depth: number;
  height: number;
  description: string;
};

export type AssetSizeRange = {
  widthRange: readonly [number, number];
  depthRange: readonly [number, number];
  heightRange: readonly [number, number];
  note: string;
};

export function getAssetDimensions(assetType: AssetType): AssetDimensions {
  return DEFAULT_ASSET_DIMENSIONS[assetType];
}

export function isAssetType(value: string): value is AssetType {
  return value in DEFAULT_ASSET_DIMENSIONS;
}

export function getAssetDimensionsSafe(assetType: string): AssetDimensions | null {
  if (!isAssetType(assetType)) {
    return null;
  }

  return DEFAULT_ASSET_DIMENSIONS[assetType];
}
