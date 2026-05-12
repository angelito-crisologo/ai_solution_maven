import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PlanSight AI to keep your imported plans across sessions."
};

type Props = {
  searchParams?: { redirectTo?: string; product?: string; error?: string };
};

export default async function SignInPage({ searchParams }: Props) {
  const redirectTo = searchParams?.redirectTo || "/";
  const product = searchParams?.product;

  // Legacy URL: /signin?product=plansight-ai was the old sign-up entry
  // point. Route it to the new /signup page so old bookmarks/nav links keep
  // working.
  if (product) {
    const params = new URLSearchParams({ product, redirectTo });
    redirect(`/signup?${params.toString()}`);
  }

  const user = await getCurrentUser();
  if (user) {
    redirect(redirectTo);
  }

  const errorMessage = mapCallbackError(searchParams?.error);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-micro text-cyan-700">Sign in</p>
        <h1 className="mt-2 text-h1 text-ink">Welcome back</h1>
        <p className="mt-3 text-body text-slate-700">
          Sign in with your email and password to access your plans.
        </p>

        {errorMessage ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-body text-red-800">
            {errorMessage}
          </p>
        ) : null}

        <SignInForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}

function mapCallbackError(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "missing_code") {
    return "That confirmation link was incomplete. Please try again or request a new one.";
  }
  if (error === "expired_link") {
    return "That link has expired. Please request a new one.";
  }
  return decodeURIComponent(error);
}
