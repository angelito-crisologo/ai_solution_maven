import type { ReactNode } from "react";
import { h1Class } from "@/lib/ui";

type Props = {
  heading: string;
  intro: string;
  /** Optional figure beside the text, e.g. the block diagram. */
  aside?: ReactNode;
};

/** Inner-page heading block: h1 and a lead paragraph. */
export function PageIntro({ heading, intro, aside }: Props) {
  return (
    <section
      aria-labelledby="h-page"
      className="px-gutter pb-[clamp(40px,5vw,64px)] pt-[clamp(40px,6vw,80px)]"
    >
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-[clamp(32px,5vw,64px)]">
        <div className="flex min-w-0 flex-[1.4_1_440px] flex-col gap-5">
          <h1 id="h-page" className={h1Class}>
            {heading}
          </h1>
          <p className="m-0 max-w-[60ch] text-lead">{intro}</p>
        </div>
        {aside}
      </div>
    </section>
  );
}
