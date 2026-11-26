import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { Section } from "@/components/blocks/Section";
import { DemoCard } from "@/components/cards/DemoCard";
import { ProductCard } from "@/components/cards/ProductCard";
import { CtaBand } from "@/components/layout/CtaBand";
import { demos } from "@/content/demos";
import { meta, work } from "@/content/pages";
import { pageMetadata } from "@/lib/metadata";
import { h2Class } from "@/lib/ui";

export const metadata: Metadata = pageMetadata(meta.work);

export default function WorkPage() {
  return (
    <>
      <PageIntro heading={work.heading} intro={work.intro} />

      <Section id="demos" labelledBy="h-demos" tone="surface">
        <h2 id="h-demos" className={h2Class}>
          {work.demos.heading}
        </h2>
        <p className="m-0 rounded-control border border-teal-700 bg-teal-50 px-5 py-4 font-semibold text-navy-900">
          {work.demos.banner}
        </p>
        {demos.map((demo) => (
          <DemoCard key={demo.id} demo={demo} variant="full" />
        ))}
      </Section>

      <Section labelledBy="h-products">
        <div className="flex flex-col gap-3">
          <h2 id="h-products" className={h2Class}>
            {work.products.heading}
          </h2>
          <p className="m-0">{work.products.text}</p>
        </div>
        <div className="grid max-w-[960px] grid-cols-1 gap-card-gap two:grid-cols-2">
          {work.products.items.map((product) => (
            <ProductCard key={product.title} {...product} />
          ))}
        </div>
      </Section>

      <CtaBand eyebrow={work.ctaBand.eyebrow} heading={work.ctaBand.heading} text="" />
    </>
  );
}
