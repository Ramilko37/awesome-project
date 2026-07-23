import assert from "node:assert/strict";
import test from "node:test";

import { resolveVariantUiState } from "./variant-ui-state";

test("draft remains a draft instead of claiming that it is saved", () => {
  assert.deepEqual(
    resolveVariantUiState({
      activeVariantId: null,
      conflict: false,
      saveStatus: "idle",
      version: 0,
    }),
    {
      saveState: null,
      version: "—",
      versionStatus: "draft",
    },
  );
});

test("saving and a persisted variant expose independent save and version states", () => {
  assert.deepEqual(
    resolveVariantUiState({
      activeVariantId: "variant-1",
      conflict: false,
      saveStatus: "saving",
      version: 7,
    }),
    {
      saveState: "saving",
      version: "v7",
      versionStatus: "current",
    },
  );
});

test("a version conflict wins over the generic save error", () => {
  assert.deepEqual(
    resolveVariantUiState({
      activeVariantId: "variant-1",
      conflict: true,
      saveStatus: "error",
      version: 7,
    }),
    {
      saveState: "conflict",
      version: "v7",
      versionStatus: "conflict",
    },
  );
});
