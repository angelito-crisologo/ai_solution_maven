"use client";

import { Loader2, KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type Props = {
  /** Where to send the user after their password is updated. */
  redirectTo: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "done" };

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm({ redirectTo }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus({
        kind: "error",
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ kind: "error", message: "Passwords don't match." });
      return;
    }

    setStatus({ kind: "submitting" });

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }

      setStatus({ kind: "done" });
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Couldn't update your password."
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="text-body font-semibold text-ink">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-body text-ink focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        />
        <p className="mt-1 text-caption text-slate-500">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-body font-semibold text-ink">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-body text-ink focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        />
      </div>

      <button
        type="submit"
        disabled={
          status.kind === "submitting" ||
          status.kind === "done" ||
          !password ||
          !confirmPassword
        }
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
      >
        {status.kind === "submitting" || status.kind === "done" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        Update password
      </button>

      {status.kind === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-body text-red-800">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
