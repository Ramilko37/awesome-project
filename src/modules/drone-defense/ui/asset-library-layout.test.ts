import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const managerSource = readFileSync(
  "src/modules/drone-defense/ui/asset-library-manager.tsx",
  "utf8",
);
const prototypeSource = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.tsx",
  "utf8",
);
const toolsSource = readFileSync(
  "src/modules/drone-defense/ui/defense-tools-panel.tsx",
  "utf8",
);
const stylesSource = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.module.css",
  "utf8",
);

test("library keeps controls fixed and manager, feedback, empty state, and cards in one scroll region", () => {
  const libraryPanel = prototypeSource.slice(
    prototypeSource.indexOf('className={styles.prototypeLibraryPanel}'),
    prototypeSource.indexOf("</section>", prototypeSource.indexOf('className={styles.prototypeLibraryPanel}')),
  );

  assert.match(libraryPanel, /prototypeLibraryFixedControls/);
  assert.match(libraryPanel, /prototypeLibraryScrollArea/);
  assert.match(
    libraryPanel,
    /prototypeLibraryScrollArea[\s\S]*<AssetLibraryManager[\s\S]*<DefenseToolsPanel/,
  );
  assert.doesNotMatch(libraryPanel, /overflow-hidden/);
  assert.match(stylesSource, /\.prototypeLibraryScrollArea\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(stylesSource, /\.prototypeLibraryScrollArea\s*\{[\s\S]*padding-bottom:/);
  assert.match(toolsSource, /<EmptyState/);
});

test("create view replaces catalog, focuses the first field, validates inline, and keeps actions accessible", () => {
  assert.match(managerSource, /children\?: ReactNode/);
  assert.match(managerSource, /mode === "closed"[\s\S]*children/);
  assert.match(managerSource, /nameInputRef\.current\?\.focus\(\)/);
  assert.match(managerSource, /invalid=\{Boolean\(formErrors\.name\)\}/);
  assert.match(managerSource, /message=\{formErrors\.name\}/);
  assert.match(managerSource, />\s*Отмена\s*</);
  assert.match(managerSource, /mode === "create" \? "Создать" : "Сохранить"/);
  assert.match(stylesSource, /\.prototypeLibraryFormFooter\s*\{[\s\S]*position:\s*sticky/);
  assert.match(stylesSource, /\.prototypeLibraryFormFooter\s*\{[\s\S]*bottom:\s*0/);
});
