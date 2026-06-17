"use client";

import { useMemo, useState, type MouseEvent } from "react";
import {
  DEFAULT_RETROSPECTIVE_PROFILE_ID,
  calculateRetrospectiveTelemetry,
  createRetrospectiveEmptyPoints,
  eventLabels,
  eventStatuses,
  retrospectiveCanvas,
  retrospectiveEventTypes,
  type RetrospectiveEventType,
  type RetrospectiveEventPoints,
  type RetrospectivePoint,
  type RetrospectiveUavProfile,
  buildPresetRetrospectivePoints,
  formatRetrospectiveDistance,
  formatRetrospectiveFlightTime,
  getRetrospectiveUavProfile,
  retrospectiveUavProfiles,
} from "@/modules/drone-defense/domain/retrospective-analysis";

function toBoardPoint(clientX: number, clientY: number, target: HTMLDivElement): RetrospectivePoint {
  const box = target.getBoundingClientRect();
  const x = Math.min(retrospectiveCanvas.width, Math.max(0, ((clientX - box.left) / box.width) * retrospectiveCanvas.width));
  const y = Math.min(retrospectiveCanvas.height, Math.max(0, ((clientY - box.top) / box.height) * retrospectiveCanvas.height));
  return { x: Math.round(x), y: Math.round(y) };
}

function clampLabel(value: number) {
  return `${value.toLocaleString("ru-RU")} м`;
}

function pointLabel(point: RetrospectivePoint | null) {
  if (!point) return "—";
  return `${clampLabel(point.x)} · ${clampLabel(point.y)}`;
}

function eventButtonClassName(type: RetrospectiveEventType, selected: RetrospectiveEventType) {
  return `rounded-xl border px-3 py-2 text-xs font-semibold transition ${
    selected === type
      ? "border-blue-700 bg-blue-50 text-blue-700"
      : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
  }`;
}

function buildRetrospectivePointSummary(points: RetrospectiveEventPoints) {
  return retrospectiveEventTypes.map((eventType) => {
    const point = points[eventType];
    return {
      eventType,
      point,
      exists: Boolean(point),
    };
  });
}

export function RetrospectiveAnalysisPage() {
  const [activeEventType, setActiveEventType] = useState<RetrospectiveEventType>("detected");
  const [selectedProfileId, setSelectedProfileId] = useState<string>(DEFAULT_RETROSPECTIVE_PROFILE_ID);
  const [points, setPoints] = useState<RetrospectiveEventPoints>(createRetrospectiveEmptyPoints);
  const profile = useMemo<RetrospectiveUavProfile>(() => getRetrospectiveUavProfile(selectedProfileId), [selectedProfileId]);
  const telemetry = useMemo(() => calculateRetrospectiveTelemetry(selectedProfileId, points), [selectedProfileId, points]);
  const timeline = useMemo(() => buildRetrospectivePointSummary(points), [points]);

  function onBoardClick(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const nextPoint = toBoardPoint(event.clientX, event.clientY, event.currentTarget);
    setPoints((prev) => ({
      ...prev,
      [activeEventType]: nextPoint,
    }));
  }

  function onReset() {
    setPoints(createRetrospectiveEmptyPoints());
  }

  function onLoadPreset() {
    setPoints(buildPresetRetrospectivePoints());
  }

  return (
    <section className="h-full bg-[#f3f7fd] px-3 py-3">
      <div className="mx-auto grid min-h-full max-w-[1240px] gap-3 lg:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="flex min-h-0 flex-col gap-3 rounded-[10px] border border-slate-200 bg-white/90 p-3 shadow-sm">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-amber-700">Work in progress</span>
              <span className="rounded-full border border-blue-300 bg-blue-100 px-2 py-1 text-blue-700">
                демонстрационный прототип
              </span>
            </div>
            <h1 className="text-xl leading-tight font-semibold text-slate-900">Ретро-анализ цепочки атаки</h1>
            <p className="text-xs text-slate-500">
              Клиентский WIP-модуль для локальной отработки события «обнаружили → воздействовали → упало». Без backend и без
              влияния на GIS MVP.
            </p>
          </header>

          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Профиль БПЛА</span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
              >
                {retrospectiveUavProfiles.map((profileItem) => (
                  <option key={profileItem.id} value={profileItem.id}>
                    {profileItem.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Активная точка</span>
              <div className="grid grid-cols-3 gap-1">
                {retrospectiveEventTypes.map((eventType) => (
                  <button
                    key={eventType}
                    className={eventButtonClassName(eventType, activeEventType)}
                    onClick={() => setActiveEventType(eventType)}
                    type="button"
                  >
                    {eventLabels[eventType]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-end gap-2">
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-700"
                onClick={onLoadPreset}
                type="button"
              >
                Демо-сценарий
              </button>
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700"
                onClick={onReset}
                type="button"
              >
                Сброс
              </button>
            </div>
          </div>

          <div className="min-h-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Карта-сцена</p>
            <div
              role="presentation"
              onClick={onBoardClick}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,_rgba(37,99,235,0.15),_transparent_55%),linear-gradient(90deg,rgba(148,163,184,.28)_1px,transparent_1px),linear-gradient(rgba(148,163,184,.28)_1px,transparent_1px)]"
              style={{ aspectRatio: `${retrospectiveCanvas.width} / ${retrospectiveCanvas.height}` }}
              title="Клик по карте ставит выбранный маркер"
            >
              <svg
                className="h-full w-full"
                viewBox={`0 0 ${retrospectiveCanvas.width} ${retrospectiveCanvas.height}`}
                preserveAspectRatio="none"
              >
                {points.detected && points.engaged && (
                  <line
                    x1={points.detected.x}
                    y1={points.detected.y}
                    x2={points.engaged.x}
                    y2={points.engaged.y}
                    stroke="#2563eb"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                )}
                {points.engaged && points.crashed && (
                  <line
                    x1={points.engaged.x}
                    y1={points.engaged.y}
                    x2={points.crashed.x}
                    y2={points.crashed.y}
                    stroke="#0d9488"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                )}
                {retrospectiveEventTypes.map((eventType, index) => {
                  const point = points[eventType];
                  if (!point) return null;
                  return (
                    <g key={`${eventType}-${index}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="7"
                        fill="#fff"
                        stroke={eventType === "detected" ? "#0ea5e9" : eventType === "engaged" ? "#14b8a6" : "#f97316"}
                        strokeWidth="3"
                      />
                      <text
                        x={point.x + 11}
                        y={point.y + 4}
                        fontSize="12"
                        fill="#0f172a"
                        fontWeight={700}
                      >
                        {index + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Активный маркер: <span className="font-semibold text-slate-700">{eventLabels[activeEventType]}</span>. Нажмите на сцену,
              чтобы поставить/обновить точку.
            </p>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3">
          <section className="rounded-[10px] border border-slate-200 bg-white/90 p-3 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Профиль и параметры</h2>
            <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xl font-semibold">{profile.label}</p>
              <p className="text-xs text-slate-600">{profile.payloadNote}</p>
              <dl className="grid gap-1 text-xs text-slate-700">
                <div className="flex justify-between gap-3">
                  <dt>Крейсерская скорость</dt>
                  <dd>{profile.speedKmH} км/ч</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Диапазон</dt>
                  <dd>{formatRetrospectiveDistance(profile.rangeM)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Текущий этап</dt>
                  <dd>{eventStatuses[activeEventType]}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="rounded-[10px] border border-slate-200 bg-white/90 p-3 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Траектория событий</h2>
            <ul className="mt-2 space-y-2">
              {timeline.map((item) => (
                <li
                  key={item.eventType}
                  className={`flex items-start justify-between gap-2 rounded-lg border px-2 py-2 text-xs ${
                    item.point ? "border-emerald-200 bg-emerald-50/70 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="truncate font-semibold">
                    {eventLabels[item.eventType]}
                  </span>
                  <span className="truncate text-right">{pointLabel(item.point)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[10px] border border-slate-200 bg-white/90 p-3 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Деривативный расчёт TTX</h2>
            <dl className="mt-2 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between gap-3">
                <dt>Обнаружение → воздействие</dt>
                <dd>{formatRetrospectiveDistance(telemetry.detectedToEngagedDistanceM)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Воздействие → падение</dt>
                <dd>{formatRetrospectiveDistance(telemetry.engagedToCrashedDistanceM)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Общая длина пути</dt>
                <dd>{formatRetrospectiveDistance(telemetry.totalPathLengthM)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Оценка времени полёта</dt>
                <dd>{formatRetrospectiveFlightTime(telemetry.estimatedFlightTimeS)}</dd>
              </div>
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[11px] leading-snug">{telemetry.plausibilityText}</p>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </section>
  );
}
