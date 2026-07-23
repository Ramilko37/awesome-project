import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import { InlineMessage } from "./inline-message";
import { SaveIndicator } from "./save-indicator";
import { Status } from "./status";
import { VersionIndicator } from "./version-indicator";

const meta = {
  title: "Components/System feedback",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const sectionClassName = "grid gap-4 rounded-[var(--fortis-radii-panel)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-surface)] p-5";

export const Statuses: Story = {
  name: "Status & InlineMessage",
  render: () => (
    <section className={sectionClassName}>
      <h1 className="text-lg font-semibold">Status</h1>
      <div className="flex flex-wrap gap-2">
        <Status label="Черновик" />
        <Status label="Сохранено" tone="success" />
        <Status label="Идёт проверка" tone="info" />
        <Status label="Требуется внимание" tone="warning" />
        <Status label="Ошибка" tone="danger" />
      </div>
      <InlineMessage action={<Button size="sm" variant="quiet">Открыть детали</Button>} tone="warning">
        Сектор выбранного средства пересекает зону, требующую дополнительной проверки.
      </InlineMessage>
    </section>
  ),
};

export const SaveStates: Story = {
  name: "SaveIndicator",
  render: () => (
    <section className={`${sectionClassName} w-[min(42rem,calc(100vw-4rem))]`}>
      <h1 className="text-lg font-semibold">Save states</h1>
      <SaveIndicator detail="Изменения доступны участникам проекта" state="saved" />
      <SaveIndicator detail="Данные отправляются на сервер" state="saving" />
      <SaveIndicator detail="Два изменения будут сохранены после подключения" onRetry={() => undefined} pendingCount={2} state="offline" />
      <SaveIndicator detail="На сервере есть более новая версия" onResolveConflict={() => undefined} state="conflict" />
      <SaveIndicator detail="Повторите попытку или проверьте соединение" onRetry={() => undefined} state="error" />
    </section>
  ),
};

export const VersionStates: Story = {
  name: "VersionIndicator",
  render: () => (
    <section className={sectionClassName}>
      <h1 className="text-lg font-semibold">Version</h1>
      <div className="flex flex-wrap gap-3">
        <VersionIndicator status="current" version="v1.14" />
        <VersionIndicator status="draft" version="v1.15" />
        <VersionIndicator status="conflict" version="v1.16" />
        <VersionIndicator status="archived" version="v1.03" />
      </div>
    </section>
  ),
};
