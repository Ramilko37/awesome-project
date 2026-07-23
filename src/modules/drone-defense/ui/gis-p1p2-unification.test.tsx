import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { createDefaultDefenseProject } from "@/shared/lib/defense-project";
import { EmptyState } from "@/shared/ui/fortis";
import { GisObjectInspector } from "./gis-workspace-panels";

const tokensSource = readFileSync("src/shared/ui/fortis/tokens.css", "utf8");
const prototypeSource = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.tsx",
  "utf8",
);
const panelSource = readFileSync(
  "src/modules/drone-defense/ui/gis-workspace-panels.tsx",
  "utf8",
);
const toolSource = readFileSync(
  "src/modules/drone-defense/ui/defense-tool-icon.tsx",
  "utf8",
);
const baseMapSource = readFileSync("src/shared/config/base-map-sources.ts", "utf8");

test("Fortis EmptyState uses panel typography and keeps descriptions readable", () => {
  const html = renderToStaticMarkup(
    <EmptyState
      description="Выберите объект в структуре проекта, чтобы увидеть его параметры."
      title="Ничего не выбрано"
    />,
  );

  assert.match(html, /class="fortis-state"/);
  assert.match(tokensSource, /--fortis-panel-title-size:\s*1\.1875rem/);
  assert.match(tokensSource, /\.fortis-state h2\s*\{[^}]*font-size:\s*var\(--fortis-panel-title-size\)/);
  assert.match(tokensSource, /\.fortis-state p[^}]*max-width:\s*65ch/);
  assert.doesNotMatch(tokensSource, /\.fortis-state h2,\s*\.fortis-page-header h1/);
});

test("inspector empty state reuses the Fortis EmptyState and has no inert action", () => {
  const project = createDefaultDefenseProject();
  const html = renderToStaticMarkup(
    <GisObjectInspector
      onClose={() => undefined}
      onUpdateObject={() => undefined}
      project={project}
      state={{ type: "empty" }}
    />,
  );

  assert.match(html, /class="fortis-state"/);
  assert.match(html, /Ничего не выбрано/);
  assert.doesNotMatch(html, /<button/);
});

test("runtime cards share Fortis card geometry and localization is centralized", () => {
  assert.match(toolSource, /<AssetCard/);
  assert.match(prototypeSource, /<AssetCard/);
  assert.match(prototypeSource, /prototypeRu/);
  assert.match(panelSource, /prototypeRu/);
  assert.match(baseMapSource, /prototypeRu/);
  assert.doesNotMatch(
    `${prototypeSource}\n${panelSource}`,
    /GIS Workspace|Defense Configuration Studio|>\s*locked\s*</,
  );
  assert.doesNotMatch(
    baseMapSource,
    /description:\s*"(?:Open-source|Dev\/demo|Configurable|Optional satellite)/,
  );
});

test("shared card states cover hover, selected, disabled, conflict and long names", () => {
  assert.match(tokensSource, /\.fortis-card:hover:not\(\[data-disabled="true"\]\)/);
  assert.match(tokensSource, /\.fortis-card\[data-selected="true"\]/);
  assert.match(tokensSource, /\.fortis-card\[data-disabled="true"\]/);
  assert.match(tokensSource, /\.fortis-card\[data-conflict="true"\]/);
  assert.match(tokensSource, /\.fortis-card__identity strong[^}]*text-overflow:\s*ellipsis/);
  assert.match(tokensSource, /\.fortis-card__actions[^}]*min-height:\s*var\(--fortis-control-height\)/);
});

test("library only adds objects and bottom drawer only gives a compact echelon overview", () => {
  assert.match(prototypeSource, /data-library-role="add-objects"/);
  assert.match(prototypeSource, /data-echelon-role="quick-overview"/);
  assert.doesNotMatch(prototypeSource, /Открывается отдельно, чтобы не перегружать основную панель/);
  assert.doesNotMatch(prototypeSource, />\s*locked\s*</);
});
