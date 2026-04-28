"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  projectType: string;
  timeline: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  projectType: "AI app development",
  timeline: "Not sure yet",
  message: "",
};

const projectTypes = [
  "AI app development",
  "Web or mobile app",
  "MVP build",
  "Internal tool",
  "Product consultation",
];

const timelines = [
  "Not sure yet",
  "This month",
  "1-3 months",
  "3+ months",
];

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "ready">("idle");
  const [error, setError] = useState("");

  const emailHref = useMemo(() => {
    const subject = encodeURIComponent(`Project enquiry from ${form.name}`);
    const body = encodeURIComponent(
      [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        `Project type: ${form.projectType}`,
        `Timeline: ${form.timeline}`,
        "",
        form.message,
      ].join("\n"),
    );

    return `mailto:hello@aisolutionmaven.com?subject=${subject}&body=${body}`;
  }, [form]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setStatus("idle");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please add your name, email, and a short project message.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("ready");
    window.location.href = emailHref;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-dark">
          Name
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="h-12 rounded-xl border border-slate-200 px-4 text-base font-normal text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Your name"
            autoComplete="name"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-dark">
          Email
          <input
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="h-12 rounded-xl border border-slate-200 px-4 text-base font-normal text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-dark">
          Project type
          <select
            value={form.projectType}
            onChange={(event) => updateField("projectType", event.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-normal text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {projectTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-dark">
          Timeline
          <select
            value={form.timeline}
            onChange={(event) => updateField("timeline", event.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-normal text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {timelines.map((timeline) => (
              <option key={timeline}>{timeline}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-medium text-dark">
        Message
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className="min-h-40 resize-y rounded-xl border border-slate-200 px-4 py-3 text-base font-normal leading-7 text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
          placeholder="Tell me what you want to build, what problem it solves, and what a good outcome looks like."
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}

      {status === "ready" ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4" />
          Your email app should open with the project details filled in.
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-6 py-3 text-base font-medium text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] sm:w-auto"
      >
        Send enquiry
        <ArrowRight aria-hidden="true" className="h-5 w-5" />
      </button>
    </form>
  );
}
