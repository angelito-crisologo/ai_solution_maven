import { diagram } from "@/content/pages";
import { cx } from "@/lib/ui";
import { ArrowRight } from "../Icons";

/** Grid positions of the mark's six blocks (column, row). Top one is teal. */
const BLOCKS: ReadonlyArray<[number, number]> = [
  [3, 1],
  [2, 2],
  [3, 2],
  [1, 3],
  [2, 3],
  [3, 3],
];

function Staircase({ filled, size }: { filled: boolean; size: 32 | 36 }) {
  return (
    <div
      className="grid gap-[5px]"
      style={{
        gridTemplateColumns: `repeat(3, ${size}px)`,
        gridTemplateRows: `repeat(3, ${size}px)`,
      }}
    >
      {BLOCKS.map(([col, row], i) => (
        <span
          key={`${col}-${row}`}
          style={{ gridColumn: col, gridRow: row }}
          className={cx(
            "rounded-[5px]",
            i === 0
              ? "bg-teal-500"
              : filled
                ? "bg-navy-900"
                : "border-[1.5px] border-dashed border-ink-400",
          )}
        />
      ))}
    </div>
  );
}

type Props = {
  /** Block size: 32 on Home, 36 on How I work. */
  size?: 32 | 36;
  /** Panel background: white on Home, Surface on How I work. */
  tone?: "white" | "surface";
  className?: string;
};

/** "One application, then a platform", built from the mark's grid. */
export function BlockDiagram({ size = 32, tone = "white", className }: Props) {
  const captionWidth = size === 32 ? "w-[106px]" : "w-[118px]";
  const arrowOffset = size === 32 ? "mt-[41px]" : "mt-[47px]";
  return (
    <figure
      role="img"
      aria-label={diagram.label}
      className={cx(
        "m-0 flex min-w-0 flex-nowrap items-end justify-center gap-3 rounded-card border border-line px-4 py-[clamp(20px,3vw,32px)]",
        tone === "white" ? "bg-white" : "bg-surface",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Staircase filled={false} size={size} />
        <span className={cx("text-center text-caption font-semibold leading-[1.3] text-navy-900", captionWidth)}>
          {diagram.first}
        </span>
      </div>
      <ArrowRight className={cx("flex-none self-start text-ink-500", arrowOffset)} />
      <div className="flex flex-col items-center gap-3">
        <Staircase filled size={size} />
        <span className={cx("text-center text-caption font-semibold leading-[1.3] text-navy-900", captionWidth)}>
          {diagram.then}
        </span>
      </div>
    </figure>
  );
}
