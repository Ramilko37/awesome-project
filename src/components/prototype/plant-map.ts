import mapJson from "./data/typical-chemical-plant-map.json";

type Tuple2 = [number, number];
type Tuple3 = [number, number, number];

type RawObject = {
  id: string;
  name: string;
  type: string;
  modelKey: string;
  layer: string;
  zoneId: string;
  position: number[];
  rotation: number[];
  scale: number[];
  dimensions?: Record<string, number>;
  status?: string;
  selectable?: boolean;
};

type RawConnection = {
  id: string;
  name: string;
  type: string;
  layer: string;
  fromObjectId?: string;
  toObjectId?: string;
  points: number[][];
  diameter?: number;
  width?: number;
  status?: string;
  selectable?: boolean;
};

type RawZone = {
  id: string;
  name: string;
  layer: string;
  polygon: number[][];
  color: string;
  opacity: number;
};

type RawSite = {
  dimensions: {
    width: number;
    depth: number;
  };
  ground: {
    material?: {
      color?: string;
      roughness?: number;
    };
  };
  perimeter: {
    points: number[][];
    height: number;
  };
};

export type PlantMapObject = {
  id: string;
  name: string;
  type: string;
  modelKey: string;
  layer: string;
  zoneId: string;
  position: Tuple3;
  rotation: Tuple3;
  scale: Tuple3;
  dimensions: Record<string, number>;
  status: string;
  selectable: boolean;
};

export type PlantMapConnection = {
  id: string;
  name: string;
  type: string;
  layer: string;
  fromObjectId?: string;
  toObjectId?: string;
  points: Tuple3[];
  diameter?: number;
  width?: number;
  status: string;
  selectable: boolean;
};

export type PlantZone = {
  id: string;
  name: string;
  layer: string;
  polygon: Tuple2[];
  color: string;
  opacity: number;
};

type PlantSite = {
  width: number;
  depth: number;
  groundColor: string;
  groundRoughness: number;
  perimeterPoints: Tuple2[];
  fenceHeight: number;
};

type PlantMapShape = {
  site: RawSite;
  zones: RawZone[];
  objects: RawObject[];
  connections: RawConnection[];
};

function toTuple2(value: number[]): Tuple2 {
  return [value[0] ?? 0, value[1] ?? 0];
}

function toTuple3(value: number[]): Tuple3 {
  return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
}

const typedMap = mapJson as unknown as PlantMapShape;

export const plantSite: PlantSite = {
  width: typedMap.site.dimensions.width,
  depth: typedMap.site.dimensions.depth,
  groundColor: typedMap.site.ground.material?.color ?? "#D8D3C4",
  groundRoughness: typedMap.site.ground.material?.roughness ?? 0.95,
  perimeterPoints: typedMap.site.perimeter.points.map(toTuple2),
  fenceHeight: typedMap.site.perimeter.height,
};

export const plantZones: PlantZone[] = typedMap.zones.map((zone) => ({
  id: zone.id,
  name: zone.name,
  layer: zone.layer,
  polygon: zone.polygon.map(toTuple2),
  color: zone.color,
  opacity: zone.opacity,
}));

export const defaultPlantMapObjects: PlantMapObject[] = typedMap.objects.map((item) => ({
  id: item.id,
  name: item.name,
  type: item.type,
  modelKey: item.modelKey,
  layer: item.layer,
  zoneId: item.zoneId,
  position: toTuple3(item.position),
  rotation: toTuple3(item.rotation),
  scale: toTuple3(item.scale),
  dimensions: item.dimensions ?? {},
  status: item.status ?? "ready",
  selectable: item.selectable ?? true,
}));

export const defaultPlantConnections: PlantMapConnection[] = typedMap.connections.map((connection) => ({
  id: connection.id,
  name: connection.name,
  type: connection.type,
  layer: connection.layer,
  fromObjectId: connection.fromObjectId,
  toObjectId: connection.toObjectId,
  points: connection.points.map(toTuple3),
  diameter: connection.diameter,
  width: connection.width,
  status: connection.status ?? "ready",
  selectable: connection.selectable ?? true,
}));
