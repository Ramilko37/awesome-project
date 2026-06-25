"use client";

import { useState, type CSSProperties } from "react";

/**
 * Faithful, self-contained reproduction of the Fortis Studio reference mock
 * (the provided HTML образец): dark topbar with the "F" logo and 3 tabs, an
 * echelon tree / library on the left, a radar-style coverage visualization in
 * the center, and an object inspector on the right, plus the calculator view.
 *
 * Styling is kept as inline styles to stay pixel-identical to the reference.
 * Fonts map onto the next/font CSS variables defined on <html> in the root layout.
 */

const SYNE = "var(--font-syne), sans-serif";
const SANS = "var(--font-manrope), system-ui, sans-serif";
const MONO = "var(--font-ibm-plex-mono), monospace";

type Status = "active" | "planned" | "off";

interface Echelon {
  code: string;
  name: string;
  range: string;
  color: string;
  r: number;
}

interface DefObject {
  id: string;
  layer: string;
  name: string;
  glyph: string;
  deg: number;
  az: number;
  sector: number;
  range: number;
  cost: number;
  qty: number;
  status: Status;
  score: number;
  lat: string;
  lng: string;
  notes: string;
  conflict?: boolean;
}

interface LibraryItem {
  glyph: string;
  name: string;
  meta: string;
}

interface LibraryGroup {
  title: string;
  items: LibraryItem[];
}

const ECHELONS: Echelon[] = [
  { code: "L1", name: "Внешнее предупреждение", range: "60–120 км", color: "#2563eb", r: 382 },
  { code: "L2", name: "Обнаружение", range: "30–60 км", color: "#0891b2", r: 332 },
  { code: "L3", name: "Идентификация", range: "15–30 км", color: "#0d9488", r: 286 },
  { code: "L4", name: "Подавление", range: "8–15 км", color: "#059669", r: 242 },
  { code: "L5", name: "Средний рубеж", range: "4–8 км", color: "#65a30d", r: 198 },
  { code: "L6", name: "Последний рубеж", range: "1,5–4 км", color: "#ca8a04", r: 154 },
  { code: "L7", name: "Срыв точности", range: "0,5–1,5 км", color: "#ea580c", r: 112 },
  { code: "L8", name: "Пассивная защита", range: "100–500 м", color: "#dc2626", r: 72 },
  { code: "L9", name: "Hardening", range: "0–100 м", color: "#7c3aed", r: 36 },
];

const SEED: DefObject[] = [
  { id: "o1", layer: "L2", name: "Оптико-электронные системы", glyph: "ОЭ", deg: 55, az: 60, sector: 90, range: 42, cost: 12, qty: 1, status: "active", score: 79, lat: "55.1421", lng: "37.0312", notes: "" },
  { id: "o2", layer: "L2", name: "Тепловизионные системы", glyph: "ТВ", deg: 118, az: 130, sector: 80, range: 38, cost: 10, qty: 1, status: "active", score: 77, lat: "55.0712", lng: "37.1620", notes: "" },
  { id: "o3", layer: "L3", name: "Мобильная РЛС обзора", glyph: "РЛС", deg: 92, az: 90, sector: 120, range: 25, cost: 20, qty: 1, status: "active", score: 79, lat: "55.0998", lng: "37.1810", notes: "" },
  { id: "o4", layer: "L4", name: "РЭБ узкополосный (GNSS)", glyph: "РЭБ", deg: 208, az: 220, sector: 140, range: 14, cost: 15, qty: 1, status: "active", score: 78, lat: "55.0610", lng: "37.0540", notes: "" },
  { id: "o5", layer: "L4", name: "GPS-спуферы", glyph: "GPS", deg: 252, az: 250, sector: 100, range: 12, cost: 9, qty: 2, status: "planned", score: 74, lat: "55.0720", lng: "37.0210", notes: "" },
  { id: "o6", layer: "L5", name: "МОГ — пост №1", glyph: "МОГ", deg: 35, az: 40, sector: 70, range: 7, cost: 18, qty: 1, status: "active", score: 74, lat: "55.1180", lng: "37.1240", notes: "" },
  { id: "o7", layer: "L5", name: "МОГ — пост №2", glyph: "МОГ", deg: 328, az: 320, sector: 70, range: 7, cost: 18, qty: 1, status: "active", score: 72, lat: "55.1230", lng: "37.0810", notes: "", conflict: true },
  { id: "o8", layer: "L5", name: "Турельный комплекс", glyph: "КИН", deg: 158, az: 165, sector: 60, range: 6, cost: 32.9, qty: 1, status: "active", score: 80, lat: "55.0790", lng: "37.1450", notes: "" },
  { id: "o9", layer: "L6", name: "Дроны-перехватчики", glyph: "ДРН", deg: 285, az: 285, sector: 45, range: 3, cost: 7, qty: 1, status: "planned", score: 74, lat: "55.0930", lng: "37.0680", notes: "" },
];

const LIBRARY: LibraryGroup[] = [
  {
    title: "Обнаружение",
    items: [
      { glyph: "ОЭ", name: "Оптико-электронные системы", meta: "12 млн · 30–60 км" },
      { glyph: "ТВ", name: "Тепловизионные системы", meta: "10 млн · 30–60 км" },
      { glyph: "РЛС", name: "РЛС обзорная", meta: "20 млн · 15–30 км" },
      { glyph: "АК", name: "Акустические массивы", meta: "6 млн · 8–15 км" },
    ],
  },
  {
    title: "РЭБ / Подавление",
    items: [
      { glyph: "РЭБ", name: "РЭБ узкополосный (GNSS)", meta: "15 млн · 8–15 км" },
      { glyph: "РЭБ", name: "РЭБ широкополосный", meta: "18 млн · 8–15 км" },
      { glyph: "GPS", name: "GPS-спуферы", meta: "9 млн · 8–15 км" },
    ],
  },
  {
    title: "Огневое поражение",
    items: [
      { glyph: "КИН", name: "Турельный комплекс", meta: "32,9 млн · 4–8 км" },
      { glyph: "ДРН", name: "Дроны-перехватчики", meta: "7 млн · 1,5–4 км" },
      { glyph: "МОГ", name: "МОГ — мобильная группа", meta: "18 млн · 4–8 км" },
    ],
  },
  {
    title: "Пассивная защита",
    items: [
      { glyph: "ФБС", name: "ФБС-ограждение", meta: "8 млн · 100–500 м" },
      { glyph: "СЕТ", name: "Сеточная тросовая завеса", meta: "6 млн · 0–100 м" },
    ],
  },
];

const STATUS_MAP: Record<Status, [string, string, string]> = {
  active: ["Активен", "#047857", "#d1fae5"],
  planned: ["План", "#475569", "#f1f5f9"],
  off: ["Отключён", "#b91c1c", "#fee2e2"],
};

function fmt(n: number): string {
  const v = Math.round(n * 10) / 10;
  return (Number.isInteger(v) ? v : v.toFixed(1)).toString().replace(".", ",");
}

function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [400 + r * Math.sin(a), 400 - r * Math.cos(a)];
}

const SCOPED_CSS = `
.fsx-root *{box-sizing:border-box}
.fsx-root ::-webkit-scrollbar{width:8px;height:8px}
.fsx-root ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px}
.fsx-root ::-webkit-scrollbar-track{background:transparent}
@keyframes fsx-fpulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.7;transform:scale(1.25)}}
.fsx-icbtn:hover{background:#334155 !important;color:#e2e8f0 !important}
.fsx-save:hover{background:#1d4ed8 !important}
.fsx-exp:hover{background:#334155 !important}
.fsx-objrow:hover{background:#f1f5f9 !important}
.fsx-libitem:hover{border-color:#bfdbfe !important;background:#f8fafc !important}
.fsx-tool:hover{background:#f1f5f9 !important}
.fsx-locate:hover{background:#f8fafc !important}
.fsx-remove:hover{background:#fef2f2 !important}
.fsx-input:focus{border-color:#2563eb !important}
`;

export function FortisStudioPrototype() {
  const [view, setView] = useState<"studio" | "calc">("studio");
  const [leftTab, setLeftTab] = useState<"echelons" | "library">("echelons");
  const [selectedLayer, setSelectedLayer] = useState<string>("L5");
  const [selectedId, setSelectedId] = useState<string | null>("o6");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ L2: true, L4: true, L5: true });
  const [coverage, setCoverage] = useState(true);
  const [labels, setLabels] = useState(false);
  const [constraints, setConstraints] = useState(true);
  const [objects, setObjects] = useState<DefObject[]>(() => SEED.map((o) => ({ ...o })));

  const selO = objects.find((o) => o.id === selectedId) ?? null;
  const selE = selO ? ECHELONS.find((e) => e.code === selO.layer) ?? null : null;
  const selLayer = ECHELONS.find((e) => e.code === selectedLayer) ?? null;

  const placedCount = objects.length;
  const totalNum = objects.reduce((a, o) => a + o.cost * o.qty, 0);
  const totalMln = fmt(totalNum);
  const remaining = fmt(9300 - totalNum);

  function selectObj(id: string) {
    const o = objects.find((x) => x.id === id);
    setSelectedId(id);
    if (o) setSelectedLayer(o.layer);
  }

  function patchSel(patch: Partial<DefObject>) {
    setObjects((prev) => prev.map((o) => (o.id === selectedId ? { ...o, ...patch } : o)));
  }

  // ── Radar visualization ────────────────────────────────────────────────
  const rings = ECHELONS.map((e) => {
    const on = e.code === selectedLayer;
    return (
      <circle
        key={`r${e.code}`}
        cx={400}
        cy={400}
        r={e.r}
        fill={e.color}
        fillOpacity={on ? 0.14 : 0.045}
        stroke={e.color}
        strokeOpacity={on ? 0.85 : 0.22}
        strokeWidth={on ? 2 : 1}
      />
    );
  });

  const coverageSectors =
    coverage &&
    objects.map((o) => {
      const e = ECHELONS.find((x) => x.code === o.layer);
      if (!e) return null;
      const r = e.r + 16;
      const a1 = o.az - o.sector / 2;
      const a2 = o.az + o.sector / 2;
      const [x1, y1] = polar(r, a1);
      const [x2, y2] = polar(r, a2);
      const large = o.sector > 180 ? 1 : 0;
      return (
        <path
          key={`c${o.id}`}
          d={`M400 400 L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`}
          fill={e.color}
          fillOpacity={o.id === selectedId ? 0.22 : 0.1}
          stroke={e.color}
          strokeOpacity={0.25}
          strokeWidth={1}
        />
      );
    });

  const markers = objects.map((o) => {
    const e = ECHELONS.find((x) => x.code === o.layer);
    if (!e) return null;
    const [x, y] = polar(e.r, o.deg);
    const isSel = o.id === selectedId;
    const stroke = o.conflict
      ? "#f59e0b"
      : o.status === "active"
        ? "#10b981"
        : o.status === "planned"
          ? "#94a3b8"
          : "#64748b";
    const showLabel = labels || isSel;
    const w = Math.max(58, o.name.length * 6.0 + 18);
    return (
      <g key={`m${o.id}`}>
        {isSel && (
          <circle cx={x} cy={y} r={23} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeOpacity={0.9} />
        )}
        <rect
          x={x - 17}
          y={y - 12}
          width={34}
          height={24}
          rx={7}
          fill="#0f172a"
          stroke={isSel ? "#2563eb" : stroke}
          strokeWidth={isSel ? 2 : 1.5}
        />
        <text
          x={x}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={9}
          fontFamily={MONO}
          fontWeight={600}
        >
          {o.glyph}
        </text>
        <circle cx={x + 15} cy={y - 10} r={3.5} fill={stroke} stroke="#fff" strokeWidth={1} />
        {showLabel && (
          <g>
            <rect x={x + 22} y={y - 12} width={w} height={24} rx={6} fill="#0f172a" opacity={0.94} />
            <text x={x + 30} y={y + 1} dominantBaseline="middle" fill="#fff" fontSize={10} fontFamily={SANS} fontWeight={600}>
              {o.name}
            </text>
          </g>
        )}
        <circle cx={x} cy={y} r={18} fill="transparent" style={{ cursor: "pointer" }} onClick={() => selectObj(o.id)} />
      </g>
    );
  });

  const mapSvg = (
    <svg viewBox="0 0 800 800" width="100%" height="100%" style={{ display: "block" }}>
      {rings}
      {coverageSectors}
      {markers}
      <circle
        cx={400}
        cy={400}
        r={14}
        fill="#2563eb"
        fillOpacity={0.25}
        style={{ transformOrigin: "400px 400px", animation: "fsx-fpulse 2.4s ease-in-out infinite" }}
      />
      <rect x={392} y={392} width={16} height={16} rx={3} fill="#2563eb" stroke="#fff" strokeWidth={2} transform="rotate(45 400 400)" />
    </svg>
  );

  // ── Warnings ───────────────────────────────────────────────────────────
  const warnings = [
    { icon: "◷", text: "Бюджет: 142 из 9 300 млн ₽ · остаток 9 158 млн", bg: "#eff6ff", border: "#dbeafe", textCol: "#1e3a8a" },
    { icon: "⚠", text: "Слепой сектор: направление 215–255° (жилая застройка)", bg: "#fffbeb", border: "#fde68a", textCol: "#92400e" },
    { icon: "⚠", text: "Конфликт геометрии: МОГ — пост №2 перекрывает соседний пост", bg: "#fef2f2", border: "#fecaca", textCol: "#991b1b" },
  ];

  // ── Calculator rows ────────────────────────────────────────────────────
  const calcRows = ECHELONS.filter((e) => objects.some((o) => o.layer === e.code)).map((e) => {
    const items = objects.filter((o) => o.layer === e.code);
    const total = items.reduce((a, o) => a + o.cost * o.qty, 0);
    return {
      code: e.code,
      name: e.name,
      range: e.range,
      color: e.color,
      total: fmt(total),
      items: items.map((o) => ({
        name: o.name,
        unit: "×" + o.qty,
        line: fmt(o.cost * o.qty),
        statusCol: o.status === "active" ? "#10b981" : "#94a3b8",
      })),
    };
  });

  const tabColor = (on: boolean) => (on ? "#0f172a" : "#64748b");
  const sm = selO ? STATUS_MAP[selO.status] ?? STATUS_MAP.active : STATUS_MAP.active;
  const stBtn = (target: Status) => !!selO && selO.status === target;

  const inputStyle: CSSProperties = {
    width: "100%",
    height: 34,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "0 10px",
    fontFamily: MONO,
    fontSize: 12,
    outline: "none",
  };

  return (
    <div
      className="fsx-root"
      style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#f1f5f9", fontFamily: SANS, color: "#0f172a" }}
    >
      <style>{SCOPED_CSS}</style>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "center", gap: 18, height: 54, padding: "0 18px", background: "#0f172a", color: "#e2e8f0", flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#2563eb", display: "grid", placeItems: "center", fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: "#fff" }}>F</div>
          <span style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, letterSpacing: ".02em" }}>FORTIS</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#64748b", letterSpacing: ".18em", textTransform: "uppercase" }}>Studio</span>
        </div>

        <nav style={{ display: "flex", gap: 2, background: "#1e293b", borderRadius: 9, padding: 3 }}>
          <button onClick={() => setView("studio")} style={{ position: "relative", border: 0, background: "transparent", color: "#cbd5e1", font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}>
            {view === "studio" && <span style={{ position: "absolute", inset: 0, background: "#2563eb", borderRadius: 6 }} />}
            <span style={{ position: "relative" }}>Карта защиты</span>
          </button>
          <button onClick={() => setView("calc")} style={{ position: "relative", border: 0, background: "transparent", color: "#cbd5e1", font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}>
            {view === "calc" && <span style={{ position: "absolute", inset: 0, background: "#2563eb", borderRadius: 6 }} />}
            <span style={{ position: "relative" }}>Калькулятор</span>
          </button>
          <button style={{ position: "relative", border: 0, background: "transparent", color: "#475569", font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 14px", borderRadius: 6, cursor: "not-allowed", display: "flex", alignItems: "center", gap: 6 }}>
            Сценарии <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 600, background: "#334155", color: "#94a3b8", padding: "1px 5px", borderRadius: 4, letterSpacing: ".06em" }}>BETA</span>
          </button>
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#38bdf8" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>Завод Альфа</span>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#64748b" }}>· Вариант A</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 3 }}>
          <button className="fsx-icbtn" title="Отменить" style={{ border: 0, background: "transparent", color: "#94a3b8", font: "inherit", fontSize: 14, width: 30, height: 28, borderRadius: 5, cursor: "pointer" }}>↺</button>
          <button className="fsx-icbtn" title="Повторить" style={{ border: 0, background: "transparent", color: "#94a3b8", font: "inherit", fontSize: 14, width: 30, height: 28, borderRadius: 5, cursor: "pointer" }}>↻</button>
        </div>

        <button className="fsx-save" style={{ display: "flex", alignItems: "center", gap: 8, border: 0, background: "#2563eb", color: "#fff", font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>
          Сохранить
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24" }} />
        </button>
        <button className="fsx-exp" title="Экспорт отчёта" style={{ border: "1px solid #334155", background: "#1e293b", color: "#cbd5e1", font: "inherit", fontSize: 14, padding: "8px 11px", borderRadius: 8, cursor: "pointer" }}>⤓</button>
      </header>

      {/* ── STUDIO body ─────────────────────────────────────── */}
      {view === "studio" && (
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Left panel */}
          <aside style={{ width: 312, flex: "none", background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", gap: 3, padding: "10px 12px 0" }}>
              <button onClick={() => setLeftTab("echelons")} style={{ position: "relative", flex: 1, border: 0, background: "transparent", font: "inherit", fontSize: 12, fontWeight: 700, padding: "8px 0 11px", color: "#64748b", cursor: "pointer" }}>
                {leftTab === "echelons" && <span style={{ position: "absolute", left: 8, right: 8, bottom: 0, height: 2.5, background: "#2563eb", borderRadius: 2 }} />}
                <span style={{ position: "relative", color: tabColor(leftTab === "echelons") }}>Эшелоны</span>
              </button>
              <button onClick={() => setLeftTab("library")} style={{ position: "relative", flex: 1, border: 0, background: "transparent", font: "inherit", fontSize: 12, fontWeight: 700, padding: "8px 0 11px", color: "#64748b", cursor: "pointer" }}>
                {leftTab === "library" && <span style={{ position: "absolute", left: 8, right: 8, bottom: 0, height: 2.5, background: "#2563eb", borderRadius: 2 }} />}
                <span style={{ position: "relative", color: tabColor(leftTab === "library") }}>Библиотека</span>
              </button>
            </div>
            <div style={{ height: 1, background: "#e2e8f0" }} />

            <div style={{ padding: "12px 12px 8px" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}>⌕</span>
                <input
                  placeholder={leftTab === "library" ? "Найти средство…" : "Найти эшелон или объект…"}
                  className="fsx-input"
                  style={{ width: "100%", height: 36, border: "1px solid #e2e8f0", borderRadius: 9, padding: "0 12px 0 30px", font: "inherit", fontSize: 13, outline: "none", background: "#f8fafc" }}
                />
              </div>
            </div>

            {/* Echelon tree */}
            {leftTab === "echelons" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "2px 10px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px 8px" }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#94a3b8" }}>9 рубежей обороны</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: "#94a3b8" }}>{placedCount} объектов</span>
                </div>
                {ECHELONS.map((e) => {
                  const items = objects.filter((o) => o.layer === e.code);
                  const on = e.code === selectedLayer;
                  const isExpanded = !!expanded[e.code];
                  return (
                    <div key={e.code} style={{ borderRadius: 10, marginBottom: 3, overflow: "hidden", border: `1px solid ${on ? "#bfdbfe" : "#eef2f7"}`, background: on ? "#f5f9ff" : "#fff" }}>
                      <div
                        onClick={() => {
                          setSelectedLayer(e.code);
                          setExpanded((st) => ({ ...st, [e.code]: !st[e.code] }));
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", cursor: "pointer" }}
                      >
                        <span style={{ width: 9, height: 9, borderRadius: 3, flex: "none", background: e.color }} />
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: on ? "#2563eb" : "#64748b", flex: "none", width: 20 }}>{e.code}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
                          <div style={{ fontFamily: MONO, fontSize: 10, color: "#94a3b8" }}>{e.range}</div>
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: items.length ? "#0f172a" : "#94a3b8", background: items.length ? "#f1f5f9" : "#f8fafc", borderRadius: 6, padding: "2px 7px", flex: "none" }}>{items.length}</span>
                        <span style={{ color: "#cbd5e1", fontSize: 10, flex: "none", width: 10, display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: "0 8px 8px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
                          {items.map((o) => (
                            <div
                              key={o.id}
                              className="fsx-objrow"
                              onClick={() => selectObj(o.id)}
                              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8, cursor: "pointer", background: o.id === selectedId ? "#eff6ff" : "#f8fafc", border: `1px solid ${o.id === selectedId ? "#bfdbfe" : "transparent"}` }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", flex: "none", background: o.conflict ? "#f59e0b" : o.status === "active" ? "#10b981" : "#94a3b8" }} />
                              <span style={{ fontSize: 12, color: "#1e293b", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</span>
                              {o.conflict && <span style={{ color: "#f59e0b", fontSize: 12, flex: "none" }}>⚠</span>}
                              <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#94a3b8", flex: "none" }}>{fmt(o.cost * o.qty)} млн</span>
                            </div>
                          ))}
                          {items.length === 0 && (
                            <div style={{ fontSize: 11.5, color: "#94a3b8", padding: "7px 9px", textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: 8 }}>Нет средств на рубеже</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Library */}
            {leftTab === "library" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "2px 10px 16px" }}>
                {LIBRARY.map((g) => (
                  <div key={g.title} style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#94a3b8", padding: "4px 4px 7px" }}>{g.title}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {g.items.map((it, i) => (
                        <div key={`${g.title}-${i}`} className="fsx-libitem" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", cursor: "grab" }}>
                          <span style={{ width: 30, height: 30, borderRadius: 8, flex: "none", background: "#0f172a", color: "#fff", display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 9, fontWeight: 600 }}>{it.glyph}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                            <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#94a3b8" }}>{it.meta}</div>
                          </div>
                          <span style={{ color: "#cbd5e1", fontSize: 15, flex: "none" }}>⠿</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Center map */}
          <main style={{ position: "relative", flex: 1, minWidth: 0, background: "radial-gradient(circle at 50% 46%, #eef4fb 0%, #e3eaf2 55%, #dbe3ee 100%)", overflow: "hidden" }}>
            {/* top floating controls */}
            <div style={{ position: "absolute", left: 16, top: 14, right: 16, zIndex: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, pointerEvents: "none" }}>
              <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 11, background: "rgba(255,255,255,.94)", border: "1px solid #e2e8f0", borderRadius: 11, padding: "9px 13px", boxShadow: "0 4px 16px rgba(15,23,42,.08)", backdropFilter: "blur(6px)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: selLayer ? selLayer.color : "#2563eb" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{selLayer ? `${selLayer.code} · ${selLayer.name}` : "Эшелон не выбран"}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#94a3b8" }}>Выберите средство и кликните по карте</div>
                </div>
              </div>
              <div style={{ pointerEvents: "auto", display: "flex", gap: 4, background: "rgba(255,255,255,.94)", border: "1px solid #e2e8f0", borderRadius: 11, padding: 5, boxShadow: "0 4px 16px rgba(15,23,42,.08)", backdropFilter: "blur(6px)" }}>
                <button onClick={() => setCoverage((v) => !v)} style={{ border: 0, font: "inherit", fontSize: 11.5, fontWeight: 600, padding: "7px 11px", borderRadius: 7, cursor: "pointer", color: coverage ? "#fff" : "#64748b", background: coverage ? "#2563eb" : "transparent" }}>Покрытие</button>
                <button onClick={() => setLabels((v) => !v)} style={{ border: 0, font: "inherit", fontSize: 11.5, fontWeight: 600, padding: "7px 11px", borderRadius: 7, cursor: "pointer", color: labels ? "#fff" : "#64748b", background: labels ? "#2563eb" : "transparent" }}>Подписи</button>
                <button onClick={() => setConstraints((v) => !v)} style={{ border: 0, font: "inherit", fontSize: 11.5, fontWeight: 600, padding: "7px 11px", borderRadius: 7, cursor: "pointer", color: constraints ? "#fff" : "#64748b", background: constraints ? "#2563eb" : "transparent" }}>Ограничения</button>
                <div style={{ width: 1, background: "#e2e8f0", margin: "3px 2px" }} />
                <button className="fsx-tool" title="Линейка" style={{ border: 0, font: "inherit", fontSize: 13, padding: "7px 10px", borderRadius: 7, cursor: "pointer", color: "#64748b", background: "transparent" }}>📐</button>
                <button className="fsx-tool" title="Приблизить" style={{ border: 0, font: "inherit", fontSize: 14, padding: "7px 10px", borderRadius: 7, cursor: "pointer", color: "#64748b", background: "transparent" }}>＋</button>
                <button className="fsx-tool" title="Отдалить" style={{ border: 0, font: "inherit", fontSize: 14, padding: "7px 10px", borderRadius: 7, cursor: "pointer", color: "#64748b", background: "transparent" }}>－</button>
              </div>
            </div>

            {/* map viz */}
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <div style={{ width: "min(86vh,720px)", height: "min(86vh,720px)", maxWidth: "100%" }}>{mapSvg}</div>
            </div>

            {/* warnings overlay */}
            <div style={{ position: "absolute", left: 16, bottom: 46, zIndex: 20, display: "flex", flexDirection: "column", gap: 7, maxWidth: 340 }}>
              {warnings.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 12px", borderRadius: 10, background: w.bg, border: `1px solid ${w.border}`, boxShadow: "0 4px 14px rgba(15,23,42,.08)" }}>
                  <span style={{ fontSize: 13, lineHeight: 1.2, flex: "none" }}>{w.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: w.textCol, lineHeight: 1.35 }}>{w.text}</span>
                </div>
              ))}
            </div>

            {/* bottom status bar */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 15, display: "flex", alignItems: "center", gap: 18, height: 30, padding: "0 16px", background: "rgba(15,23,42,.92)", color: "#94a3b8", fontFamily: MONO, fontSize: 10.5, backdropFilter: "blur(4px)" }}>
              <span>55.1042°N · 37.0976°E</span>
              <span style={{ color: "#475569" }}>|</span>
              <span>Масштаб 1:240 000</span>
              <span style={{ color: "#475569" }}>|</span>
              <span>{placedCount} объектов · {totalMln} млн</span>
              <span style={{ flex: 1 }} />
              <span style={{ color: "#fbbf24" }}>● черновик</span>
              <span style={{ color: "#475569" }}>|</span>
              <span>сохранено 14:32</span>
            </div>
          </main>

          {/* Right inspector */}
          <aside style={{ width: 328, flex: "none", background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {selO ? (
              <>
                <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#2563eb", fontWeight: 600 }}>Инспектор объекта</span>
                    <button onClick={() => setSelectedId(null)} style={{ border: 0, background: "transparent", color: "#94a3b8", font: "inherit", fontSize: 15, cursor: "pointer", padding: "0 2px" }}>✕</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 11 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 9, flex: "none", background: "#0f172a", color: "#fff", display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 10, fontWeight: 600 }}>{selO.glyph}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{selO.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{selE ? `${selE.code} · ${selE.name}` : "—"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: sm[1], background: sm[2], padding: "4px 10px", borderRadius: 7 }}>{sm[0]}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: "#0f172a", background: "#f1f5f9", padding: "4px 10px", borderRadius: 7 }}>балл {selO.score}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: "#0f172a", background: "#eff6ff", padding: "4px 10px", borderRadius: 7 }}>{fmt(selO.cost * selO.qty)} млн</span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 10 }}>Геометрия размещения</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Широта</span>
                      <input value={selO.lat} onChange={(e) => patchSel({ lat: e.target.value })} className="fsx-input" style={inputStyle} />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Долгота</span>
                      <input value={selO.lng} onChange={(e) => patchSel({ lng: e.target.value })} className="fsx-input" style={inputStyle} />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Азимут, °</span>
                      <input value={selO.az} type="number" onChange={(e) => patchSel({ az: Number(e.target.value) || 0 })} className="fsx-input" style={inputStyle} />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Сектор, °</span>
                      <input value={selO.sector} type="number" onChange={(e) => patchSel({ sector: Number(e.target.value) || 0 })} className="fsx-input" style={inputStyle} />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Дальность, км</span>
                      <input value={selO.range} type="number" onChange={(e) => patchSel({ range: Number(e.target.value) || 0 })} className="fsx-input" style={inputStyle} />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Кол-во, ед.</span>
                      <input value={selO.qty} type="number" onChange={(e) => patchSel({ qty: Math.max(1, Number(e.target.value) || 1) })} className="fsx-input" style={inputStyle} />
                    </label>
                  </div>

                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#94a3b8", margin: "18px 0 10px" }}>Статус</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => patchSel({ status: "active" })} style={{ flex: 1, border: `1px solid ${stBtn("active") ? "#10b981" : "#e2e8f0"}`, background: stBtn("active") ? "#d1fae5" : "#fff", color: stBtn("active") ? "#047857" : "#64748b", font: "inherit", fontSize: 12, fontWeight: 600, padding: "8px 0", borderRadius: 8, cursor: "pointer" }}>Активен</button>
                    <button onClick={() => patchSel({ status: "planned" })} style={{ flex: 1, border: `1px solid ${stBtn("planned") ? "#94a3b8" : "#e2e8f0"}`, background: stBtn("planned") ? "#f1f5f9" : "#fff", color: stBtn("planned") ? "#334155" : "#64748b", font: "inherit", fontSize: 12, fontWeight: 600, padding: "8px 0", borderRadius: 8, cursor: "pointer" }}>План</button>
                    <button onClick={() => patchSel({ status: "off" })} style={{ flex: 1, border: `1px solid ${stBtn("off") ? "#f87171" : "#e2e8f0"}`, background: stBtn("off") ? "#fee2e2" : "#fff", color: stBtn("off") ? "#b91c1c" : "#64748b", font: "inherit", fontSize: 12, fontWeight: 600, padding: "8px 0", borderRadius: 8, cursor: "pointer" }}>Отключён</button>
                  </div>

                  {selO.conflict && (
                    <div style={{ marginTop: 18, display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 12px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
                      <span style={{ fontSize: 14, flex: "none" }}>⚠</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>Конфликт геометрии</div>
                        <div style={{ fontSize: 11.5, color: "#92400e", marginTop: 2, lineHeight: 1.35 }}>Сектор перекрывается с соседним постом. Скорректируйте азимут или дальность.</div>
                      </div>
                    </div>
                  )}

                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#94a3b8", margin: "18px 0 8px" }}>Заметки</div>
                  <textarea value={selO.notes} onChange={(e) => patchSel({ notes: e.target.value })} placeholder="Примечание к размещению…" className="fsx-input" style={{ width: "100%", minHeight: 62, resize: "vertical", border: "1px solid #e2e8f0", borderRadius: 9, padding: "9px 10px", font: "inherit", fontSize: 12, outline: "none" }} />
                </div>

                <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
                  <button className="fsx-locate" style={{ flex: 1, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "9px 0", borderRadius: 9, cursor: "pointer" }}>Показать на карте</button>
                  <button
                    className="fsx-remove"
                    onClick={() => {
                      setObjects((prev) => prev.filter((o) => o.id !== selectedId));
                      setSelectedId(null);
                    }}
                    style={{ border: "1px solid #fecaca", background: "#fff", color: "#dc2626", font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "9px 14px", borderRadius: 9, cursor: "pointer" }}
                  >
                    Удалить
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "30px 26px", gap: 14 }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: "#f1f5f9", display: "grid", placeItems: "center", fontSize: 22, color: "#94a3b8" }}>◎</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>Объект не выбран</div>
                  <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 5, lineHeight: 1.45, maxWidth: 200 }}>Выберите средство защиты на карте или в дереве эшелонов, чтобы редактировать координаты, азимут и дальность.</div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── CALCULATOR body ─────────────────────────────────── */}
      {view === "calc" && (
        <div style={{ flex: 1, overflowY: "auto", background: "#f1f5f9" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 28px 60px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", borderBottom: "1px solid #e2e8f0", paddingBottom: 22 }}>
              <div style={{ maxWidth: 560 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".18em", textTransform: "uppercase", color: "#94a3b8" }}>Калькулятор защиты от БПЛА</div>
                <h1 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 30, lineHeight: 1.1, margin: "8px 0 0", color: "#0f172a" }}>Экономическое обоснование конфигурации</h1>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: "10px 0 0", lineHeight: 1.5 }}>Смета считается напрямую из размещения на карте — без ручного просчёта в&nbsp;Excel. Цель: дрон&nbsp;200&nbsp;кг (БЧ&nbsp;75&nbsp;кг), до&nbsp;200&nbsp;км/ч.</p>
              </div>
              <div style={{ textAlign: "right", background: "#fff", border: "1px solid #dbeafe", borderRadius: 16, padding: "16px 22px", boxShadow: "0 4px 16px rgba(15,23,42,.05)" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "#2563eb", fontWeight: 600 }}>Итого по конфигурации</div>
                <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 40, lineHeight: 1, color: "#0f172a", marginTop: 6 }}>{totalMln} <span style={{ fontSize: 18, color: "#64748b" }}>млн ₽</span></div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#94a3b8", marginTop: 5 }}>{placedCount} объектов · 5 рубежей</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 18, padding: "11px 15px", borderRadius: 11, background: "#fff", border: "1px solid #e2e8f0" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flex: "none" }} />
              <span style={{ fontSize: 13, color: "#334155" }}>Расчёт привязан к конфигурации <b style={{ color: "#0f172a" }}>Завод Альфа · Вариант A</b></span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#94a3b8" }}>версия 12 · синхронизировано 14:32</span>
              <span style={{ flex: 1 }} />
              <button onClick={() => setView("studio")} style={{ border: "1px solid #e2e8f0", background: "#f8fafc", color: "#2563eb", font: "inherit", fontSize: 12, fontWeight: 600, padding: "7px 13px", borderRadius: 8, cursor: "pointer" }}>Открыть карту →</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginTop: 22, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {calcRows.map((c) => (
                  <div key={c.code} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "15px 17px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 11, borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
                      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: "#2563eb" }}>{c.code}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{c.name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: "#94a3b8" }}>{c.range}</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{c.total} млн</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 9 }}>
                      {c.items.map((li, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 2px" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", flex: "none", background: li.statusCol }} />
                          <span style={{ fontSize: 12.5, color: "#334155", flex: 1 }}>{li.name}</span>
                          <span style={{ fontFamily: MONO, fontSize: 11, color: "#94a3b8" }}>{li.unit}</span>
                          <span style={{ fontFamily: MONO, fontSize: 12, color: "#0f172a", width: 64, textAlign: "right" }}>{li.line} млн</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <aside style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 17 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#94a3b8" }}>Смета по рубежам</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 13 }}>
                    {calcRows.map((c) => (
                      <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: "#2563eb", width: 22 }}>{c.code}</span>
                        <span style={{ color: "#475569", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                        <span style={{ fontFamily: MONO, color: "#0f172a" }}>{c.total}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", marginTop: 13, paddingTop: 13 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#2563eb", fontWeight: 600 }}>Итого</span>
                    <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: "#0f172a" }}>{totalMln} млн</span>
                  </div>
                </div>

                <div style={{ background: "#0f172a", borderRadius: 14, padding: 17, color: "#e2e8f0" }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#64748b" }}>Бюджет</div>
                  <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, marginTop: 8 }}>9 300 <span style={{ fontSize: 13, color: "#64748b" }}>млн ₽</span></div>
                  <div style={{ height: 7, borderRadius: 5, background: "#1e293b", marginTop: 12, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "1.5%", background: "linear-gradient(90deg,#2563eb,#38bdf8)", borderRadius: 5 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, marginTop: 9 }}>
                    <span style={{ color: "#94a3b8" }}>распределено {totalMln}</span>
                    <span style={{ color: "#10b981" }}>остаток {remaining}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, margin: "13px 0 0" }}>Конфигурация укладывается в&nbsp;бюджет с&nbsp;запасом. Подбор под лимит — на&nbsp;карте, во&nbsp;вкладке «Эшелоны».</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
