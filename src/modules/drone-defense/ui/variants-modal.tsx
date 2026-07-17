"use client";

import { useEffect, useState } from "react";
import { CheckCircleFilled } from "@ant-design/icons";
import { Alert, Button, Input, Modal, Spin, Tag, Typography, theme } from "antd";
import { useDefenseVariantsStore } from "@/modules/drone-defense/domain/use-defense-variants-store";
import { describePersistenceState } from "@/modules/drone-defense/domain/save-status";
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
    technicalError,
    activeVariantName,
    fetchVariants,
    saveAsNewVariant,
    retryLastFailedIntent,
    loadVariant,
    deleteVariant,
  } = useDefenseVariantsStore();
  const { token } = theme.useToken();
  const [newName, setNewName] = useState("");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    if (open) fetchVariants();
  }, [open, fetchVariants]);

  const saving = saveStatus === "saving";
  const trimmedName = newName.trim();
  const canSave = trimmedName.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    const saved = await saveAsNewVariant(trimmedName);
    if (saved) setNewName("");
  };
  const persistenceDescription = describePersistenceState({ state: saveStatus });
  const hasSaveFailure = saveStatus === "offline-draft" || saveStatus === "conflict" || saveStatus === "error";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Варианты конфигурации"
      footer={null}
      width={520}
      destroyOnHidden
    >
      {hasSaveFailure ? (
        <Alert
          type={saveStatus === "error" ? "error" : "warning"}
          message={persistenceDescription.label}
          description={
            <div>
              <span>{error}</span>
              {showTechnicalDetails && technicalError ? (
                <Typography.Paragraph copyable code style={{ display: "block", margin: `${token.marginXS}px 0 0` }}>
                  {technicalError}
                </Typography.Paragraph>
              ) : null}
            </div>
          }
          action={(
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: token.marginXS }}>
              <Button
                size="small"
                disabled={saving}
                onClick={async () => {
                  const saved = await retryLastFailedIntent();
                  if (saved) setNewName("");
                }}
              >
                {saveStatus === "offline-draft" ? "Повторить синхронизацию" : "Повторить"}
              </Button>
              {technicalError ? (
                <Button size="small" onClick={() => setShowTechnicalDetails((current) => !current)}>
                  Подробнее
                </Button>
              ) : null}
              {conflictState ? (
                <>
                  <Button size="small" onClick={() => void loadVariant(conflictState.projectId)}>
                    Обновить данные
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={async () => {
                      const copyName = trimmedName || `${activeVariantName ?? "Вариант"} — копия`;
                      const saved = await saveAsNewVariant(copyName);
                      if (saved) setNewName("");
                    }}
                  >
                    Сохранить копию
                  </Button>
                </>
              ) : null}
            </div>
          )}
          showIcon
          style={{ marginBottom: token.marginMD }}
        />
      ) : null}

      <VariantsBody
        variants={variants}
        activeVariantId={activeVariantId}
        listStatus={listStatus}
        token={token}
        onLoad={(id) => void loadVariant(id).then(onClose)}
        onDelete={(id) => void deleteVariant(id)}
      />

      <div
        style={{
          marginTop: token.marginLG,
          paddingTop: token.marginMD,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Typography.Text
          strong
          style={{ display: "block", marginBottom: token.marginXS }}
        >
          Сохранить текущую карту
        </Typography.Text>
        <div style={{ display: "flex", gap: token.marginXS }}>
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onPressEnter={() => void handleSave()}
            placeholder="Имя нового варианта…"
            disabled={saving}
            maxLength={120}
          />
          <Button
            type="primary"
            onClick={() => void handleSave()}
            disabled={!canSave}
            loading={saving}
          >
            Сохранить как новый
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type VariantsBodyProps = {
  variants: VariantSummary[];
  activeVariantId: string | null;
  listStatus: "idle" | "loading" | "error";
  token: ReturnType<typeof theme.useToken>["token"];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
};

function VariantsBody({
  variants,
  activeVariantId,
  listStatus,
  token,
  onLoad,
  onDelete,
}: VariantsBodyProps) {
  if (listStatus === "loading") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: token.marginSM,
          padding: `${token.paddingXL}px 0`,
        }}
      >
        <Spin />
        <Typography.Text type="secondary">Загрузка списка…</Typography.Text>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div
        style={{
          padding: `${token.paddingXL}px ${token.paddingLG}px`,
          textAlign: "center",
        }}
      >
        <Typography.Text type="secondary">
          Пока нет сохранённых вариантов. Сохраните текущую карту как первый
          вариант ниже.
        </Typography.Text>
      </div>
    );
  }

  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        maxHeight: 360,
        overflowY: "auto",
        marginInline: -token.paddingContentHorizontalLG,
      }}
    >
      {variants.map((variant) => {
        const isActive = variant.projectId === activeVariantId;
        return (
          <li
            key={variant.projectId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: token.marginSM,
              paddingBlock: token.paddingSM,
              paddingInline: token.paddingContentHorizontalLG,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background: isActive ? token.colorPrimaryBg : undefined,
              transition: `background ${token.motionDurationMid}`,
            }}
          >
            {isActive ? (
              <CheckCircleFilled
                style={{ color: token.colorPrimary, fontSize: token.fontSizeLG }}
              />
            ) : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: token.marginXS,
                }}
              >
                <Typography.Text strong>{variant.name}</Typography.Text>
                {isActive ? (
                  <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                    Текущий
                  </Tag>
                ) : null}
              </div>
              <Typography.Text
                type="secondary"
                style={{ display: "block", fontSize: token.fontSizeSM }}
              >
                {`v${variant.version} · ${formatUpdatedAt(variant.updatedAt)}`}
              </Typography.Text>
            </div>
            <Button type="link" size="small" onClick={() => onLoad(variant.projectId)}>
              Загрузить
            </Button>
            <Button
              type="link"
              size="small"
              danger
              onClick={() => onDelete(variant.projectId)}
            >
              Удалить
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
