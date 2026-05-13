"use client";

import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RotateCcw,
  ShieldOff,
  X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  shareId: string;
  title: string;
  isPro: boolean;
  initialRevoked: boolean;
  initialHasPassword: boolean;
  passwordSetAt: string | null;
  onClose: () => void;
};

type ActionState =
  | { kind: "idle" }
  | { kind: "pending"; action: string }
  | { kind: "error"; message: string };

const MIN_PASSWORD_LEN = 8;

function formatSetAt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Manage Share modal opened from /my-plans. Bundles the two PM-facing
 * security controls in one focused dialog rather than scattering buttons
 * across the plan row:
 *   - Revoke / Restore (Free + Pro)
 *   - Password protection — toggle, set/change, clear (Pro only)
 *
 * After any successful action, the dialog calls router.refresh() so the
 * /my-plans page re-renders with the updated security state.
 */
export function ManageShareDialog({
  shareId,
  title,
  isPro,
  initialRevoked,
  initialHasPassword,
  passwordSetAt,
  onClose
}: Props) {
  const router = useRouter();
  const [revoked, setRevoked] = useState(initialRevoked);
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [passwordSet] = useState(passwordSetAt);
  const [state, setState] = useState<ActionState>({ kind: "idle" });

  // Password input state (only used in Pro flow).
  const [enablePassword, setEnablePassword] = useState(initialHasPassword);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isPending = state.kind === "pending";

  async function callJson(path: string, body: unknown) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? `Request failed (${response.status}).`);
    }
  }

  async function handleRevoke() {
    setState({ kind: "pending", action: "revoke" });
    try {
      await callJson("/api/plansight/share/revoke", { shareId });
      setRevoked(true);
      setState({ kind: "idle" });
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to revoke."
      });
    }
  }

  async function handleRestore() {
    setState({ kind: "pending", action: "restore" });
    try {
      await callJson("/api/plansight/share/restore", { shareId });
      setRevoked(false);
      setState({ kind: "idle" });
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to restore."
      });
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPro) return;
    setState({ kind: "pending", action: "password" });
    try {
      const desiredPassword = enablePassword
        ? passwordValue.trim()
        : null;
      if (
        desiredPassword !== null &&
        desiredPassword.length < MIN_PASSWORD_LEN
      ) {
        setState({
          kind: "error",
          message: `Password must be at least ${MIN_PASSWORD_LEN} characters.`
        });
        return;
      }
      await callJson("/api/plansight/share/password", {
        shareId,
        password: desiredPassword
      });
      setHasPassword(!!desiredPassword);
      setPasswordValue("");
      setState({ kind: "idle" });
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Failed to update password."
      });
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-share-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 px-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-modal"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-micro text-cyan-700">Manage share</p>
            <h3
              id="manage-share-title"
              className="mt-1 truncate text-h3 text-ink"
            >
              {title}
            </h3>
            <p className="mt-1 text-caption text-slate-500">
              Control who can view the link.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Revocation section */}
        <section className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">
                {revoked ? "Share is revoked" : "Share is active"}
              </p>
              <p className="mt-1 text-caption text-slate-600">
                {revoked
                  ? "Anyone visiting the share link sees a generic “no longer available” page. Restore to re-enable."
                  : "Anyone with the link can view the shared plan. Revoke to deactivate it without deleting the plan."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            {revoked ? (
              <button
                type="button"
                onClick={handleRestore}
                disabled={isPending}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-700 px-3 text-caption font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.kind === "pending" && state.action === "restore" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Restore share
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isPending}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-caption font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.kind === "pending" && state.action === "revoke" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldOff className="h-3.5 w-3.5" />
                )}
                Revoke share
              </button>
            )}
          </div>
        </section>

        {/* Password protection section */}
        <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-body font-semibold text-ink">
                  Password protection
                </p>
                {!isPro ? (
                  <span className="rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-micro font-semibold text-cyan-700">
                    Pro
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-caption text-slate-600">
                Require viewers to enter a password before they can see the
                plan. Share the password through a different channel from the
                link itself — for example, send the link by email and the
                password by chat.
              </p>
              {hasPassword && passwordSet ? (
                <p className="mt-1 text-caption text-slate-500">
                  Password set on {formatSetAt(passwordSet)}.
                </p>
              ) : null}
            </div>
          </div>

          {isPro ? (
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-body text-slate-700">
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(event) => setEnablePassword(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-400 focus:ring-offset-0"
                />
                <span>Require a password for this share</span>
              </label>

              {enablePassword ? (
                <div>
                  <label
                    htmlFor="share-password"
                    className="text-caption font-semibold text-slate-700"
                  >
                    {hasPassword ? "New password" : "Password"}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="share-password"
                      type={passwordShown ? "text" : "password"}
                      autoComplete="off"
                      minLength={MIN_PASSWORD_LEN}
                      required={enablePassword && !hasPassword}
                      placeholder={
                        hasPassword
                          ? "Leave blank to keep the existing password"
                          : `At least ${MIN_PASSWORD_LEN} characters`
                      }
                      value={passwordValue}
                      onChange={(event) => setPasswordValue(event.target.value)}
                      className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-body text-ink focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordShown((v) => !v)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      aria-label={passwordShown ? "Hide password" : "Show password"}
                    >
                      {passwordShown ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    (enablePassword === hasPassword && passwordValue.length === 0)
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-700 px-3 text-caption font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state.kind === "pending" && state.action === "password" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  {enablePassword
                    ? hasPassword
                      ? "Update password"
                      : "Set password"
                    : "Remove password"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/products/plansight-ai/upgrade"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-700 px-3 text-caption font-semibold text-white transition hover:bg-cyan-800"
              >
                Upgrade to Pro
              </Link>
              <p className="text-caption text-slate-500">
                Available on PlanSight Pro.
              </p>
            </div>
          )}
        </section>

        {state.kind === "error" ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-caption text-red-800"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
