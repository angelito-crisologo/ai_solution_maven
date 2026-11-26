import { cx } from "@/lib/ui";

type Props = {
  /** What still needs confirming, from the copy deck's square brackets. */
  children: string;
  /** "block" sits on its own line, as for the live demo link. */
  variant?: "inline" | "block";
  /** Keep an inline chip on one line (Home demo cards). */
  nowrap?: boolean;
};

/**
 * The one way an unresolved fact appears on the site: a visible, clearly
 * marked chip. `npm run check:placeholders` fails while any remain.
 */
export function Placeholder({ children, variant = "inline", nowrap = false }: Props) {
  return (
    <span
      data-placeholder=""
      className={cx(
        "rounded-tag border border-dashed border-placeholder-ink bg-placeholder-tint text-label text-placeholder-ink",
        variant === "inline"
          ? "inline px-2 py-0.5"
          : "block self-start px-2 py-1",
        nowrap && "whitespace-nowrap",
      )}
    >
      Placeholder: {children}
    </span>
  );
}
