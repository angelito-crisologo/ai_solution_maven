import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PlanSight AI to keep your imported plans across sessions."
};

type Props = {
  searchParams?: { redirectTo?: string; product?: string };
};

export default async function SignInPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const product = searchParams?.product || "";
  const redirectTo =
    searchParams?.redirectTo || (product === "plansight-ai" ? "/my-plans" : "/");

  if (user) {
    redirect(redirectTo);
  }

  // Frame the page around the product when one was requested. PlanSight
  // is the only product today, so the "branded" path is just for it.
  const isPlansight = product === "plansight-ai";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-micro text-cyan-700">
          {isPlansight ? "PlanSight AI" : "Sign in"}
        </p>
        <h1 className="mt-2 text-h1 text-ink">
          {isPlansight ? "Sign up for PlanSight" : "Welcome back"}
        </h1>
        <p className="mt-3 text-body text-slate-700">
          {isPlansight
            ? "We'll email you a magic link. No password needed. Signing up keeps your most recent imported plan accessible across sessions — Pro unlocks the multi-plan dashboard."
            : "Enter your email and we'll send you a magic link. The same link works whether you've used PlanSight before or not."}
        </p>

        <SignInForm redirectTo={redirectTo} product={product} />

        {!isPlansight ? (
          <p className="mt-6 border-t border-slate-200 pt-4 text-caption text-slate-500">
            New to PlanSight?{" "}
            <a
              href={`/signin?product=plansight-ai&redirectTo=${encodeURIComponent(redirectTo)}`}
              className="font-semibold text-cyan-700 underline-offset-2 transition hover:text-cyan-800 hover:underline"
            >
              Sign up here
            </a>
            .
          </p>
        ) : null}
      </div>
    </main>
  );
}
