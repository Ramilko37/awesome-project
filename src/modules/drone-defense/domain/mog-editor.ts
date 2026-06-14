import {
  getMogWeaponCoverageSettings,
  getVisibleMogCoverageWeaponIds,
  normalizePlacedDefenseCompoundProfile,
} from "@/shared/lib/defense-project";
import type { DefenseAsset } from "@/shared/types/defense-project";
import type {
  MogEquipmentId,
  MogWeaponId,
  MogWeaponItem,
  PlacedDefenseCompoundProfile,
} from "@/shared/types/defense-configuration";
import { getVisibleMogCoverageWeapons } from "@/modules/drone-defense/domain/mog-coverage";

export type MogSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export type MogFieldErrors = {
  personnelCount?: string;
  equipment: Partial<Record<MogEquipmentId, string>>;
  weapons: Partial<Record<MogWeaponId, string>>;
  weaponCoverageAzimuth: Partial<Record<MogWeaponId, string>>;
  weaponCoverageSectorWidthDeg: Partial<Record<MogWeaponId, string>>;
};

export type MogCoverageInputMap = Partial<
  Record<
    MogWeaponId,
    {
      azimuth?: string;
      sectorWidthDeg?: string;
    }
  >
>;

export type MogCostSummary = {
  baseMln: number | null;
  equipmentMln: number | null;
  weaponsMln: number | null;
  totalMln: number | null;
  isEstimate: boolean;
};

export const MOG_POST_TYPE_OPTIONS: MogSelectOption[] = [
  { value: "МОГ", label: "МОГ", description: "мобильная огневая группа" },
  { value: "ПВН", label: "ПВН", description: "пост визуального наблюдения" },
  { value: "ГОР", label: "ГОР" },
  { value: "КПП", label: "КПП" },
  { value: "Другой пост", label: "Другой пост" },
];

export const MOG_ACCOUNTABILITY_OPTIONS: MogSelectOption[] = [
  { value: "Росгвардия", label: "Росгвардия" },
  { value: "МО", label: "МО", description: "Министерство обороны" },
  { value: "ЧОП", label: "ЧОП" },
];

export function formatMogOption(option: MogSelectOption): string {
  return option.description ? `${option.label} — ${option.description}` : option.label;
}

export function sanitizeMogCountInput(value: string): string {
  const sanitized = value.replace(/\D/g, "");
  return sanitized === "" ? "0" : sanitized;
}

export function parseMogCount(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  return Number(sanitizeMogCountInput(value ?? "0")) || 0;
}

export function clampMogAzimuth(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 359) return 359;
  return Math.trunc(value);
}

export function clampMogSector(value: number): number {
  if (!Number.isFinite(value)) return 90;
  if (value < 1) return 1;
  if (value > 360) return 360;
  return Math.trunc(value);
}

export function formatMogRange(rangeM: number): string {
  return rangeM >= 1000 ? `${rangeM / 1000} км` : `${rangeM} м`;
}

export function formatMogMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млн ₽`;
}

export function getAvailableMogCoverageWeapon(profile: PlacedDefenseCompoundProfile): MogWeaponItem | null {
  const normalized = normalizePlacedDefenseCompoundProfile(profile);
  const weapons = normalized.weapons ?? [];
  const selectedWeapon = weapons.find(
    (weapon) => weapon.id === normalized.coverageWeaponId && parseMogCount(weapon.quantity) > 0,
  );
  if (selectedWeapon) return selectedWeapon;
  return weapons.find((weapon) => parseMogCount(weapon.quantity) > 0) ?? null;
}

export function buildMogCoverageInputMap(profile: PlacedDefenseCompoundProfile): MogCoverageInputMap {
  const normalized = normalizePlacedDefenseCompoundProfile(profile);
  return Object.fromEntries(
    (normalized.weapons ?? []).map((weapon) => [
      weapon.id,
      {
        azimuth: String(weapon.coverageAzimuth ?? normalized.azimuth),
        sectorWidthDeg: String(weapon.coverageSectorWidthDeg ?? normalized.sectorWidthDeg ?? 90),
      },
    ]),
  ) as MogCoverageInputMap;
}

export function syncMogDraft(profile: PlacedDefenseCompoundProfile): PlacedDefenseCompoundProfile {
  const normalized = normalizePlacedDefenseCompoundProfile(profile);
  const visibleCoverageWeapons = getVisibleMogCoverageWeapons(normalized);
  const coverageWeapon = visibleCoverageWeapons.at(-1) ?? getAvailableMogCoverageWeapon(normalized);
  const coverageSettings = coverageWeapon
    ? getMogWeaponCoverageSettings(normalized, coverageWeapon.id)
    : {
        azimuth: clampMogAzimuth(normalized.azimuth),
        sectorWidthDeg: clampMogSector(normalized.sectorWidthDeg ?? 90),
      };

  return {
    ...normalized,
    azimuth: coverageSettings.azimuth,
    sectorWidthDeg: coverageSettings.sectorWidthDeg,
    coverageWeaponId: coverageWeapon?.id ?? normalized.coverageWeaponId,
    visibleCoverageWeaponIds: getVisibleMogCoverageWeaponIds(normalized),
    armament: coverageWeapon?.label ?? "Покрытие скрыто",
    weaponUnits: coverageWeapon?.quantity ?? "0",
    sectorOrRange: coverageWeapon
      ? `до ${formatMogRange(coverageWeapon.rangeM)}, сектор ${coverageSettings.sectorWidthDeg}°`
      : "Покрытие скрыто",
  };
}

export function validateMogDraft(args: {
  draft: PlacedDefenseCompoundProfile;
  coverageInputs?: MogCoverageInputMap;
}): MogFieldErrors {
  const { draft, coverageInputs } = args;
  const errors: MogFieldErrors = {
    equipment: {},
    weapons: {},
    weaponCoverageAzimuth: {},
    weaponCoverageSectorWidthDeg: {},
  };
  const personnel = parseMogCount(draft.personnelCount);
  if (!Number.isInteger(personnel) || personnel < 0) {
    errors.personnelCount = "Только целое число 0 и больше.";
  }

  draft.equipment?.forEach((item) => {
    const quantity = parseMogCount(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      errors.equipment[item.id] = "Количество не может быть отрицательным.";
    }
  });

  draft.weapons?.forEach((item) => {
    const quantity = parseMogCount(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      errors.weapons[item.id] = "Количество не может быть отрицательным.";
    }

    const azimuthText = coverageInputs?.[item.id]?.azimuth ?? String(item.coverageAzimuth ?? draft.azimuth);
    const azimuth = Number(azimuthText.replace(",", "."));
    if (!Number.isFinite(azimuth) || azimuth < 0 || azimuth > 359 || !Number.isInteger(azimuth)) {
      errors.weaponCoverageAzimuth[item.id] = "Азимут должен быть целым числом от 0 до 359°.";
    }

    const sectorText =
      coverageInputs?.[item.id]?.sectorWidthDeg ?? String(item.coverageSectorWidthDeg ?? draft.sectorWidthDeg ?? 90);
    const sector = Number(sectorText.replace(",", "."));
    if (!Number.isFinite(sector) || sector < 1 || sector > 360 || !Number.isInteger(sector)) {
      errors.weaponCoverageSectorWidthDeg[item.id] = "Сектор должен быть целым числом от 1 до 360°.";
    }
  });

  return errors;
}

export function hasMogErrors(errors: MogFieldErrors): boolean {
  return Boolean(
    errors.personnelCount ||
      Object.keys(errors.equipment).length ||
      Object.keys(errors.weapons).length ||
      Object.keys(errors.weaponCoverageAzimuth).length ||
      Object.keys(errors.weaponCoverageSectorWidthDeg).length,
  );
}

export function isMogDirty(initialProfile: PlacedDefenseCompoundProfile, currentProfile: PlacedDefenseCompoundProfile): boolean {
  return JSON.stringify(syncMogDraft(initialProfile)) !== JSON.stringify(syncMogDraft(currentProfile));
}

export function buildMogCostSummary(asset: DefenseAsset): MogCostSummary {
  const baseMln = asset.pricePerUnitMln ?? null;
  return {
    baseMln,
    equipmentMln: null,
    weaponsMln: null,
    totalMln: baseMln,
    isEstimate: baseMln !== null,
  };
}
