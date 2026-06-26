"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AppstoreOutlined,
  CalculatorOutlined,
  EnvironmentOutlined,
  LineChartOutlined,
  ExportOutlined,
  RadarChartOutlined,
  RedoOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { useDefenseStudioStore } from "@/modules/drone-defense/domain/use-defense-studio-store";
import { VariantSaveButton, VariantStatusButton } from "@/modules/drone-defense/ui/variant-selector";

type DefenseStudioShellProps = {
  children: React.ReactNode;
};

const topNavClassName =
  "inline-flex h-[30px] items-center gap-2 rounded-md px-3 text-xs font-semibold transition";
const mobileItemClassName = "grid h-9 place-items-center rounded-lg text-xs font-semibold transition";
const scenarioModelingTitle = "Прототип Модуля сценарного моделирования";

export function DefenseStudioShell({ children }: DefenseStudioShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = useDefenseStudioStore((state) => state.view);
  const setView = useDefenseStudioStore((state) => state.setView);

  const normalizedPathname = pathname.replace(/\/$/, "");
  const isPrototype = normalizedPathname === "/prototype";
  const isCalculator = normalizedPathname === "/calculator";
  const isRetrospective = normalizedPathname === "/retrospective-analysis";
  const requestedView = searchParams.get("view");
  const is3DQueryActive = isPrototype && (requestedView === "scenario-modeling" || requestedView === "3d");
  const isDrilldownActive = isPrototype && (is3DQueryActive || view === "drilldown");
  const isMapActive = isPrototype && !isDrilldownActive;
  const mobileTitle = isCalculator ? "Калькулятор" : isDrilldownActive ? "Сценарии" : isRetrospective ? "Анализ" : "Моя карта";
  const mobileSubtitle = isCalculator
    ? "Defense Cost Estimator"
    : isDrilldownActive
      ? scenarioModelingTitle
      : isRetrospective
        ? "Ретро-анализ"
        : "Defense Configuration Studio";

  const activeTopNavClassName = "bg-[#2563eb] text-white shadow-sm shadow-blue-950/20";
  const idleTopNavClassName = "text-slate-300 hover:bg-white/10 hover:text-white";
  const activeMobileClassName = "bg-white text-blue-700 shadow-sm";
  const idleMobileClassName = "text-slate-500 hover:bg-white/70 hover:text-slate-900";

  return (
    <div className="h-screen overflow-hidden bg-[#eef3f8] font-(family-name:--font-manrope) text-slate-900">
      <div className="flex h-full min-h-0 flex-col">
        <header className="hidden h-[54px] shrink-0 items-center border-b border-slate-900 bg-[#0f172a] px-4 text-white shadow-sm lg:flex">
          <div className="mr-5 flex min-w-[142px] items-center gap-2">
            <div className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-[#2563eb] text-[13px] text-white">
              <AppstoreOutlined />
            </div>
            <div className="leading-none">
              <p className="font-(family-name:--font-syne) text-[15px] font-bold uppercase text-white">
                FORTIS
              </p>
              <p className="font-(family-name:--font-ibm-plex-mono) text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Studio</p>
            </div>
          </div>

          <nav className="flex min-w-0 items-center gap-0.5 rounded-[9px] bg-[#1e293b] p-[3px]">
            <Link
              href="/prototype"
              className={`${topNavClassName} ${isMapActive ? activeTopNavClassName : idleTopNavClassName}`}
              onClick={() => setView("gis")}
              title="Карта защиты"
            >
              <EnvironmentOutlined />
              <span>Карта защиты</span>
            </Link>
            <Link
              href="/calculator"
              className={`${topNavClassName} ${isCalculator ? activeTopNavClassName : idleTopNavClassName}`}
              title="Просчитать конфигурацию в калькуляторе"
            >
              <CalculatorOutlined />
              <span>Калькулятор</span>
            </Link>
            <Link
              href="/prototype?view=scenario-modeling"
              className={`${topNavClassName} ${isDrilldownActive ? activeTopNavClassName : idleTopNavClassName}`}
              onClick={() => setView("drilldown")}
              title={scenarioModelingTitle}
            >
              <RadarChartOutlined />
              <span>Сценарии</span>
              <span className="rounded bg-[#334155] px-1.5 py-0.5 font-(family-name:--font-ibm-plex-mono) text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                BETA
              </span>
            </Link>
            <Link
              href="/retrospective-analysis"
              className={`${topNavClassName} ${
                isRetrospective ? "bg-[#2563eb] text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              }`}
              title="Анализ цепочки атаки (WIP)"
            >
              <LineChartOutlined />
              <span>Анализ</span>
            </Link>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden h-8 min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 xl:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
              <p className="truncate text-xs font-semibold text-slate-200">Завод Альфа <span className="text-slate-500">·</span> Вариант A</p>
            </div>
            <div className="flex h-8 items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 px-1">
              <button
                type="button"
                disabled
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600"
                title="Отменить (скоро)"
              >
                <UndoOutlined />
              </button>
              <button
                type="button"
                disabled
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600"
                title="Повторить (скоро)"
              >
                <RedoOutlined />
              </button>
            </div>
            <VariantSaveButton
              className="inline-flex h-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
            />
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              disabled
              aria-label="Экспорт"
              title="Экспорт отчёта доступен в калькуляторе"
            >
              <ExportOutlined />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-200 bg-white px-3 py-2 shadow-sm lg:hidden">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-xl px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title="Назад"
              >
                Назад
              </Link>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                <AppstoreOutlined />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{mobileTitle}</p>
                <p className="truncate text-xs text-slate-500">{mobileSubtitle}</p>
              </div>
              <div className="ml-auto">
                <VariantSaveButton />
              </div>
            </div>
            <div className="mt-2">
              <VariantStatusButton fullWidth />
            </div>

            <nav className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
              <Link
                href="/prototype"
                className={`${mobileItemClassName} ${isMapActive ? activeMobileClassName : idleMobileClassName}`}
                onClick={() => setView("gis")}
              >
                Карта
              </Link>
              <Link
                href="/calculator"
                className={`${mobileItemClassName} ${isCalculator ? activeMobileClassName : idleMobileClassName}`}
              >
                Расчёт
              </Link>
              <Link
                href="/prototype?view=scenario-modeling"
                className={`${mobileItemClassName} ${isDrilldownActive ? activeMobileClassName : idleMobileClassName}`}
                onClick={() => setView("drilldown")}
                title={scenarioModelingTitle}
              >
                Сценарии
              </Link>
              <Link
                href="/retrospective-analysis"
                className={`${mobileItemClassName} ${isRetrospective ? activeMobileClassName : idleMobileClassName}`}
                title="Анализ цепочки атаки (WIP)"
              >
                Анализ
              </Link>
            </nav>
          </div>

          <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
