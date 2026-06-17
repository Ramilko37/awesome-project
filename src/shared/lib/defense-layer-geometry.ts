import type { Coordinates, LayerGeometry } from "@/shared/types/defense-project";

const earthRadiusM = 6_371_000;
const coordinateEpsilon = 1e-10;

type PolygonValidationOptions = {
  requireClosed?: boolean;
};

export function isValidCoordinate(point: Coordinates | undefined): point is Coordinates {
  return Boolean(
    point &&
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lng) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lng) <= 180,
  );
}

export function getPolygonCoordinates(geometry: LayerGeometry): Coordinates[] {
  if (geometry.type === "polygon") {
    return [...(geometry.coordinates ?? geometry.points ?? [])];
  }
  if (geometry.type === "freeform") {
    return [...geometry.points];
  }
  return [];
}

export function isPolygonClosed(geometry: LayerGeometry): boolean {
  if (geometry.type !== "polygon") return false;
  return geometry.isClosed === true;
}

function toPlanarMeters(points: Coordinates[]) {
  if (points.length === 0) return [];
  const origin = points[0];
  const meanLatRad = (points.reduce((acc, point) => acc + point.lat, 0) / points.length) * (Math.PI / 180);
  return points.map((point) => ({
    x: ((point.lng - origin.lng) * Math.PI / 180) * earthRadiusM * Math.cos(meanLatRad),
    y: ((point.lat - origin.lat) * Math.PI / 180) * earthRadiusM,
  }));
}

export function getPolygonArea(points: Coordinates[]): number {
  if (points.length < 3 || points.some((point) => !isValidCoordinate(point))) return 0;
  const projected = toPlanarMeters(points);
  const area2 = projected.reduce((acc, point, index) => {
    const next = projected[(index + 1) % projected.length];
    return acc + point.x * next.y - next.x * point.y;
  }, 0);
  const area = Math.abs(area2) / 2;
  return area < 1e-6 ? 0 : area;
}

function orientation(a: Coordinates, b: Coordinates, c: Coordinates) {
  const value = (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
  if (Math.abs(value) <= coordinateEpsilon) return 0;
  return value > 0 ? 1 : -1;
}

function isPointOnSegment(point: Coordinates, a: Coordinates, b: Coordinates) {
  if (orientation(a, b, point) !== 0) return false;
  return (
    point.lng >= Math.min(a.lng, b.lng) - coordinateEpsilon &&
    point.lng <= Math.max(a.lng, b.lng) + coordinateEpsilon &&
    point.lat >= Math.min(a.lat, b.lat) - coordinateEpsilon &&
    point.lat <= Math.max(a.lat, b.lat) + coordinateEpsilon
  );
}

function segmentsIntersect(a: Coordinates, b: Coordinates, c: Coordinates, d: Coordinates) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && isPointOnSegment(c, a, b)) return true;
  if (o2 === 0 && isPointOnSegment(d, a, b)) return true;
  if (o3 === 0 && isPointOnSegment(a, c, d)) return true;
  if (o4 === 0 && isPointOnSegment(b, c, d)) return true;
  return false;
}

export function hasSelfIntersections(points: Coordinates[]): boolean {
  if (points.length < 4) return false;
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length;
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length;
      const isAdjacent =
        first === second ||
        firstNext === second ||
        secondNext === first ||
        (first === 0 && secondNext === 0);
      if (isAdjacent) continue;
      if (segmentsIntersect(points[first], points[firstNext], points[second], points[secondNext])) {
        return true;
      }
    }
  }
  return false;
}

export function isPointInPolygon(point: Coordinates, polygon: Coordinates[]) {
  if (!isValidCoordinate(point) || polygon.length < 3 || polygon.some((item) => !isValidCoordinate(item))) {
    return false;
  }

  for (let index = 0; index < polygon.length; index += 1) {
    const nextIndex = (index + 1) % polygon.length;
    if (isPointOnSegment(point, polygon[index], polygon[nextIndex])) return true;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i];
    const previous = polygon[j];
    const intersects =
      current.lat > point.lat !== previous.lat > point.lat &&
      point.lng < ((previous.lng - current.lng) * (point.lat - current.lat)) / (previous.lat - current.lat) + current.lng;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function isValidPolygon(points: Coordinates[], options: PolygonValidationOptions = {}) {
  void options;
  if (points.length < 3) return false;
  if (points.some((point) => !isValidCoordinate(point))) return false;
  if (getPolygonArea(points) <= 0) return false;
  if (hasSelfIntersections(points)) return false;
  return true;
}
