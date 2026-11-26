/** Site-wide copy, from the "Site-wide" table in the copy deck. */

export const site = {
  name: "AI Solution Maven",
  tagline: "Digital workplace strategy and bespoke business applications.",
  url: "https://aisolutionmaven.com",
  email: "angelito@aisolutionmaven.com",
  abn: "13 815 591 422",
  location: "Adelaide, South Australia",
  locality: "Adelaide",
  region: "SA",
  country: "AU",
  credentialsLine: "PMP · CSM · PSM I",
  copyright: "© 2026 AI Solution Maven",
  skipLink: "Skip to main content",
  privacyLabel: "Privacy",
  demoLabel: "Demo, synthetic data",
  /** Every call to action. */
  ctaLabel: "Book an intro call",
  /** The single header button. */
  navButton: "Book a call",
  menu: {
    open: "Open menu",
    close: "Close menu",
    mainLabel: "Main",
    footerLabel: "Footer",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "How I work", href: "/how-i-work" },
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  /** Footer link grid, two columns, in the design's reading order. */
  footerNav: [
    { label: "Home", href: "/" },
    { label: "Work", href: "/work" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "How I work", href: "/how-i-work" },
    { label: "Contact", href: "/contact" },
  ],
  ctaBand: {
    heading: "Start with a conversation.",
    text: "Tell me where your team loses time. I will say whether one application could fix it, and what it would cost to find out. The call is free.",
    button: "Book an intro call",
  },
} as const;

export type NavItem = (typeof site.nav)[number];
