import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button, FortisProvider } from "./index";

const tokenGroups = [
  ["Canvas", "--fortis-canvas", "#F6F8FA"],
  ["Surface", "--fortis-surface", "#FFFFFF"],
  ["Primary text", "--fortis-text", "#10171D"],
  ["Border", "--fortis-border", "#DCE2E7"],
  ["Primary action", "--fortis-action", "#155F8D"],
  ["L2 GIS", "--fortis-cyan-500", "#178A9D"],
] as const;

const meta = { title: "Foundations/Tokens" } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Reference: Story = {
  render: () => <div className="fortis-storybook-grid">{tokenGroups.map(([name, token, value]) => <section className="fortis-storybook-panel" key={token}><span className="fortis-mono" style={{ background: `var(${token})`, border: "1px solid var(--fortis-border)", borderRadius: "var(--fortis-radius-md)", height: "5rem" }} /><strong>{name}</strong><code className="fortis-mono">{token}</code><span>{value}</span></section>)}</div>,
};

export const Density: Story = {
  render: () => <div className="fortis-storybook-grid">{(["compact", "default", "comfortable"] as const).map((density) => <FortisProvider className="fortis-storybook-panel" density={density} key={density}><strong>{density}</strong><span className="fortis-mono">control: {density === "compact" ? "40px" : density === "comfortable" ? "52px" : "44px"}</span><Button>Сохранить проект</Button></FortisProvider>)}</div>,
};
