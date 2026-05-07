"use client";

import { useState } from "react";
import { type LucideIcon, Building2, Bell, Plug, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tab = "org" | "notifications" | "integrations" | "security";

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "org",            label: "Организация",   icon: Building2 },
  { id: "notifications",  label: "Уведомления",   icon: Bell      },
  { id: "integrations",   label: "Интеграции",    icon: Plug      },
  { id: "security",       label: "Безопасность",  icon: Lock      },
];

function Field({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-muted-foreground">{label}</label>
      <input
        type={type}
        defaultValue={value}
        className="h-9 px-3 rounded-lg bg-secondary/40 border border-(--glass-border) text-sm text-foreground focus:outline-none focus:border-accent/60 transition-colors"
      />
    </div>
  );
}

function Toggle({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-(--glass-border) last:border-0">
      <div>
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((v) => !v)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors cursor-pointer shrink-0",
          checked ? "bg-accent" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked && "translate-x-4",
          )}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("org");

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      <div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Настройки</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Конфигурация платформы и интеграций</p>
      </div>

      {/* Вкладки */}
      <div className="flex gap-0.5 glass rounded-xl border-(--glass-border) p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-1.5 flex-1 h-8 rounded-lg text-[12px] font-medium transition-colors cursor-pointer justify-center",
              activeTab === id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Организация ─────────────────────────────────────────── */}
      {activeTab === "org" && (
        <div className="rounded-xl glass-md border-(--glass-border) p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Профиль организации</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Название организации"  value="Fortis Defense LLC" />
            <Field label="ИНН"                   value="7712345678" />
            <Field label="Адрес"                  value="Екатеринбург, ул. Ленина, 1" />
            <Field label="Контактный email"       value="admin@fortis.io" type="email" />
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" className="cursor-pointer">Сохранить</Button>
          </div>
        </div>
      )}

      {/* ── Уведомления ─────────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <div className="rounded-xl glass-md border-(--glass-border) p-5 flex flex-col gap-0">
          <h3 className="text-sm font-semibold text-foreground mb-4">Настройки уведомлений</h3>
          <Toggle label="Push-уведомления в приложение"  desc="Отправлять при каждом обнаружении угрозы" defaultChecked />
          <Toggle label="SMS при объявлении тревоги"      desc="Рассылка всем сотрудникам объекта" defaultChecked />
          <Toggle label="Email-отчёт раз в неделю"       desc="Сводка инцидентов и uptime оборудования" />
          <Toggle label="Уведомление при отключении устройства" desc="Если устройство не выходит на связь >15 мин" defaultChecked />
          <Toggle label="Ночной режим тишины"            desc="Приглушить push-уведомления с 23:00 до 07:00" />
        </div>
      )}

      {/* ── Интеграции ──────────────────────────────────────────── */}
      {activeTab === "integrations" && (
        <div className="rounded-xl glass-md border-(--glass-border) p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">API-ключи и интеграции</h3>
          <div className="flex flex-col gap-3">
            <Field label="API-ключ платформы"   value="ftk_prod_••••••••••••••••" />
            <Field label="Webhook URL"           value="https://your-server.com/webhook" />
            <Field label="SMS-провайдер (URL)"   value="https://sms.provider.ru/api/v1/send" />
          </div>
          <div className="rounded-lg bg-secondary/40 border border-(--glass-border) p-3 text-xs text-muted-foreground">
            Подключение реальных устройств (сенсоры, камеры) происходит через API. Документация доступна в разделе Developer Docs.
          </div>
          <div className="flex justify-end">
            <Button size="sm" className="cursor-pointer">Сохранить</Button>
          </div>
        </div>
      )}

      {/* ── Безопасность ────────────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="rounded-xl glass-md border-(--glass-border) p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Безопасность аккаунта</h3>
          <Toggle label="Двухфакторная аутентификация (2FA)" desc="TOTP через приложение-аутентификатор" />
          <Toggle label="Вход только с доверенных IP"        desc="Блокировать попытки с незнакомых адресов" />
          <div className="pt-2 border-t border-(--glass-border)">
            <p className="text-[12px] font-semibold text-muted-foreground mb-3">История входов</p>
            {[
              { ip: "192.168.1.10", when: "07.05.2026, 22:50", device: "Chrome · macOS" },
              { ip: "192.168.1.10", when: "07.05.2026, 10:12", device: "Chrome · macOS" },
              { ip: "10.0.0.5",     when: "06.05.2026, 18:33", device: "Safari · iOS" },
            ].map(({ ip, when, device }) => (
              <div key={when} className="flex items-center justify-between py-2 border-b border-(--glass-border) last:border-0">
                <div>
                  <p className="text-[12px] text-foreground font-medium">{device}</p>
                  <p className="text-[11px] text-muted-foreground">{ip} · {when}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
