"use client";

import { useState } from "react";
import type { PlacementValidationResult } from "@/shared/types/defense-project";
import styles from "./drone-defense-prototype.module.css";

export type CoordinatePlacementPanelProps = {
  assetName: string;
  layerLabel: string;
  validationMessage?: string;
  validationLevel?: PlacementValidationResult["level"];
  onCheck: (input: CoordinatePlacementInput) => void;
  onPlace: (input: CoordinatePlacementInput) => void;
  onCancel: () => void;
};

export type CoordinatePlacementInput = {
  lat: string;
  lng: string;
  altitude: string;
  notes: string;
};

const emptyInput: CoordinatePlacementInput = {
  lat: "",
  lng: "",
  altitude: "",
  notes: "",
};

export function CoordinatePlacementPanel({
  assetName,
  layerLabel,
  validationMessage,
  validationLevel,
  onCheck,
  onPlace,
  onCancel,
}: CoordinatePlacementPanelProps) {
  const [input, setInput] = useState(emptyInput);
  const messageClass =
    validationLevel === "success"
      ? styles.prototypeNoticeSuccess
      : validationLevel === "warning"
        ? styles.prototypeNoticeWarning
        : styles.prototypeNoticeDanger;

  const updateInput = (patch: Partial<CoordinatePlacementInput>) => {
    setInput((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="pointer-events-none absolute inset-x-3 top-24 z-40 flex justify-end lg:inset-x-5">
      <form
        className={`${styles.prototypeFloatingPanel} pointer-events-auto w-full max-w-sm p-3 backdrop-blur`}
        onSubmit={(event) => {
          event.preventDefault();
          onPlace(input);
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={styles.prototypeEyebrow}>Размещение по координатам</p>
            <p className={`${styles.prototypeTitle} mt-1 truncate`}>
              Средство: {assetName}
            </p>
            <p className={`${styles.prototypeMeta} truncate`}>
              Эшелон: {layerLabel}
            </p>
          </div>
          <button
            type="button"
            className={`${styles.prototypeIconButton} min-h-11 min-w-11 shrink-0`}
            onClick={onCancel}
            aria-label="Закрыть"
            title="Закрыть"
          >
            ×
          </button>
        </div>

        <p id="coordinate-format-hint" className={`${styles.prototypeMeta} mt-3`}>
          Пример формата: 55,4400 и 37,1000. Поля остаются пустыми до ввода.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className={styles.prototypeLabel}>
            Широта
            <input
              value={input.lat}
              onChange={(event) => updateInput({ lat: event.target.value })}
              inputMode="decimal"
              placeholder="Например: 55,4400"
              aria-describedby="coordinate-format-hint"
              className={styles.prototypeField}
            />
          </label>
          <label className={styles.prototypeLabel}>
            Долгота
            <input
              value={input.lng}
              onChange={(event) => updateInput({ lng: event.target.value })}
              inputMode="decimal"
              placeholder="Например: 37,1000"
              aria-describedby="coordinate-format-hint"
              className={styles.prototypeField}
            />
          </label>
          <label className={styles.prototypeLabel}>
            Высота, м
            <input
              value={input.altitude}
              onChange={(event) => updateInput({ altitude: event.target.value })}
              inputMode="decimal"
              placeholder="опционально"
              className={styles.prototypeField}
            />
          </label>
          <label className={`${styles.prototypeLabel} col-span-2`}>
            Комментарий
            <textarea
              value={input.notes}
              onChange={(event) => updateInput({ notes: event.target.value })}
              rows={2}
              className={`${styles.prototypeTextarea} resize-none`}
            />
          </label>
        </div>

        {validationMessage ? (
          <div className={`mt-3 ${messageClass}`}>
            {validationMessage}
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`${styles.prototypeButton} min-h-11 cursor-pointer px-3`}
            onClick={() => onCheck(input)}
          >
            Проверить точку
          </button>
          <button
            type="submit"
            className={`${styles.prototypeButtonPrimary} min-h-11 cursor-pointer px-3`}
          >
            Разместить
          </button>
        </div>
      </form>
    </div>
  );
}
