"use client";

import { useState } from "react";
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

  return (
    <section className="px-4 pt-2 pb-6 sm:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <PlanSightWorkspace
          plan={plan}
          metrics={metrics}
          insights={[]}
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
