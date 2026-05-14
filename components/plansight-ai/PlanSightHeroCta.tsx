"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { Loader2 } from "lucide-react";

// Two primary CTAs plus a "Try a sample plan" escape hatch. Lives as a
// client component because it needs smooth-scroll + focus (upload CTA)
// and a POST fetch + router.push (sample CTA). The page stays async RSC.
export function PlanSightHeroCta() {
  const router = useRouter();
  const [sampleLoading, setSampleLoading] = useState(false);

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

  async function handleSampleClick() {
    setSampleLoading(true);
    try {
      const res = await fetch("/api/plansight/sample", { method: "POST" });
      if (!res.ok) throw new Error("sample api error");
      const { shareId } = (await res.json()) as { shareId: string };
      router.push(`?sample=${encodeURIComponent(shareId)}`);
      // Reset immediately — the shell remounts after navigation so the button
      // would otherwise stay stuck at "Preparing sample…" indefinitely.
      setSampleLoading(false);
    } catch {
      // On any failure reset the button — the user can try again or upload
      // their own file instead.
      setSampleLoading(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <a
        href="#plansight-workspace"
        onClick={handlePrimaryClick}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#22D3EE] px-5 text-body font-semibold text-navy transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:w-auto"
      >
        Upload your .mpp file
      </a>

      <div className="flex items-center gap-4">
        <Link
          href="#pricing"
          className="inline-flex h-11 items-center justify-center text-body font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:underline"
        >
          See pricing
        </Link>

        <span className="text-slate-600" aria-hidden>·</span>

        <button
          onClick={handleSampleClick}
          disabled={sampleLoading}
          className="inline-flex h-11 items-center justify-center gap-1.5 text-body font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:underline disabled:opacity-60"
        >
          {sampleLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Preparing sample…
            </>
          ) : (
            "Try a sample plan →"
          )}
        </button>
      </div>
    </div>
  );
}
