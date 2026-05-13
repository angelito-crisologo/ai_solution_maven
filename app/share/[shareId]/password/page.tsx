import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ error?: string }>;
};

/**
 * Generic password prompt for a protected share link. Per the spec, this
 * page must not reveal the plan name, owner, project description, or
 * anything else that could leak metadata before authentication. The
 * title is the same regardless of whether the share is revoked,
 * non-existent, rate-limited, or genuinely password-protected.
 */
export const metadata: Metadata = {
  title: "Password required — PlanSight AI",
  description: "This shared plan is password-protected.",
  robots: { index: false, follow: false }
};

export default async function ShareLinkPasswordPrompt({
  params,
  searchParams
}: Props) {
  const { shareId } = await params;
  const { error } = await searchParams;
  const hasError = error === "1";

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="h-16 border-b border-slate-200 bg-white px-6">
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-4">
          <Link
            href="/products/plansight-ai"
            aria-label="PlanSight AI"
            className="shrink-0"
          >
            <Image
              src="/products/plansight-ai/brand/plansight-logo-primary.svg"
              alt="PlanSight AI"
              width={180}
              height={36}
              priority
              className="h-8 w-auto sm:h-9"
            />
          </Link>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-micro text-slate-500">Protected share</p>
              <h1 className="text-h2 text-ink">Password required</h1>
            </div>
          </div>

          <p className="mt-4 text-body text-slate-700">
            Enter the password to view this shared plan. Ask the person who
            sent you the link if you don&apos;t have it.
          </p>

          <form
            action="/api/plansight/share/verify"
            method="post"
            className="mt-6 space-y-3"
          >
            <input type="hidden" name="shareId" value={shareId} />
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="off"
              className="block w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-body text-ink focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
            >
              View shared plan
            </button>
          </form>

          {hasError ? (
            <p
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-caption text-red-800"
            >
              Incorrect password.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
