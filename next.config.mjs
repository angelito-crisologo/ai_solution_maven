/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Tell Next's file-tracing to bundle the guides content directory with
    // any function that imports lib/guides. Without this, fs.readFile on
    // content/plansight-guides/*.mdx returns ENOENT at request time on
    // Vercel — Next can't statically detect dynamic fs reads against a
    // computed path, so the directory gets pruned from the deploy artefact.
    //
    // The slug page itself works fine because it reads at build time
    // (during generateStaticParams + generateMetadata). The OG image route
    // reads at request time and was hitting the missing-directory branch,
    // causing every guide to render the fallback title.
    //
    // Note: in Next 15 this option moved to the top level
    // (`outputFileTracingIncludes`). On 14.2.x it must live under
    // `experimental` or it silently no-ops.
    outputFileTracingIncludes: {
      "/products/plansight-ai/guides/**": ["./content/plansight-guides/**"],
      "/products/plansight-ai/legal/**": ["./content/plansight-legal/**"]
    }
  },
  async redirects() {
    // Legal docs originally shipped at /legal/* (one v1.1 release earlier).
    // They now live under the PlanSight product surface — preserve any
    // bookmarks, Stripe Dashboard URLs, and prior email-template links
    // with a permanent 301.
    return [
      {
        source: "/legal/:slug",
        destination: "/products/plansight-ai/legal/:slug",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
