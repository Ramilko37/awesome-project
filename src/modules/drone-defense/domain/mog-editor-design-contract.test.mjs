import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const editorSource = readFileSync("src/modules/drone-defense/ui/mog-composition-editor.tsx", "utf8");
const stylesSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.module.css", "utf8");

for (const className of [
  "mogEditorWrap",
  "mogEditorCard",
  "mogEditorHeader",
  "mogEditorHero",
  "mogEditorMetricGrid",
  "mogEditorSection",
  "mogEditorWeaponCard",
  "mogEditorCostCard",
  "mogEditorFooter",
]) {
  assert(editorSource.includes(`styles.${className}`), `МОГ editor must render the new design class ${className}`);
  assert(stylesSource.includes(`.${className}`), `МОГ editor CSS must define .${className}`);
}

assert(!editorSource.includes("styles.prototypeDrawerWrap"), "МОГ editor must not use the generic drawer wrapper");
assert(!editorSource.includes("styles.prototypeDrawer}"), "МОГ editor must not use the generic drawer shell");
assert(editorSource.includes("Мобильная огневая группа"), "МОГ editor header must expose the full card title");
assert(editorSource.includes("Боевой состав"), "МОГ editor must group personnel/equipment controls in the new card language");

console.log("mog-editor-design-contract.test.mjs: МОГ settings card uses the new prototype design");
