import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");

test("GisBoard composes visible map controls from the Fortis UI kit", () => {
  assert.match(source, /from "@\/shared\/ui\/fortis"/);
  assert.match(source, /<Select/);
  assert.match(source, /<Button/);
  assert.match(source, /<IconButton/);
  assert.match(source, /<InlineMessage/);
  assert.match(source, /<Badge/);
});

test("GisBoard no longer carries the legacy white Tailwind control cluster", () => {
  assert.doesNotMatch(source, /grid h-11 w-11 cursor-pointer place-items-center/);
  assert.doesNotMatch(source, /rounded-lg border border-white\/60 bg-white\/95/);
  assert.doesNotMatch(source, /rounded-2xl border border-white\/70 bg-white\/97/);
});
