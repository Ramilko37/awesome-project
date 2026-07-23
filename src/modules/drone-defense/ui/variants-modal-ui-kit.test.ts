import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync("src/modules/drone-defense/ui/variants-modal.tsx", "utf8");

test("Variants modal uses Fortis overlays, states and form controls", () => {
  assert.doesNotMatch(source, /from "antd"/);
  assert.doesNotMatch(source, /@ant-design\/icons/);
  assert.match(source, /<Modal/);
  assert.match(source, /<Input/);
  assert.match(source, /<LoadingState/);
  assert.match(source, /<EmptyState/);
  assert.match(source, /<Tag/);
});
