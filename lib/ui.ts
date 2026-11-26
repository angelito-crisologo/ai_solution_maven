/**
 * Class recipes for the design's buttons and links. Each has default, hover,
 * focus (global 3 px Teal 700 ring, 3 px offset) and disabled states.
 * hover:text-* is set explicitly because the base `a:hover` turns links navy.
 */

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold no-underline transition-colors disabled:cursor-not-allowed";

/** Primary: Teal 700 fill. Used once per view. */
export const btnPrimary = `${buttonBase} min-h-[48px] px-[22px] py-3 text-[17px] bg-teal-700 text-white hover:bg-navy-900 hover:text-white disabled:bg-line disabled:text-ink-700 disabled:hover:bg-line disabled:hover:text-ink-700`;

/** Header "Book a call": desktop and phone sizes from the design. */
export const btnHeader = `${buttonBase} min-h-[44px] px-[18px] py-2.5 text-[16px] bg-teal-700 text-white hover:bg-navy-900 hover:text-white`;
export const btnHeaderSmall = `${buttonBase} min-h-[44px] whitespace-nowrap px-3 py-2 text-[15px] bg-teal-700 text-white hover:bg-navy-900 hover:text-white`;

/** Larger primary, as on the Contact booking card. */
export const btnPrimaryLarge = `${buttonBase} min-h-[52px] px-[26px] py-[14px] text-[18px] bg-teal-700 text-white hover:bg-navy-900 hover:text-white`;

/** Secondary: white with a navy outline. */
export const btnSecondary = `${buttonBase} min-h-[48px] px-[22px] py-3 text-[17px] bg-white text-navy-900 border-[1.5px] border-navy-900 hover:bg-surface hover:text-navy-900`;

/** Primary on the navy band: white fill, navy text, white focus ring. */
export const btnOnNavy = `${buttonBase} min-h-[52px] px-[26px] py-[14px] text-[18px] bg-white text-navy-900 hover:bg-teal-50 hover:text-navy-900`;

/** Text link with an arrow, e.g. "See all services". */
export const textLink =
  "inline-flex min-h-[44px] items-center gap-2 self-start font-semibold text-teal-700 underline underline-offset-4 hover:text-navy-900";

/** Section wrapper: full-bleed band with the design's gutters. */
export const sectionPad = "px-gutter";
export const container = "mx-auto w-full max-w-content";

export const h1Class = "m-0 text-display text-navy-900 [text-wrap:balance]";
export const h2Class = "m-0 text-h2 text-navy-900 [text-wrap:balance]";
export const h3Class = "m-0 text-h3 text-navy-900";

/** Visually hidden but read by screen readers. */
export const srOnly =
  "absolute h-px w-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)] m-0";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
