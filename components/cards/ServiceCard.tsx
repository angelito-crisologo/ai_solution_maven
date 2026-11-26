import { cx, h3Class } from "@/lib/ui";

type Props = {
  title: string;
  text: string;
  /** Teal marker for the "first application" card; navy otherwise. */
  accent?: boolean;
};

/** Service card: square marker, h3, one paragraph. */
export function ServiceCard({ title, text, accent = false }: Props) {
  return (
    <article className="flex flex-col gap-3 rounded-card border border-line bg-white p-6">
      <span
        aria-hidden="true"
        className={cx("h-5 w-5 rounded-tag", accent ? "bg-teal-500" : "bg-navy-900")}
      />
      <h3 className={h3Class}>{title}</h3>
      <p className="m-0">{text}</p>
    </article>
  );
}
