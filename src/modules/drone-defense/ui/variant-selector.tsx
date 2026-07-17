"use client";

import { useState } from "react";
import { SaveOutlined } from "@ant-design/icons";
import { Button, theme } from "antd";
import { useDefenseVariantsStore } from "@/modules/drone-defense/domain/use-defense-variants-store";
import { VariantsModal } from "@/modules/drone-defense/ui/variants-modal";
import { describePersistenceState } from "@/modules/drone-defense/domain/save-status";

function useVariantMeta() {
  const { token } = theme.useToken();
  const { activeVariantId, activeVariantName, saveStatus, lastSuccessfulSaveAt, overwriteActiveVariant } =
    useDefenseVariantsStore();

  const isDraft = !activeVariantId;
  const saving = saveStatus === "saving";
  const variantLabel = isDraft ? "Черновик (не сохранён)" : activeVariantName;
  const persistence = describePersistenceState({ state: saveStatus, lastSuccessfulSaveAt });
  const label = saveStatus === "idle" ? variantLabel : `${variantLabel} · ${persistence.label}`;
  const dotColor =
    persistence.tone === "danger"
      ? token.colorError
      : persistence.tone === "warning"
        ? token.colorWarning
        : persistence.tone === "progress"
          ? token.colorInfo
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
          minHeight: 44,
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
          aria-live="polite"
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

export function VariantSelector() {
  const { saving } = useVariantMeta();
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <VariantStatusButton />
      <VariantSaveButton />
      <Button size="small" onClick={() => setOpen(true)} disabled={saving}>
        Сохранить как…
      </Button>
      <VariantsModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
