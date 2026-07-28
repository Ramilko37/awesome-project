"use client";

import type { RadarBlip } from "./sensor-readings";

// ─── Types ────────────────────────────────────────────────────────────────────

const RADAR_RINGS = [0.25, 0.5, 0.75, 1];

// ─── Component ────────────────────────────────────────────────────────────────

export function RadarScope({ blips, sweep }: { blips: RadarBlip[]; sweep: number }) {
  const size = 260;
  const cx = size / 2;

  return (
    <svg width={size} height={size} className="block">
      <circle cx={cx} cy={cx} r={cx - 2} fill="#0a1628" stroke="#1e3a5f" strokeWidth={1} />

      {RADAR_RINGS.map((r) => (
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
