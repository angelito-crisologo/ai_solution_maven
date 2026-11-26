import Image from "next/image";
import { site } from "@/content/site";
import { cx } from "@/lib/ui";

type Props = {
  /** Mark size in px. Wordmark is 0.54 × mark height, gap is one block. */
  size?: 28 | 32 | 40;
  reversed?: boolean;
  className?: string;
};

const text: Record<NonNullable<Props["size"]>, string> = {
  28: "text-[15px] gap-2",
  32: "text-[18px] gap-2.5",
  40: "text-[22px] gap-3",
};

/** Logo lockup: the supplied mark plus the Inter 600 wordmark. */
export function Logo({ size = 32, reversed = false, className }: Props) {
  return (
    <span className={cx("flex min-w-0 items-center", text[size], className)}>
      <Image
        src={reversed ? "/brand/mark-reversed.svg" : "/brand/mark-colour.svg"}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="flex-none"
      />
      <span
        className={cx(
          "whitespace-nowrap font-semibold tracking-[-0.01em]",
          reversed ? "text-white" : "text-navy-900",
        )}
      >
        {site.name}
      </span>
    </span>
  );
}
