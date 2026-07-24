import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { createDefaultDefenseProject } from "@/shared/lib/defense-project";
import { GisObjectInspector, GisProjectTree, type InspectorState } from "./gis-workspace-panels";

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

test("Inspector renders exactly one explicit empty, echelon, object, loading or error state", () => {
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
    hasCoverageConflict: true,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };

  const states: InspectorState[] = [
    { type: "closed" },
    { type: "echelon", echelonId: layer.id },
    { type: "object", objectId: selectedObject.id },
    { type: "loading" },
    { type: "error", message: "Не удалось загрузить контекст" },
  ];
  const renderState = (state: InspectorState) =>
    renderToStaticMarkup(
      <GisObjectInspector
        onClose={() => undefined}
        onUpdateObject={() => undefined}
        project={{ ...project, placedObjects: [selectedObject] }}
        state={state}
      />,
    );
  const [closed, echelon, selected, loading, error] = states.map(renderState);

  assert.match(selected, /aria-label="Инспектор объекта"/);
  assert.match(selected, /data-inspector-state="object"/);
  assert.match(selected, /Тестовый объект/);
  assert.match(selected, new RegExp(`${layer.code} · ${layer.name}`));
  assert.match(selected, /Количество/);
  assert.match(selected, /aria-label="Количество объектов"/);
  assert.match(selected, /aria-label="Статус объекта"/);
  assert.match(selected, /Скрыть на карте/);
  assert.match(selected, /Покрытие конфликтует с соседним объектом/);
  assert.match(selected, /class="fortis-select/);
  assert.match(selected, /class="fortis-button/);
  assert.match(echelon, /aria-label="Инспектор эшелона"/);
  assert.match(echelon, /data-inspector-state="echelon"/);
  assert.match(echelon, new RegExp(layer.name));
  assert.doesNotMatch(echelon, /Ничего не выбрано/);
  assert.equal(closed, "");
  assert.match(loading, /data-inspector-state="loading"/);
  assert.match(loading, /Загрузка контекста/);
  assert.match(error, /data-inspector-state="error"/);
  assert.match(error, /Не удалось загрузить контекст/);

  for (const html of [echelon, selected, loading, error]) {
    assert.equal(html.match(/data-inspector-state=/g)?.length, 1);
  }
});
