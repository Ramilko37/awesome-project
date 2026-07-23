import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("coordinate placement uses Fortis form and feedback components", () => {
  const source = readFileSync(
    "src/modules/drone-defense/ui/coordinate-placement-panel.tsx",
    "utf8",
  );

  assert.match(source, /<Input/);
  assert.match(source, /<Textarea/);
  assert.match(source, /<InlineMessage/);
  assert.match(source, /<Button/);
  assert.doesNotMatch(source, /<input/);
  assert.doesNotMatch(source, /<textarea/);
});

test("layer geometry wizard uses Fortis controls", () => {
  const source = readFileSync(
    "src/modules/drone-defense/ui/drone-defense-prototype.tsx",
    "utf8",
  );
  const wizard = source.slice(source.indexOf("function LayerGeometryWizard"));

  assert.match(wizard, /<Input/);
  assert.match(wizard, /<Select/);
  assert.match(wizard, /<Button/);
  assert.doesNotMatch(wizard, /<input/);
  assert.doesNotMatch(wizard, /<select/);
});

test("MOG editor uses Fortis form, feedback and action components", () => {
  const source = readFileSync(
    "src/modules/drone-defense/ui/mog-composition-editor.tsx",
    "utf8",
  );

  assert.match(source, /<Input/);
  assert.match(source, /<Select/);
  assert.match(source, /<Checkbox/);
  assert.match(source, /<InlineMessage/);
  assert.match(source, /<Button/);
  assert.doesNotMatch(source, /from "lucide-react"/);
});
