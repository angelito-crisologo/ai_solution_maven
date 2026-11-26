/**
 * Contact form rules, shared by the form (client) and /api/contact (server)
 * so both enforce the same limits.
 */

export const LIMITS = {
  name: 100,
  email: 254,
  organisation: 150,
  message: 5000,
  /** Legacy optional fields still accepted by the API. */
  projectType: 100,
  timeline: 100,
} as const;

export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/** Name of the hidden spam-check field. Real visitors never fill it. */
export const HONEYPOT_FIELD = "website";

export type ContactField = "name" | "email" | "message";
export type FieldErrors = Partial<Record<ContactField, true>>;

export type ContactInput = {
  name: string;
  email: string;
  organisation: string;
  message: string;
  projectType: string;
  timeline: string;
};

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Remove CR, LF and other control characters (for subjects and headers). */
export function singleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

/** Trim every field and drop anything that is not a string. */
export function normalise(payload: unknown): ContactInput {
  const p = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  return {
    name: str(p.name),
    email: str(p.email),
    organisation: str(p.organisation),
    message: str(p.message),
    projectType: str(p.projectType),
    timeline: str(p.timeline),
  };
}

/** Required-field and email checks, matching the copy deck's messages. */
export function fieldErrors(input: Pick<ContactInput, ContactField>): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name.trim()) errors.name = true;
  if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = true;
  if (!input.message.trim()) errors.message = true;
  return errors;
}

/** True when any field is longer than its limit. */
export function tooLong(input: ContactInput): boolean {
  return (Object.keys(LIMITS) as Array<keyof typeof LIMITS>).some(
    (key) => input[key].length > LIMITS[key],
  );
}
