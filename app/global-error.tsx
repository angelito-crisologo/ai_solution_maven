"use client";

import { useEffect } from "react";
import { system } from "@/content/system";
import "./globals.css";

/** Replaces the root layout when it fails, so it carries its own shell. */
export default function GlobalError({
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
    <html lang="en-AU">
      <body className="font-sans">
        <main className="px-gutter py-section-lg">
          <div className="mx-auto flex max-w-content flex-col items-start gap-5">
            <h1 className="m-0 text-display text-navy-900">{system.error.heading}</h1>
            <p className="m-0 max-w-[60ch] text-lead">{system.error.text}</p>
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-[48px] items-center rounded-control bg-teal-700 px-[22px] py-3 text-[17px] font-semibold text-white hover:bg-navy-900"
            >
              {system.error.retry}
            </button>
            <a href="/" className="font-semibold">
              {system.error.home}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
