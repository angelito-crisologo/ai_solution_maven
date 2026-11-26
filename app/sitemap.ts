import type { MetadataRoute } from "next";
import { meta } from "@/content/pages";
import { site } from "@/content/site";

/** The seven public pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [meta.home, meta.services, meta.howIWork, meta.work, meta.about, meta.contact, meta.privacy];
  return pages.map(({ path }) => ({
    url: path === "/" ? site.url : `${site.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path === "/privacy" ? 0.3 : 0.8,
  }));
}
