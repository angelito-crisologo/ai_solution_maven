import type { Metadata } from "next";
import Link from "next/link";
import { BookingLink } from "@/components/BookingLink";
import { ArrowLink } from "@/components/blocks/ArrowLink";
import { BlockDiagram } from "@/components/blocks/BlockDiagram";
import { Section } from "@/components/blocks/Section";
import { CredentialList } from "@/components/cards/CredentialTile";
import { DemoCard } from "@/components/cards/DemoCard";
import { DemoLabel } from "@/components/cards/DemoLabel";
import { ScreenshotFrame } from "@/components/cards/ScreenshotFrame";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { StepNumber } from "@/components/cards/StepNumber";
import { CtaBand } from "@/components/layout/CtaBand";
import { credentials, credentialsCopy } from "@/content/credentials";
import { demos } from "@/content/demos";
import { home, meta } from "@/content/pages";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { btnPrimary, btnSecondary, cx, h1Class, h2Class } from "@/lib/ui";

export const metadata: Metadata = pageMetadata(meta.home);

export default function HomePage() {
  const { hero, friction, help, starts } = home;

  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="h-hero"
        className="px-gutter pb-[clamp(48px,7vw,96px)] pt-[clamp(32px,6vw,88px)]"
      >
        <div className="mx-auto flex max-w-content flex-wrap items-center gap-[clamp(32px,5vw,64px)]">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
            <h1 id="h-hero" className={h1Class}>
              {hero.heading}
            </h1>
            <p className="m-0 text-lead font-medium text-navy-900">{hero.subheading}</p>
            <p className="m-0 max-w-[54ch]">{hero.offer}</p>
            <div className="mt-1 flex max-w-[520px] flex-wrap gap-3">
              <BookingLink location="hero" className={cx(btnPrimary, "flex-[1_1_200px]")}>
                {site.ctaLabel}
              </BookingLink>
              <Link
                href={hero.secondaryButton.href}
                className={cx(btnSecondary, "flex-[1_1_200px]")}
              >
                {hero.secondaryButton.label}
              </Link>
            </div>
          </div>
          <figure className="m-0 flex min-w-0 flex-[1_1_400px] flex-col gap-2.5 rounded-card border border-line bg-surface p-3">
            <figcaption className="flex flex-wrap items-center justify-between gap-2">
              <DemoLabel />
              <span className="text-label text-navy-900">{hero.imageCaption}</span>
            </figcaption>
            <ScreenshotFrame
              image={hero.image}
              sizes="(min-width: 1144px) 528px, (min-width: 960px) 45vw, 92vw"
              priority
            />
          </figure>
        </div>
      </section>

      {/* Where the friction usually is */}
      <section aria-labelledby="h-friction" className="bg-surface px-gutter py-section">
        <div className="mx-auto flex max-w-content flex-wrap items-start gap-x-[clamp(32px,5vw,64px)] gap-y-4">
          <h2 id="h-friction" className={cx(h2Class, "min-w-0 flex-[1_1_320px]")}>
            {friction.heading}
          </h2>
          <p className="m-0 min-w-0 max-w-[62ch] flex-[1.4_1_400px] text-lead-sm">
            {friction.text}
          </p>
        </div>
      </section>

      {/* Three ways I help */}
      <Section labelledBy="h-help" size="lg">
        <h2 id="h-help" className={h2Class}>
          {help.heading}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-card-gap">
          {help.cards.map((card, i) => (
            <ServiceCard key={card.title} {...card} accent={i === help.accent} />
          ))}
        </div>
        <ArrowLink {...help.link} />
      </Section>

      {/* Working demos */}
      <Section id="demos" labelledBy="h-demos" tone="surface" size="lg">
        <div className="flex max-w-[720px] flex-col gap-3">
          <h2 id="h-demos" className={h2Class}>
            {home.demos.heading}
          </h2>
          <p className="m-0">{home.demos.text}</p>
        </div>
        <div className="grid grid-cols-1 gap-card-gap three:grid-cols-3">
          {demos.map((demo) => (
            <DemoCard key={demo.id} demo={demo} variant="compact" />
          ))}
        </div>
        <ArrowLink {...home.demos.link} />
      </Section>

      {/* Credentials */}
      <Section labelledBy="h-cred" size="lg">
        <div className="flex flex-col gap-3">
          <h2 id="h-cred" className={h2Class}>
            {credentialsCopy.heading}
          </h2>
          <p className="m-0">{credentialsCopy.text}</p>
        </div>
        <CredentialList items={credentials} />
      </Section>

      {/* How it starts */}
      <Section labelledBy="h-starts" tone="surface" size="lg">
        <h2 id="h-starts" className={h2Class}>
          {starts.heading}
        </h2>
        <div className="flex flex-wrap items-stretch gap-card-gap">
          <BlockDiagram size={32} tone="white" className="flex-[1_1_300px]" />
          <ol className="m-0 grid min-w-0 flex-[2_1_460px] list-none grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-card-gap p-0">
            {starts.steps.map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3.5 rounded-card border border-line bg-white p-6"
              >
                <StepNumber n={i + 1} accent={i === starts.accent} />
                <p className="m-0 pt-[5px] text-navy-900">{step}</p>
              </li>
            ))}
          </ol>
        </div>
        <ArrowLink {...starts.link} />
      </Section>

      <CtaBand />
    </>
  );
}
