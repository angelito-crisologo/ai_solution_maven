import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your PlanSight AI password by email."
};

type Props = {
  searchParams?: { redirectTo?: string };
};

export default function ForgotPasswordPage({ searchParams }: Props) {
  const redirectTo = searchParams?.redirectTo || "/";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-micro text-cyan-700">Reset password</p>
        <h1 className="mt-2 text-h1 text-ink">Forgot your password?</h1>
        <p className="mt-3 text-body text-slate-700">
          Enter your email and we&apos;ll send you a link to choose a new one.
        </p>

        <ForgotPasswordForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
