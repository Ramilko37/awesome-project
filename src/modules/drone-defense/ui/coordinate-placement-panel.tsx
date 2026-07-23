"use client";

import { useState } from "react";
import {
  Button,
  Icon,
  IconButton,
  InlineMessage,
  Input,
  Textarea,
} from "@/shared/ui/fortis";
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
  const messageTone =
    validationLevel === "success"
      ? "info"
      : validationLevel === "warning"
        ? "warning"
        : "error";

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
          <IconButton
            className="shrink-0"
            icon="action.close"
            label="Закрыть"
            onClick={onCancel}
            size="sm"
            variant="quiet"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Input
            inputMode="decimal"
            label="Широта"
            onChange={(event) => updateInput({ lat: event.target.value })}
            placeholder="55.4400"
            value={input.lat}
          />
          <Input
            inputMode="decimal"
            label="Долгота"
            onChange={(event) => updateInput({ lng: event.target.value })}
            placeholder="37.1000"
            value={input.lng}
          />
          <Input
            inputMode="decimal"
            label="Высота, м"
            onChange={(event) => updateInput({ altitude: event.target.value })}
            placeholder="Опционально"
            value={input.altitude}
          />
          <Textarea
            className="col-span-2 resize-none"
            label="Комментарий"
            onChange={(event) => updateInput({ notes: event.target.value })}
            rows={2}
            value={input.notes}
          />
        </div>

        {validationMessage ? (
          <InlineMessage tone={messageTone}>
            {validationMessage}
          </InlineMessage>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            leadingIcon={<Icon decorative name="status.info" />}
            onClick={() => onCheck(input)}
            variant="secondary"
          >
            Проверить точку
          </Button>
          <Button type="submit">
            Разместить
          </Button>
        </div>
      </form>
    </div>
  );
}
