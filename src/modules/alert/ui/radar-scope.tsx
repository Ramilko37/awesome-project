"use client";

import type { ObjectKind } from "@/shared/types/defense";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RadarBlip = { angle: number; dist: number; id: string };

export type SensorReading = {
  kind: ObjectKind;
  blips?: RadarBlip[];
  targetSpeed?: number;
  targetAlt?: number;
  targetDist?: number;
  rfFrequency?: number;
  rfProtocol?: string;
  rfBearing?: number;
  rfStrength?: number;
  acousticLevel?: number;
  acousticBearing?: number;
  cameraAiLabel?: string;
  cameraConfidence?: number;
  cameraPtzAz?: number;
  cameraPtzEl?: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

export const mockSensorReadings: Record<string, SensorReading> = {
  "sensor-07": {
    kind: "sensor",
    blips: [{ angle: 42, dist: 0.62, id: "t1" }, { angle: 44, dist: 0.6, id: "t2" }],
    targetSpeed: 14,
    targetAlt: 48,
    targetDist: 186,
  },
  "sensor-02": {
    kind: "sensor",
    blips: [{ angle: 128, dist: 0.45, id: "t3" }],
    targetSpeed: 9,
    targetAlt: 32,
    targetDist: 240,
  },
  "sensor-11": {
    kind: "sensor",
    blips: [],
    targetSpeed: 0,
    targetAlt: 0,
    targetDist: 0,
  },
  "camera-04": {
    kind: "camera",
    cameraAiLabel: "Квадрокоптер DJI",
    cameraConfidence: 91,
    cameraPtzAz: 42,
    cameraPtzEl: 18,
  },
  "camera-09": {
    kind: "camera",
    cameraAiLabel: "Объект не идентифицирован",
    cameraConfidence: 34,
    cameraPtzAz: 215,
    cameraPtzEl: 7,
  },
  "sensor-01": {
    kind: "sensor",
    rfFrequency: 2437,
    rfProtocol: "DJI OcuSync 2.0",
    rfBearing: 312,
    rfStrength: -68,
  },
  "sensor-core": {
    kind: "sensor",
    blips: [{ angle: 290, dist: 0.55, id: "t4" }],
    targetSpeed: 6,
    targetAlt: 21,
    targetDist: 310,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RadarScope({ blips, sweep }: { blips: RadarBlip[]; sweep: number }) {
  const size = 260;
  const cx = size / 2;
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} className="block">
      <circle cx={cx} cy={cx} r={cx - 2} fill="#0a1628" stroke="#1e3a5f" strokeWidth={1} />

      {rings.map((r) => (
        <circle key={r} cx={cx} cy={cx} r={(cx - 2) * r}
          fill="none" stroke="#1e4d6b" strokeWidth={0.5} />
      ))}

      <line x1={cx} y1={2} x2={cx} y2={size - 2} stroke="#1e4d6b" strokeWidth={0.5} />
      <line x1={2} y1={cx} x2={size - 2} y2={cx} stroke="#1e4d6b" strokeWidth={0.5} />

      {[["С", cx, 10], ["Ю", cx, size - 4], ["З", 8, cx + 4], ["В", size - 6, cx + 4]].map(([l, x, y]) => (
        <text key={String(l)} x={Number(x)} y={Number(y)} fill="#38bdf8"
          fontSize={7} textAnchor="middle" fontFamily="monospace">{l}</text>
      ))}

      {(() => {
        const sweepRad = (sweep - 90) * (Math.PI / 180);
        const trailLen = 60;
        const r = cx - 2;
        const paths = Array.from({ length: 12 }, (_, i) => {
          const a = sweepRad - (i * trailLen / 12) * (Math.PI / 180);
          return `${cx + r * Math.cos(a)},${cx + r * Math.sin(a)}`;
        });
        return (
          <path d={`M ${cx},${cx} L ${paths.join(" L ")}`} fill="rgba(56,189,248,0.07)" />
        );
      })()}

      {(() => {
        const rad = (sweep - 90) * (Math.PI / 180);
        const r = cx - 2;
        return (
          <line x1={cx} y1={cx}
            x2={cx + r * Math.cos(rad)}
            y2={cx + r * Math.sin(rad)}
            stroke="#38bdf8" strokeWidth={1.5} opacity={0.9} />
        );
      })()}

      {blips.map((b) => {
        const rad = (b.angle - 90) * (Math.PI / 180);
        const r = (cx - 2) * b.dist;
        const bx = cx + r * Math.cos(rad);
        const by = cx + r * Math.sin(rad);
        return (
          <g key={b.id}>
            <circle cx={bx} cy={by} r={5} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <circle cx={bx} cy={by} r={2} fill="#f59e0b" />
            <circle cx={bx} cy={by} r={8} fill="none" stroke="#f59e0b" strokeWidth={0.5} opacity={0.4} />
          </g>
        );
      })}
    </svg>
  );
}
