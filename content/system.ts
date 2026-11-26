/**
 * Copy for the 404 and error pages. The copy deck does not cover these, so
 * this wording is a proposal to review.
 */
export const system = {
  notFound: {
    heading: "Page not found",
    text: "This page is not here. It may have moved when the site changed.",
    link: "Go to the home page",
  },
  error: {
    heading: "Something went wrong",
    text: "The page did not load. Please try again.",
    retry: "Try again",
    home: "Go to the home page",
  },
} as const;
