import type { Coordinates } from "@/shared/types/defense-project";

const earthRadiusM = 6_371_000;

function radians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function measurePathMeters(points: Coordinates[]) {
  return points.slice(1).reduce((sum, point, index) => {
    const previous = points[index];
    const latitudeDelta = radians(point.lat - previous.lat);
    const longitudeDelta = radians(point.lng - previous.lng);
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(previous.lat)) *
        Math.cos(radians(point.lat)) *
        Math.sin(longitudeDelta / 2) ** 2;
    return sum + earthRadiusM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }, 0);
}

export function formatMeasuredDistance(meters: number) {
  if (meters < 1_000) return `${Math.round(meters).toLocaleString("ru-RU")} м`;
  return `${(meters / 1_000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} км`;
}
