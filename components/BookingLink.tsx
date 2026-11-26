"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics/gtag";
import { BOOKING_EVENT, BOOKING_URL } from "@/lib/booking";

type Props = {
  /** Where the button sits, sent with the GA4 event (e.g. "header", "hero"). */
  location: string;
  className?: string;
  children: ReactNode;
};

/** Every booking button. Opens Cal.com in a new tab and fires GA4. */
export function BookingLink({ location, className, children }: Props) {
  return (
    <a
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track(BOOKING_EVENT, { location })}
    >
      {children}
    </a>
  );
}
