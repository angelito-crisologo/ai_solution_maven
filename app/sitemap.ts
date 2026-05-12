import type { MetadataRoute } from "next";
import { listGuides } from "@/lib/guides";

const siteUrl = "https://aisolutionmaven.com";

type Route = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
  lastModified?: Date;
};

// PlanSight pages get higher priority than the portfolio-level routes — the
// product is the main reason a crawler will care about this domain right now.
// /share/[shareId] is intentionally excluded: those pages already set
// robots: { index: false } and are unguessable, so listing them would only
// leak share IDs.
const staticRoutes: Route[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "monthly", priority: 0.8 },
  { path: "/products/plansight-ai", changeFrequency: "weekly", priority: 0.9 },
  { path: "/products/plansight-ai/guides", changeFrequency: "weekly", priority: 0.8 },
  { path: "/products/plansight-ai/upgrade", changeFrequency: "monthly", priority: 0.7 },
  { path: "/projects", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const builtAt = new Date();
  const guides = await listGuides();

  const staticEntries = staticRoutes.map(({ path, changeFrequency, priority, lastModified }) => ({
    url: `${siteUrl}${path}`,
    lastModified: lastModified ?? builtAt,
    changeFrequency,
    priority
  }));

  const guideEntries = guides.map((guide) => ({
    url: `${siteUrl}/products/plansight-ai/guides/${guide.slug}`,
    // Honour the per-guide updatedAt so re-published edits poke the crawler.
    lastModified: new Date(guide.updatedAt ?? guide.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));

  return [...staticEntries, ...guideEntries];
}
