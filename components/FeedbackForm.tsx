"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, AlertTriangle, Lightbulb, MessageSquare } from "lucide-react";

type FeedbackType = "general_feedback" | "feature_request" | "bug_report";
type Severity = "low" | "medium" | "high" | "critical";

type FeedbackFormProps = {
  defaultType?: FeedbackType;
  product?: string;
  pagePath?: string;
  pageUrl?: string;
  shareId?: string;
  planTitle?: string;
  sourceContext?: string;
};

type FeedbackState = {
  feedbackType: FeedbackType;
  subject: string;
  name: string;
  email: string;
  message: string;
  severity: Severity;
  stepsToReproduce: string;
  desiredOutcome: string;
};

const feedbackTypeOptions: Array<{
  value: FeedbackType;
  label: string;
  description: string;
  icon: typeof MessageSquare;
}> = [
  {
    value: "general_feedback",
    label: "General feedback",
    description: "Share a comment about the product, workflow, or experience.",
    icon: MessageSquare
  },
  {
    value: "feature_request",
    label: "Feature request",
    description: "Describe what would make the product more useful for you.",
    icon: Lightbulb
  },
  {
    value: "bug_report",
    label: "Bug report",
    description: "Tell us what broke, what you expected, and what actually happened.",
    icon: AlertTriangle
  }
];

function createInitialState(defaultType: FeedbackType): FeedbackState {
  return {
    feedbackType: defaultType,
    subject: "",
    name: "",
    email: "",
    message: "",
    severity: "medium",
    stepsToReproduce: "",
    desiredOutcome: ""
  };
}

export function FeedbackForm({
  defaultType = "general_feedback",
  product = "AI Solution Maven",
  pagePath = "/feedback",
  pageUrl = "",
  shareId = "",
  planTitle = "",
  sourceContext = ""
}: FeedbackFormProps) {
  const [form, setForm] = useState<FeedbackState>(() => createInitialState(defaultType));
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const typeDetails = useMemo(
    () => feedbackTypeOptions.find((option) => option.value === form.feedbackType) ?? feedbackTypeOptions[0],
    [form.feedbackType]
  );

  function updateField(field: keyof FeedbackState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus("idle");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.subject.trim() || !form.message.trim()) {
      setError("Please add a short subject and a description.");
      setStatus("error");
      return;
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          feedbackType: form.feedbackType,
          subject: form.subject.trim(),
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          severity: form.feedbackType === "bug_report" ? form.severity : null,
          stepsToReproduce: form.feedbackType === "bug_report" ? form.stepsToReproduce.trim() : "",
          desiredOutcome:
            form.feedbackType === "feature_request" ? form.desiredOutcome.trim() : "",
          product,
          pagePath,
          pageUrl,
          shareId,
          planTitle,
          sourceContext,
          browser:
            typeof window !== "undefined"
              ? window.navigator.userAgent
              : ""
        })
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit feedback right now.");
      }

      setForm(createInitialState(form.feedbackType));
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit feedback right now."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-8"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Feedback
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-dark">Report an issue or share an idea</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Use this form for comments, feature requests, and bug reports. If you need a reply,
            include your email address.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-dark">{product}</p>
          <p className="mt-1">Source: {sourceContext || "feedback page"}</p>
          {planTitle ? <p className="mt-1">Plan: {planTitle}</p> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {feedbackTypeOptions.map((option) => {
          const Icon = option.icon;
          const active = form.feedbackType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField("feedbackType", option.value)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-dark text-white">
                  <Icon className="h-5 w-5" />
                </div>
                {active ? (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-normal text-white">
                    Selected
                  </span>
                ) : null}
              </div>
              <p className="mt-4 font-semibold text-dark">{option.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-dark sm:col-span-2">
          Subject
          <input
            value={form.subject}
            onChange={(event) => updateField("subject", event.target.value)}
            className="h-12 rounded-xl border border-slate-200 px-4 text-base font-normal text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder={
              form.feedbackType === "bug_report"
                ? "Short summary of the issue"
                : form.feedbackType === "feature_request"
                  ? "Short summary of the idea"
                  : "Short summary of your feedback"
            }
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-dark">
          Name
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="h-12 rounded-xl border border-slate-200 px-4 text-base font-normal text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Optional"
            autoComplete="name"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-dark">
          Email
          <input
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="h-12 rounded-xl border border-slate-200 px-4 text-base font-normal text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Optional"
            autoComplete="email"
            inputMode="email"
          />
        </label>

        {form.feedbackType === "bug_report" ? (
          <label className="grid gap-2 text-sm font-medium text-dark">
            Severity
            <select
              value={form.severity}
              onChange={(event) => updateField("severity", event.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-normal text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        ) : null}
      </div>

      {form.feedbackType === "bug_report" ? (
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-dark">
            Steps to reproduce
            <textarea
              value={form.stepsToReproduce}
              onChange={(event) => updateField("stepsToReproduce", event.target.value)}
              className="min-h-28 resize-y rounded-xl border border-slate-200 px-4 py-3 text-base font-normal leading-7 text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="What were you doing when the problem happened?"
            />
          </label>
        </div>
      ) : null}

      {form.feedbackType === "feature_request" ? (
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-dark">
            Desired outcome
            <textarea
              value={form.desiredOutcome}
              onChange={(event) => updateField("desiredOutcome", event.target.value)}
              className="min-h-28 resize-y rounded-xl border border-slate-200 px-4 py-3 text-base font-normal leading-7 text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="What should the product do?"
            />
          </label>
        </div>
      ) : null}

      <label className="mt-5 grid gap-2 text-sm font-medium text-dark">
        Details
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className="min-h-40 resize-y rounded-xl border border-slate-200 px-4 py-3 text-base font-normal leading-7 text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
          placeholder={
            form.feedbackType === "bug_report"
              ? "Describe what happened and what you expected to happen."
              : form.feedbackType === "feature_request"
                ? "Describe the request and the problem it solves."
                : "Share your comment or experience."
          }
        />
      </label>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        {typeDetails.description} {form.feedbackType === "bug_report" ? "Coming from a problem? This will be reviewed as a bug report." : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}

      {status === "success" ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4" />
          Feedback saved. Thank you for the note.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-6 py-3 text-base font-medium text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {status === "submitting" ? "Sending..." : "Send feedback"}
        <ArrowRight aria-hidden="true" className="h-5 w-5" />
      </button>
    </form>
  );
}
