/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // PlanSight now lives at its own subdomain. Redirect all old routes so
      // bookmarks, Stripe emails, and indexed URLs stay functional.
      {
        source: "/products/plansight-ai",
        destination: "https://plansight.aisolutionmaven.com",
        permanent: true,
      },
      {
        source: "/products/plansight-ai/:path*",
        destination: "https://plansight.aisolutionmaven.com/:path*",
        permanent: true,
      },
      // Legacy legal paths from v1.1 (previously /legal/:slug → /products/plansight-ai/legal/:slug)
      {
        source: "/legal/:slug",
        destination: "https://plansight.aisolutionmaven.com/legal/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
