import type { MetadataRoute } from "next";

const siteUrl = "https://aisolutionmaven.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const builtAt = new Date();

  return [
    { url: siteUrl, lastModified: builtAt, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/products`, lastModified: builtAt, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/products/plansight-ai`, lastModified: builtAt, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/products/scrumready`, lastModified: builtAt, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/projects`, lastModified: builtAt, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: builtAt, changeFrequency: "monthly", priority: 0.6 },
  ];
}
