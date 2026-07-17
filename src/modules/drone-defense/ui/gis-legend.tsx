"use client";

import { useState } from "react";
import type { EchelonMapPlacement } from "@/modules/drone-defense/domain/echelon-map-model";
import { getAssetCategoryColor, getAssetMarkerCategory } from "@/modules/drone-defense/ui/map-object-marker";
import type { DefenseLayer } from "@/shared/types/drone-defense";

type GisLegendProps = {
  layers: DefenseLayer[];
  selectedLayerId: string;
  placements: EchelonMapPlacement[];
  hasCoverage: boolean;
  hasConstraints: boolean;
};

const markerCategoryLabels: Record<string, string> = {
  "early-warning": "Раннее предупреждение",
  detection: "Обнаружение",
  classification: "Классификация",
  jamming: "Подавление",
  spoofing: "Спуфинг",
  kinetic: "Поражение",
  interceptor: "Перехват",
  "passive-protection": "Пассивная защита",
  "engineering-protection": "Инженерная защита",
  infrastructure: "Инфраструктура",
  software: "ПО/аналитика",
  "command-center": "Командный центр",
  "external-service": "Внешний сервис",
};

export function buildLegendMarkerCategories(placements: EchelonMapPlacement[]) {
  const categories = new Map<string, { id: string; label: string; color: string }>();

  for (const placement of placements) {
    const id = getAssetMarkerCategory(placement);
    if (categories.has(id)) continue;
    categories.set(id, {
      id,
      label: markerCategoryLabels[id] ?? placement.label,
      color: getAssetCategoryColor(placement),
    });
  }

  return [...categories.values()];
}

export function GisLegend({
  layers,
  selectedLayerId,
  placements,
  hasCoverage,
  hasConstraints,
}: GisLegendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const markerCategories = buildLegendMarkerCategories(placements);

  return (
    <div className="absolute left-4 top-28 z-10 max-w-[min(22rem,calc(100%-2rem))]">
      <button
        type="button"
        className="mb-2 min-h-11 rounded-lg border border-white/60 bg-white/95 px-3 text-sm font-semibold text-slate-700 shadow-md shadow-slate-900/10 backdrop-blur transition hover:border-blue-200 hover:text-blue-700"
        aria-expanded={isOpen}
        aria-controls="gis-map-legend"
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? "Скрыть легенду карты" : "Показать легенду карты"}
      </button>
      {isOpen ? (
        <div
          id="gis-map-legend"
          className="max-h-[min(18rem,45vh)] overflow-y-auto rounded-xl border border-white/70 bg-white/95 p-3 text-xs text-slate-700 shadow-lg shadow-slate-900/15 backdrop-blur"
        >
          <p className="font-semibold text-slate-950">Условные обозначения</p>
          <div className="mt-2 grid gap-1.5">
            {layers.map((layer) => {
              const isActive = layer.id === selectedLayerId;
              return (
                <div key={layer.id} className="flex min-h-8 items-center gap-2">
                  <span
                    className={`h-4 w-7 shrink-0 rounded-sm ${isActive ? "ring-2 ring-slate-800 ring-offset-1" : "border border-slate-400"}`}
                    style={{ backgroundColor: layer.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 truncate">
                    <strong>{layer.shortName}</strong> · {layer.name}{isActive ? " (активный)" : ""}
                  </span>
                </div>
              );
            })}
            {markerCategories.map((category) => (
              <div key={category.id} className="flex min-h-8 items-center gap-2" data-legend-marker-category={category.id}>
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white ring-1 ring-slate-400"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                <span>{category.label}</span>
              </div>
            ))}
            {hasCoverage ? (
              <div className="flex min-h-8 items-center gap-2">
                <span className="h-4 w-7 shrink-0 rounded-sm border border-blue-400 bg-blue-200/60" aria-hidden="true" />
                <span>Зона покрытия средства</span>
              </div>
            ) : null}
            {hasConstraints ? (
              <div className="flex min-h-8 items-center gap-2">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-amber-500 text-[10px] font-bold text-white" aria-hidden="true">!</span>
                <span>Конфликт или ограничение размещения</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
