import type { Metadata } from "next";
import { CheckList } from "@/components/blocks/CheckList";
import { PageIntro } from "@/components/blocks/PageIntro";
import { Section } from "@/components/blocks/Section";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { CtaBand } from "@/components/layout/CtaBand";
import { meta, services } from "@/content/pages";
import { pageMetadata } from "@/lib/metadata";
import { h2Class } from "@/lib/ui";

export const metadata: Metadata = pageMetadata(meta.services);

export default function ServicesPage() {
  const { consulting, build, costs, itTeam, ctaBand } = services;

  return (
    <>
      <PageIntro heading={services.heading} intro={services.intro} />

      <Section labelledBy="h-consult" tone="surface">
        <h2 id="h-consult" className={h2Class}>
          {consulting.heading}
        </h2>
        <div className="grid grid-cols-1 gap-card-gap two:grid-cols-2">
          {consulting.cards.map((card) => (
            <ServiceCard key={card.title} {...card} />
          ))}
        </div>
      </Section>

      <Section labelledBy="h-build">
        <h2 id="h-build" className={h2Class}>
          {build.heading}
        </h2>
        <div className="grid grid-cols-1 gap-card-gap three:grid-cols-3">
          {build.cards.map((card) => (
            <ServiceCard key={card.title} {...card} />
          ))}
        </div>
      </Section>

      <Section
        tone="surface"
        innerClassName="grid grid-cols-1 gap-[clamp(40px,5vw,64px)] two:grid-cols-2"
      >
        <div className="flex flex-col gap-4">
          <h2 className={h2Class}>{costs.heading}</h2>
          <p className="m-0">{costs.text}</p>
        </div>
        <div className="flex flex-col gap-5">
          <h2 className={h2Class}>{itTeam.heading}</h2>
          <CheckList items={itTeam.items} />
        </div>
      </Section>

      <CtaBand heading={ctaBand.heading} text={ctaBand.text} />
    </>
  );
}
