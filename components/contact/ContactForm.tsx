"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { contact } from "@/content/pages";
import {
  fieldErrors,
  HONEYPOT_FIELD,
  LIMITS,
  type ContactField,
  type FieldErrors,
} from "@/lib/contact/validate";
import { btnPrimary, cx } from "@/lib/ui";
import { RichText } from "../RichText";

type Status = "idle" | "sending" | "success" | "failed" | "toomany";
type Values = { name: string; email: string; organisation: string; message: string };

const EMPTY: Values = { name: "", email: "", organisation: "", message: "" };
const ORDER: ContactField[] = ["name", "email", "message"];
const copy = contact.form;

const labelClass = "text-body-sm font-semibold text-navy-900";
const helpClass = "text-small text-ink-500";
const errorClass = "text-small font-medium text-error";
const alertClass =
  "rounded-control border border-error bg-error-tint px-4 py-3.5 text-small text-navy-900";

function controlClass(invalid: boolean) {
  return cx(
    "w-full rounded-control bg-white px-3.5 py-2.5 text-body text-navy-900",
    invalid ? "border-2 border-error" : "border-[1.5px] border-ink-400",
  );
}

/**
 * Contact form. States follow the design: field errors (focus moves to the
 * first one), sending, success (replaces the form, role="status"), send
 * failed and too many attempts (role="alert", values kept).
 */
export function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const honeypotRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  const focusNameNext = useRef(false);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
    // After "Send another message", the form is back: start at the name field.
    if (status === "idle" && focusNameNext.current) {
      focusNameNext.current = false;
      refs.name.current?.focus();
    }
    // refs are stable objects; status is the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function update(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // Once a field has been flagged, re-check it as the visitor types.
    if (field !== "organisation" && errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        const recheck = fieldErrors({ ...values, [field]: value });
        if (!recheck[field]) delete next[field];
        return next;
      });
    }
  }

  function showErrors(next: FieldErrors) {
    setErrors(next);
    const first = ORDER.find((field) => next[field]);
    if (first) refs[first].current?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const next = fieldErrors(values);
    if (Object.keys(next).length > 0) {
      setStatus("idle");
      showErrors(next);
      return;
    }

    setErrors({});
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? "",
        }),
      });

      if (response.ok) {
        setValues(EMPTY);
        setStatus("success");
        return;
      }
      if (response.status === 429) {
        setStatus("toomany");
        return;
      }
      if (response.status === 400) {
        const data = (await response.json().catch(() => ({}))) as { fields?: FieldErrors };
        if (data.fields && Object.keys(data.fields).length > 0) {
          setStatus("idle");
          showErrors(data.fields);
          return;
        }
      }
      setStatus("failed");
    } catch {
      setStatus("failed");
    }
  }

  function reset() {
    setValues(EMPTY);
    setErrors({});
    focusNameNext.current = true;
    setStatus("idle");
  }

  const sending = status === "sending";

  return (
    <>
      <div role="status">
        {status === "success" ? (
          <div
            ref={successRef}
            tabIndex={-1}
            className="flex flex-col gap-3 rounded-control border border-success bg-success-tint p-5 outline-none"
          >
            <strong className="text-[20px] text-success">{copy.success.heading}</strong>
            <p className="m-0 text-navy-900">
              <RichText value={copy.success.text} />
            </p>
            <button
              type="button"
              onClick={reset}
              className="cursor-pointer self-start border-0 bg-transparent p-0 font-semibold text-teal-700 underline underline-offset-[3px] hover:text-navy-900"
            >
              {copy.success.again}
            </button>
          </div>
        ) : null}
      </div>

      {status !== "success" ? (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          {status === "toomany" ? (
            <div role="alert" className={alertClass}>
              <strong className="text-error">{copy.tooMany.lead}</strong>{" "}
              <RichText value={copy.tooMany.text} />
            </div>
          ) : null}
          {status === "failed" ? (
            <div role="alert" className={alertClass}>
              <strong className="text-error">{copy.failed.lead}</strong>{" "}
              <RichText value={copy.failed.text} />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-name" className={labelClass}>
              {copy.name.label}
            </label>
            <input
              ref={refs.name}
              id="f-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={LIMITS.name}
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "f-name-error" : undefined}
              className={cx(controlClass(!!errors.name), "min-h-[48px]")}
            />
            {errors.name ? (
              <span id="f-name-error" className={errorClass}>
                {copy.errors.name}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-email" className={labelClass}>
              {copy.email.label}
            </label>
            <span id="f-email-help" className={helpClass}>
              {copy.email.help}
            </span>
            <input
              ref={refs.email}
              id="f-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={LIMITS.email}
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={cx("f-email-help", errors.email && "f-email-error")}
              className={cx(controlClass(!!errors.email), "min-h-[48px]")}
            />
            {errors.email ? (
              <span id="f-email-error" className={errorClass}>
                {copy.errors.email}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-org" className={labelClass}>
              {copy.organisation.label}{" "}
              <span className="font-normal text-ink-500">{copy.organisation.optional}</span>
            </label>
            <input
              id="f-org"
              name="organisation"
              type="text"
              autoComplete="organization"
              maxLength={LIMITS.organisation}
              value={values.organisation}
              onChange={(e) => update("organisation", e.target.value)}
              className={cx(controlClass(false), "min-h-[48px]")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-msg" className={labelClass}>
              {copy.message.label}
            </label>
            <span id="f-msg-help" className={helpClass}>
              {copy.message.help}
            </span>
            <textarea
              ref={refs.message}
              id="f-msg"
              name="message"
              rows={4}
              maxLength={LIMITS.message}
              value={values.message}
              onChange={(e) => update("message", e.target.value)}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={cx("f-msg-help", errors.message && "f-msg-error")}
              className={cx(controlClass(!!errors.message), "resize-y")}
            />
            {errors.message ? (
              <span id="f-msg-error" className={errorClass}>
                {copy.errors.message}
              </span>
            ) : null}
          </div>

          {/* Spam check: hidden from sight and from assistive technology. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="f-website">{copy.honeypotLabel}</label>
            <input
              ref={honeypotRef}
              id="f-website"
              name={HONEYPOT_FIELD}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>

          <button type="submit" disabled={sending} className={cx(btnPrimary, "self-start")}>
            {sending ? copy.sending : copy.submit}
          </button>
        </form>
      ) : null}
    </>
  );
}
