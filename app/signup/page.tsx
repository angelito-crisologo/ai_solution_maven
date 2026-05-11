import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SignUpForm } from "@/components/auth/SignUpForm";
import {
  activateProduct,
  getProductActivation,
  PRODUCTS,
  type ProductSlug
} from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a PlanSight AI account to keep your imported plans across sessions."
};

type Props = {
  searchParams?: { redirectTo?: string; product?: string };
};

// Known product slugs accepted on /signup. Anything else is treated as if
// no product was requested.
const KNOWN_PRODUCT_SLUGS: Record<string, ProductSlug> = {
  "plansight-ai": PRODUCTS.PLANSIGHT
};

const PRODUCT_LABELS: Record<ProductSlug, string> = {
  "plansight-ai": "PlanSight"
};

export default async function SignUpPage({ searchParams }: Props) {
  const rawProduct = searchParams?.product || "";
  const productSlug: ProductSlug | null = KNOWN_PRODUCT_SLUGS[rawProduct] ?? null;
  const redirectTo =
    searchParams?.redirectTo || (productSlug === PRODUCTS.PLANSIGHT ? "/my-plans" : "/my-plans");

  const user = await getCurrentUser();

  // Signed-in branch: reuse the existing AISM account. If a known product
  // was requested, activate it (idempotent) and show a friendly card
  // explaining we re-used the existing credentials. If no product was
  // requested there's nothing to do — send them to their destination.
  if (user) {
    if (!productSlug) {
      redirect(redirectTo);
    }

    const productLabel = PRODUCT_LABELS[productSlug];
    const existing = await getProductActivation(user.id, productSlug);
    const alreadyActivated = !!existing;
    let activationError: string | null = null;

    if (!existing) {
      try {
        await activateProduct(user.id, productSlug);
      } catch (err) {
        activationError =
          err instanceof Error ? err.message : `Couldn't add ${productLabel} to your account.`;
      }
    }

    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          {activationError ? (
            <>
              <p className="text-micro text-amber-700">Almost there</p>
              <h1 className="mt-2 text-h1 text-ink">We hit a snag</h1>
              <p className="mt-3 text-body text-slate-700">
                You&apos;re signed in as{" "}
                <span className="font-semibold">{user.email}</span>, but we
                couldn&apos;t add {productLabel} to your account just yet:{" "}
                {activationError}
              </p>
              <Link
                href={`/signup?product=${productSlug}&redirectTo=${encodeURIComponent(redirectTo)}`}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
              >
                Try again
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-micro text-cyan-700">{productLabel} AI</p>
              <h1 className="mt-2 text-h1 text-ink">
                {alreadyActivated ? "Welcome back" : `You're signed up for ${productLabel}`}
              </h1>
              <p className="mt-3 text-body text-slate-700">
                {alreadyActivated ? (
                  <>
                    You&apos;re already set up for {productLabel} with your AI Solution
                    Maven account{" "}
                    <span className="font-semibold">{user.email}</span>.
                  </>
                ) : (
                  <>
                    We see you&apos;re already signed in with an AI Solution Maven
                    account (<span className="font-semibold">{user.email}</span>).
                    We&apos;ve added {productLabel} to your account using the same
                    credentials — no extra signup needed.
                  </>
                )}
              </p>
              <p className="mt-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-body text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <span>
                  You can now access the <span className="font-semibold">My plans</span>{" "}
                  dashboard. Free keeps your most recent imported plan across sessions;
                  Pro unlocks multi-plan retention and the full AI suite.
                </span>
              </p>
              <Link
                href={redirectTo}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
              >
                Continue to {productLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  // Anonymous branch: standard sign-up form.
  const isPlansight = productSlug === PRODUCTS.PLANSIGHT;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-micro text-cyan-700">
          {isPlansight ? "PlanSight AI" : "Sign up"}
        </p>
        <h1 className="mt-2 text-h1 text-ink">
          {isPlansight ? "Sign up for free" : "Create your account"}
        </h1>
        <p className="mt-3 text-body text-slate-700">
          {isPlansight
            ? "Signing up unlocks the My plans dashboard and keeps your most recent imported plan across sessions. Pro unlocks multi-plan retention and the full AI suite."
            : "Sign up with your email and a password."}
        </p>

        <SignUpForm redirectTo={redirectTo} product={rawProduct} />
      </div>
    </main>
  );
}
