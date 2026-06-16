import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const editorSource = readFileSync("src/modules/drone-defense/ui/mog-composition-editor.tsx", "utf8");
const stylesSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.module.css", "utf8");

assert(editorSource.includes("function MogSectorDial"), "МОГ editor must provide a visual sector dial component");
assert(editorSource.includes("handleWeaponSectorDialChange"), "МОГ editor must route dial changes into coverageSectorWidthDeg");
assert(editorSource.includes("<MogSectorDial"), "Sector field must render the visual dial next to the numeric input");
assert(
  editorSource.includes("aria-label={`Настроить сектор"),
  "Sector dial must expose an accessible label for visual sector adjustment",
);
assert(editorSource.includes("coverageSectorWidthDeg: nextValue"), "Sector dial changes must update weapon coverage sector");

for (const className of [
  ".mogSectorDial",
  ".mogSectorDialCore",
  ".mogSectorDialHandle",
  ".mogSectorInput",
]) {
  assert(stylesSource.includes(className), `Sector dial CSS must define ${className}`);
}

assert(stylesSource.includes("--mog-sector-angle"), "Sector dial CSS must render the selected sector angle");
assert(stylesSource.includes("--mog-sector-color"), "Sector dial CSS must use the weapon coverage color");

console.log("mog-sector-dial-contract.test.mjs: visual МОГ sector dial contract passed");
