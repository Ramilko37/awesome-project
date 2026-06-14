"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildMogCoverageInputMap,
  buildMogCostSummary,
  clampMogAzimuth,
  clampMogSector,
  formatMogMoney,
  formatMogOption,
  formatMogRange,
  hasMogErrors,
  isMogDirty,
  MOG_ACCOUNTABILITY_OPTIONS,
  MOG_POST_TYPE_OPTIONS,
  type MogCoverageInputMap,
  parseMogCount,
  sanitizeMogCountInput,
  syncMogDraft,
  validateMogDraft,
} from "@/modules/drone-defense/domain/mog-editor";
import {
  getVisibleMogCoverageWeapons,
  MOG_WEAPON_COVERAGE_COLORS,
} from "@/modules/drone-defense/domain/mog-coverage";
import type { DefenseAsset, PlacedDefenseObject } from "@/shared/types/defense-project";
import type { MogEquipmentId, MogWeaponId, PlacedDefenseCompoundProfile } from "@/shared/types/defense-configuration";

type MogCompositionEditorProps = {
  objectId: string;
  asset: DefenseAsset;
  layerLabel: string;
  profile: PlacedDefenseCompoundProfile;
  onPreviewChange: (patch: Partial<PlacedDefenseObject>) => void;
  onSave: (patch: Partial<PlacedDefenseObject>) => void;
  onCancel: (patch: Partial<PlacedDefenseObject>) => void;
};

function EditorSection({
  title,
  eyebrow,
  tone = "default",
  children,
}: {
  title: string;
  eyebrow?: string;
  tone?: "default" | "muted" | "accent";
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border p-4 sm:p-5",
        tone === "accent" && "border-amber-200 bg-amber-50/80",
        tone === "muted" && "border-slate-200 bg-white",
        tone === "default" && "border-slate-200 bg-slate-50/85",
      )}
    >
      <div className="mb-4">
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p> : null}
        <h3 className="mt-1 text-sm font-semibold text-slate-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-rose-600">{message}</p>;
}

function Stepper({
  value,
  onDecrease,
  onIncrease,
  ariaLabel,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={onDecrease}
        disabled={value <= 0}
        aria-label={`${ariaLabel}: уменьшить`}
        className="grid h-9 w-9 place-items-center rounded-full text-lg text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
      >
        −
      </button>
      <output
        aria-label={`${ariaLabel}: текущее значение`}
        className="min-w-10 text-center text-sm font-semibold text-slate-950"
      >
        {value}
      </output>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`${ariaLabel}: увеличить`}
        className="grid h-9 w-9 place-items-center rounded-full text-lg text-slate-700 transition hover:bg-slate-100"
      >
        +
      </button>
    </div>
  );
}

export function MogCompositionEditor({
  objectId,
  asset,
  layerLabel,
  profile,
  onPreviewChange,
  onSave,
  onCancel,
}: MogCompositionEditorProps) {
  const initialProfile = syncMogDraft(profile);
  const lastObjectIdRef = useRef(objectId);
  const [baselineProfile, setBaselineProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [coverageInputs, setCoverageInputs] = useState<MogCoverageInputMap>(() =>
    buildMogCoverageInputMap(initialProfile),
  );

  useEffect(() => {
    if (lastObjectIdRef.current === objectId) return;
    lastObjectIdRef.current = objectId;
    const nextInitialProfile = syncMogDraft(profile);
    setBaselineProfile(nextInitialProfile);
    setDraft(nextInitialProfile);
    setCoverageInputs(buildMogCoverageInputMap(nextInitialProfile));
  }, [objectId, profile]);

  const costSummary = useMemo(() => buildMogCostSummary(asset), [asset]);
  const visibleCoverageWeapons = useMemo(() => getVisibleMogCoverageWeapons(draft), [draft]);
  const visibleCoverageWeaponIds = useMemo(
    () => new Set(visibleCoverageWeapons.map((weapon) => weapon.id)),
    [visibleCoverageWeapons],
  );
  const errors = useMemo(
    () =>
      validateMogDraft({
        draft,
        coverageInputs,
      }),
    [coverageInputs, draft],
  );
  const hasErrors = hasMogErrors(errors);
  const isDirty = isMogDirty(baselineProfile, draft);

  const applyDraft = (updater: (current: PlacedDefenseCompoundProfile) => PlacedDefenseCompoundProfile) => {
    setDraft((current) => {
      const next = syncMogDraft(updater(current));
      setCoverageInputs(buildMogCoverageInputMap(next));
      onPreviewChange({ compoundProfile: next });
      return next;
    });
  };

  const setCoverageInputValue = (
    weaponId: MogWeaponId,
    patch: Partial<NonNullable<MogCoverageInputMap[MogWeaponId]>>,
  ) => {
    setCoverageInputs((current) => ({
      ...current,
      [weaponId]: {
        ...current[weaponId],
        ...patch,
      },
    }));
  };

  const handleEquipmentStep = (id: MogEquipmentId, delta: number) => {
    applyDraft((current) => ({
      ...current,
      equipment: current.equipment?.map((item) =>
        item.id === id ? { ...item, quantity: String(Math.max(0, parseMogCount(item.quantity) + delta)) } : item,
      ),
    }));
  };

  const handleWeaponStep = (id: MogWeaponId, delta: number) => {
    applyDraft((current) => {
      const nextWeapons = current.weapons?.map((item) =>
        item.id === id ? { ...item, quantity: String(Math.max(0, parseMogCount(item.quantity) + delta)) } : item,
      );
      const nextVisibleCoverageWeaponIds = (current.visibleCoverageWeaponIds ?? []).filter((weaponId) => {
        const weapon = nextWeapons?.find((item) => item.id === weaponId);
        return Boolean(weapon && parseMogCount(weapon.quantity) > 0);
      });
      return {
        ...current,
        weapons: nextWeapons,
        visibleCoverageWeaponIds: nextVisibleCoverageWeaponIds,
      };
    });
  };

  const handleCoverageToggle = (id: MogWeaponId) => {
    const selectedWeapon = draft.weapons?.find((item) => item.id === id);
    if (!selectedWeapon || parseMogCount(selectedWeapon.quantity) === 0) return;
    applyDraft((current) => {
      const currentVisible = new Set(current.visibleCoverageWeaponIds ?? []);
      const nextVisible = new Set(currentVisible);
      if (nextVisible.has(id)) {
        nextVisible.delete(id);
      } else {
        nextVisible.add(id);
      }

      const nextVisibleCoverageWeaponIds = (current.weapons ?? [])
        .map((weapon) => weapon.id)
        .filter((weaponId) => nextVisible.has(weaponId));

      return {
        ...current,
        coverageWeaponId: id,
        visibleCoverageWeaponIds: nextVisibleCoverageWeaponIds,
      };
    });
  };

  const handleWeaponAzimuthInput = (weaponId: MogWeaponId, value: string) => {
    setCoverageInputValue(weaponId, { azimuth: value });
    const parsed = Number(value.replace(",", "."));
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 359) return;
    applyDraft((current) => ({
      ...current,
      weapons: current.weapons?.map((weapon) =>
        weapon.id === weaponId ? { ...weapon, coverageAzimuth: clampMogAzimuth(parsed) } : weapon,
      ),
    }));
  };

  const commitWeaponAzimuthInput = (weaponId: MogWeaponId) => {
    const weapon = draft.weapons?.find((item) => item.id === weaponId);
    if (!weapon) return;
    const parsed = Number((coverageInputs[weaponId]?.azimuth ?? "").replace(",", "."));
    const nextValue =
      Number.isInteger(parsed) && parsed >= 0 && parsed <= 359
        ? clampMogAzimuth(parsed)
        : clampMogAzimuth(weapon.coverageAzimuth ?? draft.azimuth);
    setCoverageInputValue(weaponId, { azimuth: String(nextValue) });
    if (nextValue !== (weapon.coverageAzimuth ?? draft.azimuth)) {
      applyDraft((current) => ({
        ...current,
        weapons: current.weapons?.map((item) =>
          item.id === weaponId ? { ...item, coverageAzimuth: nextValue } : item,
        ),
      }));
    }
  };

  const handleWeaponSectorInput = (weaponId: MogWeaponId, value: string) => {
    setCoverageInputValue(weaponId, { sectorWidthDeg: value });
    const parsed = Number(value.replace(",", "."));
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 360) return;
    applyDraft((current) => ({
      ...current,
      weapons: current.weapons?.map((weapon) =>
        weapon.id === weaponId ? { ...weapon, coverageSectorWidthDeg: clampMogSector(parsed) } : weapon,
      ),
    }));
  };

  const commitWeaponSectorInput = (weaponId: MogWeaponId) => {
    const weapon = draft.weapons?.find((item) => item.id === weaponId);
    if (!weapon) return;
    const parsed = Number((coverageInputs[weaponId]?.sectorWidthDeg ?? "").replace(",", "."));
    const nextValue =
      Number.isInteger(parsed) && parsed >= 1 && parsed <= 360
        ? clampMogSector(parsed)
        : clampMogSector(weapon.coverageSectorWidthDeg ?? draft.sectorWidthDeg ?? 90);
    setCoverageInputValue(weaponId, { sectorWidthDeg: String(nextValue) });
    if (nextValue !== (weapon.coverageSectorWidthDeg ?? draft.sectorWidthDeg ?? 90)) {
      applyDraft((current) => ({
        ...current,
        weapons: current.weapons?.map((item) =>
          item.id === weaponId ? { ...item, coverageSectorWidthDeg: nextValue } : item,
        ),
      }));
    }
  };

  const handleCancel = () => {
    onCancel({ compoundProfile: baselineProfile });
  };

  const handleSave = () => {
    if (hasErrors) return;
    const finalizedDraft = syncMogDraft({
      ...draft,
      personnelCount: sanitizeMogCountInput(draft.personnelCount),
    });
    onSave({ compoundProfile: finalizedDraft });
  };

  return (
    <div className="pointer-events-none fixed inset-y-2 right-2 z-30 flex justify-end sm:inset-y-3 sm:right-3">
      <aside className="pointer-events-auto flex h-full w-[min(100vw-1rem,35rem)] max-w-[35rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
        <header className="border-b border-slate-200 px-4 pb-4 pt-5 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {asset.name}
                </span>
                {isDirty ? (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    Есть несохраненные изменения
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Настройка МОГ</h2>
              <p className="mt-2 text-sm text-slate-600">
                {draft.postType} · {layerLabel} · {formatMogMoney(costSummary.baseMln)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="Закрыть редактор МОГ"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-36 pt-4 sm:px-5">
          <div className="space-y-4">
            <EditorSection title="Основные параметры" eyebrow="Пост и контекст">
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Тип поста
                  <select
                    value={draft.postType}
                    onChange={(event) => applyDraft((current) => ({ ...current, postType: event.target.value }))}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-300"
                  >
                    {MOG_POST_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {formatMogOption(option)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Количество личного состава
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={draft.personnelCount}
                        onChange={(event) =>
                          applyDraft((current) => ({
                            ...current,
                            personnelCount: sanitizeMogCountInput(event.target.value),
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 pr-14 text-sm text-slate-950 outline-none transition focus:border-blue-300"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                        чел.
                      </span>
                    </div>
                    <FieldError message={errors.personnelCount} />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Подотчётность
                    <select
                      value={draft.accountability}
                      onChange={(event) => applyDraft((current) => ({ ...current, accountability: event.target.value }))}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-300"
                    >
                      {MOG_ACCOUNTABILITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {formatMogOption(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </EditorSection>

            <EditorSection title="Оснащение" eyebrow="Штатный комплект" tone="muted">
              <div className="space-y-2">
                {draft.equipment?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{item.label}</p>
                      <FieldError message={errors.equipment[item.id]} />
                    </div>
                    <Stepper
                      value={parseMogCount(item.quantity)}
                      onDecrease={() => handleEquipmentStep(item.id, -1)}
                      onIncrease={() => handleEquipmentStep(item.id, 1)}
                      ariaLabel={`${item.label}: количество`}
                    />
                  </div>
                ))}
              </div>
            </EditorSection>

            <EditorSection title="Оружие и покрытия" eyebrow="Покрытия на карте" tone="default">
              <div className="space-y-3">
                {draft.weapons?.map((weapon) => {
                  const quantity = parseMogCount(weapon.quantity);
                  const isActive = visibleCoverageWeaponIds.has(weapon.id);
                  const isDisabled = quantity === 0;
                  const color = MOG_WEAPON_COVERAGE_COLORS[weapon.id];

                  return (
                    <article
                      key={weapon.id}
                      className={cn(
                        "rounded-3xl border p-4 transition",
                        isActive && "border-blue-300 bg-blue-50/60 shadow-[0_12px_32px_rgba(59,130,246,0.12)]",
                        !isActive && "border-slate-200 bg-white",
                        isDisabled && "opacity-65",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: color.stroke }}
                            />
                            <h4 className="truncate text-sm font-semibold text-slate-950">{weapon.label}</h4>
                            {isActive ? (
                              <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: color.stroke, color: color.stroke }}>
                                На карте
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Дальность: {formatMogRange(weapon.rangeM)}</p>
                        </div>
                        <Stepper
                          value={quantity}
                          onDecrease={() => handleWeaponStep(weapon.id, -1)}
                          onIncrease={() => handleWeaponStep(weapon.id, 1)}
                          ariaLabel={`${weapon.label}: количество`}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs font-medium text-slate-500">
                          Кол-во: <span className="font-semibold text-slate-700">{quantity}</span>
                        </div>
                        <label
                          className={cn(
                            "flex min-h-11 items-center gap-3 rounded-full border px-4 text-sm font-semibold transition",
                            isActive && "bg-white",
                            !isActive && "bg-white text-slate-700",
                            isDisabled && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
                          )}
                          style={!isDisabled && isActive ? { borderColor: color.stroke, color: color.stroke } : undefined}
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            disabled={isDisabled}
                            onChange={() => handleCoverageToggle(weapon.id)}
                            className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                          />
                          <span>{isActive ? "Покрытие на карте" : "Показать покрытие"}</span>
                        </label>
                      </div>

                      {!isDisabled ? (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Азимут
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                max={359}
                                step={1}
                                inputMode="numeric"
                                value={coverageInputs[weapon.id]?.azimuth ?? String(weapon.coverageAzimuth ?? draft.azimuth)}
                                onChange={(event) => handleWeaponAzimuthInput(weapon.id, event.target.value)}
                                onBlur={() => commitWeaponAzimuthInput(weapon.id)}
                                className={cn(
                                  "h-11 w-full rounded-2xl border bg-white px-3 pr-10 text-sm text-slate-950 outline-none transition",
                                  errors.weaponCoverageAzimuth[weapon.id]
                                    ? "border-rose-300 focus:border-rose-400"
                                    : "border-slate-200 focus:border-blue-300",
                                )}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                                °
                              </span>
                            </div>
                            <FieldError message={errors.weaponCoverageAzimuth[weapon.id]} />
                          </label>

                          <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Сектор
                            <div className="relative">
                              <input
                                type="number"
                                min={1}
                                max={360}
                                step={1}
                                inputMode="numeric"
                                value={
                                  coverageInputs[weapon.id]?.sectorWidthDeg ??
                                  String(weapon.coverageSectorWidthDeg ?? draft.sectorWidthDeg ?? 90)
                                }
                                onChange={(event) => handleWeaponSectorInput(weapon.id, event.target.value)}
                                onBlur={() => commitWeaponSectorInput(weapon.id)}
                                className={cn(
                                  "h-11 w-full rounded-2xl border bg-white px-3 pr-10 text-sm text-slate-950 outline-none transition",
                                  errors.weaponCoverageSectorWidthDeg[weapon.id]
                                    ? "border-rose-300 focus:border-rose-400"
                                    : "border-slate-200 focus:border-blue-300",
                                )}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                                °
                              </span>
                            </div>
                            <FieldError message={errors.weaponCoverageSectorWidthDeg[weapon.id]} />
                          </label>
                        </div>
                      ) : null}

                      {!isDisabled ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Это покрытие использует собственные азимут и сектор независимо от остальных типов оружия.
                        </p>
                      ) : null}

                      {isDisabled ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Добавьте количество, чтобы показать покрытие на карте.
                        </p>
                      ) : null}
                      <FieldError message={errors.weapons[weapon.id]} />
                    </article>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Легенда покрытий</p>
                {visibleCoverageWeapons.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {visibleCoverageWeapons.map((weapon) => (
                      <div key={weapon.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: MOG_WEAPON_COVERAGE_COLORS[weapon.id].stroke }}
                        />
                        <span>
                          {weapon.label} — {formatMogRange(weapon.rangeM)} · {weapon.coverageAzimuth ?? draft.azimuth}° /{" "}
                          {weapon.coverageSectorWidthDeg ?? draft.sectorWidthDeg ?? 90}°
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Покрытия на карте не выбраны.</p>
                )}
              </div>
            </EditorSection>

            <EditorSection title="Стоимость" eyebrow="Текущая оценка" tone="accent">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span>База поста</span>
                  <strong className="text-slate-950">{formatMogMoney(costSummary.baseMln)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span>Оснащение</span>
                  <strong className="text-slate-950">{formatMogMoney(costSummary.equipmentMln)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span>Оружие</span>
                  <strong className="text-slate-950">{formatMogMoney(costSummary.weaponsMln)}</strong>
                </div>
                <div className="border-t border-amber-200 pt-3">
                  <div className="flex items-center justify-between gap-3 text-base font-semibold text-slate-950">
                    <span>Итого</span>
                    <span>{formatMogMoney(costSummary.totalMln)}</span>
                  </div>
                  {costSummary.isEstimate ? (
                    <p className="mt-2 text-xs text-slate-600">
                      Итог пока учитывает базовую стоимость поста. Стоимость оснащения и оружия подключим отдельно, когда она появится в данных.
                    </p>
                  ) : null}
                </div>
              </div>
            </EditorSection>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
            {hasErrors ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
            <p>
              {hasErrors
                ? "Исправьте ошибки в форме, прежде чем сохранять объект."
                : "Каждое покрытие на карте обновляется сразу со своим азимутом и сектором. Сохранение фиксирует текущую конфигурацию, отмена возвращает исходный вариант."}
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-11 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={hasErrors || !isDirty}
              className="min-h-11 flex-1 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Сохранить изменения
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
