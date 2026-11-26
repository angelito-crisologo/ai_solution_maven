import { site } from "@/content/site";
import { btnOnNavy, cx } from "@/lib/ui";
import { BookingLink } from "../BookingLink";

type Props = {
  heading?: string;
  text?: string;
  /** Small line above the heading, as on Work. */
  eyebrow?: string;
  /** Sent with the GA4 booking event. */
  location?: string;
  /** Balanced heading wrap (inner pages). Home uses natural wrapping. */
  balance?: boolean;
};

/** The navy call-to-action band. Defaults to the site-wide copy. */
export function CtaBand({
  heading = site.ctaBand.heading,
  text = site.ctaBand.text,
  eyebrow,
  location = "cta_band",
  balance = true,
}: Props) {
  return (
    <section
      aria-labelledby="h-cta"
      className="on-navy bg-navy-900 px-gutter py-section"
    >
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-12 gap-y-6">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
          {eyebrow ? (
            <p className="m-0 text-label text-navy-100">{eyebrow}</p>
          ) : null}
          <h2 id="h-cta" className={cx("m-0 text-h2 text-white", balance && "[text-wrap:balance]")}>
            {heading}
          </h2>
          {text ? <p className="m-0 max-w-[56ch] text-navy-100">{text}</p> : null}
        </div>
        <BookingLink
          location={location}
          className={cx(btnOnNavy, "flex-[1_1_220px] min-[700px]:max-w-[280px]")}
        >
          {site.ctaBand.button}
        </BookingLink>
      </div>
    </section>
  );
}
