import type { Metadata } from "next";
import { AboutBlock } from "@/components/blocks/AboutBlock";
import { CheckList } from "@/components/blocks/CheckList";
import { Section } from "@/components/blocks/Section";
import { CredentialList } from "@/components/cards/CredentialTile";
import { CtaBand } from "@/components/layout/CtaBand";
import { RichText } from "@/components/RichText";
import { credentials, credentialsCopy } from "@/content/credentials";
import { about, meta } from "@/content/pages";
import { pageMetadata } from "@/lib/metadata";
import { h2Class } from "@/lib/ui";

export const metadata: Metadata = pageMetadata(meta.about);

export default function AboutPage() {
  return (
    <>
      <AboutBlock />

      <Section labelledBy="h-lines" tone="surface">
        <h2 id="h-lines" className={h2Class}>
          {about.lines.heading}
        </h2>
        <CheckList items={about.lines.items} />
      </Section>

      <Section labelledBy="h-cred">
        <h2 id="h-cred" className={h2Class}>
          {credentialsCopy.heading}
        </h2>
        <CredentialList items={credentials} />
      </Section>

      <Section labelledBy="h-exp" tone="surface">
        <h2 id="h-exp" className={h2Class}>
          {about.experience.heading}
        </h2>
        <ul className="m-0 flex max-w-[760px] list-none flex-col gap-3.5 p-0">
          {about.experience.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-navy-900">
              <span
                aria-hidden="true"
                className="mt-[11px] h-2 w-2 flex-none rounded-[2px] bg-navy-900"
              />
              <span>
                <RichText value={item} />
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand />
    </>
  );
}
