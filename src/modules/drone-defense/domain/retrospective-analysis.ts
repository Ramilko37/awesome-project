export const retrospectiveEventTypes = ["detected", "engaged", "crashed"] as const;

export type RetrospectiveEventType = (typeof retrospectiveEventTypes)[number];

export type RetrospectivePoint = {
  x: number;
  y: number;
};

export type RetrospectiveEventPoints = Record<RetrospectiveEventType, RetrospectivePoint | null>;

export type RetrospectiveUavProfile = {
  id: string;
  label: string;
  speedKmH: number;
  speedMs: number;
  rangeM: number;
  payloadNote: string;
};

export const retrospectiveUavProfiles: RetrospectiveUavProfile[] = [
  {
    id: "fpv",
    label: "FPV",
    speedKmH: 180,
    speedMs: 50,
    rangeM: 35_000,
    payloadNote: "малый полезный груз",
  },
  {
    id: "fixed-wing",
    label: "Fixed-wing",
    speedKmH: 250,
    speedMs: 70,
    rangeM: 140_000,
    payloadNote: "средний полезный груз",
  },
  {
    id: "loitering-munition",
    label: "Loitering munition",
    speedKmH: 220,
    speedMs: 60,
    rangeM: 260_000,
    payloadNote: "средний/тяжёлый полезный груз",
  },
  {
    id: "swarm",
    label: "Swarm / light copter",
    speedKmH: 120,
    speedMs: 35,
    rangeM: 18_000,
    payloadNote: "низкий полезный груз",
  },
] ;

export const eventLabels: Record<RetrospectiveEventType, string> = {
  detected: "обнаружили",
  engaged: "воздействовали",
  crashed: "упало",
};

export const eventStatuses: Record<RetrospectiveEventType, string> = {
  detected: "Детекция цели",
  engaged: "Вмешательство",
  crashed: "Падение",
};

export const retrospectiveCanvas = {
  width: 1000,
  height: 560,
} as const;

export type RetrospectivePlausibility = "incomplete" | "range_exceeded" | "plausible";

export type RetrospectiveTelemetry = {
  detectedToEngagedDistanceM: number | null;
  engagedToCrashedDistanceM: number | null;
  totalPathLengthM: number | null;
  estimatedFlightTimeS: number | null;
  plausibility: RetrospectivePlausibility;
  plausibilityText: string;
  isPlausible: boolean;
  profileLabel: string;
};

export function createRetrospectiveEmptyPoints(): RetrospectiveEventPoints {
  return {
    detected: null,
    engaged: null,
    crashed: null,
  };
}

export function getRetrospectiveUavProfile(id: string) {
  return (
    retrospectiveUavProfiles.find((item) => item.id === id) ??
    retrospectiveUavProfiles[0] ?? {
      id: "fpv",
      label: "FPV",
      speedKmH: 180,
      speedMs: 50,
      rangeM: 35_000,
      payloadNote: "малый полезный груз",
    }
  );
}

export function buildPresetRetrospectivePoints(): RetrospectiveEventPoints {
  return {
    detected: { x: 175, y: 170 },
    engaged: { x: 365, y: 250 },
    crashed: { x: 560, y: 445 },
  };
}

export function calculateRetrospectiveDistance(from: RetrospectivePoint, to: RetrospectivePoint): number {
  return Math.hypot(from.x - to.x, from.y - to.y);
}

export function formatRetrospectiveDistance(distanceM: number | null): string {
  if (distanceM === null || Number.isNaN(distanceM)) return "—";
  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} км`;
  }
  return `${distanceM.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} м`;
}

export function formatRetrospectiveFlightTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const rounded = Math.max(0, Math.round(seconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hours > 0) {
    return `${hours} ч ${minutes} мин ${secs} с`;
  }
  if (minutes > 0) {
    return `${minutes} мин ${secs} с`;
  }
  return `${secs} с`;
}

export function calculateRetrospectiveTelemetry(profileId: string, points: RetrospectiveEventPoints): RetrospectiveTelemetry {
  const profile = getRetrospectiveUavProfile(profileId);
  const detectedToEngagedDistanceM =
    points.detected && points.engaged ? calculateRetrospectiveDistance(points.detected, points.engaged) : null;
  const engagedToCrashedDistanceM =
    points.engaged && points.crashed ? calculateRetrospectiveDistance(points.engaged, points.crashed) : null;
  const totalPathLengthM =
    detectedToEngagedDistanceM === null || engagedToCrashedDistanceM === null
      ? null
      : detectedToEngagedDistanceM + engagedToCrashedDistanceM;
  const estimatedFlightTimeS = totalPathLengthM === null ? null : totalPathLengthM / profile.speedMs;

  if (!points.detected || !points.engaged || !points.crashed || totalPathLengthM === null) {
    return {
      detectedToEngagedDistanceM,
      engagedToCrashedDistanceM,
      totalPathLengthM,
      estimatedFlightTimeS,
      plausibility: "incomplete",
      plausibilityText: "Нужно отметить все три события: обнаружили, воздействовали, упало.",
      isPlausible: false,
      profileLabel: profile.label,
    };
  }

  if (totalPathLengthM > profile.rangeM) {
    return {
      detectedToEngagedDistanceM,
      engagedToCrashedDistanceM,
      totalPathLengthM,
      estimatedFlightTimeS,
      plausibility: "range_exceeded",
      plausibilityText: `Маршрут (${formatRetrospectiveDistance(totalPathLengthM)}) выходит за заявленный профиль (${formatRetrospectiveDistance(profile.rangeM)}).`,
      isPlausible: false,
      profileLabel: profile.label,
    };
  }

  return {
    detectedToEngagedDistanceM,
    engagedToCrashedDistanceM,
    totalPathLengthM,
    estimatedFlightTimeS,
    plausibility: "plausible",
    plausibilityText: "Маршрут в пределах заявленного радиуса и скорости выбранного профиля.",
    isPlausible: true,
    profileLabel: profile.label,
  };
}

export const DEFAULT_RETROSPECTIVE_PROFILE_ID = retrospectiveUavProfiles[0].id;
