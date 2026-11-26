import { cx } from "@/lib/ui";

/**
 * Numbered block. Teal 500 marks the first application (navy text on teal is
 * large text at 4.2:1, which passes); every other step is navy with white.
 */
export function StepNumber({ n, accent = false }: { n: number; accent?: boolean }) {
  return (
    <span
      className={cx(
        "flex h-10 w-10 flex-none items-center justify-center rounded-image text-[20px] font-bold",
        accent ? "bg-teal-500 text-navy-900" : "bg-navy-900 text-white",
      )}
    >
      {n}
    </span>
  );
}
