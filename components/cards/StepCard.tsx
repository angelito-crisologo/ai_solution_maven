import { h3Class } from "@/lib/ui";
import { StepNumber } from "./StepNumber";

type Props = {
  n: number;
  title: string;
  text: string;
  getLabel: string;
  get: string;
  accent?: boolean;
};

/** How I work step: number and h3, what happens, then "What you get". */
export function StepCard({ n, title, text, getLabel, get, accent }: Props) {
  return (
    <article className="flex flex-col gap-3.5 rounded-card border border-line bg-white p-6">
      <div className="flex items-center gap-3">
        <StepNumber n={n} accent={accent} />
        <h3 className={h3Class}>{title}</h3>
      </div>
      <p className="m-0">{text}</p>
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3.5">
        <span className="text-label text-teal-700">{getLabel}</span>
        <p className="m-0 text-body-sm text-navy-900">{get}</p>
      </div>
    </article>
  );
}
