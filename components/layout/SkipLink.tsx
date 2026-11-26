import { site } from "@/content/site";

/** First focusable element on every page. Hidden until focused. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="absolute -left-[9999px] top-2 z-50 rounded-control bg-navy-900 px-4 py-3 font-semibold text-white no-underline hover:text-white focus:left-2"
    >
      {site.skipLink}
    </a>
  );
}
