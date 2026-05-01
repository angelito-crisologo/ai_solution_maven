import { ArrowRight, FileUp, Share2, Sparkles } from "lucide-react";

type FlowStep = {
  icon: typeof FileUp;
  title: string;
  text: string;
};

const flowSteps: FlowStep[] = [
  {
    icon: FileUp,
    title: "Upload",
    text: "Import an MPP plan into a normalized workspace."
  },
  {
    icon: Sparkles,
    title: "Analyze",
    text: "Review schedule health, dependencies, and AI-ready insight."
  },
  {
    icon: Share2,
    title: "Share",
    text: "Open a read-only stakeholder link from the same plan."
  }
];

type Props = {
  title?: string;
  className?: string;
};

export function PlanSightFlowGraphic({ title = "Product flow", className = "" }: Props) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur ${className}`.trim()}>
      <p className="text-sm font-semibold uppercase tracking-normal text-slate-300">{title}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {flowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-normal text-slate-400">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p>
              {index < flowSteps.length - 1 ? (
                <ArrowRight className="mt-4 h-4 w-4 text-slate-500 sm:hidden" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
