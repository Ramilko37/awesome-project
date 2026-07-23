import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FortisProvider } from "./provider";

const tokenGroups = [
  {
    name: "Surface",
    tokens: [
      ["Canvas", "--fortis-semantic-light-background-canvas"],
      ["Surface", "--fortis-semantic-light-background-surface"],
      ["Subtle", "--fortis-semantic-light-background-subtle"],
      ["Selected", "--fortis-semantic-light-background-selected"],
    ],
  },
  {
    name: "Text & borders",
    tokens: [
      ["Primary", "--fortis-semantic-light-text-primary"],
      ["Secondary", "--fortis-semantic-light-text-secondary"],
      ["Default border", "--fortis-semantic-light-border-default"],
      ["Interactive border", "--fortis-semantic-light-border-interactive"],
    ],
  },
  {
    name: "Status",
    tokens: [
      ["Success", "--fortis-semantic-light-status-success-text"],
      ["Info", "--fortis-semantic-light-status-info-text"],
      ["Warning", "--fortis-semantic-light-status-warning-text"],
      ["Danger", "--fortis-semantic-light-status-danger-text"],
    ],
  },
] as const;

const meta = {
  title: "Foundations/Fortis tokens",
  component: FortisProvider,
} satisfies Meta<typeof FortisProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
  render: () => (
    <div className="grid w-[min(60rem,calc(100vw-4rem))] gap-8">
      <section className="grid gap-2">
        <p className="text-sm font-semibold text-[var(--fortis-semantic-light-text-link)]">Fortis UI Kit</p>
        <h1 className="text-3xl font-semibold tracking-tight">Foundations</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--fortis-semantic-light-text-secondary)]">
          Живой срез токенов, из которых собираются интерфейсы Fortis. Источник значений — сгенерированный дизайн-контракт.
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-3">
        {tokenGroups.map((group) => (
          <section className="grid gap-3 rounded-[var(--fortis-radii-panel)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-surface)] p-4" key={group.name}>
            <h2 className="text-sm font-semibold">{group.name}</h2>
            <div className="grid gap-2">
              {group.tokens.map(([label, token]) => (
                <div className="flex items-center gap-3" key={token}>
                  <span className="h-8 w-8 shrink-0 rounded-[var(--fortis-radii-control)] border border-[var(--fortis-semantic-light-border-default)]" style={{ background: `var(${token})` }} />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="text-sm font-medium">{label}</span>
                    <code className="truncate text-[0.6875rem] text-[var(--fortis-semantic-light-text-secondary)]">{token}</code>
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <section className="grid gap-3 rounded-[var(--fortis-radii-panel)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-surface)] p-4">
        <h2 className="text-sm font-semibold">Density</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["compact", "default", "comfortable"] as const).map((density) => (
            <FortisProvider className="rounded-[var(--fortis-radii-control)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-subtle)] p-3" density={density} key={density}>
              <p className="text-sm font-semibold capitalize">{density}</p>
              <p className="mt-1 text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">Контроль: var(--fortis-density-modes-active-control-height)</p>
            </FortisProvider>
          ))}
        </div>
      </section>
    </div>
  ),
};
