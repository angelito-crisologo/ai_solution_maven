import type { Metadata } from "next";
import type { PageMeta } from "@/content/types";
import { site } from "@/content/site";

export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${site.name}: ${site.tagline}`,
} as const;

/**
 * Full metadata for one page. Open Graph and Twitter are set in full on
 * every page because Next replaces (does not merge) a parent's openGraph
 * object when a page sets its own.
 */
export function pageMetadata({ title, description, path }: PageMeta): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: site.name,
      locale: "en_AU",
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
