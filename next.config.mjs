/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next's file-tracing to bundle the guides content directory with any
  // function that imports lib/guides. Without this, fs.readFile on
  // content/plansight-guides/*.mdx returns ENOENT at request time on
  // Vercel — Next can't statically detect dynamic fs reads against a
  // computed path, so the directory gets pruned from the deploy artefact.
  //
  // The slug page itself works fine because it reads at build time (during
  // generateStaticParams + generateMetadata). The OG image route reads at
  // request time and was hitting the missing-directory branch, causing
  // every guide to render the fallback title.
  outputFileTracingIncludes: {
    "/products/plansight-ai/guides/**": ["./content/plansight-guides/**"]
  }
};

export default nextConfig;
