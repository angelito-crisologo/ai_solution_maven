/**
 * Design tokens for a single product (or for the parent AISM brand). This
 * is the implementation side of `/branding/<slug>/BRANDKIT.md`. Components
 * import these tokens to render a product with its own colors, typography,
 * and assets.
 */
export type ProductBranding = {
  /** Stable slug. Matches product_activations.product_slug in the database
   * and the directory name under `/branding/` and `/public/products/`. */
  slug: string;

  /** Display name shown in headers, page titles, og:title, etc. */
  name: string;

  /** One-line tagline used in headers, hero copy, og:description. */
  tagline: string;

  /** Color tokens. All CSS-color-string values (hex, rgb, hsl). */
  colors: {
    primary: string;
    primaryFg: string;
    secondary: string;
    accent: string;
    dark: string;
    light: string;
    success: string;
    warning: string;
    danger: string;
  };

  /** CSS gradient strings for header backgrounds, brand marks, etc. */
  gradients: {
    /** Used for buttons and the brand icon background. */
    brand: string;
    /** Used for product header bars. */
    headerBg: string;
  };

  /** Path to web-served assets under `/public/products/<slug>/`. */
  assets: {
    /** Square mark for favicons / icon-only contexts. */
    icon: string;
    /** Full logo with wordmark for nav bars. */
    logo: string;
    /** og:image fallback. */
    ogImage: string;
  };

  /** CSS font-family stack. Inter is the AISM default. */
  fontFamily: string;
};
