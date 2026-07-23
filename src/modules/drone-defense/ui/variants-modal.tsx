"use client";

import { useEffect, useState } from "react";
import { useDefenseVariantsStore } from "@/modules/drone-defense/domain/use-defense-variants-store";
import {
  Alert,
  Button,
  EmptyState,
  Icon,
  Input,
  LoadingState,
  Modal,
  Tag,
} from "@/shared/ui/fortis";
import type { VariantSummary } from "@/shared/types/defense-project";

type Props = { open: boolean; onClose: () => void };

function formatUpdatedAt(updatedAt: string): string {
  return new Date(updatedAt).toLocaleDateString("ru-RU");
}

export function VariantsModal({ open, onClose }: Props) {
  const {
    variants,
    activeVariantId,
    listStatus,
    saveStatus,
    conflictState,
    error,
    fetchVariants,
    saveAsNewVariant,
    loadVariant,
    deleteVariant,
  } = useDefenseVariantsStore();
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (open) fetchVariants();
  }, [open, fetchVariants]);

  const saving = saveStatus === "saving";
  const trimmedName = newName.trim();
  const canSave = trimmedName.length > 0 && !saving;

  const handleSave = () => {
    if (!canSave) return;
    void saveAsNewVariant(trimmedName).then(() => setNewName(""));
  };

  return (
    <Modal
      description="Сохраняйте, загружайте и удаляйте конфигурации текущей карты."
      onClose={onClose}
      open={open}
      title="Варианты конфигурации"
    >
      <div className="fortis-variants-modal">
        {error ? (
          <Alert
            action={
              conflictState ? (
                <Button
                  onClick={() => void loadVariant(conflictState.projectId)}
                  size="sm"
                  variant="danger"
                >
                  Перезагрузить актуальную версию
                </Button>
              ) : undefined
            }
            title="Не удалось выполнить действие"
            tone="danger"
          >
            {error}
          </Alert>
        ) : null}

        <VariantsBody
          activeVariantId={activeVariantId}
          listStatus={listStatus}
          onDelete={(id) => void deleteVariant(id)}
          onLoad={(id) => void loadVariant(id).then(onClose)}
          variants={variants}
        />

        <section className="fortis-variants-save">
          <h3>Сохранить текущую карту</h3>
          <div className="fortis-variants-save__controls">
            <Input
              disabled={saving}
              label="Имя нового варианта"
              maxLength={120}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSave();
              }}
              placeholder="Например, Северный периметр"
              value={newName}
            />
            <Button
              disabled={!canSave}
              loading={saving}
              onClick={handleSave}
            >
              Сохранить как новый
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  );
}

type VariantsBodyProps = {
  variants: VariantSummary[];
  activeVariantId: string | null;
  listStatus: "idle" | "loading" | "error";
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
};

function VariantsBody({
  variants,
  activeVariantId,
  listStatus,
  onLoad,
  onDelete,
}: VariantsBodyProps) {
  if (listStatus === "loading") {
    return <LoadingState label="Загрузка списка вариантов" />;
  }

  if (variants.length === 0) {
    return (
      <EmptyState
        description="Сохраните текущую карту как первый вариант."
        title="Пока нет сохранённых вариантов"
      />
    );
  }

  return (
    <ul className="fortis-variants-list">
      {variants.map((variant) => {
        const isActive = variant.projectId === activeVariantId;

        return (
          <li
            className="fortis-variants-list__item"
            data-active={isActive || undefined}
            key={variant.projectId}
          >
            {isActive ? (
              <Icon
                className="fortis-variants-list__active-icon"
                decorative
                name="status.success"
                size={20}
              />
            ) : null}
            <div className="fortis-variants-list__content">
              <div className="fortis-variants-list__title">
                <strong>{variant.name}</strong>
                {isActive ? <Tag label="Текущий" selected /> : null}
              </div>
              <span className="fortis-variants-list__meta">
                {`v${variant.version} · ${formatUpdatedAt(variant.updatedAt)}`}
              </span>
            </div>
            <div className="fortis-variants-list__actions">
              <Button
                onClick={() => onLoad(variant.projectId)}
                size="sm"
                variant="quiet"
              >
                Загрузить
              </Button>
              <Button
                onClick={() => onDelete(variant.projectId)}
                size="sm"
                variant="danger"
              >
                Удалить
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
