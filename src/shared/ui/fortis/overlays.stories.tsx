import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Alert, Button, Drawer, DropdownMenu, Modal, Popover, Tooltip } from "./index";

const meta = { title: "Components/Overlays" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function OverlayExample() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  return <section className="fortis-storybook-panel"><h1>Overlay interactions</h1><div className="fortis-storybook-grid"><Tooltip label="Показывает долю защищённой площади"><Button variant="secondary">Покрытие</Button></Tooltip><DropdownMenu items={[{ label: "Сравнить версии", onSelect: () => undefined }, { danger: true, label: "Удалить расчёт", onSelect: () => undefined }]} /><Popover label="О расчёте"><strong>Покрытие</strong><p>Показывает долю защищённой площади.</p></Popover><Button onClick={() => setModal(true)}>Открыть Modal</Button><Button onClick={() => setDrawer(true)} variant="secondary">Открыть Drawer</Button></div><Modal description="Короткая блокирующая задача с безопасным выходом." onClose={() => setModal(false)} open={modal} title="Сохранить версию"><p>Сохранить текущие изменения как версию 13?</p><div className="fortis-overlay__footer"><Button onClick={() => setModal(false)} variant="secondary">Отмена</Button><Button onClick={() => setModal(false)}>Сохранить</Button></div></Modal><Drawer description="Контекст GIS остаётся доступным после закрытия." onClose={() => setDrawer(false)} open={drawer} title="Инспектор объекта"><p>МОГ — пост №1 · L2</p><Alert title="Покрытие 71%" tone="warning">Ниже цели на 3 п.п.</Alert></Drawer></section>;
}

export const Interactive: Story = { render: () => <OverlayExample />, play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.click(canvas.getByRole("button", { name: "Открыть Modal" })); const dialog = within(canvasElement.ownerDocument.body).getByRole("dialog", { name: "Сохранить версию" }); await expect(dialog).toBeVisible(); await userEvent.keyboard("{Escape}"); await expect(within(canvasElement.ownerDocument.body).queryByRole("dialog", { name: "Сохранить версию" })).not.toBeInTheDocument(); } };
export const FeedbackAlert: Story = { render: () => <section className="fortis-storybook-panel"><Alert action={<Button size="sm" variant="quiet">Открыть</Button>} title="Версия 12 готова к проверке">Расчёт обновлён после изменения радиуса L2.</Alert></section> };

function ReviewHarnessExample() {
  const [modalOpen, setModalOpen] = useState(false);
  const [parentRenders, setParentRenders] = useState(0);
  const [selection, setSelection] = useState("Нет выбора");
  return (
    <section className="fortis-storybook-panel">
      <h1>Проверка overlay-компонентов</h1>
      <div className="fortis-storybook-grid">
        <Button onClick={() => setModalOpen(true)}>Открыть тестовое окно</Button>
        <DropdownMenu
          items={[
            { label: "Первое действие", onSelect: () => setSelection("Первое действие") },
            { disabled: true, label: "Недоступное действие", onSelect: () => undefined },
            { label: "Второе действие", onSelect: () => setSelection("Второе действие") },
          ]}
          label="Тестовое меню"
        />
        <Button variant="secondary">Внешняя кнопка</Button>
        <output aria-live="polite">{selection}</output>
      </div>
      <Modal
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title="Проверка стабильного фокуса"
      >
        <p>Перерисовок родителя: {parentRenders}</p>
        <Button onClick={() => setParentRenders((count) => count + 1)}>
          Перерисовать родителя
        </Button>
      </Modal>
    </section>
  );
}

export const ReviewHarness: Story = { render: () => <ReviewHarnessExample /> };
