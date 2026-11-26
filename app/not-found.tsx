import type { Metadata } from "next";
import { ArrowLink } from "@/components/blocks/ArrowLink";
import { system } from "@/content/system";
import { h1Class } from "@/lib/ui";

export const metadata: Metadata = {
  title: { absolute: system.notFound.heading },
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="px-gutter py-section-lg">
      <div className="mx-auto flex max-w-content flex-col gap-5">
        <h1 className={h1Class}>{system.notFound.heading}</h1>
        <p className="m-0 max-w-[60ch] text-lead">{system.notFound.text}</p>
        <ArrowLink href="/" label={system.notFound.link} />
      </div>
    </section>
  );
}
