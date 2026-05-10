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
    text: "Drop in an .mpp file. We parse it into a normalized workspace."
  },
  {
    icon: Sparkles,
    title: "Analyze",
    text: "Critical path, RAG status, and a Claude-generated narrative."
  },
  {
    icon: Share2,
    title: "Share",
    text: "Send stakeholders a read-only link. No login required."
  }
];

type Props = {
  title?: string;
  className?: string;
};

export function PlanSightFlowGraphic({ title = "Product flow", className = "" }: Props) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-navy-800 p-5 ${className}`.trim()}>
      <p className="text-micro text-cyan-400">{title}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {flowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="rounded-md border border-slate-800 bg-navy p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-800 text-cyan-400">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-caption text-slate-500">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-4 text-h3 text-slate-100">{step.title}</p>
              <p className="mt-2 text-body text-slate-400">{step.text}</p>
              {index < flowSteps.length - 1 ? (
                <ArrowRight className="mt-4 h-4 w-4 text-slate-600 sm:hidden" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
