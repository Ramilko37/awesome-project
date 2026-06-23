import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shellSource = readFileSync("src/modules/drone-defense/ui/defense-studio-shell.tsx", "utf8");
const prototypeSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const gisBoardSource = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");
const styleSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.module.css", "utf8");
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

for (const prop of ["showCoverage", "showPlacementLabels", "showConstraintWarnings"]) {
  assert(gisBoardSource.includes(prop), `GisBoard must expose ${prop} UI toggle prop`);
}

for (const copy of ["Инспектор объекта", "Широта", "Долгота", "Азимут", "Сектор", "Дальность", "Кол-во", "Статус", "Заметки"]) {
  assert(prototypeSource.includes(copy), `Prototype selected-object inspector must expose ${copy}`);
}

for (const className of ["studioWorkspace", "studioPanel", "studioTopTabs", "studioEchelonTree", "studioInspector"]) {
  assert(styleSource.includes(`.${className}`), `Studio UI kit stylesheet must define .${className}`);
  assert(prototypeSource.includes(`styles.${className}`), `Prototype must consume styles.${className}`);
}

for (const token of ["--studio-appbar", "--studio-blue", "--studio-radius", "--studio-surface"]) {
  assert(styleSource.includes(token), `Studio UI kit stylesheet must define ${token}`);
}

assert(
  calculatorSource.includes("studioCalculatorShell") &&
    calculatorSource.includes("sticky") &&
    calculatorSource.includes("Карта защиты"),
  "Calculator must use the compact Studio sibling layout with sticky summary and map navigation",
);

console.log("studio-ui-refresh-contract.test.mjs: Studio UI refresh contract wired");
