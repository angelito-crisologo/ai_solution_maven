import type { ImageAsset } from "./types";

/**
 * Credential tiles. Badges are shown as supplied, with no certification
 * numbers. Links go to the issuer's verification page.
 */

export type Credential = {
  readonly name: string;
  readonly issuer: string;
  readonly linkLabel: string;
  readonly href: string;
  readonly badge: ImageAsset;
};

export const credentials: readonly Credential[] = [
  {
    name: "PMP, Project Management Professional",
    issuer: "Project Management Institute",
    linkLabel: "Verify on Credly",
    href: "https://www.credly.com/badges/881bfcbb-4fa2-4cbe-a040-dd38d86a6a31",
    badge: {
      src: "/images/pmp.png",
      alt: "PMP badge, Project Management Institute",
      width: 1700,
      height: 1700,
    },
  },
  {
    name: "CSM, Certified ScrumMaster",
    issuer: "Scrum Alliance",
    linkLabel: "Verify the badge",
    href: "https://app.badgecert.com/public/badges/udyrkgvf",
    badge: {
      src: "/images/csm-badge.png",
      alt: "CSM badge, Scrum Alliance",
      width: 300,
      height: 300,
    },
  },
  {
    name: "PSM I, Professional Scrum Master I",
    issuer: "Scrum.org",
    linkLabel: "Verify on Credly",
    href: "https://www.credly.com/badges/d6baf139-d5d4-44e3-a960-cfc433d7e0f4",
    badge: {
      src: "/images/psm.png",
      alt: "PSM I badge, Scrum.org",
      width: 600,
      height: 600,
    },
  },
];

export const credentialsCopy = {
  heading: "Certified, and checkable.",
  text: "PMP, CSM and PSM I. Each badge links to the issuer.",
} as const;
