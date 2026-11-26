import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GA4Scripts } from "@/components/analytics/GA4Scripts";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { meta } from "@/content/pages";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  ...pageMetadata(meta.home),
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  // Google Search Console verification for the URL-prefix property
  // https://aisolutionmaven.com/. Renders
  // <meta name="google-site-verification" content="..." />. Rotating the
  // token in Search Console produces a new value. The PlanSight and
  // ScrumReady subdomains are separate sites and are not covered by it.
  verification: {
    google: "R-OnioYD5sNBGMcnpuuG9Xeb0NlazmgQFov5sr9FVRI",
  },
};

export const viewport: Viewport = {
  themeColor: "#132440",
};

/** Structured data for the business, from the copy deck's Metadata section. */
const organisation = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.name,
  url: site.url,
  email: site.email,
  description: site.tagline,
  image: `${site.url}/og-image.png`,
  logo: `${site.url}/icon-512.png`,
  areaServed: { "@type": "Country", name: "Australia" },
  address: {
    "@type": "PostalAddress",
    addressLocality: site.locality,
    addressRegion: site.region,
    addressCountry: site.country,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={inter.variable}>
      <body className="font-sans">
        <SkipLink />
        <Header />
        <main id="main" tabIndex={-1} className="flex flex-col outline-none">
          {children}
        </main>
        <Footer />
        <script
          type="application/ld+json"
          // Static object built from /content; no user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
        <GA4Scripts />
      </body>
    </html>
  );
}
