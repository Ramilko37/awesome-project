import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync("src/modules/drone-defense/ui/defense-studio-shell.tsx", "utf8");

test("Defense Studio shell uses the Fortis navigation and overlay contract", () => {
  assert.doesNotMatch(source, /@ant-design\/icons/);
  assert.match(source, /navigation\.back/);
  assert.match(source, /navigation\.map/);
  assert.match(source, /navigation\.calculator/);
  assert.match(source, /navigation\.scenario/);
  assert.match(source, /navigation\.analysis/);
  assert.match(source, /<Drawer/);
  assert.match(source, /fortis-studio-shell/);
});

test("Defense Studio keeps the existing shareable GIS and scenario routes", () => {
  assert.match(source, /href="\/prototype"/);
  assert.match(source, /href="\/prototype\?view=scenario-modeling"/);
  assert.match(source, /navigate\("gis"\)/);
  assert.match(source, /navigate\("drilldown"\)/);
});
