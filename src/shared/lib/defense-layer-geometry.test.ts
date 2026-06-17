// Run: npx tsx src/shared/lib/defense-layer-geometry.test.ts

import {
  getPolygonArea,
  hasSelfIntersections,
  isPointInPolygon,
  isValidPolygon,
} from "@/shared/lib/defense-layer-geometry";
import type { Coordinates } from "@/shared/types/defense-project";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const square: Coordinates[] = [
  { lat: 55, lng: 37 },
  { lat: 55, lng: 37.01 },
  { lat: 55.01, lng: 37.01 },
  { lat: 55.01, lng: 37 },
];

assert(isPointInPolygon({ lat: 55.005, lng: 37.005 }, square), "point inside polygon must be accepted");
assert(!isPointInPolygon({ lat: 55.02, lng: 37.005 }, square), "point outside polygon must be rejected");
assert(isPointInPolygon({ lat: 55, lng: 37.005 }, square), "point on polygon boundary must be accepted");

assert(!isValidPolygon(square.slice(0, 2)), "polygon with 2 points must be invalid");
assert(isValidPolygon(square), "polygon with 3+ non-intersecting points must be valid");
assert(getPolygonArea(square) > 0, "non-degenerate polygon must have positive area");

const selfIntersecting: Coordinates[] = [
  { lat: 55, lng: 37 },
  { lat: 55.01, lng: 37.01 },
  { lat: 55, lng: 37.01 },
  { lat: 55.01, lng: 37 },
];
assert(hasSelfIntersections(selfIntersecting), "bow-tie polygon must report self-intersection");
assert(!isValidPolygon(selfIntersecting), "self-intersecting polygon must be invalid");

const zeroArea: Coordinates[] = [
  { lat: 55, lng: 37 },
  { lat: 55.005, lng: 37.005 },
  { lat: 55.01, lng: 37.01 },
];
assert(getPolygonArea(zeroArea) === 0, "collinear polygon must have zero area");
assert(!isValidPolygon(zeroArea), "zero-area polygon must be invalid");

console.log("defense-layer-geometry.test.ts: OK");
