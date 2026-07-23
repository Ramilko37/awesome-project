import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";
import { Button } from "./button";
import { Input, Textarea } from "./field";
import { Icon } from "./icon";
import { IconButton } from "./icon-button";

const meta = {
  title: "Components/Core controls",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const sectionClassName = "grid gap-4 rounded-[var(--fortis-radii-panel)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-surface)] p-5";

export const ButtonStates: Story = {
  name: "Button",
  render: () => (
    <section className={sectionClassName}>
      <h1 className="text-lg font-semibold">Button</h1>
      <div className="flex flex-wrap gap-3">
        <Button>Сохранить проект</Button>
        <Button variant="secondary">Предпросмотр</Button>
        <Button variant="quiet">Отменить</Button>
        <Button variant="danger">Удалить</Button>
        <Button loading>Сохранение</Button>
        <Button disabled>Недоступно</Button>
      </div>
    </section>
  ),
};

export const FieldStates: Story = {
  name: "Input & Textarea",
  render: () => (
    <section className={`${sectionClassName} w-[min(34rem,calc(100vw-4rem))]`}>
      <h1 className="text-lg font-semibold">Fields</h1>
      <Input defaultValue="Завод Альфа" helpText="Название будет видно в отчёте." label="Объект защиты" />
      <Input error="Укажите стоимость в рублях." invalid label="Стоимость" placeholder="Например, 2 400 000" />
      <Textarea defaultValue="Проверить сектор применения перед публикацией." label="Комментарий" maxLength={140} />
    </section>
  ),
};

export const CompactInformation: Story = {
  name: "Badge, Icon & IconButton",
  render: () => (
    <section className={sectionClassName}>
      <h1 className="text-lg font-semibold">Compact information</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="accent">Активный слой</Badge>
        <Badge>4 объекта</Badge>
        <Icon label="Сохранено" name="status.success" />
        <IconButton icon="action.save" label="Сохранить вариант" />
        <IconButton icon="action.more" label="Дополнительные действия" variant="quiet" />
        <IconButton icon="action.close" label="Удалить объект" variant="danger" />
        <IconButton icon="status.loading" label="Сохранение" loading />
      </div>
    </section>
  ),
};
