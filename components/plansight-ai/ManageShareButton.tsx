"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";
import { ManageShareDialog } from "./ManageShareDialog";

type Props = {
  shareId: string;
  title: string;
  isPro: boolean;
  revoked: boolean;
  hasPassword: boolean;
  passwordSetAt: string | null;
};

/**
 * Trigger + dialog wrapper for the Manage Share modal on /my-plans.
 * Keeps the (heavier) dialog out of the page bundle until the user
 * actually opens it.
 */
export function ManageShareButton({
  shareId,
  title,
  isPro,
  revoked,
  hasPassword,
  passwordSetAt
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        title="Revoke or password-protect this share link"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Manage share
      </button>
      {open ? (
        <ManageShareDialog
          shareId={shareId}
          title={title}
          isPro={isPro}
          initialRevoked={revoked}
          initialHasPassword={hasPassword}
          passwordSetAt={passwordSetAt}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
