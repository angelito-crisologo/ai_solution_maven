"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState, type MouseEvent } from "react";

const SUBJECT = "PlanSight AI — worth a look";
const BODY =
  "Saw a project plan shared through this — clean read-only view, AI summary on top. Worth a look if you're sharing .mpp files with stakeholders.\n\nhttps://aisolutionmaven.com/products/plansight-ai";

// Direct Gmail compose URL. Opens in a new tab with subject + body
// pre-filled, no protocol-handler config required. Works for any
// signed-in Google account.
const GMAIL_HREF =
  "https://mail.google.com/mail/?view=cm&fs=1&su=" +
  encodeURIComponent(SUBJECT) +
  "&body=" +
  encodeURIComponent(BODY);

// Direct Outlook web compose URL. Same pattern as Gmail.
const OUTLOOK_HREF =
  "https://outlook.office.com/mail/deeplink/compose?subject=" +
  encodeURIComponent(SUBJECT) +
  "&body=" +
  encodeURIComponent(BODY);

// mailto: as the third option for users whose OS has a default mail
// app (Apple Mail, Outlook desktop, etc.). On Chrome + Windows with
// no handler configured this silently does nothing — the clipboard
// fallback below covers that case.
const MAILTO_HREF =
  "mailto:?subject=" +
  encodeURIComponent(SUBJECT) +
  "&body=" +
  encodeURIComponent(BODY);

// Three explicit affordances because mailto: alone fails silently on
// any system without a default mail client registered (very common
// on Chrome + Windows). Every click also copies the message to the
// clipboard so even users on an obscure mail platform can paste it
// into whatever they actually use.
export function StakeholderMailtoCta() {
  const [copied, setCopied] = useState(false);

  async function handleClick(_event: MouseEvent<HTMLAnchorElement>) {
    try {
      await navigator.clipboard.writeText(`Subject: ${SUBJECT}\n\n${BODY}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      // Clipboard API unavailable (insecure context, permission denied).
      // The anchor default still fires.
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <a
          href={GMAIL_HREF}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Gmail compose with the message pre-filled"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-700 px-5 text-body font-semibold text-white transition hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          Open in Gmail
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href={OUTLOOK_HREF}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Outlook on the web with the message pre-filled"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-body font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          Open in Outlook
        </a>
        <a
          href={MAILTO_HREF}
          onClick={handleClick}
          aria-label="Open your default mail app with the message pre-filled"
          className="inline-flex h-11 items-center justify-center text-body font-semibold text-slate-700 transition hover:text-ink focus-visible:outline-none focus-visible:underline"
        >
          Use my mail app
        </a>
      </div>
      {copied ? (
        <p
          role="status"
          className="mt-3 inline-flex items-center gap-1.5 text-caption text-emerald-700"
        >
          <Check className="h-3.5 w-3.5" />
          Message also copied — paste into a new email anywhere.
        </p>
      ) : null}
      <p className="mt-4">
        <Link
          href="/products/plansight-ai"
          className="text-caption font-semibold text-slate-600 underline-offset-2 transition hover:text-ink hover:underline"
        >
          Or see what PlanSight does →
        </Link>
      </p>
    </div>
  );
}
