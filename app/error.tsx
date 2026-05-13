"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
    <div className="flex min-h-screen items-center justify-center bg-light px-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold text-dark">The page failed to load</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Refreshing should usually recover from a transient error. If it does not, the browser console will show the
          underlying issue.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-full bg-dark px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Try again
        </button>
        <nav aria-label="Legal" className="mt-6 flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <Link href="/products/plansight-ai/legal/terms" className="transition hover:text-slate-700">Terms</Link>
          <Link href="/products/plansight-ai/legal/privacy" className="transition hover:text-slate-700">Privacy</Link>
          <Link href="/products/plansight-ai/legal/refunds" className="transition hover:text-slate-700">Refunds</Link>
        </nav>
      </div>
    </div>
  );
}
