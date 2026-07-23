import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { InlineMessage } from "./inline-message";
import { SaveIndicator } from "./save-indicator";
import { Status } from "./status";
import { VersionIndicator } from "./version-indicator";

const meta = {
  title: "Patterns/GIS workspace",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectedObject: Story = {
  render: () => (
    <div className="grid w-[min(72rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--fortis-radii-panel)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-surface)] shadow-[var(--fortis-elevation-overlay)] lg:grid-cols-[14rem_minmax(0,1fr)_20rem]">
      <aside className="grid gap-4 border-b border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-subtle)] p-4 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Эшелоны</p>
          <IconButton icon="action.more" label="Действия со слоями" size="sm" variant="quiet" />
        </div>
        <div className="grid gap-2 text-sm">
          <button className="rounded-[var(--fortis-radii-control)] bg-[var(--fortis-semantic-light-background-selected)] px-3 py-2 text-left font-semibold text-[var(--fortis-semantic-light-text-link)]" type="button">L2 · Ближняя зона</button>
          <button className="rounded-[var(--fortis-radii-control)] px-3 py-2 text-left text-[var(--fortis-semantic-light-text-secondary)] hover:bg-[var(--fortis-semantic-light-state-hover-surface)]" type="button">L3 · Средняя зона</button>
          <button className="rounded-[var(--fortis-radii-control)] px-3 py-2 text-left text-[var(--fortis-semantic-light-text-secondary)] hover:bg-[var(--fortis-semantic-light-state-hover-surface)]" type="button">L4 · Внешняя зона</button>
        </div>
        <Button className="mt-auto" size="sm" variant="secondary">Добавить эшелон</Button>
      </aside>
      <section className="relative grid min-h-[28rem] place-items-center overflow-hidden bg-[var(--fortis-themes-dark-map-background)] p-6 text-center before:absolute before:inset-0 before:bg-[linear-gradient(var(--fortis-themes-dark-map-grid)_1px,transparent_1px),linear-gradient(90deg,var(--fortis-themes-dark-map-grid)_1px,transparent_1px)] before:bg-[size:2.5rem_2.5rem] before:opacity-45">
        <div className="relative grid max-w-xs gap-3 rounded-[var(--fortis-radii-panel)] border border-white/20 bg-[var(--fortis-themes-dark-map-overlay-surface)] p-4 text-left shadow-[var(--fortis-elevation-overlay)]">
          <div className="flex items-center justify-between gap-2"><Badge variant="accent">Выбрано</Badge><Status label="Активен" tone="success" /></div>
          <p className="text-sm font-semibold text-[var(--fortis-themes-dark-map-overlay-text)]">РЛС «Барьер»</p>
          <p className="text-[0.8125rem] text-[var(--fortis-themes-dark-map-overlay-text)]">55.7512° N · 37.6184° E</p>
        </div>
      </section>
      <aside className="grid content-start gap-5 border-t border-[var(--fortis-semantic-light-border-default)] p-4 lg:border-t-0 lg:border-l">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">Выбранный объект</p><h1 className="mt-1 text-lg font-semibold">РЛС «Барьер»</h1></div><IconButton icon="action.close" label="Закрыть инспектор" size="sm" variant="quiet" /></div>
        <div className="grid grid-cols-2 gap-2"><div className="rounded-[var(--fortis-radii-control)] bg-[var(--fortis-semantic-light-background-subtle)] p-3"><p className="text-[0.6875rem] text-[var(--fortis-semantic-light-text-secondary)]">Количество</p><p className="mt-1 font-mono text-sm font-semibold">2 ед.</p></div><div className="rounded-[var(--fortis-radii-control)] bg-[var(--fortis-semantic-light-background-subtle)] p-3"><p className="text-[0.6875rem] text-[var(--fortis-semantic-light-text-secondary)]">Радиус</p><p className="mt-1 font-mono text-sm font-semibold">4.5 км</p></div></div>
        <InlineMessage tone="warning">Проверьте сектор действия перед сохранением варианта.</InlineMessage>
        <SaveIndicator state="saved" />
        <VersionIndicator status="current" version="v1.14" />
      </aside>
    </div>
  ),
};
