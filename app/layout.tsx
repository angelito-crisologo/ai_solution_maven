import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GA4Scripts } from "@/components/analytics/GA4Scripts";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

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
  // Google Search Console — URL prefix property verification for
  // https://aisolutionmaven.com/. Renders as
  // <meta name="google-site-verification" content="..." />.
  // The token covers the property only; rotating in Search Console will
  // produce a new value. Domain property (DNS TXT) is intentionally skipped
  // since the site doesn't use subdomains.
  verification: {
    google: "R-OnioYD5sNBGMcnpuuG9Xeb0NlazmgQFov5sr9FVRI"
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <GA4Scripts />
      </body>
    </html>
  );
}
