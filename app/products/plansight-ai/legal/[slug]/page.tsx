import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { getLegalDocument, listLegalSlugs } from "@/lib/legal";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listLegalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getLegalDocument(slug);
  if (!doc) {
    return { title: "Not found — PlanSight AI" };
  }
  return {
    title: { absolute: `${doc.title} — PlanSight AI` },
    description: doc.description,
    alternates: { canonical: `/products/plansight-ai/legal/${slug}` },
    openGraph: {
      title: doc.title,
      description: doc.description,
      url: `/products/plansight-ai/legal/${slug}`,
      type: "article"
    },
    robots: { index: true, follow: true }
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Tailwind-styled markdown components for legal documents. Wider element
// set than the guides renderer because legal docs use hr (section breaks),
// tables (sub-processor and retention schedules), h4, and heavy strong/em.
const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-10 text-h2 text-ink" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-8 text-h3 text-ink" {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mt-6 text-body-lg font-semibold text-ink" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mt-4 text-body-lg text-slate-800" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-cyan-700 underline underline-offset-2 hover:text-cyan-800"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="mt-4 list-disc space-y-2 pl-6 text-body-lg text-slate-800"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="mt-4 list-decimal space-y-2 pl-6 text-body-lg text-slate-800"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-ink" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic" {...props} />
  ),
  hr: () => <hr className="my-10 border-slate-200" />,
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="mt-6 overflow-x-auto">
      <table
        className="w-full border-collapse border border-slate-200 text-body text-slate-800"
        {...props}
      />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-slate-50" {...props} />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border border-slate-200 px-3 py-2 text-left font-semibold text-ink"
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-slate-200 px-3 py-2 align-top" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800"
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

export default async function LegalDocumentPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getLegalDocument(slug);
  if (!doc) {
    notFound();
  }

  const user = await getCurrentUser();
  const activation = user
    ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT)
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <PlanSightNavbar
        signedIn={!!user}
        activated={!!activation}
        tier={activation?.tier ?? null}
      />

      <section className="bg-navy text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-micro text-cyan-400">PlanSight AI · Legal</p>
          <h1 className="mt-3 text-display text-slate-100">{doc.title}</h1>
          <p className="mt-4 text-caption text-slate-300">
            Last updated{" "}
            <span className="font-medium text-slate-100">
              {formatDate(doc.updatedAt)}
            </span>
            {doc.effectiveAt !== doc.updatedAt ? (
              <>
                {" "}
                · Effective{" "}
                <span className="font-medium text-slate-100">
                  {formatDate(doc.effectiveAt)}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </section>

      <article className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <MDXRemote
            source={doc.body}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </div>
      </article>

      <PlanSightFooter />
    </main>
  );
}
