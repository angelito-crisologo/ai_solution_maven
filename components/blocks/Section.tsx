import type { ReactNode } from "react";
import { cx } from "@/lib/ui";

type Props = {
  children: ReactNode;
  /** Heading id for aria-labelledby. */
  labelledBy?: string;
  tone?: "white" | "surface";
  /** "lg" is the Home rhythm (64 to 96 px); default is 56 to 88 px. */
  size?: "md" | "lg";
  id?: string;
  className?: string;
  /** Classes for the inner 1120 px container. */
  innerClassName?: string;
};

/** Full-bleed band with the design's gutters and a 1120 px container. */
export function Section({
  children,
  labelledBy,
  tone = "white",
  size = "md",
  id,
  className,
  innerClassName = "flex flex-col gap-stack",
}: Props) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx(
        "px-gutter",
        size === "lg" ? "py-section-lg" : "py-section",
        tone === "surface" ? "bg-surface" : "bg-white",
        id && "scroll-mt-6",
        className,
      )}
    >
      <div className={cx("mx-auto w-full max-w-content", innerClassName)}>{children}</div>
    </section>
  );
}
