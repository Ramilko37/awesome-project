"use client";

import Link from "next/link";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAlertStore } from "@/modules/alert/domain/useAlertStore";

export function StatusBanner() {
  const { alert } = useAlertStore();

  if (alert.status === "normal") {
    return (
      <div className="flex items-center gap-2 h-7 px-3 rounded-full glass border border-(--glass-border) text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Защита активна
        <ShieldCheck className="h-3.5 w-3.5 ml-0.5" />
      </div>
    );
  }

  if (alert.status === "threat_detected") {
    return (
      <Link
        href="/dashboard/alert"
        className="flex items-center gap-2 h-7 px-3 rounded-full glass border border-amber-400/40 bg-amber-400/10 text-[12px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-400/20 transition-colors cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        Угроза — {alert.siteName}
        <AlertTriangle className="h-3.5 w-3.5 ml-0.5" />
      </Link>
    );
  }

  // alarm_active
  return (
    <Link
      href="/dashboard/alert"
      className="flex items-center gap-2 h-7 px-3 rounded-full border border-red-500/50 bg-red-500/15 text-[12px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer animate-pulse"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      ТРЕВОГА — {alert.siteName}
      <ShieldAlert className="h-3.5 w-3.5 ml-0.5" />
    </Link>
  );
}
