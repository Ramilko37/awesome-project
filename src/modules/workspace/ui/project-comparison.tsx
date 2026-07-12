import type { BackendConfigSnapshot, BackendProjectCompare } from "@/modules/defense-calculator/infra/backend-project-api";

function formatMln(value: number) {
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млн ₽`;
}

function signed(value: number) {
  if (value > 0) return `+${value.toLocaleString("ru-RU")}`;
  if (value < 0) return `−${Math.abs(value).toLocaleString("ru-RU")}`;
  return "0";
}

export function canCompareProjects(projectA: string, projectB: string) {
  return projectA.length > 0 && projectB.length > 0 && projectA !== projectB;
}

function SnapshotCard({ title, snapshot }: { title: string; snapshot: BackendConfigSnapshot }) {
  const profile = snapshot.structuralProfile;
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label={title}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <h3 className="mt-1 text-base font-bold text-slate-950">{snapshot.projectName}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt className="text-slate-500">Стоимость</dt><dd className="font-mono font-bold">{formatMln(snapshot.costCalculation.totalMln)}</dd></div>
        <div><dt className="text-slate-500">Объекты</dt><dd className="font-mono font-bold">{profile.objectCount}</dd></div>
        <div><dt className="text-slate-500">Единицы</dt><dd className="font-mono font-bold">{profile.unitCount}</dd></div>
        <div><dt className="text-slate-500">Конфликты</dt><dd className="font-mono font-bold">{profile.conflictCount}</dd></div>
        <div><dt className="text-slate-500">Покрытые объекты</dt><dd className="font-mono font-bold">{profile.coveredObjCount}</dd></div>
        <div><dt className="text-slate-500">Эшелоны</dt><dd className="font-mono font-bold">{profile.echelonCount}</dd></div>
      </dl>
    </section>
  );
}

export function ProjectComparison({ comparison }: { comparison: BackendProjectCompare }) {
  const metrics = [
    ["Стоимость", comparison.diff.costDeltaMln, "млн ₽"],
    ["Объекты", comparison.diff.objectCountDelta, ""],
    ["Единицы", comparison.diff.unitCountDelta, ""],
    ["Эшелоны", comparison.diff.echelonCountDelta, ""],
    ["Категории", comparison.diff.categoryCountDelta, ""],
    ["Конфликты", comparison.diff.conflictCountDelta, ""],
    ["Покрытые объекты", comparison.diff.coveredObjCountDelta, ""],
  ] as const;

  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4" aria-label="Результат сравнения вариантов">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Результат A/B сравнения</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SnapshotCard title="Вариант A" snapshot={comparison.projectA} />
        <SnapshotCard title="Вариант B" snapshot={comparison.projectB} />
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, suffix]) => (
          <div key={label} className="rounded-md border border-slate-100 bg-white p-3">
            <dt className="text-xs text-slate-500">Δ {label}</dt>
            <dd className={`mt-1 font-mono text-lg font-bold ${value < 0 ? "text-emerald-700" : value > 0 ? "text-blue-700" : "text-slate-700"}`}>
              {signed(value)}{suffix ? ` ${suffix}` : ""}
            </dd>
          </div>
        ))}
      </dl>

      {comparison.diff.byEchelon.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-800">Дельта по эшелонам</h3>
          <table className="mt-2 min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-2 py-2">Эшелон</th><th className="px-2 py-2">Объекты</th><th className="px-2 py-2">Единицы</th><th className="px-2 py-2">Конфликты</th><th className="px-2 py-2">Покрытие</th></tr>
            </thead>
            <tbody>
              {comparison.diff.byEchelon.map((row) => (
                <tr key={row.layerId} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-medium">{row.layerCode} · {row.layerName}</td>
                  <td className="px-2 py-2 font-mono">{signed(row.objectCountDelta)}</td>
                  <td className="px-2 py-2 font-mono">{signed(row.unitCountDelta)}</td>
                  <td className="px-2 py-2 font-mono">{signed(row.conflictCountDelta)}</td>
                  <td className="px-2 py-2 font-mono">{signed(row.coveredObjDelta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
