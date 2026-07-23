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

function cssRule(selector: string) {
  const start = stylesSource.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `Missing ${selector} CSS rule`);
  const end = stylesSource.indexOf("}", start);
  assert.notEqual(end, -1, `Unterminated ${selector} CSS rule`);
  return stylesSource.slice(start, end + 1);
}

test("library keeps controls fixed and manager, feedback, empty state, and cards in one scroll region", () => {
  const libraryPanel = prototypeSource.slice(
    prototypeSource.indexOf('className={styles.prototypeLibraryPanel}'),
    prototypeSource.indexOf("</section>", prototypeSource.indexOf('className={styles.prototypeLibraryPanel}')),
  );
  const scrollAreaStyles = cssRule(".prototypeLibraryScrollArea");
  const catalogContentStyles = cssRule(".prototypeLibraryCatalogContent");

  assert.match(libraryPanel, /prototypeLibraryFixedControls/);
  assert.match(libraryPanel, /prototypeLibraryScrollArea/);
  assert.match(
    libraryPanel,
    /prototypeLibraryScrollArea[\s\S]*<AssetLibraryManager[\s\S]*<DefenseToolsPanel/,
  );
  assert.doesNotMatch(libraryPanel, /overflow-hidden/);
  assert.match(scrollAreaStyles, /display:\s*flex/);
  assert.match(catalogContentStyles, /overflow-y:\s*auto/);
  assert.match(catalogContentStyles, /padding-bottom:/);
  assert.match(toolsSource, /<EmptyState/);
});

test("create view replaces catalog, focuses the first field, validates inline, and keeps actions accessible", () => {
  const formStyles = cssRule(".prototypeLibraryForm");
  const formHeaderStyles = cssRule(".prototypeLibraryFormHeader");
  const formBodyStyles = cssRule(".prototypeLibraryFormBody");
  const formFooterStyles = cssRule(".prototypeLibraryFormFooter");

  assert.match(managerSource, /children\?: ReactNode/);
  assert.match(managerSource, /mode === "closed"[\s\S]*children/);
  assert.match(managerSource, /nameInputRef\.current\?\.focus\(\)/);
  assert.match(managerSource, /invalid=\{Boolean\(formErrors\.name\)\}/);
  assert.match(managerSource, /message=\{formErrors\.name\}/);
  assert.match(managerSource, /\{prototypeRu\.library\.cancel\}/);
  assert.match(
    managerSource,
    /mode === "create" \? prototypeRu\.library\.create : prototypeRu\.library\.save/,
  );
  assert.match(formStyles, /min-height:\s*0/);
  assert.match(formBodyStyles, /overflow-y:\s*auto/);
  assert.match(formHeaderStyles, /flex:\s*0 0 auto/);
  assert.match(formFooterStyles, /flex:\s*0 0 auto/);
  assert.doesNotMatch(formFooterStyles, /position:\s*sticky/);
});
