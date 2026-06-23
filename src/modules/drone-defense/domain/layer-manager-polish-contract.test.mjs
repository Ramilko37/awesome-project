import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");

assert(
  source.includes("setLayerVisibility"),
  "Layer panel must use the existing layer visibility action instead of introducing a parallel visibility model",
);
assert(
  source.includes("hoveredLayerId"),
  "Layer cards must track hovered layer state so card hover can synchronize with map ring highlight",
);
assert(
  source.includes("Новый эшелон защиты") && source.includes("Создание эшелона"),
  "Layer wizard must use clearer creation copy for new echelons",
);
assert(
  source.includes("studioLeftTab") && source.includes("Эшелоны") && source.includes("Библиотека"),
  "Layer manager must live in the Studio left panel with Echelons/Library tabs",
);
assert(
  source.includes("studioEchelonTree") && source.includes("studioEchelonObject"),
  "Layer manager must render a left-side echelon tree with nested placed objects",
);

console.log("layer-manager-polish-contract.test.mjs: layer manager polish contract wired");
