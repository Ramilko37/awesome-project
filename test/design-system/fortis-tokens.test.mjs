import assert from "node:assert/strict";
import test from "node:test";

import { generateTokenCss, validateTokenDocument } from "../../scripts/design-system/fortis-tokens.mjs";

const validTokens = {
  primitive: {
    color: { blue: { 600: "#2176a8" } },
    size: { controlDefault: "44px" },
  },
  semantic: {
    light: { action: { primary: "{primitive.color.blue.600}" } },
  },
  component: {
    button: { primaryBackground: "{semantic.light.action.primary}" },
  },
  densityModes: {
    compact: { controlHeight: "40px" },
    default: { controlHeight: "{primitive.size.controlDefault}" },
    comfortable: { controlHeight: "52px" },
    active: { controlHeight: "{densityModes.default.controlHeight}" },
  },
  themes: {
    light: { accent: "{semantic.light.action.primary}" },
    darkMap: { background: "#10171d" },
  },
};

test("accepts semantic component references and emits deterministic CSS variables", () => {
  assert.deepEqual(validateTokenDocument(validTokens), []);

  const css = generateTokenCss(validTokens);

  assert.match(css, /--fortis-primitive-color-blue-600: #2176a8;/);
  assert.match(css, /--fortis-semantic-light-action-primary: var\(--fortis-primitive-color-blue-600\);/);
  assert.match(css, /--fortis-component-button-primary-background: var\(--fortis-semantic-light-action-primary\);/);
  assert.match(css, /\[data-fortis-density="compact"\]/);
  assert.match(css, /--fortis-density-modes-active-control-height: var\(--fortis-density-modes-compact-control-height\);/);
  assert.equal(css, generateTokenCss(validTokens));
});

test("reports missing and cyclic aliases", () => {
  const missing = structuredClone(validTokens);
  missing.semantic.light.action.primary = "{semantic.light.action.unknown}";
  assert.deepEqual(validateTokenDocument(missing), ["Missing token reference: semantic.light.action.unknown"]);

  const cyclic = structuredClone(validTokens);
  cyclic.semantic.light.action.primary = "{component.button.primaryBackground}";
  assert.deepEqual(validateTokenDocument(cyclic), ["Cyclic token reference: semantic.light.action.primary → component.button.primaryBackground → semantic.light.action.primary"]);
});

test("rejects component colors that bypass the semantic layer", () => {
  const invalid = structuredClone(validTokens);
  invalid.component.button.primaryBackground = "{primitive.color.blue.600}";

  assert.deepEqual(validateTokenDocument(invalid), ["Forbidden component color reference: component.button.primaryBackground → primitive.color.blue.600"]);
});

test("ignores documentation placeholders stored in metadata", () => {
  const documented = structuredClone(validTokens);
  documented.meta = { aliasSyntax: "{path.to.token}" };

  assert.deepEqual(validateTokenDocument(documented), []);
});

test("does not emit prose annotations as CSS declarations", () => {
  const documented = structuredClone(validTokens);
  documented.motion = { reducedMotion: "Set animation duration to 0.01ms; preserve state changes." };

  assert.doesNotMatch(generateTokenCss(documented), /reduced-motion/);
});
