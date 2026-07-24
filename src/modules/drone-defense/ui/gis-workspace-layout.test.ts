import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const prototypeSource = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.tsx",
  "utf8",
);
const prototypeStyles = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.module.css",
  "utf8",
);
const workspaceSource = readFileSync(
  "src/modules/drone-defense/ui/gis-workspace-panels.tsx",
  "utf8",
);
const globalStyles = readFileSync("src/app/globals.css", "utf8");

test("workspace keeps a 280–320px structure panel and gives the desktop map at least 560px", () => {
  assert.match(
    prototypeStyles,
    /width:\s*clamp\(17\.5rem,\s*25vw,\s*20rem\)/,
  );
  assert.match(
    globalStyles,
    /grid-template-columns:\s*minmax\(35rem,\s*1fr\)\s+minmax\(20rem,\s*21rem\)/,
  );
  assert.match(globalStyles, /\.fortis-gis-map-board\s*\{[\s\S]*?min-width:\s*35rem/);
  assert.match(prototypeStyles, /\.prototypeMain\s*\{[\s\S]*?min-width:\s*0/);
  assert.match(prototypeStyles, /\.prototypeMain\s*\{[\s\S]*?overflow:\s*clip/);
});

test("inspector is a constrained-width drawer before the full desktop grid breakpoint", () => {
  assert.match(
    globalStyles,
    /@media \(min-width:\s*64rem\)[\s\S]*?\.fortis-gis-inspector\s*\{[\s\S]*?position:\s*absolute/,
  );
  assert.match(
    globalStyles,
    /@media \(min-width:\s*80rem\)[\s\S]*?\.fortis-gis-main\s*\{[\s\S]*?display:\s*grid/,
  );
  assert.match(
    globalStyles,
    /@media \(min-width:\s*80rem\)[\s\S]*?\.fortis-gis-inspector\s*\{[\s\S]*?position:\s*static/,
  );
});

test("workspace uses one active-echelon and selected-entity contract for inspector transitions", () => {
  assert.match(
    workspaceSource,
    /export type InspectorState\s*=\s*\|\s*\{\s*type:\s*"closed"\s*\}/,
  );
  assert.match(workspaceSource, /\|\s*\{\s*type:\s*"echelon";\s*echelonId:\s*string\s*\}/);
  assert.match(workspaceSource, /\|\s*\{\s*type:\s*"object";\s*objectId:\s*string\s*\}/);
  assert.match(workspaceSource, /\|\s*\{\s*type:\s*"loading"\s*\}/);
  assert.match(workspaceSource, /\|\s*\{\s*type:\s*"error";\s*message:\s*string\s*\}/);
  assert.match(prototypeSource, /const \[selectedEchelonId, setSelectedEchelonId\] = useState<string \| null>\(null\)/);
  assert.match(prototypeSource, /const workspaceState = useMemo<WorkspaceState>/);
  assert.match(prototypeSource, /activeEchelonId: selectedLayerId \|\| null/);
  assert.match(prototypeSource, /const selectedLayerId = project\.activeLayerId/);
  assert.match(prototypeSource, /workspaceState\.selectedEntity\?\.type\s*===\s*"object"/);
  assert.match(prototypeSource, /workspaceState\.selectedEntity\?\.type\s*===\s*"echelon"/);
  assert.match(prototypeSource, /selectWorkspaceEchelonState\(workspaceState,\s*layerId\)/);
  assert.match(prototypeSource, /const selectedEntity = useMemo<SelectedEntity>/);
  assert.match(prototypeSource, /if \(selectedObjectId\) return \{ type: "object", id: selectedObjectId \}/);
  assert.match(prototypeSource, /return selectedEchelonId \? \{ type: "echelon", id: selectedEchelonId \} : null/);
  assert.doesNotMatch(prototypeSource, /inspectorContextState/);
});

test("tree truncation keeps full labels accessible without squeezing counts or statuses", () => {
  assert.match(workspaceSource, /title=\{project\.baseObject\.name\}/);
  assert.match(workspaceSource, /title=\{objectLabel\(object, project\.assetLibrary\)\}/);
  assert.match(workspaceSource, /title=\{layer\.name\}/);
  assert.match(globalStyles, /\.fortis-tree-item__copy\s*\{[\s\S]*?min-width:\s*0/);
  assert.match(globalStyles, /\.fortis-tree-item__copy\s*>\s*span\s*\{[\s\S]*?white-space:\s*nowrap/);
  assert.match(globalStyles, /\.fortis-tree-item\s*>\s*\.fortis-mono\s*\{[\s\S]*?flex:\s*0\s+0\s+auto/);
  assert.match(globalStyles, /\.fortis-gis-tree-detail\s*\{[\s\S]*?white-space:\s*nowrap/);
});

test("left workspace exposes mutually exclusive structure and library modes without the legacy map drawers", () => {
  assert.match(prototypeSource, /const \[leftWorkspaceTab, setLeftWorkspaceTab\] = useState<"structure" \| "library">\("structure"\)/);
  assert.match(prototypeSource, /role="tablist"/);
  assert.match(prototypeSource, /aria-controls="fortis-gis-structure-panel"/);
  assert.match(prototypeSource, /aria-controls="fortis-gis-library-content"/);
  assert.match(prototypeSource, /leftWorkspaceTab === "structure"/);
  assert.match(prototypeSource, /leftWorkspaceTab === "library"/);
  assert.doesNotMatch(prototypeSource, /EchelonObjectsList/);
});
