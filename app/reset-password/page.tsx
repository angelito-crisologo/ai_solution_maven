import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your PlanSight AI account."
};

type Props = {
  searchParams?: { next?: string };
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  // The user lands here after clicking the email reset link. The auth
  // callback already exchanged the code for a session, so a user should
  // exist. If not, the link was invalid or the session expired — send them
  // back to /forgot-password to start over.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/forgot-password");
  }

  const redirectTo = searchParams?.next || "/";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-micro text-cyan-700">Reset password</p>
        <h1 className="mt-2 text-h1 text-ink">Choose a new password</h1>
        <p className="mt-3 text-body text-slate-700">
          Signed in as <span className="font-semibold">{user.email}</span>. Pick a new
          password to finish.
        </p>

        <ResetPasswordForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
