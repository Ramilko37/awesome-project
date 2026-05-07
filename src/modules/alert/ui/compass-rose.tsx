"use client";

export function CompassRose({ bearing }: { bearing: number }) {
  const size = 240;
  const cx = size / 2;
  const r = cx - 10;
  const dirs = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];

  return (
    <svg width={size} height={size} className="block">
      <circle cx={cx} cy={cx} r={r} fill="#0a1628" stroke="#1e3a5f" strokeWidth={1} />

      {Array.from({ length: 36 }, (_, i) => {
        const a = (i * 10 - 90) * (Math.PI / 180);
        const inner = i % 3 === 0 ? r - 8 : r - 4;
        return (
          <line key={i}
            x1={cx + r * Math.cos(a)} y1={cx + r * Math.sin(a)}
            x2={cx + inner * Math.cos(a)} y2={cx + inner * Math.sin(a)}
            stroke="#1e4d6b" strokeWidth={i % 9 === 0 ? 1.5 : 0.5} />
        );
      })}

      {dirs.map((d, i) => {
        const a = (i * 45 - 90) * (Math.PI / 180);
        const tr = r - 16;
        return (
          <text key={d} x={cx + tr * Math.cos(a)} y={cx + tr * Math.sin(a) + 3}
            fill={d === "С" ? "#38bdf8" : "#64748b"}
            fontSize={7} textAnchor="middle" fontFamily="monospace">{d}</text>
        );
      })}

      {(() => {
        const rad = (bearing - 90) * (Math.PI / 180);
        const tip = r - 18;
        const base = 8;
        const tx = cx + tip * Math.cos(rad);
        const ty = cx + tip * Math.sin(rad);
        const lx = cx - base * Math.cos(rad - 0.4);
        const ly = cx - base * Math.sin(rad - 0.4);
        const rx = cx - base * Math.cos(rad + 0.4);
        const ry = cx - base * Math.sin(rad + 0.4);
        return (
          <g>
            <line x1={cx} y1={cx} x2={tx} y2={ty} stroke="#f59e0b" strokeWidth={2} />
            <polygon points={`${tx},${ty} ${lx},${ly} ${rx},${ry}`} fill="#f59e0b" opacity={0.8} />
            <circle cx={cx} cy={cx} r={3} fill="#38bdf8" />
            <circle cx={tx} cy={ty} r={5} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.6} />
          </g>
        );
      })()}

      <text x={cx} y={cx + 3} fill="#f59e0b" fontSize={10}
        textAnchor="middle" fontFamily="monospace" fontWeight="bold">
        {bearing}°
      </text>
    </svg>
  );
}
