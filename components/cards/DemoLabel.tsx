import { site } from "@/content/site";

/** The fixed "Demo, synthetic data" label. Always above the image, never on it. */
export function DemoLabel() {
  return (
    <span className="self-start rounded-tag border border-teal-700 bg-teal-50 px-2 py-[3px] text-label text-navy-900">
      {site.demoLabel}
    </span>
  );
}
