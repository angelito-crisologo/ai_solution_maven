"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState, type MouseEvent } from "react";

const SUBJECT = "PlanSight AI — worth a look";
const BODY =
  "Saw a project plan shared through this — clean read-only view, AI summary on top. Worth a look if you're sharing .mpp files with stakeholders.\n\nhttps://aisolutionmaven.com/products/plansight-ai";

const MAILTO_HREF =
  "mailto:?subject=" +
  encodeURIComponent(SUBJECT) +
  "&body=" +
  encodeURIComponent(BODY);

// The mailto: anchor fires its default action for users whose browser
// has a configured handler (Apple Mail, Outlook, Gmail-as-default,
// etc.). The click handler additionally copies the message to the
// clipboard so the action still produces something useful when no
// handler exists — a common failure mode on Windows + Chrome with
// no default mail client set. We show a transient "copied" hint
// either way; if the mail app opens the hint is mildly redundant but
// not misleading.
export function StakeholderMailtoCta() {
  const [copied, setCopied] = useState(false);

  async function handleClick(_event: MouseEvent<HTMLAnchorElement>) {
    try {
      await navigator.clipboard.writeText(`Subject: ${SUBJECT}\n\n${BODY}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      // Clipboard API unavailable (insecure context, permission denied).
      // The mailto: action still fires from the anchor default.
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <a
          href={MAILTO_HREF}
          onClick={handleClick}
          aria-label="Email your PM about PlanSight"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-700 px-5 text-body font-semibold text-white transition hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          Tell your PM about PlanSight
          <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/products/plansight-ai"
          className="inline-flex h-11 items-center justify-center text-body font-semibold text-slate-700 transition hover:text-ink focus-visible:outline-none focus-visible:underline"
        >
          See what it does
        </Link>
      </div>
      {copied ? (
        <p
          role="status"
          className="mt-3 inline-flex items-center gap-1.5 text-caption text-emerald-700"
        >
          <Check className="h-3.5 w-3.5" />
          Message copied — paste into a new email if your mail app didn&apos;t
          open.
        </p>
      ) : null}
    </div>
  );
}
