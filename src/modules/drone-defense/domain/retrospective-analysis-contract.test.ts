import assert from "node:assert/strict";
import {
  DEFAULT_RETROSPECTIVE_PROFILE_ID,
  calculateRetrospectiveDistance,
  calculateRetrospectiveTelemetry,
  formatRetrospectiveDistance,
  formatRetrospectiveFlightTime,
  retrospectiveUavProfiles,
  type RetrospectiveEventPoints,
} from "@/modules/drone-defense/domain/retrospective-analysis";

function throwOnFail(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const detector = { x: 0, y: 0 };
const engager = { x: 30, y: 40 };
const crash = { x: 60, y: 80 };

const testChain: RetrospectiveEventPoints = {
  detected: detector,
  engaged: engager,
  crashed: crash,
};

const fixedProfile = retrospectiveUavProfiles.find((item) => item.id === "fixed-wing");
const fpvProfile = retrospectiveUavProfiles.find((item) => item.id === "fpv");

if (!fixedProfile || !fpvProfile) {
  throw new Error("Expected fixed-wing and FPV profiles to be defined");
}

const firstSegment = calculateRetrospectiveDistance(detector, engager);
const secondSegment = calculateRetrospectiveDistance(engager, crash);
const chain = calculateRetrospectiveTelemetry(fixedProfile.id, testChain);

assert.equal(firstSegment, 50, "distance calc should match a 3-4-5 scaled triangle");
assert.equal(secondSegment, 50, "distance calc should match second 3-4-5 segment");
assert.equal(chain.detectedToEngagedDistanceM, 50, "chain telemetry should preserve first segment");
assert.equal(chain.engagedToCrashedDistanceM, 50, "chain telemetry should preserve second segment");
assert.equal(chain.totalPathLengthM, 100, "total path length should be the sum of both segments");

const parsedTime = formatRetrospectiveFlightTime(125);
throwOnFail(parsedTime === "2 мин 5 с", `expected 125s format -> "2 мин 5 с", got ${parsedTime}`);
assert.equal(formatRetrospectiveDistance(2500), "2,5 км", "distance formatter must use km labels above 1km");
assert.equal(
  formatRetrospectiveDistance(560),
  "560 м",
  "distance formatter must keep meters under one kilometer",
);

const incompleteTelemetry = calculateRetrospectiveTelemetry(fixedProfile.id, {
  detected: detector,
  engaged: null,
  crashed: null,
});
assert.equal(incompleteTelemetry.plausibility, "incomplete", "missing one chain point must mark incomplete");

const tooLongTelemetry = calculateRetrospectiveTelemetry(fpvProfile.id, {
  detected: { x: 0, y: 0 },
  engaged: { x: 50_000, y: 0 },
  crashed: { x: 100_000, y: 0 },
});
assert.equal(tooLongTelemetry.plausibility, "range_exceeded", "distance beyond selected profile range must be outside_range");

const plausibleTelemetry = calculateRetrospectiveTelemetry(fixedProfile.id, {
  detected: { x: 0, y: 0 },
  engaged: { x: 12_000, y: 0 },
  crashed: { x: 22_000, y: 0 },
});
assert.equal(plausibleTelemetry.plausibility, "plausible", "fixed-wing profile should handle a realistic mid-range chain");

assert.equal(
  DEFAULT_RETROSPECTIVE_PROFILE_ID,
  "fpv",
  "default profile id should remain fpv",
);

console.log("retrospective-analysis-contract.test.ts: OK");
