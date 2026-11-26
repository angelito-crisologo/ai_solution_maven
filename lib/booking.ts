/**
 * The single booking link used by every "Book an intro call" and "Book a
 * call" button. Set NEXT_PUBLIC_BOOKING_URL to override; it is inlined at
 * build time.
 */
export const DEFAULT_BOOKING_URL = "https://cal.com/angelito-crisologo/30min";

export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || DEFAULT_BOOKING_URL;

/** GA4 event fired when a booking button is clicked. */
export const BOOKING_EVENT = "book_call_clicked";
