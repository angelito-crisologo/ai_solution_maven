import type { Metadata } from "next";
import { BookingLink } from "@/components/BookingLink";
import { PageIntro } from "@/components/blocks/PageIntro";
import { ContactForm } from "@/components/contact/ContactForm";
import { Calendar, Mail } from "@/components/Icons";
import { contact, meta } from "@/content/pages";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { btnPrimaryLarge, srOnly } from "@/lib/ui";

export const metadata: Metadata = pageMetadata(meta.contact);

/** Contact. No call-to-action band: the booking button is the call to action. */
export default function ContactPage() {
  const { details } = contact;

  return (
    <>
      <PageIntro heading={contact.heading} intro={contact.intro} />

      <section className="bg-surface px-gutter pb-[clamp(56px,7vw,88px)] pt-[clamp(40px,5vw,72px)]">
        <div className="mx-auto grid max-w-content grid-cols-1 items-start gap-stack [grid-template-areas:'book''form''details'] two:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] two:grid-rows-[auto_1fr] two:[grid-template-areas:'book_form''details_form']">
          <div className="flex flex-col gap-3.5 rounded-card border border-line bg-white p-6 [grid-area:book]">
            <BookingLink location="contact" className={btnPrimaryLarge}>
              <Calendar />
              {site.ctaLabel}
            </BookingLink>
            <p className="m-0 text-small text-ink-500">{contact.bookingNote}</p>
          </div>

          <div className="relative min-w-0 rounded-card border border-line bg-white p-6 [grid-area:form]">
            <h2 className={srOnly}>{contact.formHeading}</h2>
            <ContactForm />
          </div>

          <div className="flex flex-col gap-4 px-1 [grid-area:details]">
            <h2 className="m-0 text-h3 text-navy-900">{details.heading}</h2>
            <dl className="m-0 flex flex-col gap-3.5 text-body-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-label text-navy-900">{details.emailLabel}</dt>
                <dd className="m-0">
                  <a
                    href={`mailto:${site.email}`}
                    className="inline-flex min-h-[44px] items-center gap-2 text-teal-700 [overflow-wrap:anywhere]"
                  >
                    <Mail />
                    {site.email}
                  </a>
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-label text-navy-900">{details.locationLabel}</dt>
                <dd className="m-0">{site.location}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-label text-navy-900">{details.abnLabel}</dt>
                <dd className="m-0">{site.abn}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
