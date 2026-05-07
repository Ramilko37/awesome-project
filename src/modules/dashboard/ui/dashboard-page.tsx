import Link from "next/link";
import { BarChart3, FileText, ScanLine, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Активных объектов", value: "4",   icon: Shield,   delta: "+1 в этом месяце",       positive: true  },
  { label: "Покрытие",          value: "87%",  icon: Shield,   delta: "+3% за последнюю неделю", positive: true  },
  { label: "Инциденты",         value: "2",    icon: FileText, delta: "за последние 30 дней",    positive: false },
  { label: "Отчёты",            value: "12",   icon: BarChart3,delta: "сформировано в месяце",   positive: true  },
];

const recentSites = [
  { name: "Завод Альфа",      status: "Активен",      coverage: 91 },
  { name: "Склад Б",          status: "Активен",      coverage: 78 },
  { name: "Резервуарный парк",status: "Настройка",    coverage: 43 },
  { name: "КПП Д",            status: "Отключён",     coverage: 0  },
];

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  "Активен":   "default",
  "Настройка": "secondary",
  "Отключён":  "outline",
};

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">

      {/* заголовок страницы */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Добро пожаловать</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Вот что происходит на ваших объектах прямо сейчас.
          </p>
        </div>
        <Link
          href="/prototype"
          className="flex items-center gap-2 h-9 px-3 rounded-md glass border-(--glass-border) text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
        >
          <ScanLine className="h-4 w-4 text-accent" />
          Открыть конфигуратор
        </Link>
      </div>

      {/* карточки метрик */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, delta, positive }) => (
          <div key={label} className="flex flex-col gap-3 p-4 rounded-xl glass-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
              <div className="h-7 w-7 rounded-lg bg-secondary/80 grid place-items-center text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
            <p className={`text-xs font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {delta}
            </p>
          </div>
        ))}
      </div>

      {/* таблица объектов */}
      <div className="rounded-xl glass-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-(--glass-border)">
          <h3 className="text-sm font-semibold text-foreground">Последние объекты</h3>
          <Link href="/dashboard/sites" className="text-xs text-accent font-medium hover:underline cursor-pointer">
            Все объекты
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--glass-border)">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Объект</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Статус</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Покрытие</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Действие</th>
            </tr>
          </thead>
          <tbody>
            {recentSites.map(({ name, status, coverage }) => (
              <tr key={name} className="border-b border-(--glass-border) last:border-0 hover:bg-white/5 dark:hover:bg-white/5 transition-colors">
                <td className="px-5 py-3 font-medium text-foreground">{name}</td>
                <td className="px-5 py-3">
                  <Badge variant={statusVariant[status]}>{status}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary max-w-24 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${coverage}%`, opacity: coverage === 0 ? 0.2 : 1 }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{coverage}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href="/prototype" className="text-xs text-accent font-medium hover:underline cursor-pointer">
                    Настроить
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
