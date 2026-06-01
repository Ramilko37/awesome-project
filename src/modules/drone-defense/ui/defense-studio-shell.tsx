"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CalculatorOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  RadarChartOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useDefenseStudioStore } from "@/modules/drone-defense/domain/use-defense-studio-store";

type DefenseStudioShellProps = {
  children: React.ReactNode;
};

const railItemClassName =
  "flex h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition";
const mobileItemClassName = "grid h-9 place-items-center rounded-lg text-xs font-semibold transition";

export function DefenseStudioShell({ children }: DefenseStudioShellProps) {
  const pathname = usePathname();
  const view = useDefenseStudioStore((state) => state.view);
  const setView = useDefenseStudioStore((state) => state.setView);

  const normalizedPathname = pathname.replace(/\/$/, "");
  const isPrototype = normalizedPathname === "/prototype";
  const isCalculator = normalizedPathname === "/calculator";
  const isMapActive = isPrototype && view !== "drilldown";
  const isDrilldownActive = isPrototype && view === "drilldown";
  const mobileTitle = isCalculator ? "Калькулятор" : "Моя карта";
  const mobileSubtitle = isCalculator ? "Defense Cost Estimator" : "Defense Configuration Studio";

  const activeRailClassName = "bg-blue-600 text-white shadow-md shadow-blue-600/25";
  const idleRailClassName = "text-slate-500 hover:bg-slate-100 hover:text-slate-900";
  const activeMobileClassName = "bg-white text-blue-700 shadow-sm";
  const idleMobileClassName = "text-slate-500 hover:bg-white/70 hover:text-slate-900";

  return (
    <div className="h-screen overflow-hidden bg-[#eef3f8] text-slate-900">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside className="hidden w-[76px] shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
          <div className="flex h-[74px] items-center justify-center border-b border-slate-100">
            <Link
              href="/dashboard"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              title="Назад"
            >
              <ArrowLeftOutlined />
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-2 px-2 py-4">
            <Link
              href="/prototype"
              className={`${railItemClassName} ${isMapActive ? activeRailClassName : idleRailClassName}`}
              onClick={() => setView("gis")}
              title="Карта"
            >
              <span className="text-lg">
                <EnvironmentOutlined />
              </span>
              <span>Карта</span>
            </Link>
            <Link
              href="/calculator"
              className={`${railItemClassName} ${isCalculator ? activeRailClassName : idleRailClassName}`}
              title="Просчитать конфигурацию в калькуляторе"
            >
              <span className="text-lg">
                <CalculatorOutlined />
              </span>
              <span>Расчёт</span>
            </Link>
            <Link
              href="/prototype"
              className={`${railItemClassName} ${isDrilldownActive ? activeRailClassName : idleRailClassName}`}
              onClick={() => setView("drilldown")}
              title="3D"
            >
              <span className="text-lg">
                <RadarChartOutlined />
              </span>
              <span>3D</span>
            </Link>
          </nav>
          <div className="space-y-2 border-t border-slate-100 px-2 py-3">
            <button className="flex h-12 w-full items-center justify-center rounded-xl text-lg text-slate-400 hover:bg-slate-100" type="button" title="Сохранить">
              <SaveOutlined />
            </button>
            <button className="flex h-12 w-full items-center justify-center rounded-xl text-lg text-slate-400 hover:bg-slate-100" type="button" title="Экспорт">
              <ExportOutlined />
            </button>
          </div>
        </aside>

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-200 bg-white px-3 py-2 shadow-sm lg:hidden">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title="Назад"
              >
                <ArrowLeftOutlined />
              </Link>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                <AppstoreOutlined />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{mobileTitle}</p>
                <p className="truncate text-xs text-slate-500">{mobileSubtitle}</p>
              </div>
            </div>

            <nav className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
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
                href="/prototype"
                className={`${mobileItemClassName} ${isDrilldownActive ? activeMobileClassName : idleMobileClassName}`}
                onClick={() => setView("drilldown")}
              >
                3D
              </Link>
            </nav>
          </div>

          <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
