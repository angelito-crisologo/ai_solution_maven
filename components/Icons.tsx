/** Stroke icons from the design export. All decorative (aria-hidden). */

type IconProps = { className?: string };

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function ArrowRight({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? "flex-none"}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ExternalLink({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? "flex-none"}>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function Check({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? "mt-[5px] flex-none text-teal-700"}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function Calendar({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? "flex-none"}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </svg>
  );
}

export function Mail({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? "flex-none"}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </svg>
  );
}
