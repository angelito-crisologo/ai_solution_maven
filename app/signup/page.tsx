import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a PlanSight AI account to keep your imported plans across sessions."
};

type Props = {
  searchParams?: { redirectTo?: string; product?: string };
};

export default async function SignUpPage({ searchParams }: Props) {
  const product = searchParams?.product || "";
  const redirectTo =
    searchParams?.redirectTo || (product === "plansight-ai" ? "/my-plans" : "/my-plans");

  const user = await getCurrentUser();
  if (user) {
    redirect(redirectTo);
  }

  const isPlansight = product === "plansight-ai";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-micro text-cyan-700">
          {isPlansight ? "PlanSight AI" : "Sign up"}
        </p>
        <h1 className="mt-2 text-h1 text-ink">
          {isPlansight ? "Create your PlanSight account" : "Create your account"}
        </h1>
        <p className="mt-3 text-body text-slate-700">
          {isPlansight
            ? "Signing up keeps your most recent imported plan accessible across sessions — Pro unlocks the multi-plan dashboard."
            : "Sign up with your email and a password."}
        </p>

        <SignUpForm redirectTo={redirectTo} product={product} />
      </div>
    </main>
  );
}
