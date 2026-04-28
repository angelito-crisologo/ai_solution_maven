import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
            404
          </p>
          <h1 className="mt-3 max-w-3xl text-[40px] font-bold leading-[1.12] tracking-normal md:text-[48px]">
            This page is not available
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            The route does not exist yet. Use the homepage, products, projects,
            or contact page to keep moving.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-medium text-dark transition hover:bg-slate-100"
            >
              Go Home
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-base font-medium text-white transition hover:border-white/25 hover:bg-white/5"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
