// Shared between the server admin page and the "use client" chart
// components. Lives in its own (non-client) module because exporting
// plain objects from a "use client" module breaks property access from
// server components (React Client Manifest only handles function references).
export const ADMIN_CHART_COLORS = {
  primary: "#0e7490", // cyan-700
  secondary: "#7c3aed", // violet-600
  danger: "#b91c1c" // red-700
} as const;

export type ChartValueFormat = "usd" | "ms" | "bytes" | "int";
