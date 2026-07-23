import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Checkbox, RadioGroup, SegmentedControl, SelectionExample, Switch, Tag } from "./index";

const meta = { title: "Components/Selection" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ChoiceExample() {
  const [coverage, setCoverage] = useState(true);
  const [autosave, setAutosave] = useState(true);
  const [version, setVersion] = useState("current");
  return <section className="fortis-storybook-panel"><h1>Checkbox · Radio · Switch</h1><Checkbox checked={coverage} label="Показывать зоны покрытия" onCheckedChange={setCoverage} /><Switch checked={autosave} label="Автосохранение проекта" onCheckedChange={setAutosave} /><RadioGroup label="Версия" onValueChange={setVersion} options={[{ label: "Текущая версия", value: "current" }, { label: "Сравнение с v11", value: "compare" }]} value={version} /></section>;
}

export const Choices: Story = { render: () => <ChoiceExample /> };
export const TabsAndSegments: Story = { render: () => <section className="fortis-storybook-panel"><h1>Tabs · Segmented Control</h1><SelectionExample /><SegmentedControl items={[{ label: "Схема", value: "scheme" }, { label: "Таблица", value: "table" }, { label: "Сравнение", value: "compare" }]} value="scheme" /></section> };
export const Tags: Story = { render: () => <section className="fortis-storybook-panel"><h1>Tag</h1><div className="fortis-storybook-grid"><Tag label="L2 · Ближняя зона" selected /><Tag label="Покрытие" onRemove={() => undefined} /></div></section> };
