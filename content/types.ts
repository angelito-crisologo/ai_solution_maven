/**
 * Shared types for the site's copy. All wording lives in /content so it can
 * be edited in one place; components only arrange it.
 */

/** An unresolved fact from the copy deck. Rendered as a visible chip. */
export type PlaceholderSegment = { readonly placeholder: string };

/** An inline link inside a sentence. */
export type LinkSegment = {
  readonly link: { readonly href: string; readonly label: string };
};

export type Segment = string | PlaceholderSegment | LinkSegment;

/** Plain text, or a sentence made of text, links and placeholders. */
export type RichText = string | readonly Segment[];

/**
 * Mark an unresolved item from the copy deck. Every call is listed by
 * `npm run check:placeholders`, which fails until none are left.
 */
export function ph(note: string): PlaceholderSegment {
  return { placeholder: note };
}

export function link(href: string, label: string): LinkSegment {
  return { link: { href, label } };
}

export type ImageAsset = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
};

export type PageMeta = {
  readonly title: string;
  readonly description: string;
  readonly path: string;
};
