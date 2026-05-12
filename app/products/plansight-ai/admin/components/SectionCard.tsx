import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  /** Optional window label like "Last 7 days". */
  window?: string;
  children: ReactNode;
};

/**
 * Top-level wrapper for each admin section. Title, optional description
 * and time-window stamp, then children.
 */
export function SectionCard({ title, description, window, children }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-h2 text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 text-body text-slate-600">{description}</p>
          ) : null}
        </div>
        {window ? (
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-caption text-slate-600">
            {window}
          </span>
        ) : null}
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
