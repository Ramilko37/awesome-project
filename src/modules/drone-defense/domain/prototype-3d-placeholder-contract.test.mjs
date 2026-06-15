// Run: pnpm exec node src/modules/drone-defense/domain/prototype-3d-placeholder-contract.test.mjs

import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const shellSource = readFileSync("src/modules/drone-defense/ui/defense-studio-shell.tsx", "utf8");
const prototypeSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const placeholderSource = readFileSync("src/modules/drone-defense/ui/prototype-3d-placeholder.tsx", "utf8");
const dashboardSidebarSource = readFileSync("src/modules/dashboard/ui/sidebar.tsx", "utf8");

assert(shellSource.includes("setView(\"drilldown\")"), "3D navigation must open a dedicated prototype state");
assert(shellSource.includes("href=\"/prototype?view=3d\""), "3D navigation must use a shareable 3D prototype state URL");
assert(
  dashboardSidebarSource.includes("href=\"/prototype?view=3d\""),
  "Dashboard 3D entry must not open the default 2D /prototype state",
);
assert(!shellSource.includes("href=\"/models\""), "3D navigation must not restore the legacy /models route");
assert(
  prototypeSource.includes("<Prototype3DPlaceholder />"),
  "Prototype 3D state must render the planned product placeholder",
);
assert(
  prototypeSource.includes("searchParams.get(\"view\") === \"3d\""),
  "Prototype must render the 3D placeholder from a direct /prototype?view=3d entry",
);
assert(
  !prototypeSource.includes("<FacilityDrilldown"),
  "Prototype 3D navigation must not expose the old demo-runtime drilldown as the primary 3D section",
);
assert(placeholderSource.includes("Раздел в разработке"), "3D placeholder must show the required heading");
assert(
  placeholderSource.includes("3D-модель объекта будет доступна в следующих версиях Fortis. Сейчас основной рабочий контур — 2D GIS-конструктор."),
  "3D placeholder must show the required explanatory copy",
);
assert(placeholderSource.includes("@react-three/fiber"), "3D placeholder must include a lightweight React Three Fiber visual");

console.log("prototype-3d-placeholder-contract.test.mjs: 3D placeholder contract passed");
