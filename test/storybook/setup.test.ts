import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const frontendRoot = path.resolve(import.meta.dirname, "../..");

function readProjectFile(relativePath: string) {
  const filePath = path.join(frontendRoot, relativePath);
  assert.equal(existsSync(filePath), true, `${relativePath} must exist`);
  return readFileSync(filePath, "utf8");
}

test("Storybook uses Next.js/Vite and the Fortis global context", () => {
  const main = readProjectFile(".storybook/main.ts");
  const preview = readProjectFile(".storybook/preview.tsx");
  const previewCss = readProjectFile(".storybook/fortis-preview.css");
  const gitignore = readProjectFile(".gitignore");
  const eslintConfig = readProjectFile("eslint.config.mjs");

  assert.match(main, /@storybook\/nextjs-vite/);
  assert.match(preview, /fortis-preview\.css/);
  assert.match(previewCss, /shared\/ui\/fortis\/tokens\.css/);
  assert.match(preview, /FortisProvider/);
  assert.match(gitignore, /^\/storybook-static$/m);
  assert.match(eslintConfig, /"storybook-static\/\*\*"/);
});

test("Fortis catalog exposes foundations, components, and GIS patterns", () => {
  const expectedStories = [
    "src/shared/ui/fortis/fortis-foundations.stories.tsx",
    "src/shared/ui/fortis/core-components.stories.tsx",
    "src/shared/ui/fortis/status-components.stories.tsx",
    "src/shared/ui/fortis/gis-workspace-pattern.stories.tsx",
  ];

  for (const storyPath of expectedStories) {
    assert.equal(existsSync(path.join(frontendRoot, storyPath)), true, `${storyPath} must exist`);
  }
});
