import Link from "next/link";
import { demoCopy, type Demo } from "@/content/demos";
import { cx, h3Class } from "@/lib/ui";
import { Placeholder } from "../Placeholder";
import { RichText } from "../RichText";
import { DemoLabel } from "./DemoLabel";
import { ScreenshotFrame } from "./ScreenshotFrame";

type Props = {
  demo: Demo;
  /**
   * "compact": one screenshot and a "See the screenshots" link (Home).
   * "full": both screenshots side by side from 720 px (Work).
   */
  variant: "compact" | "full";
};

/** Demo card, with the "Demo, synthetic data" label above the image. */
export function DemoCard({ demo, variant }: Props) {
  const full = variant === "full";
  const images = full ? demo.images : [demo.images[demo.homeImage]];

  return (
    <article
      id={full ? demo.id : undefined}
      className={cx(
        "flex flex-col overflow-hidden rounded-card border border-line bg-white",
        full && "scroll-mt-6",
      )}
    >
      <div className="flex flex-col gap-2.5 border-b border-line bg-surface p-3">
        <DemoLabel />
        <div className={cx(full && "grid grid-cols-1 gap-3 two:grid-cols-2")}>
          {images.map((image) => (
            <ScreenshotFrame
              key={image.src}
              image={image}
              sizes={
                full
                  ? "(min-width: 1144px) 536px, (min-width: 720px) 46vw, 92vw"
                  : "(min-width: 1144px) 350px, (min-width: 860px) 30vw, 92vw"
              }
            />
          ))}
        </div>
      </div>
      <div className={cx("flex flex-col gap-3 p-6", !full && "flex-1")}>
        <h3 className={h3Class}>{demo.title}</h3>
        <p className={cx("m-0", full && "max-w-prose")}>{demo.text}</p>
        <p className="m-0 text-small text-ink-500">
          <span className="font-semibold text-navy-900">{demoCopy.builtWithLabel}</span>{" "}
          <RichText value={demo.builtWith} />
        </p>
        {demo.liveDemo ? <Placeholder variant="block">{demo.liveDemo.placeholder}</Placeholder> : null}
        {!full ? (
          <Link
            href={`/work#${demo.id}`}
            className="mt-auto inline-flex min-h-[44px] items-center self-start font-semibold text-teal-700 underline underline-offset-4 hover:text-navy-900"
          >
            {demoCopy.screenshotsLink}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
