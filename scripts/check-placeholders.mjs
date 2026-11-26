#!/usr/bin/env node
/**
 * Pre-launch check: lists every unresolved placeholder and exits 1 if any
 * remain. Placeholders are created with ph("...") in /content, or written
 * as a literal <Placeholder>text</Placeholder> anywhere in app/ or
 * components/. Run with `npm run check:placeholders`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const SKIP = new Set(["node_modules", ".next", ".git"]);

function walk(dir, exts) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((ext) => name.endsWith(ext))) out.push(full);
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

const found = [];

// ph("...") calls in content modules (the definition itself is skipped).
for (const file of walk(join(root, "content"), [".ts", ".tsx"])) {
  const text = readFileSync(file, "utf8");
  const re = /\bph\(\s*(["'`])([\s\S]*?)\1\s*,?\s*\)/g;
  for (const match of text.matchAll(re)) {
    found.push({ file, line: lineOf(text, match.index), note: match[2] });
  }
}

// Literal <Placeholder>text</Placeholder> written straight into JSX.
for (const dir of ["app", "components"]) {
  for (const file of walk(join(root, dir), [".tsx", ".jsx"])) {
    const text = readFileSync(file, "utf8");
    const re = /<Placeholder\b[^>]*>\s*([^{<\s][^<]*)<\/Placeholder>/g;
    for (const match of text.matchAll(re)) {
      found.push({ file, line: lineOf(text, match.index), note: match[1].trim() });
    }
  }
}

if (found.length === 0) {
  console.log("No placeholders remain.");
  process.exit(0);
}

console.error(`${found.length} placeholder(s) still to resolve before launch:\n`);
for (const { file, line, note } of found) {
  console.error(`  ${relative(root, file)}:${line}  ${note}`);
}
process.exit(1);
