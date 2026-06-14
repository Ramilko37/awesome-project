import { getVisibleMogCoverageWeaponIds } from "@/shared/lib/defense-project";
import type {
  MogWeaponId,
  MogWeaponItem,
  PlacedDefenseCompoundProfile,
} from "@/shared/types/defense-configuration";

export type MogCoverageColor = {
  stroke: string;
  fill: string;
  lineRgba: [number, number, number, number];
  fillRgba: [number, number, number, number];
};

export const MOG_WEAPON_COVERAGE_COLORS: Record<MogWeaponId, MogCoverageColor> = {
  firearms: {
    stroke: "#2563EB",
    fill: "rgba(37, 99, 235, 0.14)",
    lineRgba: [37, 99, 235, 210],
    fillRgba: [37, 99, 235, 36],
  },
  antiDroneRifles: {
    stroke: "#7C3AED",
    fill: "rgba(124, 58, 237, 0.14)",
    lineRgba: [124, 58, 237, 210],
    fillRgba: [124, 58, 237, 36],
  },
  interceptorDrones: {
    stroke: "#F59E0B",
    fill: "rgba(245, 158, 11, 0.16)",
    lineRgba: [245, 158, 11, 220],
    fillRgba: [245, 158, 11, 42],
  },
};

export function getMogWeaponCoverageColor(weaponId: MogWeaponId): MogCoverageColor {
  return MOG_WEAPON_COVERAGE_COLORS[weaponId];
}

export function getVisibleMogCoverageWeapons(profile: PlacedDefenseCompoundProfile): MogWeaponItem[] {
  const weapons = profile.weapons ?? [];
  const visibleIds = new Set(getVisibleMogCoverageWeaponIds(profile));
  return weapons.filter((weapon) => visibleIds.has(weapon.id) && Number(weapon.quantity) > 0);
}
