import fs from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content", "plansight-guides");

export type GuideFrontmatter = {
  title: string;
  description: string;
  publishedAt: string; // ISO date
  updatedAt?: string;  // ISO date
  ogImage?: string;
  draft?: boolean;
};

export type GuideSummary = GuideFrontmatter & {
  slug: string;
};

export type GuideContent = GuideSummary & {
  body: string;
};

/**
 * Parse YAML-like frontmatter from the top of an .mdx file. We avoid pulling
 * in gray-matter as a dependency by handling the small subset of YAML we
 * actually use: simple key: value pairs, with optional quoted strings and
 * booleans. Anything more complex (lists, nested objects) is out of scope —
 * keep frontmatter flat.
 */
function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  const [, fmRaw, body] = match;
  const frontmatter: Record<string, unknown> = {};
  for (const line of fmRaw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    let value: unknown = trimmed.slice(colon + 1).trim();
    if (typeof value === "string") {
      // Strip surrounding quotes if present.
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      } else if (value === "true") {
        value = true;
      } else if (value === "false") {
        value = false;
      }
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body };
}

function toSummary(slug: string, frontmatter: Record<string, unknown>): GuideSummary | null {
  const title = frontmatter.title;
  const description = frontmatter.description;
  const publishedAt = frontmatter.publishedAt;
  if (typeof title !== "string" || typeof description !== "string" || typeof publishedAt !== "string") {
    return null;
  }
  return {
    slug,
    title,
    description,
    publishedAt,
    updatedAt: typeof frontmatter.updatedAt === "string" ? frontmatter.updatedAt : undefined,
    ogImage: typeof frontmatter.ogImage === "string" ? frontmatter.ogImage : undefined,
    draft: frontmatter.draft === true
  };
}

async function readGuideFile(filename: string): Promise<GuideContent | null> {
  const fullPath = path.join(CONTENT_DIR, filename);
  let raw: string;
  try {
    raw = await fs.readFile(fullPath, "utf8");
  } catch {
    return null;
  }
  const { frontmatter, body } = parseFrontmatter(raw);
  const slug = filename.replace(/\.mdx?$/, "");
  const summary = toSummary(slug, frontmatter);
  if (!summary) return null;
  return { ...summary, body };
}

/**
 * Return every published guide, newest first. Drafts (`draft: true` in
 * frontmatter) are excluded so an unfinished post can sit in the repo
 * without leaking to the index, sitemap, or RSS feed.
 */
export async function listGuides(): Promise<GuideSummary[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(CONTENT_DIR);
  } catch {
    return [];
  }
  const guides = await Promise.all(
    entries
      .filter((name) => name.endsWith(".mdx") || name.endsWith(".md"))
      .map(async (name) => {
        const guide = await readGuideFile(name);
        if (!guide || guide.draft) return null;
        return guide;
      })
  );
  return guides
    .filter((g): g is GuideContent => g !== null)
    .map(({ body, ...summary }) => summary)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getGuide(slug: string): Promise<GuideContent | null> {
  for (const ext of [".mdx", ".md"]) {
    const guide = await readGuideFile(`${slug}${ext}`);
    if (guide && !guide.draft) return guide;
  }
  return null;
}

export async function listGuideSlugs(): Promise<string[]> {
  const guides = await listGuides();
  return guides.map((g) => g.slug);
}
