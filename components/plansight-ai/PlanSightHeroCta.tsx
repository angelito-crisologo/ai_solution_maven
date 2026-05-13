"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

// Two-button hero CTA. Lives as a client component because it needs to
// take over the anchor click to do smooth-scroll + focus the file
// input — both are runtime-only behaviours. The page itself stays an
// async Server Component.
export function PlanSightHeroCta() {
  function handlePrimaryClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const workspace = document.getElementById("plansight-workspace");
    workspace?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Briefly defer focus so the smooth-scroll has a moment to start
    // before the file input grabs the viewport.
    requestAnimationFrame(() => {
      document
        .getElementById("plansight-file-input")
        ?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <a
        href="#plansight-workspace"
        onClick={handlePrimaryClick}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#22D3EE] px-5 text-body font-semibold text-navy transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:w-auto"
      >
        Upload your .mpp file
      </a>
      <Link
        href="#pricing"
        className="inline-flex h-11 items-center justify-center text-body font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:underline"
      >
        See pricing
      </Link>
    </div>
  );
}
