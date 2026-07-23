import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const referencePattern = /\{([^}]+)\}/g;

function isLeaf(value) {
  return value === null || typeof value !== "object" || Array.isArray(value);
}

function flattenTokens(value, prefix = "", result = new Map()) {
  if (isLeaf(value)) {
    result.set(prefix, value);
    return result;
  }

  for (const [key, child] of Object.entries(value)) {
    flattenTokens(child, prefix ? `${prefix}.${key}` : key, result);
  }

  return result;
}

function flattenTokenDocument(tokens) {
  const tokenLayers = Object.fromEntries(Object.entries(tokens).filter(([path]) => path !== "meta"));
  return flattenTokens(tokenLayers);
}

function referencesOf(value) {
  if (typeof value !== "string") return [];
  return [...value.matchAll(referencePattern)].map((match) => match[1]);
}

function cssVariable(path) {
  return `--fortis-${path
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()}`;
}

function cssValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value !== "string") return String(value);
  return value.replace(referencePattern, (_, path) => `var(${cssVariable(path)})`);
}

function isCssDeclarationValue(value) {
  return typeof value !== "string" || !value.includes(";");
}

export function validateTokenDocument(tokens) {
  const flat = flattenTokenDocument(tokens);
  const errors = [];

  for (const [path, value] of flat) {
    for (const reference of referencesOf(value)) {
      if (!flat.has(reference)) {
        errors.push(`Missing token reference: ${reference}`);
      }
      if (path.startsWith("component.") && reference.startsWith("primitive.color.")) {
        errors.push(`Forbidden component color reference: ${path} → ${reference}`);
      }
    }
  }

  if (errors.length > 0) return errors;

  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(path) {
    if (visiting.has(path)) {
      const cycleStart = stack.indexOf(path);
      errors.push(`Cyclic token reference: ${[...stack.slice(cycleStart), path].join(" → ")}`);
      return;
    }
    if (visited.has(path)) return;

    visiting.add(path);
    stack.push(path);
    for (const reference of referencesOf(flat.get(path))) {
      visit(reference);
      if (errors.length > 0) return;
    }
    stack.pop();
    visiting.delete(path);
    visited.add(path);
  }

  for (const path of flat.keys()) {
    visit(path);
    if (errors.length > 0) return errors;
  }

  return errors;
}

export function generateTokenCss(tokens) {
  const errors = validateTokenDocument(tokens);
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const flat = flattenTokenDocument(tokens);
  const declarations = [...flat.entries()]
    .filter(([, value]) => isCssDeclarationValue(value))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, value]) => `  ${cssVariable(path)}: ${cssValue(value)};`)
    .join("\n");

  const densityOverrides = ["compact", "default", "comfortable"]
    .map((density) => {
      const prefix = `densityModes.${density}.`;
      const overrides = [...flat.entries()]
        .filter(([path, value]) => path.startsWith(prefix) && isCssDeclarationValue(value))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path]) => {
          const activePath = `densityModes.active.${path.slice(prefix.length)}`;
          return `  ${cssVariable(activePath)}: var(${cssVariable(path)});`;
        })
        .join("\n");

      return `[data-fortis-density="${density}"] {\n${overrides}\n}`;
    })
    .join("\n\n");

  return `/* Generated from docs/design-system/fortis-ui-kit-v1.0/design-tokens.json. Do not edit manually. */\n[data-fortis-theme] {\n${declarations}\n}\n\n${densityOverrides}\n`;
}

function runCli() {
  const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const source = resolve(root, "docs/design-system/fortis-ui-kit-v1.0/design-tokens.json");
  const output = resolve(root, "src/shared/ui/fortis/tokens.css");
  const css = generateTokenCss(JSON.parse(readFileSync(source, "utf8")));

  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== css) {
      throw new Error("Fortis token stylesheet is out of date. Run: pnpm design-system:tokens");
    }
    return;
  }

  writeFileSync(output, css);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
