import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://aisolutionmaven.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Solution Maven",
    template: "%s | AI Solution Maven",
  },
  description: "Building AI-powered solutions that solve real problems.",
  applicationName: "AI Solution Maven",
  authors: [{ name: "AI Solution Maven" }],
  creator: "AI Solution Maven",
  publisher: "AI Solution Maven",
  keywords: [
    "AI app development",
    "AI consultant",
    "MVP development",
    "full-stack developer",
    "Next.js developer",
    "AI automation",
    "SaaS product development",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "AI Solution Maven",
    title: "AI Solution Maven",
    description: "Building AI-powered solutions that solve real problems.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AI Solution Maven - AI-powered apps that solve real business problems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Solution Maven",
    description: "Building AI-powered solutions that solve real problems.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
