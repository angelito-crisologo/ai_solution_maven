import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PlanSight AI to keep your imported plans across sessions."
};

type Props = {
  searchParams?: { redirectTo?: string };
};

export default async function SignInPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user) {
    redirect(searchParams?.redirectTo || "/my-plans");
  }

  const redirectTo = searchParams?.redirectTo || "/my-plans";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">
          PlanSight AI
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-dark">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We&apos;ll email you a magic link. No password needed. Signing in keeps
          your most recent imported plan accessible across sessions — Pro
          unlocks the multi-plan dashboard.
        </p>

        <SignInForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
