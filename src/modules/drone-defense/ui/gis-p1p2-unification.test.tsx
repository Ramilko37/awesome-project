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
const assetLibraryManagerSource = readFileSync(
  "src/modules/drone-defense/ui/asset-library-manager.tsx",
  "utf8",
);
const baseMapSource = readFileSync("src/shared/config/base-map-sources.ts", "utf8");
const navigationSource = readFileSync(
  "src/shared/ui/fortis/data-navigation-domain.tsx",
  "utf8",
);

function sourceBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(startIndex, -1, `Missing source boundary: ${start}`);
  assert.notEqual(endIndex, -1, `Missing source boundary: ${end}`);
  return source.slice(startIndex, endIndex);
}

function assertUsesCentralizedCopy(source: string, surface: string) {
  assert.match(source, /prototypeRu\./, `${surface} must read copy from prototypeRu`);
  assert.doesNotMatch(
    source,
    /(["'`])[^"'`\n]*[А-Яа-яЁё][^"'`\n]*(["'`])/,
    `${surface} must not declare Cyrillic user copy in string literals`,
  );
  assert.doesNotMatch(
    source,
    />[^<{\n]*[А-Яа-яЁё][^<{\n]*</,
    `${surface} must not declare Cyrillic user copy in JSX text`,
  );
}

function discoverPrototypeUiChildren(
  source: string,
  surfaceSources: string[],
): Map<string, string> {
  const discovered = new Map<string, string>();
  const pending: Array<{ componentName: string; modulePath: string }> = [];

  function enqueueRenderedImports(moduleSource: string, renderedSources: string[]) {
    const renderedComponents = new Set(
      renderedSources.flatMap((renderedSource) =>
        [...renderedSource.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((match) => match[1]),
      ),
    );

    for (const match of moduleSource.matchAll(
      /import\s+\{([^}]+)\}\s+from\s+"@\/modules\/drone-defense\/ui\/([^"]+)";/g,
    )) {
      const modulePath = match[2];
      for (const importedName of match[1].split(",")) {
        const componentName = importedName.trim().split(/\s+as\s+/)[0];
        if (renderedComponents.has(componentName) && !discovered.has(componentName)) {
          pending.push({ componentName, modulePath });
        }
      }
    }
  }

  enqueueRenderedImports(source, surfaceSources);

  while (pending.length > 0) {
    const child = pending.shift();
    assert.ok(child);
    if (discovered.has(child.componentName)) continue;

    const childSource = readFileSync(
      `src/modules/drone-defense/ui/${child.modulePath}.tsx`,
      "utf8",
    );
    discovered.set(child.componentName, childSource);
    enqueueRenderedImports(childSource, [childSource]);
  }

  return discovered;
}

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

test("runtime cards share Fortis card geometry and full Task 4 surfaces use centralized copy", () => {
  const librarySurface = sourceBetween(
    prototypeSource,
    'data-library-role="add-objects"',
    "</AssetLibraryManager>",
  );
  const assetLibraryManagerSurface = assetLibraryManagerSource.slice(
    assetLibraryManagerSource.indexOf("export function AssetLibraryManager"),
  );
  const echelonDrawerSurface = sourceBetween(
    prototypeSource,
    "aria-label={prototypeRu.echelons.overviewAria}",
    '{activeView === "drilldown"',
  );
  const echelonObjectsSurface = sourceBetween(
    prototypeSource,
    "{activeView === \"gis\" && isEchelonObjectsPanelOpen",
    '{activeView === "gis" ? (',
  );
  const prototypeUiChildren = discoverPrototypeUiChildren(
    prototypeSource,
    [librarySurface, echelonObjectsSurface, echelonDrawerSurface],
  );

  for (const requiredChild of [
    "AssetLibraryManager",
    "DefenseToolIcon",
    "DefenseToolsPanel",
    "EchelonObjectsList",
  ]) {
    assert.ok(
      prototypeUiChildren.has(requiredChild),
      `Task 4 child discovery must include ${requiredChild}`,
    );
  }
  assert.match(prototypeUiChildren.get("DefenseToolIcon") ?? "", /<AssetCard/);
  assert.match(prototypeSource, /<AssetCard/);
  assert.match(baseMapSource, /prototypeRu/);
  assertUsesCentralizedCopy(panelSource, "GIS tree and inspector");
  assertUsesCentralizedCopy(assetLibraryManagerSurface, "asset library manager and form");
  assertUsesCentralizedCopy(librarySurface, "prototype library");
  assertUsesCentralizedCopy(echelonObjectsSurface, "prototype echelon objects panel");
  assertUsesCentralizedCopy(echelonDrawerSurface, "prototype echelon drawer");
  for (const [componentName, childSource] of prototypeUiChildren) {
    assertUsesCentralizedCopy(
      componentName === "AssetLibraryManager" ? assetLibraryManagerSurface : childSource,
      `${componentName} runtime child`,
    );
  }
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
  assert.match(navigationSource, /className="fortis-tree-item__label"/);
  assert.match(tokensSource, /\.fortis-tree-item__label[^}]*text-overflow:\s*ellipsis/);
  assert.match(tokensSource, /\.fortis-tree-item__label[^}]*white-space:\s*nowrap/);
  assert.match(tokensSource, /\.fortis-tree-item\s*>\s*\.fortis-mono[^}]*flex:\s*0 0 auto/);
});

test("library only adds objects and bottom drawer only gives a compact echelon overview", () => {
  assert.match(prototypeSource, /data-library-role="add-objects"/);
  assert.match(prototypeSource, /data-echelon-role="quick-overview"/);
  assert.doesNotMatch(prototypeSource, /Открывается отдельно, чтобы не перегружать основную панель/);
  assert.doesNotMatch(prototypeSource, />\s*locked\s*</);
});
