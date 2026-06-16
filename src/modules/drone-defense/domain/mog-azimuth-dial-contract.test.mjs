import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const editorSource = readFileSync("src/modules/drone-defense/ui/mog-composition-editor.tsx", "utf8");
const stylesSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.module.css", "utf8");

assert(editorSource.includes("function MogAzimuthDial"), "МОГ editor must provide a visual azimuth dial component");
assert(editorSource.includes("onPointerDown"), "Azimuth dial must support direct pointer drag");
assert(editorSource.includes("onPointerMove"), "Azimuth dial must update while the pointer moves");
assert(editorSource.includes("setPointerCapture"), "Azimuth dial must capture pointer movement during drag");
assert(editorSource.includes("onKeyDown"), "Azimuth dial must support keyboard adjustment");
assert(editorSource.includes("handleWeaponAzimuthDialChange"), "МОГ editor must route dial changes into coverageAzimuth");
assert(editorSource.includes("<MogAzimuthDial"), "Azimuth field must render the visual dial next to the numeric input");
assert(
  editorSource.includes("aria-label={`Настроить азимут"),
  "Azimuth dial must expose an accessible label for visual azimuth adjustment",
);

for (const className of [
  ".mogAzimuthControl",
  ".mogAzimuthDial",
  ".mogAzimuthDialNeedle",
  ".mogAzimuthDialHandle",
  ".mogAzimuthInput",
]) {
  assert(stylesSource.includes(className), `Azimuth dial CSS must define ${className}`);
}

assert(stylesSource.includes("min-width: 3rem"), "Azimuth dial must keep at least a 48px touch target width");
assert(stylesSource.includes("min-height: 3rem"), "Azimuth dial must keep at least a 48px touch target height");
assert(stylesSource.includes("--mog-azimuth-angle"), "Azimuth dial CSS must rotate from a CSS angle variable");

console.log("mog-azimuth-dial-contract.test.mjs: visual МОГ azimuth dial contract passed");
