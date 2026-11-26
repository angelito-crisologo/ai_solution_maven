import type { Metadata } from "next";
import { RichText } from "@/components/RichText";
import { meta, privacy } from "@/content/pages";
import { pageMetadata } from "@/lib/metadata";
import { h1Class } from "@/lib/ui";

export const metadata: Metadata = pageMetadata(meta.privacy);

/** Privacy policy. No call-to-action band, only the header button. */
export default function PrivacyPage() {
  return (
    <div className="px-gutter pb-[clamp(56px,7vw,96px)] pt-[clamp(40px,6vw,80px)]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-7">
        <div className="flex flex-col gap-3">
          <h1 className={h1Class}>{privacy.heading}</h1>
          <p className="m-0 text-small text-ink-500">
            {privacy.lastUpdatedLabel} <RichText value={privacy.lastUpdated} />
          </p>
        </div>
        {privacy.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="m-0 text-h3 text-navy-900">{section.heading}</h2>
            <p className="m-0">
              <RichText value={section.text} />
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
