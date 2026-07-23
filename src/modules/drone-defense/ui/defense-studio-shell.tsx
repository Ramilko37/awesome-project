"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useDefenseStudioStore } from "@/modules/drone-defense/domain/use-defense-studio-store";
import { VariantSaveButton, VariantStatusButton } from "@/modules/drone-defense/ui/variant-selector";
import {
  Drawer,
  FortisProvider,
  Icon,
  IconButton,
  type FortisIconName,
} from "@/shared/ui/fortis";

type DefenseStudioShellProps = {
  children: ReactNode;
};

type StudioNavigationProps = {
  isCalculator: boolean;
  isDrilldownActive: boolean;
  isMapActive: boolean;
  isRetrospective: boolean;
  onClose?: () => void;
  setView: (view: "gis" | "drilldown") => void;
};

const scenarioModelingTitle = "Прототип Модуля сценарного моделирования";

function StudioNavLink({
  active,
  href,
  icon,
  label,
  onClick,
  title,
}: {
  active: boolean;
  href: string;
  icon: FortisIconName;
  label: string;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className="fortis-studio-nav-link"
      data-active={active || undefined}
      href={href}
      onClick={onClick}
      title={title ?? label}
    >
      <Icon decorative name={icon} size={19} />
      <span>{label}</span>
    </Link>
  );
}

function StudioNavigation({
  isCalculator,
  isDrilldownActive,
  isMapActive,
  isRetrospective,
  onClose,
  setView,
}: StudioNavigationProps) {
  const navigate = (view?: "gis" | "drilldown") => {
    if (view) setView(view);
    onClose?.();
  };

  return (
    <nav aria-label="Разделы Fortis Studio" className="fortis-studio-navigation">
      <StudioNavLink
        active={isMapActive}
        href="/prototype"
        icon="navigation.map"
        label="Карта"
        onClick={() => navigate("gis")}
      />
      <StudioNavLink
        active={isCalculator}
        href="/calculator"
        icon="navigation.calculator"
        label="Расчёт"
        onClick={() => navigate()}
        title="Просчитать конфигурацию в калькуляторе"
      />
      <StudioNavLink
        active={isDrilldownActive}
        href="/prototype?view=scenario-modeling"
        icon="navigation.scenario"
        label="Сценарии"
        onClick={() => navigate("drilldown")}
        title={scenarioModelingTitle}
      />
      <StudioNavLink
        active={isRetrospective}
        href="/retrospective-analysis"
        icon="navigation.analysis"
        label="Анализ"
        onClick={() => navigate()}
        title="Анализ цепочки атаки (WIP)"
      />
    </nav>
  );
}

export function DefenseStudioShell({ children }: DefenseStudioShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = useDefenseStudioStore((state) => state.view);
  const setView = useDefenseStudioStore((state) => state.setView);
  const [navigationOpen, setNavigationOpen] = useState(false);

  const normalizedPathname = pathname.replace(/\/$/, "");
  const isPrototype = normalizedPathname === "/prototype";
  const isCalculator = normalizedPathname === "/calculator";
  const isRetrospective = normalizedPathname === "/retrospective-analysis";
  const requestedView = searchParams.get("view");
  const is3DQueryActive = isPrototype && (requestedView === "scenario-modeling" || requestedView === "3d");
  const isDrilldownActive = isPrototype && (is3DQueryActive || view === "drilldown");
  const isMapActive = isPrototype && !isDrilldownActive;
  const title = isCalculator ? "Калькулятор" : isDrilldownActive ? "Сценарии" : isRetrospective ? "Анализ" : "Моя карта";
  const subtitle = isCalculator
    ? "Defense Cost Estimator"
    : isDrilldownActive
      ? scenarioModelingTitle
      : isRetrospective
        ? "Ретро-анализ"
        : "Defense Configuration Studio";
  const navigationProps = {
    isCalculator,
    isDrilldownActive,
    isMapActive,
    isRetrospective,
    setView,
  };

  return (
    <FortisProvider className="fortis-studio-shell">
      <div className="fortis-studio-frame">
        <aside aria-label="Навигация Fortis Studio" className="fortis-studio-rail">
          <Link aria-label="Назад в рабочий кабинет" className="fortis-studio-back-link" href="/dashboard" title="Назад">
            <Icon decorative name="navigation.back" size={19} />
          </Link>
          <StudioNavigation {...navigationProps} />
          <div className="fortis-studio-rail-actions">
            <VariantSaveButton iconOnly className="fortis-studio-rail-action" />
            <IconButton className="fortis-studio-rail-action" icon="action.export" label="Экспорт" variant="quiet" />
          </div>
        </aside>

        <div className="fortis-studio-content">
          <header className="fortis-studio-compact-header">
            <IconButton
              aria-expanded={navigationOpen}
              icon="navigation.menu"
              label="Открыть навигацию"
              onClick={() => setNavigationOpen(true)}
              variant="quiet"
            />
            <span className="fortis-studio-compact-mark" aria-hidden="true">
              <Icon decorative name="map.layers" size={19} />
            </span>
            <div className="fortis-studio-compact-title">
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </div>
            <VariantSaveButton />
            <div className="fortis-studio-compact-status">
              <VariantStatusButton fullWidth />
            </div>
          </header>

          <main className="fortis-studio-main">{children}</main>
        </div>
      </div>

      <Drawer
        description="Карта, расчёт и аналитические режимы проекта."
        onClose={() => setNavigationOpen(false)}
        open={navigationOpen}
        title="Fortis Studio"
      >
        <StudioNavigation {...navigationProps} onClose={() => setNavigationOpen(false)} />
        <VariantStatusButton fullWidth />
      </Drawer>
    </FortisProvider>
  );
}
