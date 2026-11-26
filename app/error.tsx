"use client";

import { useEffect } from "react";
import { ArrowLink } from "@/components/blocks/ArrowLink";
import { system } from "@/content/system";
import { btnPrimary, h1Class } from "@/lib/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="px-gutter py-section-lg">
      <div className="mx-auto flex max-w-content flex-col items-start gap-5">
        <h1 className={h1Class}>{system.error.heading}</h1>
        <p className="m-0 max-w-[60ch] text-lead">{system.error.text}</p>
        <button type="button" onClick={() => reset()} className={btnPrimary}>
          {system.error.retry}
        </button>
        <ArrowLink href="/" label={system.error.home} />
      </div>
    </section>
  );
}
