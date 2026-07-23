import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const prototypeSource = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.tsx",
  "utf8",
);
const stylesSource = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.module.css",
  "utf8",
);
const tokensSource = readFileSync(
  "src/shared/ui/fortis/tokens.css",
  "utf8",
);

test("GIS workspace switches to sidebar plus map at the tablet breakpoint", () => {
  assert.match(prototypeSource, /md:flex-row/);
  assert.match(stylesSource, /@media \(min-width: 768px\)/);
  assert.match(tokensSource, /@media \(max-width: 47\.99rem\)/);
  assert.doesNotMatch(
    tokensSource,
    /@media \(max-width: 48rem\) \{ \.fortis-gis-workspace/,
  );
});

test("mobile catalog tray leaves the majority of the viewport to the map", () => {
  assert.match(stylesSource, /max-height: 36vh/);
  assert.match(
    prototypeSource,
    /\[isLayerPanelExpanded, setIsLayerPanelExpanded\] = useState\(false\)/,
  );
});
