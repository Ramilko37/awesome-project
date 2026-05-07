"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBanner } from "@/modules/alert/ui/status-banner";
import { OnboardingTrigger } from "@/modules/onboarding/ui/onboarding-trigger";

const pageTitles: Record<string, string> = {
  "/dashboard":            "Обзор",
  "/dashboard/alert":      "Центр тревог",
  "/dashboard/sites":      "Объекты",
  "/dashboard/reports":    "Отчёты",
  "/dashboard/incidents":  "Инциденты",
  "/dashboard/team":       "Команда",
  "/dashboard/settings":   "Настройки",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Панель управления";

  return (
    <header className="flex items-center h-14 px-6 gap-4">
      <h1 className="text-[15px] font-semibold text-foreground tracking-tight flex-1">{title}</h1>

      <div className="flex items-center gap-2">
        <StatusBanner />
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" aria-label="Поиск">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" aria-label="Уведомления">
          <Bell className="h-4 w-4" />
        </Button>
        <OnboardingTrigger />
        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-bold cursor-pointer select-none">
          АД
        </div>
      </div>
    </header>
  );
}
