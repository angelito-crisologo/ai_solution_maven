"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { GA4_MEASUREMENT_ID, isGa4Enabled, trackPageview } from "@/lib/analytics/gtag";

/**
 * GA4 bootstrap + App Router pageview tracker. Two pieces in one component
 * because they share the same gate (`NEXT_PUBLIC_GA4_MEASUREMENT_ID` set).
 *
 * - <Script> loads gtag.js with the measurement ID and runs the boilerplate
 *   bootstrap. The initial page_view fires automatically inside that boot.
 * - <GA4Pageviews> listens to App Router pathname + searchParams changes and
 *   fires page_view on each client-side navigation (Next App Router doesn't
 *   trigger automatic gtag pageviews on route changes the way the Pages
 *   Router did).
 *
 * Both render nothing when GA4 isn't configured.
 */
export function GA4Scripts() {
  if (!isGa4Enabled()) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA4_MEASUREMENT_ID}', { send_page_view: true });
          `
        }}
      />
      {/* useSearchParams needs to be inside a Suspense boundary in the App Router */}
      <Suspense fallback={null}>
        <GA4Pageviews />
      </Suspense>
    </>
  );
}

function GA4Pageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    // Skip the very first render — gtag's config call already sent that
    // page_view. After that, fire one event per client-side route change.
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    // Tiny defer so document.title reflects the new route's metadata.
    const timer = window.setTimeout(() => {
      trackPageview(path);
    }, 0);
    return () => window.clearTimeout(timer);
    // pathname/searchParams are the App Router change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
