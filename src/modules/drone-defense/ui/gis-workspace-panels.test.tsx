import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { createDefaultDefenseProject } from "@/shared/lib/defense-project";
import { GisObjectInspector, GisProjectTree } from "./gis-workspace-panels";

test("Project Tree exposes the base object, layers and placed objects as a semantic project structure", () => {
  const project = createDefaultDefenseProject();
  const layer = project.layers[0]!;
  const object = {
    id: "tree-object",
    assetId: project.assetLibrary[0]!.id,
    layerId: layer.id,
    coordinates: { lat: 56.84, lng: 60.6 },
    quantity: 1,
    status: "planned" as const,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };
  const html = renderToStaticMarkup(
    <GisProjectTree
      activeLayerId={layer.id}
      onSelectLayer={() => undefined}
      onSelectObject={() => undefined}
      project={{ ...project, placedObjects: [object] }}
      selectedObjectId={object.id}
    />,
  );

  assert.match(html, /aria-label="Структура проекта"/);
  assert.match(html, /role="tree"/);
  assert.match(html, new RegExp(project.baseObject.name));
  assert.match(html, new RegExp(layer.code));
  assert.match(html, /aria-current="true"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /class="fortis-search"/);
  assert.match(html, /class="fortis-tree-item"/);
});

test("Object Inspector shows selected asset context and does not invent an object when selection is empty", () => {
  const project = createDefaultDefenseProject();
  const layer = project.layers[0]!;
  const asset = project.assetLibrary[0]!;
  const selectedObject = {
    id: "inspected-object",
    assetId: asset.id,
    layerId: layer.id,
    coordinates: { lat: 56.84, lng: 60.6 },
    name: "Тестовый объект",
    quantity: 2,
    status: "active" as const,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };

  const selected = renderToStaticMarkup(
    <GisObjectInspector
      asset={asset}
      layer={layer}
      object={selectedObject}
      onClose={() => undefined}
      onUpdateObject={() => undefined}
    />,
  );
  const empty = renderToStaticMarkup(
    <GisObjectInspector
      asset={null}
      layer={null}
      object={null}
      onClose={() => undefined}
      onUpdateObject={() => undefined}
    />,
  );

  assert.match(selected, /aria-label="Инспектор объекта"/);
  assert.match(selected, /Тестовый объект/);
  assert.match(selected, new RegExp(`${layer.code} · ${layer.name}`));
  assert.match(selected, /Количество/);
  assert.match(selected, /aria-label="Количество объектов"/);
  assert.match(selected, /aria-label="Статус объекта"/);
  assert.match(selected, /Скрыть на карте/);
  assert.match(selected, /class="fortis-select/);
  assert.match(selected, /class="fortis-button/);
  assert.match(empty, /Выберите объект на карте или в структуре проекта/);
  assert.doesNotMatch(empty, /Количество/);
});
