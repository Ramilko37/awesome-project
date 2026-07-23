import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const componentNames = [
  "Button", "IconButton", "Input", "Textarea", "Select", "Search", "Checkbox", "Radio", "Switch", "Tabs", "SegmentedControl",
  "Badge", "Status", "Tag", "Alert", "Toast", "InlineMessage", "Tooltip", "DropdownMenu", "Popover", "Modal", "Drawer", "Table",
  "Pagination", "EmptyState", "LoadingState", "ErrorState", "SuccessState", "Navigation", "Breadcrumbs", "PageHeader", "AssetCard",
  "EchelonTreeItem", "ObjectInspector", "BudgetMetric", "CoverageStatus", "WarningStack", "SaveIndicator", "VersionIndicator",
] as const;

const fortisDirectory = path.resolve(import.meta.dirname);
const indexSource = readFileSync(path.join(fortisDirectory, "index.ts"), "utf8");
const storySource = readdirSync(fortisDirectory)
  .filter((file) => file.endsWith(".stories.tsx"))
  .map((file) => readFileSync(path.join(fortisDirectory, file), "utf8"))
  .join("\n");

test("every approved Fortis UI Kit component is exported", () => {
  for (const componentName of componentNames) {
    assert.match(indexSource, new RegExp(`\\b${componentName}\\b`), `${componentName} must be a public Fortis export`);
  }
});

test("every approved Fortis UI Kit component is visible in Storybook source", () => {
  for (const componentName of componentNames) {
    assert.match(storySource, new RegExp(`\\b${componentName}\\b`), `${componentName} must be represented by a Fortis story`);
  }
});
