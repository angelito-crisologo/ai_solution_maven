"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

type Props = {
  sharePath: string;
};

/**
 * Copies the absolute URL of the stakeholder share view to the clipboard.
 * Builds the absolute URL from window.location.origin so the same component
 * works across local dev, Vercel previews, and production without prop
 * threading.
 */
export function CopyShareLinkButton({ sharePath }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const absolute = new URL(sharePath, window.location.origin).toString();
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail in restricted contexts (no HTTPS, browser
      // permissions). Fall back to a manual prompt so the user can still
      // grab the URL.
      const absolute = new URL(sharePath, window.location.origin).toString();
      window.prompt("Copy this link", absolute);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      title="Copy the stakeholder share link to your clipboard"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Copied!
        </>
      ) : (
        <>
          <Link2 className="h-3.5 w-3.5" />
          Copy link
        </>
      )}
    </button>
  );
}
