"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-light font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">Application error</p>
            <h1 className="mt-2 text-2xl font-semibold text-dark">PlanSight AI could not load</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The app hit an unexpected error. Retry the page after the cache has refreshed.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 rounded-full bg-dark px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Retry
            </button>
            {/* Plain anchors, not next/link — the root layout is gone in this
                error boundary, so use the safest possible navigation. */}
            <nav aria-label="Legal" className="mt-6 flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <a href="/products/plansight-ai/legal/terms" className="transition hover:text-slate-700">Terms</a>
              <a href="/products/plansight-ai/legal/privacy" className="transition hover:text-slate-700">Privacy</a>
              <a href="/products/plansight-ai/legal/refunds" className="transition hover:text-slate-700">Refunds</a>
            </nav>
          </div>
        </div>
      </body>
    </html>
  );
}
