import Image from "next/image";
import { about } from "@/content/pages";
import { site } from "@/content/site";

/**
 * Short bio card, as in the design system: square crop of the photo, name,
 * city and the short bio. Not placed on a page in this release (the
 * approved Home design has no bio); kept for social cards and later use.
 */
export function ShortBioCard() {
  return (
    <article className="flex flex-col gap-4 rounded-card border border-line bg-white p-6">
      <div className="flex items-center gap-3.5">
        <div className="h-[72px] w-[72px] flex-none overflow-hidden rounded-control border border-line">
          <Image
            src={about.photo.src}
            alt={about.photo.alt}
            width={72}
            height={90}
            sizes="72px"
            className="block h-full w-full object-cover [object-position:50%_22%]"
          />
        </div>
        <div className="flex min-w-0 flex-col">
          <strong className="text-[20px] leading-[1.3] text-navy-900">{about.name}</strong>
          <span className="text-small text-ink-500">{site.location}</span>
        </div>
      </div>
      <p className="m-0">{about.shortBio}</p>
    </article>
  );
}
