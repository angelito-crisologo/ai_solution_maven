import fs from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content", "plansight-legal");

export type LegalFrontmatter = {
  title: string;
  description: string;
  updatedAt: string;
  effectiveAt: string;
};

export type LegalSummary = LegalFrontmatter & {
  slug: string;
};

export type LegalDocument = LegalSummary & {
  body: string;
};

/**
 * Parse YAML-like frontmatter from the top of a legal doc. Intentionally
 * mirrors lib/guides/index.ts rather than sharing a helper — the two
 * frontmatter shapes are different and the loaders are likely to evolve
 * independently.
 */
function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body };
}

function toSummary(
  slug: string,
  frontmatter: Record<string, unknown>
): LegalSummary | null {
  const { title, description, updatedAt, effectiveAt } = frontmatter;
  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof updatedAt !== "string" ||
    typeof effectiveAt !== "string"
  ) {
    return null;
  }
  return { slug, title, description, updatedAt, effectiveAt };
}

async function readLegalFile(filename: string): Promise<LegalDocument | null> {
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

export async function listLegalDocuments(): Promise<LegalSummary[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(CONTENT_DIR);
  } catch {
    return [];
  }
  const docs = await Promise.all(
    entries
      .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
      .map((name) => readLegalFile(name))
  );
  return docs
    .filter((d): d is LegalDocument => d !== null)
    .map(({ body, ...summary }) => summary)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getLegalDocument(
  slug: string
): Promise<LegalDocument | null> {
  for (const ext of [".md", ".mdx"]) {
    const doc = await readLegalFile(`${slug}${ext}`);
    if (doc) return doc;
  }
  return null;
}

export async function listLegalSlugs(): Promise<string[]> {
  const docs = await listLegalDocuments();
  return docs.map((d) => d.slug);
}
