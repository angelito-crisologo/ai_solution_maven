import Image from "next/image";
import { about } from "@/content/pages";
import { h1Class } from "@/lib/ui";
import { RichText } from "../RichText";

/** About hero: 4:5 photo (320 px at most), h1, subheading and the bio. */
export function AboutBlock() {
  return (
    <section
      aria-labelledby="h-page"
      className="px-gutter pb-section pt-[clamp(40px,6vw,80px)]"
    >
      <div className="mx-auto flex max-w-content flex-wrap items-start gap-[clamp(24px,5vw,64px)]">
        <div className="aspect-[4/5] w-full min-w-0 max-w-[320px] flex-[0_1_320px] overflow-hidden rounded-card border border-line">
          <Image
            src={about.photo.src}
            alt={about.photo.alt}
            width={about.photo.width}
            height={about.photo.height}
            sizes="(min-width: 375px) 320px, 92vw"
            priority
            className="block h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 max-w-[680px] flex-[1_1_360px] flex-col gap-4">
          <h1 id="h-page" className={h1Class}>
            {about.heading}
          </h1>
          <p className="m-0 text-lead font-medium text-navy-900">{about.subheading}</p>
          {about.bio.map((paragraph, i) => (
            <p key={i} className="m-0">
              <RichText value={paragraph} />
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
