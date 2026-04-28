import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "AI Solution Maven - AI-powered apps that solve real business problems";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0F172A",
          color: "white",
          padding: 72,
          fontFamily: "Inter, Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 80% 20%, rgba(124,58,237,0.42), transparent 34%), radial-gradient(circle at 18% 18%, rgba(37,99,235,0.34), transparent 28%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", gap: 24, alignItems: "center" }}>
          <div
            style={{
              width: 86,
              height: 86,
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            AI
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>
              AI Solution Maven
            </div>
            <div style={{ marginTop: 8, color: "#CBD5E1", fontSize: 22 }}>
              Building AI-powered solutions that solve real problems.
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            maxWidth: 920,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ color: "#6EE7B7", fontSize: 22, fontWeight: 700 }}>
            Practical AI builder
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 68,
              lineHeight: 1.05,
              letterSpacing: 0,
              fontWeight: 800,
            }}
          >
            AI-powered apps that solve real business problems
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", gap: 18 }}>
          {["AI apps", "Full-stack builds", "MVP delivery"].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 18,
                padding: "16px 22px",
                color: "#E2E8F0",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
