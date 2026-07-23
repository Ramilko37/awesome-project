import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Badge, Button, Icon, IconButton, InlineMessage, Input, Search, Select, Status, Textarea } from "./index";

const meta = { title: "Components/Core" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Actions: Story = { render: () => <section className="fortis-storybook-panel"><h1>Actions</h1><div className="fortis-storybook-grid"><Button>Сохранить проект</Button><Button variant="secondary">Сравнить версии</Button><Button variant="quiet">Отмена</Button><Button variant="danger">Удалить расчёт</Button><Button loading>Сохраняем</Button><Button disabled>Недоступно</Button><IconButton icon="action.locate" label="Центрировать карту" /><IconButton icon="action.more" label="Дополнительные действия" variant="quiet" /></div></section> };

function FieldsExample() {
  const [query, setQuery] = useState("");
  return <section className="fortis-storybook-panel"><h1>Fields</h1><Input defaultValue="Завод Альфа" label="Название объекта" message="До 80 знаков; используется в отчётах." /><Textarea defaultValue="Уточнено покрытие северного сектора." label="Комментарий к версии" /><Select defaultValue="base" label="Сценарий расчёта" options={[{ label: "Базовый · L1–L4", value: "base" }, { label: "Расширенный · L1–L5", value: "extended" }]} /><Input invalid label="Лимит бюджета, ₽" message="Не меньше стоимости конфигурации: 184 760 000 ₽." value="120 000 000" readOnly /><Search label="Поиск по активам" onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery("")} placeholder="МОГ, РЛС, пост" value={query} /></section>;
}

export const Fields: Story = {
  render: () => <FieldsExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "Поиск по активам" });
    await userEvent.type(search, "МОГ");
    await expect(search).toHaveValue("МОГ");
    await userEvent.click(canvas.getByRole("button", { name: "Очистить поиск" }));
    await expect(search).toHaveValue("");
  },
};

export const Feedback: Story = { render: () => <section className="fortis-storybook-panel"><h1>Compact feedback</h1><div className="fortis-storybook-grid"><Badge>4 актива</Badge><Badge tone="accent">L2 · Ближняя зона</Badge><Status label="Сохранено" tone="success" /><Status label="Ошибка связи" tone="danger" /><InlineMessage tone="warning">Покрытие северного сектора — 71%</InlineMessage><span><Icon decorative name="status.warning" size={20} /> <span>semantic icon</span></span></div></section> };
