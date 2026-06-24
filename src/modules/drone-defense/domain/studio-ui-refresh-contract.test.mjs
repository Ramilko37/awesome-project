import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shellSource = readFileSync("src/modules/drone-defense/ui/defense-studio-shell.tsx", "utf8");
const prototypeSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const gisBoardSource = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");
const markerSource = readFileSync("src/modules/drone-defense/ui/map-object-marker.tsx", "utf8");
const styleSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.module.css", "utf8");
const assetLibraryManagerSource = readFileSync("src/modules/drone-defense/ui/asset-library-manager.tsx", "utf8");
const calculatorSource = readFileSync("src/modules/defense-calculator/ui/calculator-page.tsx", "utf8");

for (const copy of ["FORTIS", "Studio", "Карта защиты", "Калькулятор", "Сценарии", "BETA", "Анализ"]) {
  assert(shellSource.includes(copy), `Studio shell top bar must expose ${copy}`);
}

for (const icon of ["UndoOutlined", "RedoOutlined", "ExportOutlined"]) {
  assert(shellSource.includes(icon), `Studio shell must keep ${icon} action in the top bar`);
}

assert(
  !shellSource.includes("w-[76px]"),
  "Studio shell must not keep the old desktop left rail width",
);
assert(shellSource.includes("h-[54px]"), "Studio shell topbar must use compact 54px height");
assert(shellSource.includes("bg-[#1e293b]"), "Studio shell nav must be a compact segmented control");
assert(shellSource.includes("h-[26px] w-[26px]"), "Studio shell logo icon must be compact");
assert(!shellSource.includes("ArrowLeftOutlined"), "Studio shell desktop topbar must not keep a dominant back arrow");
assert(shellSource.includes("aria-label=\"Экспорт\""), "Studio shell export action must be icon-only");

for (const prop of ["showCoverage", "showPlacementLabels", "showConstraintWarnings"]) {
  assert(gisBoardSource.includes(prop), `GisBoard must expose ${prop} UI toggle prop`);
}
assert(gisBoardSource.includes("mapToneOverlay"), "GisBoard must render a quieting overlay above basemap tiles");
assert(gisBoardSource.includes("styles.studioMapToolbar"), "GisBoard must own the compact map toolbar with zoom and basemap controls");
assert(!gisBoardSource.includes("absolute right-4 top-4 z-10 flex items-start gap-2"), "GisBoard must not keep the old separate basemap/zoom control cluster");
assert(!prototypeSource.includes("<div className={styles.studioMapToolbar}"), "Prototype must not render a second map toolbar above GisBoard");
assert(markerSource.includes("getAssetMarkerGlyph"), "Map markers must expose compact text glyphs");
assert(markerSource.includes("labelsEnabled"), "Map markers must allow the toolbar to hide placement labels");
assert(gisBoardSource.includes("labelsEnabled={showPlacementLabels}"), "GisBoard must wire the placement labels toggle into marker labels");

for (const copy of ["Инспектор объекта", "Широта", "Долгота", "Азимут", "Сектор", "Дальность", "Кол-во", "Статус", "Заметки"]) {
  assert(prototypeSource.includes(copy), `Prototype selected-object inspector must expose ${copy}`);
}
assert(prototypeSource.includes("buildPrototypeDemoProject"), "Prototype must seed the first demo screen through the workflow helper");
assert(prototypeSource.includes("resolvePrototypeSelectedObjectId"), "Prototype must choose the first placed object when selection is empty");
assert(!prototypeSource.includes("Defense Configuration Studio"), "Prototype left panel must not keep the old project masthead");
assert(prototypeSource.includes("Найти эшелон или объект"), "Echelon tab must expose compact search");
assert(prototypeSource.includes("Локальный каталог"), "Library tab must expose quiet local catalog status copy");
assert(prototypeSource.includes("Бюджет:"), "Map warnings must include budget summary copy");
assert(prototypeSource.includes("55.1042°N"), "Status bar must expose coordinate-scale engineering copy");
assert(prototypeSource.includes("Показать на карте"), "Inspector primary map action must use reference copy");
assert(!prototypeSource.includes("Ничего не выбрано"), "Prototype first screen inspector must not default to an empty title");

for (const className of ["studioWorkspace", "studioPanel", "studioTopTabs", "studioEchelonTree", "studioInspector"]) {
  assert(styleSource.includes(`.${className}`), `Studio UI kit stylesheet must define .${className}`);
  assert(prototypeSource.includes(`styles.${className}`), `Prototype must consume styles.${className}`);
}

for (const token of ["--studio-appbar", "--studio-blue", "--studio-radius", "--studio-surface"]) {
  assert(styleSource.includes(token), `Studio UI kit stylesheet must define ${token}`);
}
assert(styleSource.includes("--studio-left-panel: 312px"), "Studio stylesheet must define the reference left panel width");
assert(styleSource.includes("--studio-right-panel: 328px"), "Studio stylesheet must define the reference right panel width");
assert(styleSource.includes("bottom: 2.35rem"), "Studio warning stack must live above the bottom status bar");
assert(styleSource.includes("height: 30px"), "Studio map footer must use reference status bar height");
assert(assetLibraryManagerSource.includes("localCatalogActive"), "Asset library manager must quiet backend fallback when local catalog is usable");

assert(
  calculatorSource.includes("studioCalculatorShell") &&
    calculatorSource.includes("sticky") &&
    calculatorSource.includes("Карта защиты"),
  "Calculator must use the compact Studio sibling layout with sticky summary and map navigation",
);

console.log("studio-ui-refresh-contract.test.mjs: Studio UI refresh contract wired");
