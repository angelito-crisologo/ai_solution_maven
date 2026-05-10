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
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">
          {isPlansight ? "PlanSight AI" : "AI Solution Maven"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-dark">
          {isPlansight ? "Sign up for PlanSight" : "Sign in"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isPlansight
            ? "We'll email you a magic link. No password needed. Signing up keeps your most recent imported plan accessible across sessions — Pro unlocks the multi-plan dashboard."
            : "We'll email you a magic link. No password needed."}
        </p>

        <SignInForm redirectTo={redirectTo} product={product} />
      </div>
    </main>
  );
}
