import type { ReactNode } from "react";

export type Stat = {
  label: string;
  value: string | number;
  /** Optional sub-line like "+12% vs prior 7d" or "↑ 5". */
  hint?: string;
  /** Optional emoji or icon character. */
  accent?: string;
};

type Props = {
  stats: Stat[];
  /** Optional override for grid column count. Defaults sensibly per stat count. */
  columnsClass?: string;
};

export function StatRow({ stats, columnsClass }: Props) {
  const cols =
    columnsClass ??
    (stats.length >= 4
      ? "grid-cols-2 md:grid-cols-4"
      : stats.length === 3
        ? "grid-cols-3"
        : "grid-cols-2");
  return (
    <div className={`grid gap-3 ${cols}`}>
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-caption font-medium uppercase tracking-wider text-slate-500">
        {stat.label}
      </p>
      <p className="mt-1.5 text-h2 leading-tight text-ink">
        {stat.accent ? <span className="mr-1.5">{stat.accent}</span> : null}
        {stat.value}
      </p>
      {stat.hint ? (
        <p className="mt-0.5 text-caption text-slate-500">{stat.hint}</p>
      ) : null}
    </div>
  );
}

/** Helpers for formatting stat values. */
export function formatPct(n: number | null, fractionDigits = 0): string {
  if (n == null) return "—";
  return `${n.toFixed(fractionDigits)}%`;
}

export function formatMs(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(2)}s`;
  return `${Math.round(n)}ms`;
}

export function formatUsd(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

export function formatInt(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

export function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}
