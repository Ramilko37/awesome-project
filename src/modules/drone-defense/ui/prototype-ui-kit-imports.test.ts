import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");

test("2D prototype composition does not import Ant controls or icons", () => {
  assert.doesNotMatch(source, /from "antd"/);
  assert.doesNotMatch(source, /@ant-design\/icons/);
});

test("2D prototype composes Fortis actions, menus and confirmation modal", () => {
  assert.match(source, /DropdownMenu/);
  assert.match(source, /IconButton/);
  assert.match(source, /<Search/);
  assert.match(source, /<Modal/);
  assert.match(source, /variant="danger"/);
  assert.doesNotMatch(source, /<input[\s\S]{0,160}placeholder="Найти средство/);
});
