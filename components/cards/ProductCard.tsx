import { Fragment } from "react";
import type { ImageAsset } from "@/content/types";
import { h3Class } from "@/lib/ui";
import { ExternalLink } from "../Icons";
import { ScreenshotFrame } from "./ScreenshotFrame";

type Props = {
  title: string;
  text: string;
  href: string;
  /** The product address, split where it may wrap on a phone. */
  hostParts: readonly string[];
  image: ImageAsset;
};

/** Own-product card: same frame as a demo card, no demo label, links out. */
export function ProductCard({ title, text, href, hostParts, image }: Props) {
  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-line bg-white">
      <div className="border-b border-line bg-surface p-3">
        <ScreenshotFrame
          image={image}
          sizes="(min-width: 1000px) 456px, (min-width: 720px) 46vw, 92vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className={h3Class}>{title}</h3>
        <p className="m-0">{text}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex min-h-[44px] min-w-0 items-center gap-1.5 self-start text-[17px] font-semibold text-teal-700 underline underline-offset-4 [overflow-wrap:break-word] hover:text-navy-900"
        >
          <span className="min-w-0">
            {hostParts.map((part, i) => (
              <Fragment key={part}>
                {part}
                {i < hostParts.length - 1 ? <wbr /> : null}
              </Fragment>
            ))}
          </span>
          <ExternalLink />
        </a>
      </div>
    </article>
  );
}
