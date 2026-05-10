"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Shield, Brain, BarChart3, ScanLine, Zap, Users,
  ArrowRight, CheckCircle2, ChevronRight, TrendingUp,
  AlertTriangle, Lock, Cpu, Globe, Activity, Layers,
  Target, Sun, Moon, Sparkles, DollarSign, RefreshCw,
} from "lucide-react";

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function HeroThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-8" />;
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="h-8 w-8 rounded-lg border border-white/12 dark:border-white/12 bg-white/8 hover:bg-white/14 dark:bg-white/5 dark:hover:bg-white/10 grid place-items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
      aria-label="Переключить тему"
    >
      <Sun className="h-4 w-4 block dark:hidden" />
      <Moon className="h-4 w-4 hidden dark:block" />
    </button>
  );
}

// ─── Animation helpers ────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    // if already in viewport (e.g. bfcache restore), fire immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setInView(true);
      obs.disconnect();
    }
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Radar grid background ────────────────────────────────────────────────────

function RadarGrid({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots: { x: number; y: number; age: number; alpha: number }[] = [];
    const accent = dark ? "56,189,248" : "3,105,161";
    const accentLine = dark ? "rgba(56,189,248,0.55)" : "rgba(3,105,161,0.4)";

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.42;
      const maxR = Math.min(width, height) * 0.44;

      ctx.strokeStyle = `rgba(${accent},0.07)`;
      ctx.lineWidth = 1;
      for (let r = maxR / 4; r <= maxR; r += maxR / 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(${accent},0.05)`;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.stroke();
      }

      const sweepEnd = angle;
      const sweepStart = sweepEnd - 0.9;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, `rgba(${accent},0.15)`);
      grad.addColorStop(1, `rgba(${accent},0)`);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, sweepStart, sweepEnd);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = accentLine;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepEnd) * maxR, cy + Math.sin(sweepEnd) * maxR);
      ctx.stroke();

      if (Math.random() < 0.04) {
        const r = maxR * (0.3 + Math.random() * 0.65);
        const a = sweepEnd + (Math.random() - 0.5) * 0.3;
        dots.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, age: 0, alpha: 1 });
      }

      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        d.age++;
        d.alpha = Math.max(0, 1 - d.age / 90);
        if (d.alpha <= 0) { dots.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accent},${d.alpha * 0.9})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accent},${d.alpha * 0.15})`;
        ctx.fill();
      }

      angle += 0.012;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [dark]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Pill badge ───────────────────────────────────────────────────────────────

function Pill({ children, color = "sky" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    sky:     "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet:  "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber:   "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    indigo:  "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${colors[color] ?? colors.sky}`}>
      {children}
    </span>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, delay = 0, inView }: {
  icon: React.ReactNode; title: string; description: string; delay?: number; inView: boolean;
}) {
  return (
    <div
      className="group relative rounded-2xl border border-slate-200/60 dark:border-white/8 bg-white/70 dark:bg-white/4 p-6 backdrop-blur-sm transition-all duration-500 hover:border-sky-400/50 dark:hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.3s, box-shadow 0.3s`,
      }}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-sky-500/4 to-transparent pointer-events-none" />
      <div className="mb-4 h-11 w-11 rounded-xl bg-sky-500/10 border border-sky-500/20 dark:border-sky-500/20 grid place-items-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/16 transition-all duration-300">
        {icon}
      </div>
      <h3 className="mb-2 text-[15px] font-semibold text-slate-900 dark:text-white leading-snug">{title}</h3>
      <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ num, title, description, delay, inView }: {
  num: string; title: string; description: string; delay: number; inView: boolean;
}) {
  return (
    <div
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      <div className="text-[11px] font-bold tracking-widest text-sky-500 mb-3 uppercase">{num}</div>
      <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-2 leading-snug">{title}</h3>
      <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, icon, delay, inView }: {
  value: string; label: string; icon: React.ReactNode; delay: number; inView: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center text-center gap-2 rounded-2xl border border-slate-200/70 dark:border-white/8 bg-white/60 dark:bg-white/4 px-8 py-7 backdrop-blur-sm"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "scale(1)" : "scale(0.94)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      <div className="text-sky-500 dark:text-sky-400 mb-1">{icon}</div>
      <div className="text-[32px] font-display font-bold text-slate-900 dark:text-white leading-none">{value}</div>
      <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">{label}</div>
    </div>
  );
}

// ─── AI improvement card ──────────────────────────────────────────────────────

function AIImprovCard({ icon, title, description, accent, delay, inView }: {
  icon: React.ReactNode; title: string; description: string;
  accent: string; delay: number; inView: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 backdrop-blur-sm ${accent}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl grid place-items-center shrink-0 bg-current/8">
          {icon}
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-1 leading-snug">{title}</h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HeroPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = !mounted || resolvedTheme !== "light";

  const heroSection    = useInView(0.1);
  const statsSection   = useInView(0.2);
  const featuresSection = useInView(0.1);
  const aiSection      = useInView(0.1);
  const howSection     = useInView(0.15);
  const ctaSection     = useInView(0.2);

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const heroCta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = heroCta.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowFloatingCta(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-white overflow-x-hidden font-sans transition-colors duration-300">

      {/* ─ Scroll to top ────────────────────────────────────────────────── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Наверх"
        className="fixed right-5 bottom-6 z-40 h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/60 dark:shadow-black/30 grid place-items-center text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:border-sky-400/40 transition-all duration-200 cursor-pointer"
        style={{
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          pointerEvents: showScrollTop ? "auto" : "none",
        }}
      >
        <ChevronRight className="h-4 w-4 -rotate-90" />
      </button>

      {/* ─ Floating CTA ─────────────────────────────────────────────────── */}
      <div
        className="fixed right-5 top-1/2 -translate-y-1/2 z-40"
        style={{
          opacity: showFloatingCta ? 1 : 0,
          transform: showFloatingCta ? "translateY(-50%) translateX(0)" : "translateY(-50%) translateX(calc(100% + 20px))",
          transition: "opacity 0.35s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          pointerEvents: showFloatingCta ? "auto" : "none",
        }}
      >
        <a
          href="#cta"
          className="group flex flex-col items-center gap-2 rounded-2xl px-4 py-4 bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-200 cursor-pointer"
        >
          <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-0.5 transition-transform duration-200" />
          {/* вертикальный текст */}
          <span
            className="text-[11px] font-bold text-white uppercase tracking-widest leading-none"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            Запросить демо
          </span>
        </a>
      </div>

      {/* ─ Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-slate-200/80 dark:border-white/6 bg-slate-50/85 dark:bg-[#080d1a]/85 backdrop-blur-xl transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-sky-500/12 border border-sky-500/25 grid place-items-center">
            <Shield className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <span className="font-display font-bold text-[17px] text-slate-900 dark:text-white tracking-tight">Fortis</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[13px] text-slate-500 dark:text-slate-400">
          <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Возможности</a>
          <a href="#ai"       className="hover:text-slate-900 dark:hover:text-white transition-colors">ИИ-аналитика</a>
          <a href="#how"      className="hover:text-slate-900 dark:hover:text-white transition-colors">Как работает</a>
        </div>
        <div className="flex items-center gap-2">
          <HeroThemeToggle />
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 px-4 py-2 text-[13px] font-semibold text-white transition-colors shadow-sm shadow-sky-500/20"
          >
            Открыть ЛК
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </nav>

      {/* ─ Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-24 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 h-175 w-175 rounded-full bg-sky-500/6 dark:bg-sky-500/8 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-100 w-100 rounded-full bg-indigo-600/5 dark:bg-indigo-600/8 blur-[100px]" />
          <div className="absolute bottom-[-5%] right-[-5%] h-87.5 w-87.5 rounded-full bg-sky-400/4 dark:bg-sky-400/6 blur-[90px]" />
        </div>

        <RadarGrid dark={dark} />

        <div ref={heroSection.ref} className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
          <div style={{ opacity: heroSection.inView ? 1 : 0, transform: heroSection.inView ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
            <Pill color="sky">
              <Zap className="h-3 w-3" />
              Платформа нового поколения
            </Pill>
          </div>

          <div style={{ opacity: heroSection.inView ? 1 : 0, transform: heroSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.7s ease 100ms, transform 0.7s ease 100ms" }}>
            <h1 className="font-display text-[44px] md:text-[64px] font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white">
              Защита предприятий
              <br />
              <span className="bg-linear-to-r from-sky-500 via-sky-400 to-indigo-500 dark:from-sky-400 dark:via-sky-300 dark:to-indigo-400 bg-clip-text text-transparent">
                на основе ИИ
              </span>
            </h1>
          </div>

          <p
            className="max-w-xl text-[16px] text-slate-500 dark:text-slate-400 leading-relaxed"
            style={{ opacity: heroSection.inView ? 1 : 0, transform: heroSection.inView ? "translateY(0)" : "translateY(18px)", transition: "opacity 0.7s ease 200ms, transform 0.7s ease 200ms" }}
          >
            Fortis объединяет радары, RF-детекторы, PTZ-камеры и искусственный интеллект в единую
            платформу управления. Угроза обнаружена — за секунды. Защита улучшается — постоянно.
          </p>

          <div
            ref={heroCta}
            className="flex flex-wrap items-center justify-center gap-3 mt-2"
            style={{ opacity: heroSection.inView ? 1 : 0, transform: heroSection.inView ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.7s ease 300ms, transform 0.7s ease 300ms" }}
          >
            <a
              href="#cta"
              className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 text-[14px] font-semibold text-white transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40"
            >
              Запросить демо
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/12 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/9 px-6 py-3 text-[14px] font-medium text-slate-700 dark:text-slate-300 transition-all duration-200"
            >
              Открыть платформу
            </a>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-6 mt-3 text-[12px] text-slate-400 dark:text-slate-500"
            style={{ opacity: heroSection.inView ? 1 : 0, transition: "opacity 0.7s ease 450ms" }}
          >
            {["Развёртывание за 24 ч", "Соответствие требованиям ФСБ", "99.9% Uptime SLA"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25">
          <div className="h-8 w-5 rounded-full border border-slate-400 dark:border-slate-600 flex items-start justify-center pt-1.5">
            <div className="h-1.5 w-1 rounded-full bg-slate-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─ Stats ────────────────────────────────────────────────────────── */}
      <section id="stats" className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div ref={statsSection.ref} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value="< 3 с"  label="Время обнаружения угрозы"   icon={<Zap className="h-5 w-5" />}      delay={0}   inView={statsSection.inView} />
            <StatCard value="98.7%"  label="Точность классификации ИИ"  icon={<Brain className="h-5 w-5" />}    delay={80}  inView={statsSection.inView} />
            <StatCard value="360°"   label="Покрытие периметра"          icon={<Target className="h-5 w-5" />}   delay={160} inView={statsSection.inView} />
            <StatCard value="50+"    label="Типов БПЛА в базе ИИ"        icon={<Cpu className="h-5 w-5" />}      delay={240} inView={statsSection.inView} />
          </div>
        </div>
      </section>

      {/* ─ Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="relative py-24 px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-200 rounded-full bg-sky-500/4 dark:bg-sky-500/5 blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <div ref={featuresSection.ref}>
            <div
              className="mb-14 text-center"
              style={{ opacity: featuresSection.inView ? 1 : 0, transform: featuresSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
            >
              <Pill color="violet">
                <Layers className="h-3 w-3" />
                Возможности платформы
              </Pill>
              <h2 className="font-display mt-4 text-[34px] md:text-[42px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                Всё для защиты объекта
                <br />
                <span className="text-slate-400 dark:text-slate-400 font-medium text-[28px] md:text-[32px]">в одной платформе</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard inView={featuresSection.inView} delay={0}   icon={<Brain className="h-5 w-5" />}       title="ИИ-планирование защиты"         description="Алгоритм анализирует геометрию объекта, существующие устройства и угрозы — и автоматически предлагает оптимальную расстановку сенсоров." />
              <FeatureCard inView={featuresSection.inView} delay={70}  icon={<Activity className="h-5 w-5" />}    title="Мониторинг в реальном времени"  description="Радарные сигналы, RF-спектр и видео с PTZ-камер объединены в единый экран оператора. Угроза классифицируется до появления в зоне риска." />
              <FeatureCard inView={featuresSection.inView} delay={140} icon={<BarChart3 className="h-5 w-5" />}   title="Аналитика и отчётность"         description="Динамика инцидентов, uptime оборудования, эффективность операторов — в виде наглядных графиков и экспортируемых отчётов." />
              <FeatureCard inView={featuresSection.inView} delay={210} icon={<ScanLine className="h-5 w-5" />}    title="3D-конфигуратор"                 description="Интерактивная трёхмерная расстановка устройств на модели предприятия с визуализацией зон покрытия и готовыми сценариями защиты." />
              <FeatureCard inView={featuresSection.inView} delay={280} icon={<TrendingUp className="h-5 w-5" />}  title="ИИ-рекомендации"                 description="Система непрерывно анализирует инциденты и выдаёт рекомендации: где добавить устройство, как изменить сценарий, какие зоны уязвимы." />
              <FeatureCard inView={featuresSection.inView} delay={350} icon={<Users className="h-5 w-5" />}       title="Управление командой"             description="Роли операторов, привязка к объектам, SMS-уведомления при тревоге. Полный контроль над доступами и реакцией персонала." />
            </div>
          </div>
        </div>
      </section>

      {/* ─ AI Continuous Improvement ────────────────────────────────────── */}
      <section id="ai" className="relative py-24 px-6 border-y border-slate-200/60 dark:border-white/5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 h-125 w-125 rounded-full bg-indigo-500/5 dark:bg-indigo-500/6 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-100 w-100 rounded-full bg-sky-500/4 dark:bg-sky-500/5 blur-[90px]" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <div ref={aiSection.ref}>
            <div
              className="mb-14 text-center"
              style={{ opacity: aiSection.inView ? 1 : 0, transform: aiSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
            >
              <Pill color="indigo">
                <Sparkles className="h-3 w-3" />
                Непрерывное совершенствование
              </Pill>
              <h2 className="font-display mt-4 text-[34px] md:text-[42px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                Защита, которая
                <br />
                <span className="bg-linear-to-r from-indigo-500 to-sky-500 dark:from-indigo-400 dark:to-sky-400 bg-clip-text text-transparent">
                  умнеет с каждым днём
                </span>
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Каждый инцидент — это данные. Каждые данные — это улучшение. Fortis не просто реагирует на угрозы,
                он предвосхищает их: анализирует паттерны атак, предлагает точечные доработки и оптимизирует
                стоимость защиты без потери эффективности.
              </p>
            </div>

            {/* big statement row */}
            <div
              className="mb-10 rounded-2xl border border-indigo-500/20 dark:border-indigo-400/15 bg-linear-to-br from-indigo-500/6 to-sky-500/4 dark:from-indigo-500/8 dark:to-sky-500/5 p-8 text-center"
              style={{ opacity: aiSection.inView ? 1 : 0, transform: aiSection.inView ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.6s ease 100ms, transform 0.6s ease 100ms" }}
            >
              <div className="flex flex-wrap justify-center gap-10 md:gap-16">
                {[
                  { val: "−40%", label: "Снижение бюджета на защиту\nза счёт точечного размещения устройств" },
                  { val: "+2.3×", label: "Рост эффективности обнаружения\nпосле 90 дней обучения ИИ" },
                  { val: "0",    label: "Слепых зон после применения\nрекомендаций по конфигурации" },
                ].map(({ val, label }) => (
                  <div key={val} className="flex flex-col items-center gap-1">
                    <span className="font-display text-[40px] font-bold bg-linear-to-r from-indigo-500 to-sky-500 dark:from-indigo-400 dark:to-sky-400 bg-clip-text text-transparent leading-none">
                      {val}
                    </span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 whitespace-pre-line text-center leading-relaxed max-w-40">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AIImprovCard
                inView={aiSection.inView} delay={0}
                accent="border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/6"
                icon={<Brain className="h-5 w-5 text-sky-500 dark:text-sky-400" />}
                title="Новые сценарии защиты от ИИ"
                description="После каждого инцидента система предлагает обновлённый сценарий расстановки: какие зоны усилить, какие устройства добавить или переместить."
              />
              <AIImprovCard
                inView={aiSection.inView} delay={100}
                accent="border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/6"
                icon={<DollarSign className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />}
                title="Оптимизация бюджета на защиту"
                description="ИИ выявляет избыточное перекрытие зон и дублирующие устройства — и рекомендует конфигурацию с тем же уровнем защиты при меньших затратах."
              />
              <AIImprovCard
                inView={aiSection.inView} delay={200}
                accent="border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/6"
                icon={<RefreshCw className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />}
                title="Самообновляющаяся база угроз"
                description="База данных типов БПЛА и тактик атак пополняется автоматически из глобальной сети Fortis — ваша защита актуальна без ручных обновлений."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─ How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="relative py-24 px-6">
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-125 w-125 rounded-full bg-indigo-600/4 dark:bg-indigo-600/6 blur-[100px]" />

        <div className="max-w-5xl mx-auto relative">
          <div ref={howSection.ref}>
            <div
              className="mb-16 text-center"
              style={{ opacity: howSection.inView ? 1 : 0, transform: howSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
            >
              <Pill color="emerald">
                <Globe className="h-3 w-3" />
                Как работает Fortis
              </Pill>
              <h2 className="font-display mt-4 text-[34px] md:text-[42px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                От обнаружения
                <br />
                <span className="text-slate-400 font-medium text-[28px] md:text-[32px]">до нейтрализации угрозы</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-10">
                <StepCard num="01" title="Сенсоры засекают объект" delay={0} inView={howSection.inView}
                  description="Радар, RF-детектор и PTZ-камеры одновременно фиксируют движение. ИИ сопоставляет сигналы и классифицирует тип БПЛА за миллисекунды." />
                <StepCard num="02" title="Оператор принимает решение" delay={120} inView={howSection.inView}
                  description="На экране Центра тревог — данные с датчиков и видеопоток. Один клик — тревога объявлена, SMS разослан всем сотрудникам." />
                <StepCard num="03" title="ИИ анализирует и улучшает" delay={240} inView={howSection.inView}
                  description="После инцидента система обновляет рекомендации по конфигурации, корректирует бюджет защиты и дополняет базу знаний об угрозах." />
              </div>

              <div
                className="relative rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0d1627] p-5 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none"
                style={{ opacity: howSection.inView ? 1 : 0, transform: howSection.inView ? "translateX(0)" : "translateX(30px)", transition: "opacity 0.7s ease 150ms, transform 0.7s ease 150ms" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-red-400/80" />
                  <div className="h-2 w-2 rounded-full bg-amber-400/80" />
                  <div className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <div className="ml-2 text-[11px] text-slate-400 font-mono">fortis — центр тревог</div>
                </div>
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 flex items-center gap-3 mb-3">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <div>
                    <div className="text-[12px] font-semibold text-amber-600 dark:text-amber-300">Обнаружена угроза</div>
                    <div className="text-[11px] text-amber-500/80">Завод «Альфа» · Зона B4 · 14:32:07</div>
                  </div>
                  <div className="ml-auto text-[11px] font-semibold text-amber-500 dark:text-amber-400 border border-amber-500/30 rounded-lg px-2.5 py-1">
                    Управление →
                  </div>
                </div>
                {[
                  { src: "RF-детектор #3", zone: "B4", level: "high",   time: "14:32:07" },
                  { src: "Радар #1",       zone: "B4", level: "medium", time: "14:32:05" },
                  { src: "Камера #7",      zone: "B3", level: "low",    time: "14:31:58" },
                ].map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-white/3 px-4 py-2.5 mb-2">
                    <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${ev.level === "high" ? "text-red-500" : ev.level === "medium" ? "text-amber-500" : "text-sky-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-slate-800 dark:text-white">{ev.src}</div>
                      <div className="text-[11px] text-slate-400">Зона {ev.zone}</div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono shrink-0">{ev.time}</div>
                  </div>
                ))}
                <div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/6 px-4 py-3 flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 mb-0.5">ИИ-рекомендация</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Добавьте RF-детектор в зону B4 — 68% угроз за 7 дней пришли из этого сектора. Экономия: −12% бюджета.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ Brands ───────────────────────────────────────────────────────── */}
      <section className="py-14 px-6 border-y border-slate-200/60 dark:border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-8">
            Интегрируется с оборудованием ведущих производителей
          </p>
          <div className="flex flex-wrap justify-center gap-10 text-[13px] font-semibold text-slate-300 dark:text-slate-700 tracking-wide">
            {["Droneshield", "Robin Radar", "Dedrone", "Squarehead", "Aaronia", "Hikvision"].map((b) => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─ CTA ──────────────────────────────────────────────────────────── */}
      <section id="cta" className="relative py-28 px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-150 rounded-full bg-sky-500/6 dark:bg-sky-500/8 blur-[100px]" />
        </div>

        <div className="max-w-2xl mx-auto text-center relative" ref={ctaSection.ref}>
          <div style={{ opacity: ctaSection.inView ? 1 : 0, transform: ctaSection.inView ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
            <Pill color="sky">
              <Lock className="h-3 w-3" />
              Оставьте заявку на демо
            </Pill>
            <h2 className="font-display mt-5 text-[36px] md:text-[48px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Защитите ваш объект
              <br />
              <span className="bg-linear-to-r from-sky-500 to-indigo-500 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                уже сегодня
              </span>
            </h2>
            <p className="mt-4 text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Наш эксперт проведёт персональное демо, настроит конфигурацию под ваш объект и ответит на все вопросы.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ваш@email.ru"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/6 px-4 py-3 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/60 transition-all"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 text-[14px] font-semibold text-white transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 whitespace-nowrap"
                >
                  Запросить демо
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-6 py-4 max-w-md mx-auto">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="text-left">
                  <div className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-300">Заявка принята!</div>
                  <div className="text-[12px] text-emerald-600/70 dark:text-emerald-500/80">Мы свяжемся с вами в течение 24 часов.</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-6 mt-8 text-[12px] text-slate-400">
              {["Без обязательств", "Бесплатная консультация", "Конфиденциальность данных"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─ Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/60 dark:border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-sky-500/12 border border-sky-500/20 grid place-items-center">
              <Shield className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
            </div>
            <span className="font-display font-bold text-[15px] text-slate-900 dark:text-white">Fortis</span>
          </div>
          <div className="text-[12px] text-slate-400">
            © 2026 Fortis. Система защиты промышленных предприятий от БПЛА.
          </div>
          <Link href="/dashboard" className="text-[12px] text-sky-500 hover:text-sky-400 transition-colors">
            Личный кабинет →
          </Link>
        </div>
      </footer>
    </div>
  );
}
