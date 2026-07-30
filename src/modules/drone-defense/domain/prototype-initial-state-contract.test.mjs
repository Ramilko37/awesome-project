// Run: pnpm exec node src/modules/drone-defense/domain/prototype-initial-state-contract.test.mjs
import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const toolIconSource = readFileSync("src/modules/drone-defense/ui/defense-tool-icon.tsx", "utf8");
const gisBoardSource = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");

assert(source.includes("startInitialProject();"), "prototype must create a clean initial project without projectId");
const bootstrapStart = source.indexOf("const bootstrapKey =");
const bootstrapEnd = source.indexOf("const continueLocalDraft =");
const bootstrapSource = source.slice(bootstrapStart, bootstrapEnd);
assert(!bootstrapSource.includes("restoreProjectFromLocalStorage"), "prototype must not auto-restore localStorage on default load");
assert(source.includes("const continueLocalDraft ="), "prototype must restore localStorage only from an explicit continue action");
assert(!source.includes('ensureBackendVariant("Тестовый терминал Екатеринбург")'), "prototype must not auto-create a backend test variant");
assert(!source.includes('layer.code === "L4"'), "prototype must not auto-select L4");
assert(source.includes("Найден незавершённый проект"), "prototype must offer local project restore only after confirmation");
assert(source.includes("Спроектируйте защиту объекта шаг за шагом"), "new prototype must show onboarding modal copy");
assert(source.includes("L0 · Зона предприятия"), "prototype structure must render the system facility layer");
assert(source.includes("getRecommendedAssetsForLayer"), "prototype library must use deterministic layer recommendations");
assert(source.includes('setLeftPanelMode("library")'), "opening the recommended library must be a UI state change");
assert(!toolIconSource.includes("onClick={onSelect}"), "asset cards must not start placement from a generic card click");
assert(toolIconSource.includes('title="Разместить"'), "asset cards must expose an explicit placement action");
assert(toolIconSource.includes("event.stopPropagation();"), "placement button must not bubble into drag/select handlers");
assert(toolIconSource.includes('target.closest("button,input,select,textarea,a")'), "asset card drag handlers must ignore inner controls");
assert(!gisBoardSource.includes("protected-object-model-footprints"), "default map must not render the temporary 3D facility model");
assert(!gisBoardSource.includes("Упрощённая модель объекта"), "default map must not show the removed facility model badge");

console.log("prototype-initial-state-contract.test.mjs: OK");
