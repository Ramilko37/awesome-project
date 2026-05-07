"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  FileText,
  LayoutDashboard,
  MapPin,
  ScanLine,
  Settings,
  Shield,
  Users,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { useAlertStore } from "@/modules/alert/domain/useAlertStore";

const navMain = [
  { href: "/dashboard",           label: "Обзор",        icon: LayoutDashboard },
  { href: "/dashboard/alert",     label: "Тревоги",      icon: AlertTriangle,  alert: true },
  { href: "/dashboard/sites",     label: "Объекты",      icon: MapPin },
  { href: "/dashboard/reports",   label: "Аналитика",    icon: BarChart3 },
  { href: "/dashboard/incidents", label: "Инциденты",    icon: FileText },
  { href: "/dashboard/team",      label: "Команда",      icon: Users },
];

const navBottom = [
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { alert } = useAlertStore();

  return (
    <aside className="flex flex-col h-full">
      {/* бренд */}
      <div className="flex items-center gap-2.5 h-14 px-4 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
          <Shield className="h-4 w-4" />
        </div>
        <span
          className="text-[15px] font-bold tracking-tight text-sidebar-foreground"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Fortis
        </span>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* основная навигация */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
        <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Платформа
        </p>
        {navMain.map(({ href, label, icon: Icon, alert: isAlert }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const hasAlertBadge = isAlert && alert.status !== "normal";
          const alertColor =
            alert.status === "alarm_active"
              ? "bg-red-500"
              : "bg-amber-500";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-3.75 w-3.75 shrink-0",
                  isAlert && alert.status === "alarm_active" && "text-red-500",
                  isAlert && alert.status === "threat_detected" && "text-amber-500",
                )}
              />
              {label}
              {hasAlertBadge && (
                <span className={cn("ml-auto h-2 w-2 rounded-full animate-pulse", alertColor)} />
              )}
            </Link>
          );
        })}

        <Separator className="bg-sidebar-border my-2" />

        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Инструменты
        </p>
        <Link
          href="/prototype"
          className="flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
        >
          <ScanLine className="h-3.75 w-3.75 shrink-0 text-accent" />
          <span>Конфигуратор</span>
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/15 text-accent">
            3D
          </span>
        </Link>

        <Separator className="bg-sidebar-border my-2" />

        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Компания
        </p>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
        >
          <Globe className="h-3.75 w-3.75 shrink-0 text-pink-500" />
          <span>О продукте</span>
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-pink-500/12 text-pink-500">
            ↗
          </span>
        </Link>
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* нижняя зона */}
      <div className="flex flex-col gap-0.5 p-2">
        {navBottom.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-3.75 w-3.75 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* пользователь */}
        <div className="flex items-center gap-2 h-9 px-2 mt-1 rounded-md glass border-(--glass-border)">
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-[10px] font-bold shrink-0">
            АД
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-sidebar-foreground truncate leading-tight">Администратор</span>
            <span className="text-[10px] text-muted-foreground truncate leading-tight">admin@fortis.io</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
