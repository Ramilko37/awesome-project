"use client";

import { useState } from "react";
import { type LucideIcon, UserPlus, MessageSquare, Shield, Eye, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockTeamMembers } from "@/shared/lib/mock-data";
import type { TeamRole } from "@/shared/types/defense";

const roleLabel: Record<TeamRole, string> = {
  admin:    "Администратор",
  operator: "Оператор",
  viewer:   "Наблюдатель",
};
const roleIcon: Record<TeamRole, LucideIcon> = {
  admin:    Shield,
  operator: Wrench,
  viewer:   Eye,
};
const roleVariant: Record<TeamRole, "default" | "secondary" | "outline"> = {
  admin: "default", operator: "secondary", viewer: "outline",
};

export function TeamPage() {
  const [members] = useState(mockTeamMembers);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Команда</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Управление доступом и уведомлениями операторов</p>
        </div>
        <Button className="cursor-pointer" size="sm">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Пригласить
        </Button>
      </div>

      <div className="rounded-xl glass-md border-(--glass-border) overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--glass-border)">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Сотрудник</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Роль</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Объекты</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">SMS-уведомления</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Последний вход</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const RoleIcon = roleIcon[m.role];
              return (
                <tr key={m.id} className="border-b border-(--glass-border) last:border-0 hover:bg-white/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-bold shrink-0">
                        {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={roleVariant[m.role]} className="gap-1">
                      <RoleIcon className="h-3 w-3" />
                      {roleLabel[m.role]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{m.siteIds.length} объектов</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        m.smsNotifications ? "bg-emerald-500" : "bg-muted-foreground/40",
                      )} />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {m.smsNotifications ? (m.phone ?? "Включено") : "Отключено"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums text-muted-foreground">
                    {m.lastSeenAt
                      ? m.lastSeenAt.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
