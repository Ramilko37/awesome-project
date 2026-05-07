"use client";

import { useEffect } from "react";
import {
  type LucideIcon,
  LayoutDashboard, AlertTriangle, MapPin, BarChart3,
  FileText, Users, ScanLine, Shield, ArrowRight,
  CheckCircle2, X, Zap, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useOnboardingStore,
  type OnboardingStepId,
} from "@/modules/onboarding/domain/useOnboardingStore";

// ─── Конфигурация шагов ───────────────────────────────────────────────────────

type Step = {
  id: OnboardingStepId;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  features: string[];
  tip?: string;
};

const steps: Step[] = [
  {
    id: "welcome",
    icon: Shield,
    iconColor: "text-accent",
    iconBg: "bg-accent/15",
    title: "Добро пожаловать в Fortis",
    description:
      "Платформа для защиты промышленных предприятий от БПЛА. Здесь вы управляете системами обнаружения, реагируете на угрозы и анализируете безопасность объектов в реальном времени.",
    features: [
      "Мониторинг угроз в режиме реального времени",
      "Управление командой операторов",
      "Аналитика инцидентов и состояния оборудования",
      "3D-конфигуратор расстановки устройств",
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-500/15",
    title: "Обзор — общая картина",
    description:
      "Главная страница платформы. Здесь сосредоточены ключевые метрики по всем объектам: покрытие территории, количество активных устройств, последние инциденты и статус защиты.",
    features: [
      "Сводка по всем объектам одним взглядом",
      "Быстрый переход к конфигуратору",
      "Последние события и изменения статуса",
    ],
    tip: "Статус-баннер в шапке всегда показывает текущее состояние — зелёный, жёлтый или красный.",
  },
  {
    id: "alert",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/15",
    title: "Центр тревог — ядро операторской работы",
    description:
      "Главный экран при обнаружении угрозы. Отображает сигналы с радаров, камер и RF-детекторов в реальном времени. Оператор принимает решение: объявить тревогу или отклонить ложное срабатывание.",
    features: [
      "Живые данные с радарного скопа и RF-детектора",
      "Видеопоток с PTZ-камер и AI-классификация объекта",
      "Объявление тревоги с автоматической SMS-рассылкой сотрудникам",
      "Журнал всех событий с фильтрацией",
    ],
    tip: "При нажатии «Данные» или «Видео» открывается панель устройства с показаниями датчика в реальном времени.",
  },
  {
    id: "sites",
    icon: MapPin,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/15",
    title: "Объекты — управление предприятиями",
    description:
      "Список всех защищаемых объектов. Для каждого — статус, процент покрытия периметра, количество устройств и дата последнего инцидента.",
    features: [
      "Карточки объектов с ключевыми метриками",
      "Фильтрация по статусу: Активен / Настройка / Отключён",
      "Переход к деталям объекта с конфигурацией устройств",
      "Прямой запуск 3D-конфигуратора для объекта",
    ],
    tip: "На странице деталей объекта есть вкладка «Конфигурация» — она синхронизируется с 3D-конфигуратором.",
  },
  {
    id: "reports",
    icon: BarChart3,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/15",
    title: "Аналитика — эффективность защиты",
    description:
      "Дашборд с графиками и метриками за период. Помогает оценить качество защиты, найти уязвимые зоны и отследить динамику угроз по объектам.",
    features: [
      "Динамика обнаружений по дням и объектам",
      "Инциденты в разрезе зон периметра",
      "Среднее время реакции оператора",
      "Uptime оборудования по каждому объекту",
    ],
  },
  {
    id: "incidents",
    icon: FileText,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/15",
    title: "Инциденты — полный журнал событий",
    description:
      "Таблица всех зафиксированных угроз со статусами и действиями операторов. Каждый инцидент можно открыть для просмотра деталей и скриншота с камеры.",
    features: [
      "Фильтрация по уровню угрозы и статусу",
      "Боковая панель с деталями каждого события",
      "Информация об источнике: сенсор, камера, зона",
    ],
    tip: "Кликните на строку инцидента — откроется боковая панель с подробностями.",
  },
  {
    id: "team",
    icon: Users,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/15",
    title: "Команда — операторы и доступы",
    description:
      "Управление пользователями платформы. Назначение ролей, привязка к объектам и настройка SMS-уведомлений для каждого сотрудника.",
    features: [
      "Роли: Администратор, Оператор, Наблюдатель",
      "Привязка операторов к конкретным объектам",
      "Управление SMS-уведомлениями при тревоге",
      "Приглашение новых сотрудников по email",
    ],
    tip: "При объявлении тревоги SMS получат только те сотрудники, у которых включены уведомления.",
  },
  {
    id: "configurator",
    icon: ScanLine,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/15",
    title: "3D-конфигуратор — расстановка защиты",
    description:
      "Интерактивный инструмент для проектирования системы защиты объекта. Расставляйте сенсоры, камеры, щиты подавления и посты на 3D-модели предприятия.",
    features: [
      "Drag-and-drop расстановка устройств",
      "Визуализация радиусов покрытия в 3D",
      "Готовые сценарии: Baseline, Периметр, Критические активы, Ночной режим",
      "Синхронизация конфигурации с ЛК",
    ],
    tip: "Нажмите «Синхронизировать» в конфигураторе — и конфигурация появится на странице деталей объекта.",
  },
  {
    id: "landing",
    icon: Globe,
    iconColor: "text-pink-500",
    iconBg: "bg-pink-500/15",
    title: "Лендинг — публичная страница продукта",
    description:
      "Главная страница Fortis — публичный лендинг для привлечения клиентов. Здесь потенциальные заказчики узнают о продукте, видят преимущества и оставляют заявку на демо.",
    features: [
      "Hero-секция с ключевым УТП и визуализацией",
      "Блок возможностей платформы",
      "Кейсы и доказательства эффективности",
      "Форма заявки на демо",
    ],
    tip: "Лендинг доступен по адресу / — откройте его из сайдбара через пункт «О продукте».",
  },
];

// ─── Индикатор прогресса ──────────────────────────────────────────────────────

function StepDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i === current
              ? "h-2 w-5 bg-accent"
              : i < current
              ? "h-2 w-2 bg-accent/50"
              : "h-2 w-2 bg-secondary",
          )}
        />
      ))}
    </div>
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────

export function OnboardingModal() {
  const { completed, currentStep, setStep, markVisited, finish, _hydrated } =
    useOnboardingStore();

  const stepIndex = steps.findIndex((s) => s.id === currentStep);
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!completed && step) markVisited(step.id);
  }, [step, completed, markVisited]);

  // не рендерим ничего пока zustand не прочитал localStorage
  if (!_hydrated || completed || !step) return null;

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      setStep(steps[stepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStep(steps[stepIndex - 1].id);
  };

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* карточка */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-(--glass-border) overflow-hidden">

        {/* цветная полоса сверху */}
        <div className="h-1 w-full bg-gradient-to-r from-accent via-sky-400 to-indigo-400" />

        {/* шапка */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-0">
          <div className={cn(
            "h-12 w-12 rounded-2xl grid place-items-center shrink-0",
            step.iconBg,
          )}>
            <Icon className={cn("h-6 w-6", step.iconColor)} />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {isFirst ? "Знакомство с платформой" : `Шаг ${stepIndex} из ${steps.length - 1}`}
            </p>
            <h2 className="text-[17px] font-bold text-foreground leading-tight">
              {step.title}
            </h2>
          </div>

          <button
            onClick={finish}
            className="h-7 w-7 rounded-lg hover:bg-secondary/60 grid place-items-center text-muted-foreground transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Пропустить"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* тело */}
        <div className="px-6 pt-4 pb-5 flex flex-col gap-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* список возможностей */}
          <ul className="flex flex-col gap-2">
            {step.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          {/* tip */}
          {step.tip && (
            <div className="flex items-start gap-2.5 rounded-xl bg-accent/8 border border-accent/20 px-3.5 py-3">
              <Zap className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              <p className="text-[12px] text-foreground leading-relaxed">
                <span className="font-semibold text-accent">Подсказка: </span>
                {step.tip}
              </p>
            </div>
          )}
        </div>

        {/* футер */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-(--glass-border) bg-secondary/20">
          <StepDots total={steps.length} current={stepIndex} />

          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer h-8"
                onClick={handleBack}
              >
                Назад
              </Button>
            )}
            <Button
              size="sm"
              className="cursor-pointer h-8 gap-1.5"
              onClick={handleNext}
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Начать работу
                </>
              ) : isFirst ? (
                <>
                  Начать обзор
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Далее
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
