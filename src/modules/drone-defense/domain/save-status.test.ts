import assert from "node:assert/strict";
import { describePersistenceState, localizeSaveError } from "./save-status";

assert.deepEqual(describePersistenceState({ state: "saving" }), {
  label: "Сохраняем…",
  tone: "progress",
});
assert.equal(
  describePersistenceState({ state: "offline-draft" }).label,
  "Офлайн · изменения сохранены на устройстве",
);
assert.equal(describePersistenceState({ state: "conflict" }).label, "Версия проекта изменилась");
assert.equal(
  localizeSaveError(new Error("Failed to reach backend"), true),
  "Не удалось подключиться к локальному серверу",
);

console.log("save-status.test.ts: persistence copy matrix passed");
