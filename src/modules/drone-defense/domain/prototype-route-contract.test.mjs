import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routeSource = readFileSync("src/app/prototype/page.tsx", "utf8");

assert(
  routeSource.includes("FortisStudioPrototype"),
  "/prototype route must render the connected Fortis Studio UI kit",
);
assert(
  !routeSource.includes("DroneDefensePrototype"),
  "/prototype route must not fall back to the old visual workspace",
);

const prototypeSource = readFileSync("src/modules/drone-defense/ui/fortis-studio-prototype.tsx", "utf8");

assert(
  prototypeSource.includes("useDefenseProjectStore"),
  "Fortis Studio prototype must read DefenseProject from the project store",
);
assert(
  prototypeSource.includes("GisBoard"),
  "Fortis Studio prototype must keep the real GIS board instead of an SVG-only map",
);
assert(
  !prototypeSource.includes("const SEED") && !prototypeSource.includes("const LIBRARY") && !prototypeSource.includes("const ECHELONS"),
  "Fortis Studio prototype must not use hardcoded mock arrays as runtime source of truth",
);

console.log("prototype-route-contract.test.mjs: /prototype uses connected Fortis Studio UI kit");
