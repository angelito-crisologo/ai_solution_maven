"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildInsightsReport } from "@/lib/plansight-ai/analysis";
import type { PlanMetrics } from "@/lib/plansight-ai/types";
import type { SharePayload } from "@/lib/plansight-ai/share";
import type { Plan } from "@/lib/plansight-ai/types";
import { PlanSightWorkspace } from "./PlanSightWorkspace";

type Props = {
  plan: Plan;
  metrics: PlanMetrics;
  share: SharePayload;
};

export function SharedStakeholderPlanView({ plan, metrics, share }: Props) {
  const [stakeholderName, setStakeholderName] = useState("");
  const analysis = useMemo(() => buildInsightsReport(plan), [plan]);

  return (
    <section className="px-4 pt-2 pb-6 sm:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-soft">
          Need to report an issue, leave a comment, or request a feature?{" "}
          <Link
            href={{
              pathname: "/feedback",
              query: {
                product: "PlanSight AI",
                source: "shared-plan",
                pagePath: `/share/${share.shareId}`,
                shareId: share.shareId,
                planTitle: plan.title
              }
            }}
            className="font-semibold text-primary transition hover:text-secondary"
          >
            Send feedback
          </Link>
          .
        </div>
        <PlanSightWorkspace
          plan={plan}
          metrics={metrics}
          insights={[]}
          analysis={analysis}
          share={share}
          stakeholderName={stakeholderName}
          onStakeholderNameChange={setStakeholderName}
          outerSectionClassName="px-4 pt-4 pb-8 sm:px-6"
          containerMaxWidthClassName="max-w-[1600px]"
        />
      </div>
    </section>
  );
}
