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

test("inspector selection transitions are explicit and clearing returns to empty", () => {
  assert.match(
    workspaceSource,
    /export type InspectorState\s*=\s*\|\s*\{\s*type:\s*"empty"\s*\}/,
  );
  assert.match(workspaceSource, /\|\s*\{\s*type:\s*"echelon";\s*echelonId:\s*string\s*\}/);
  assert.match(workspaceSource, /\|\s*\{\s*type:\s*"object";\s*objectId:\s*string\s*\}/);
  assert.match(workspaceSource, /\|\s*\{\s*type:\s*"loading"\s*\}/);
  assert.match(workspaceSource, /\|\s*\{\s*type:\s*"error";\s*message:\s*string\s*\}/);
  assert.match(
    prototypeSource,
    /useState<\s*Extract<InspectorState,\s*\{\s*type:\s*"empty"\s*\|\s*"echelon"\s*\}>\s*>\(\{\s*type:\s*"empty"\s*\}\)/,
  );
  assert.match(
    prototypeSource,
    /selectedObjectId\s*\?\s*\{\s*type:\s*"object",\s*objectId:\s*selectedObjectId\s*\}\s*:\s*inspectorContextState/,
  );
  assert.match(
    prototypeSource,
    /setInspectorContextState\(\{\s*type:\s*"echelon",\s*echelonId:\s*layerId\s*\}\)/,
  );
  assert.match(prototypeSource, /setInspectorContextState\(\{\s*type:\s*"empty"\s*\}\)/);
  assert.doesNotMatch(prototypeSource, /setInspectorContextState\(\{\s*type:\s*"object"/);
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
