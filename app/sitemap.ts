import type { MetadataRoute } from "next";

const siteUrl = "https://aisolutionmaven.com";

type Route = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

// PlanSight pages get higher priority than the portfolio-level routes — the
// product is the main reason a crawler will care about this domain right now.
// /share/[shareId] is intentionally excluded: those pages already set
// robots: { index: false } and are unguessable, so listing them would only
// leak share IDs.
const routes: Route[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "monthly", priority: 0.8 },
  { path: "/products/plansight-ai", changeFrequency: "weekly", priority: 0.9 },
  { path: "/products/plansight-ai/upgrade", changeFrequency: "monthly", priority: 0.7 },
  { path: "/projects", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority
  }));
}
