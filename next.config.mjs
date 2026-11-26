/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // PlanSight lives at its own subdomain. Redirect all old routes so
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
      // Old portfolio routes, replaced by /work in the redesign.
      { source: "/products", destination: "/work", permanent: true },
      { source: "/products/scrumready", destination: "/work", permanent: true },
      { source: "/projects", destination: "/work", permanent: true },
      // The old metadata pointed browsers at an SVG apple icon that never existed.
      { source: "/apple-icon.svg", destination: "/apple-icon.png", permanent: true },
    ];
  },
};

export default nextConfig;
