import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { getGuide, listGuideSlugs } from "@/lib/guides";

const SITE_URL = "https://aisolutionmaven.com";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) {
    return { title: "Guide not found — PlanSight AI" };
  }
  return {
    title: { absolute: `${guide.title} — PlanSight AI` },
    description: guide.description,
    alternates: { canonical: `/products/plansight-ai/guides/${slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `/products/plansight-ai/guides/${slug}`,
      type: "article",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt ?? guide.publishedAt,
      ...(guide.ogImage ? { images: [{ url: guide.ogImage }] } : {})
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description
    },
    icons: {
      icon: [
        { url: "/products/plansight-ai/favicon.ico", sizes: "any" },
        { url: "/products/plansight-ai/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/products/plansight-ai/favicon-16.png", type: "image/png", sizes: "16x16" }
      ],
      apple: { url: "/products/plansight-ai/favicon-180.png", sizes: "180x180" }
    },
    manifest: "/products/plansight-ai/site.webmanifest"
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * Promote a YYYY-MM-DD frontmatter date to a timezone-anchored ISO 8601
 * datetime. Google's Rich Results parser flags bare dates as "missing
 * timezone" — anchoring at UTC midnight is the conventional fix and stays
 * stable across deploys regardless of the server's locale.
 *
 * Strings that already include a time component (e.g. an author wrote
 * `publishedAt: 2026-05-12T14:30:00Z` in frontmatter) pass through unchanged.
 */
function toIsoDateTime(dateStr: string): string {
  if (dateStr.includes("T")) return dateStr;
  return `${dateStr}T00:00:00+00:00`;
}

// Tailwind-styled MDX components. Keeps guide markdown free of styling so the
// content author can write plain prose without thinking about classes.
const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-10 text-h2 text-ink" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-8 text-h3 text-ink" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mt-4 text-body-lg text-slate-800" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-cyan-700 underline underline-offset-2 hover:text-cyan-800" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-body-lg text-slate-800" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-body-lg text-slate-800" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-caption text-slate-100"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="mt-6 border-l-2 border-cyan-300 bg-cyan-50/40 px-5 py-3 text-body-lg italic text-slate-800"
      {...props}
    />
  )
};

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) {
    notFound();
  }

  const [user] = await Promise.all([getCurrentUser()]);
  const activation = user ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT) : null;

  // Article JSON-LD. Drives the Article rich-result eligibility and feeds
  // Google's understanding of authorship and dates.
  //
  // Per-guide image:
  //  - If frontmatter sets `ogImage` (a path), use it absolute.
  //  - Otherwise fall back to the site's root /opengraph-image route, which
  //    returns a 1200x630 PNG generated by app/opengraph-image.tsx. Single
  //    URL is sufficient for Article rich results; multiple aspect ratios
  //    (1x1, 4x3, 16x9) only matter for Google News / Top Stories.
  const imageUrl = guide.ogImage
    ? guide.ogImage.startsWith("http")
      ? guide.ogImage
      : `${SITE_URL}${guide.ogImage}`
    : `${SITE_URL}/opengraph-image`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    image: imageUrl,
    datePublished: toIsoDateTime(guide.publishedAt),
    dateModified: toIsoDateTime(guide.updatedAt ?? guide.publishedAt),
    author: {
      "@type": "Organization",
      name: "AI Solution Maven",
      url: SITE_URL
    },
    publisher: {
      "@type": "Organization",
      name: "AI Solution Maven",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/products/plansight-ai/brand/plansight-logo-primary.svg`
      }
    },
    mainEntityOfPage: `${SITE_URL}/products/plansight-ai/guides/${slug}`
  };

  return (
    <main className="min-h-screen bg-light">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <PlanSightNavbar
        signedIn={!!user}
        activated={!!activation}
        tier={activation?.tier ?? null}
        signinRedirectTo={`/products/plansight-ai/guides/${slug}`}
      />

      <article className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/products/plansight-ai/guides"
            className="inline-flex items-center gap-1 text-caption font-semibold text-cyan-700 hover:text-cyan-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All guides
          </Link>

          <header className="mt-6">
            <p className="text-micro uppercase tracking-wider text-cyan-700">
              {formatDate(guide.publishedAt)}
              {guide.updatedAt && guide.updatedAt !== guide.publishedAt
                ? ` · updated ${formatDate(guide.updatedAt)}`
                : ""}
            </p>
            <h1 className="mt-3 text-display text-ink">{guide.title}</h1>
            <p className="mt-4 text-lead text-slate-700">{guide.description}</p>
          </header>

          <div className="mt-10">
            <MDXRemote source={guide.body} components={mdxComponents} />
          </div>

          <aside className="mt-16 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-micro uppercase tracking-wider text-cyan-700">Try it now</p>
            <h2 className="mt-2 text-h3 text-ink">
              Upload an .mpp file and PlanSight does the rest.
            </h2>
            <p className="mt-2 text-body text-slate-700">
              Critical path, risks, AI summary, and a clean stakeholder share view — free, no
              signup needed.
            </p>
            <Link
              href="/products/plansight-ai"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
            >
              Open PlanSight AI
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </article>

      <PlanSightFooter />
    </main>
  );
}
