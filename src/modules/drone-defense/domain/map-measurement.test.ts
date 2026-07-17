import assert from "node:assert/strict";
import { formatMeasuredDistance, measurePathMeters } from "./map-measurement";

assert.equal(measurePathMeters([]), 0);
assert.equal(measurePathMeters([{ lat: 55, lng: 37 }]), 0);

const oneKm = measurePathMeters([
  { lat: 55, lng: 37 },
  { lat: 55.00899, lng: 37 },
]);
assert(oneKm > 990 && oneKm < 1010, `expected about 1 km, got ${oneKm}`);

assert.equal(formatMeasuredDistance(0), "0 м");
assert.equal(formatMeasuredDistance(850), "850 м");
assert.equal(formatMeasuredDistance(1250), "1,25 км");

console.log("map-measurement.test.ts: geometry and formatting passed");
