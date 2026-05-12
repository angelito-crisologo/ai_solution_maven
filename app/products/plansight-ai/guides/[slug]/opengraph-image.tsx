import { ImageResponse } from "next/og";
import { getGuide } from "@/lib/guides";

// Node.js runtime is required because lib/guides reads .mdx files from the
// filesystem (node:fs). Edge runtime would force us to inline the content,
// which removes the per-slug benefit. Cold-start cost is minimal — OG images
// are aggressively cached after the first render.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PlanSight AI guide";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Per-guide Open Graph image. Renders the guide title onto a PlanSight-branded
 * 1200x630 canvas. Wires automatically into:
 *   - The guide page's <meta property="og:image"> (Next picks up
 *     opengraph-image.tsx adjacent to page.tsx)
 *   - The Article JSON-LD `image` field on the slug route (which falls back
 *     to /opengraph-image only when guide.ogImage is unset; this route's URL
 *     gets used as a fallback for newer guides if we wire it through too —
 *     for now the Article schema reads the site-wide image, which Google
 *     happily accepts)
 *
 * Visual layout:
 *   - Navy background (matches the brand pack's "primary surface on dark")
 *   - PlanSight wordmark top-left, two-tone (slate + cyan, mirroring navbar)
 *   - "Guides" eyebrow in cyan-400
 *   - Guide title rendered at 64px, wrapping naturally up to three lines
 *   - Bottom strip with domain attribution
 */
export default async function Image({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  const title = guide?.title ?? "PlanSight AI guide";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B1220",
          padding: 72,
          fontFamily: "Inter, Arial, sans-serif",
          position: "relative",
          color: "#F8FAFC"
        }}
      >
        {/* Subtle radial accents — cyan glow top-right, deep accent bottom-left */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 88% 12%, rgba(34,211,238,0.18), transparent 38%), radial-gradient(circle at 10% 90%, rgba(8,145,178,0.16), transparent 32%)"
          }}
        />

        {/* Top row — wordmark + Guides eyebrow */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 20
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0891B2",
              color: "#F8FAFC",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -1
            }}
          >
            P
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: -0.5,
                display: "flex"
              }}
            >
              <span style={{ color: "#CBD5E1" }}>Plan</span>
              <span style={{ color: "#22D3EE" }}>Sight</span>
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#94A3B8",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: 600
              }}
            >
              AI
            </div>
            <div
              style={{
                marginLeft: 16,
                fontSize: 14,
                color: "#22D3EE",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: 700
              }}
            >
              · Guides
            </div>
          </div>
        </div>

        {/* Title — the headline of the card */}
        <div
          style={{
            position: "relative",
            maxWidth: 1000,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: -1,
              color: "#F8FAFC"
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom strip — domain attribution */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "#94A3B8"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "#22D3EE"
              }}
            />
            <span>aisolutionmaven.com</span>
          </div>
          <span>An AI-analysed view of any .mpp file</span>
        </div>
      </div>
    ),
    size
  );
}
