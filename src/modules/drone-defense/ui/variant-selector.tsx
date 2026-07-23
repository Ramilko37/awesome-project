"use client";

import { useState } from "react";

import { resolveVariantUiState } from "@/modules/drone-defense/domain/variant-ui-state";
import { useDefenseVariantsStore } from "@/modules/drone-defense/domain/use-defense-variants-store";
import { VariantsModal } from "@/modules/drone-defense/ui/variants-modal";
import { useDefenseProjectStore } from "@/shared/lib/use-defense-project-store";
import {
  Button,
  Icon,
  IconButton,
  SaveIndicator,
  Status,
  VersionIndicator,
} from "@/shared/ui/fortis";

function useVariantMeta() {
  const {
    activeVariantId,
    activeVariantName,
    conflictState,
    error,
    loadVariant,
    overwriteActiveVariant,
    saveStatus,
  } = useDefenseVariantsStore();
  const version = useDefenseProjectStore((state) => state.project.version);
  const uiState = resolveVariantUiState({
    activeVariantId,
    conflict: Boolean(conflictState),
    saveStatus,
    version,
  });

  return {
    activeVariantId,
    activeVariantName,
    conflictState,
    error,
    isDraft: !activeVariantId,
    loadVariant,
    overwriteActiveVariant,
    saving: saveStatus === "saving",
    uiState,
  };
}

export function VariantStatusButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const { activeVariantId, activeVariantName, conflictState, error, isDraft, loadVariant, uiState } = useVariantMeta();
  const [open, setOpen] = useState(false);
  const label = conflictState ? "Конфликт версий" : isDraft ? "Черновик (не сохранён)" : activeVariantName ?? "Текущий вариант";

  return (
    <div className={fullWidth ? "grid min-w-0 gap-2" : "inline-grid min-w-0 gap-2"}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button
          aria-expanded={open}
          aria-haspopup="dialog"
          className={fullWidth ? "min-w-0 flex-1 justify-between" : "max-w-[16rem]"}
          onClick={() => setOpen(true)}
          trailingIcon={<Icon decorative name="action.more" size={16} />}
          variant="secondary"
        >
          <span className="truncate">{label}</span>
        </Button>
        <VersionIndicator
          onOpenHistory={() => setOpen(true)}
          status={uiState.versionStatus}
          version={uiState.version}
        />
      </div>
      {uiState.saveState ? (
        <SaveIndicator
          detail={conflictState?.message ?? error ?? undefined}
          onResolveConflict={
            conflictState && activeVariantId ? () => void loadVariant(activeVariantId) : undefined
          }
          resolveConflictLabel="Загрузить актуальную"
          state={uiState.saveState}
        />
      ) : (
        <Status label="Черновик не сохранён" tone="warning" />
      )}
      <VariantsModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export function VariantSaveButton({ iconOnly = false, className }: { iconOnly?: boolean; className?: string }) {
  const { activeVariantName, isDraft, overwriteActiveVariant, saving } = useVariantMeta();
  const [open, setOpen] = useState(false);
  const label = isDraft ? "Сохранить карту как новый вариант" : `Сохранить вариант «${activeVariantName ?? "текущий"}»`;

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
        <IconButton
          className={className}
          icon="action.save"
          label={label}
          loading={saving}
          onClick={handleSave}
          variant="quiet"
        />
      ) : (
        <Button leadingIcon={<Icon decorative name="action.save" size={16} />} loading={saving} onClick={handleSave}>
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
    <div className="flex flex-wrap items-center gap-2">
      <VariantStatusButton />
      <VariantSaveButton />
      <Button disabled={saving} onClick={() => setOpen(true)} variant="secondary">
        Сохранить как…
      </Button>
      <VariantsModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
