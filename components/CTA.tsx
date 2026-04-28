import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section id="contact" className="bg-dark px-6 py-20 text-white">
      <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
            Start a build
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
            Need an AI product that is practical, polished, and ready for real
            users?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            I can help turn a rough workflow, product idea, or internal process
            into a working app with a clear path to launch.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-medium text-dark transition hover:bg-slate-100"
          >
            Contact
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
          <Link
            href="mailto:hello@aisolutionmaven.com"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-base font-medium text-white transition hover:border-white/25 hover:bg-white/5"
          >
            Book a Call
          </Link>
        </div>
      </div>
    </section>
  );
}
