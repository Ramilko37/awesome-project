import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pageSource = readFileSync("src/app/(defense-studio)/retrospective-analysis/page.tsx", "utf8");
const shellSource = readFileSync("src/modules/drone-defense/ui/defense-studio-shell.tsx", "utf8");
const sidebarSource = readFileSync("src/modules/dashboard/ui/sidebar.tsx", "utf8");
const pageImports = pageSource.match(/^import .*$/gm) ?? [];

assert(
  /import\s+\{\s*RetrospectiveAnalysisPage\s*\}\s+from\s+"@\/modules\/drone-defense\/ui\/retrospective-analysis"\s*;?/.test(
    pageSource,
  ),
  "Retrospective page should import the module root component only",
);
assert(pageImports.length === 1, "Retrospective page should have a single module import");
assert(!/usePathname/.test(pageSource), "Retrospective page should stay simple and server-safe");

assert(
  shellSource.includes("href=\"/retrospective-analysis\"") &&
    shellSource.includes(">Анализ<") &&
    shellSource.includes("isRetrospective"),
  "DefenseStudioShell must expose the new WIP route in desktop and mobile rails",
);
assert(
  shellSource.includes("grid-cols-4"),
  "DefenseStudioShell must have mobile nav capacity for four tabs",
);
assert(
  sidebarSource.includes("href=\"/retrospective-analysis\"") &&
    sidebarSource.includes(">Анализ (WIP)<"),
  "Dashboard sidebar must keep Конфигуратор and add a WIP 'Анализ' entry",
);

console.log("retrospective-analysis-navigation-contract.test.mjs: OK");
