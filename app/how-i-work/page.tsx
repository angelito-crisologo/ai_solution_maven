import type { Metadata } from "next";
import { BlockDiagram } from "@/components/blocks/BlockDiagram";
import { CheckList } from "@/components/blocks/CheckList";
import { PageIntro } from "@/components/blocks/PageIntro";
import { Section } from "@/components/blocks/Section";
import { StepCard } from "@/components/cards/StepCard";
import { CtaBand } from "@/components/layout/CtaBand";
import { RichText } from "@/components/RichText";
import { howIWork, meta } from "@/content/pages";
import { pageMetadata } from "@/lib/metadata";
import { h2Class, srOnly } from "@/lib/ui";

export const metadata: Metadata = pageMetadata(meta.howIWork);

export default function HowIWorkPage() {
  const { steps, costs, handover, questions } = howIWork;

  return (
    <>
      <PageIntro
        heading={howIWork.heading}
        intro={howIWork.intro}
        aside={<BlockDiagram size={36} tone="surface" className="flex-[1_1_300px]" />}
      />

      <Section
        labelledBy="h-steps"
        tone="surface"
        innerClassName="grid grid-cols-1 gap-card-gap two:grid-cols-2"
      >
        <h2 id="h-steps" className={srOnly}>
          {howIWork.stepsHeading}
        </h2>
        {steps.map((step, i) => (
          <StepCard
            key={step.title}
            n={i + 1}
            title={step.title}
            text={step.text}
            getLabel={howIWork.whatYouGet}
            get={step.get}
            accent={i === howIWork.accent}
          />
        ))}
      </Section>

      <Section innerClassName="grid grid-cols-1 gap-[clamp(40px,5vw,64px)] two:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h2 className={h2Class}>{costs.heading}</h2>
          <CheckList items={costs.items} />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className={h2Class}>{handover.heading}</h2>
          <p className="m-0">{handover.text}</p>
        </div>
      </Section>

      <Section labelledBy="h-it" tone="surface">
        <h2 id="h-it" className={h2Class}>
          {questions.heading}
        </h2>
        <dl className="m-0 flex flex-col border-b border-line">
          {questions.items.map((item) => (
            <div
              key={item.q}
              className="flex flex-wrap gap-x-8 gap-y-1 border-t border-line py-5"
            >
              <dt className="flex-[1_1_260px] text-[20px] font-semibold leading-[1.4] text-navy-900">
                {item.q}
              </dt>
              <dd className="m-0 flex-[2_1_320px]">
                <RichText value={item.a} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <CtaBand />
    </>
  );
}
