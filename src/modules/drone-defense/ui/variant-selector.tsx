"use client";

import { useState } from "react";
import { SaveOutlined } from "@ant-design/icons";
import { Button, theme } from "antd";
import { useDefenseVariantsStore } from "@/modules/drone-defense/domain/use-defense-variants-store";
import { resolveVariantUiState } from "@/modules/drone-defense/domain/variant-ui-state";
import { VariantsModal } from "@/modules/drone-defense/ui/variants-modal";
import { useDefenseProjectStore } from "@/shared/lib/use-defense-project-store";

function useVariantMeta() {
  const { token } = theme.useToken();
  const projectVersion = useDefenseProjectStore((state) => state.project.version);
  const { activeVariantId, activeVariantName, conflictState, saveStatus, overwriteActiveVariant } =
    useDefenseVariantsStore();

  const isDraft = !activeVariantId;
  const saving = saveStatus === "saving";
  const uiState = resolveVariantUiState({
    activeVariantId,
    conflict: Boolean(conflictState),
    saveStatus,
    version: projectVersion,
  });
  const statusLabel =
    uiState.saveState === "saving"
      ? "сохраняем"
      : uiState.saveState === "error"
        ? "ошибка сохранения"
        : uiState.saveState === "conflict"
          ? "конфликт версии"
          : uiState.version;
  const label = isDraft ? "Создание проекта..." : `${activeVariantName ?? "Текущий проект"} · ${statusLabel}`;
  const dotColor =
    uiState.saveState === "saving"
      ? token.colorInfo
      : uiState.saveState === "error" || uiState.saveState === "conflict"
        ? token.colorError
        : isDraft
          ? token.colorWarning
          : token.colorSuccess;

  return {
    token,
    activeVariantId,
    activeVariantName,
    saveStatus,
    overwriteActiveVariant,
    isDraft,
    saving,
    label,
    dotColor,
  };
}

export function VariantStatusButton({
  fullWidth = false,
}: {
  fullWidth?: boolean;
}) {
  const { token, isDraft, label, dotColor } = useVariantMeta();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Открыть варианты конфигурации"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: token.marginXS,
          width: fullWidth ? "100%" : undefined,
          justifyContent: fullWidth ? "space-between" : undefined,
          minWidth: 0,
          maxWidth: fullWidth ? undefined : 200,
          height: token.controlHeight,
          paddingInline: token.paddingSM,
          background: token.colorFillQuaternary,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          color: token.colorText,
          cursor: "pointer",
          font: "inherit",
          fontSize: token.fontSize,
          lineHeight: 1,
          transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.borderColor = token.colorPrimaryBorderHover;
          event.currentTarget.style.background = token.colorFillTertiary;
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.borderColor = token.colorBorderSecondary;
          event.currentTarget.style.background = token.colorFillQuaternary;
        }}
      >
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}1f`,
          }}
        />
        <span
          style={{
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: token.fontWeightStrong,
            color: isDraft ? token.colorTextSecondary : token.colorText,
          }}
        >
          {label}
        </span>
        <span
          aria-hidden
          style={{ flexShrink: 0, color: token.colorTextTertiary, fontSize: token.fontSizeSM }}
        >
          ▾
        </span>
      </button>
      <VariantsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function VariantSaveButton({
  iconOnly = false,
  className,
}: {
  iconOnly?: boolean;
  className?: string;
}) {
  const { activeVariantName, overwriteActiveVariant, isDraft, saving } = useVariantMeta();
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (isDraft) {
      setOpen(true);
      return;
    }
    void overwriteActiveVariant();
  };

  return (
    <>
      {iconOnly ? (
        <button
          className={className}
          type="button"
          onClick={handleSave}
          disabled={saving}
          title={
            isDraft
              ? "Сохранить карту как новый вариант"
              : `Сохранить вариант «${activeVariantName ?? "текущий"}»`
          }
          aria-label={isDraft ? "Сохранить карту как новый вариант" : "Сохранить текущий вариант"}
        >
          <SaveOutlined />
        </button>
      ) : (
        <Button type="primary" onClick={handleSave} loading={saving}>
          Сохранить
        </Button>
      )}
      <VariantsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
