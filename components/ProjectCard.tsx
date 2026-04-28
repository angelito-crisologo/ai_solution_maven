import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  tags: string[];
  bars: number[];
};

export function ProjectCard({
  title,
  description,
  href,
  tags,
  bars,
}: ProjectCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="bg-slate-950 p-5 text-white">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-error" />
            <span className="h-3 w-3 rounded-full bg-warning" />
            <span className="h-3 w-3 rounded-full bg-success" />
          </div>
          <span className="text-xs text-slate-400">Preview</span>
        </div>
        <div className="grid h-40 items-end gap-3 rounded-xl bg-white/[0.06] p-4">
          <div className="flex items-end gap-2">
            {bars.map((height) => (
              <span
                key={height}
                className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-secondary"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-dark">{title}</h3>
          <Link
            href={href}
            aria-label={`View ${title}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-dark transition hover:border-primary hover:text-primary"
          >
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
