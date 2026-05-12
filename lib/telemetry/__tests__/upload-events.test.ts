import { describe, expect, it } from "vitest";
import { classifyError, hashFilename, sanitizeError } from "../upload-events";

describe("classifyError", () => {
  it("maps AbortError to parser_timeout", () => {
    const err = Object.assign(new Error("operation aborted"), { name: "AbortError" });
    expect(classifyError(err)).toBe("parser_timeout");
  });

  it("maps timeout-keyword messages to parser_timeout", () => {
    expect(classifyError(new Error("request timed out"))).toBe("parser_timeout");
    expect(classifyError(new Error("Connection timeout"))).toBe("parser_timeout");
  });

  it("maps network errors to parser_error", () => {
    expect(classifyError(new Error("fetch failed"))).toBe("parser_error");
    expect(classifyError(new Error("getaddrinfo ENOTFOUND parser.example"))).toBe("parser_error");
    expect(classifyError(new Error("connect ECONNREFUSED 127.0.0.1:3005"))).toBe("parser_error");
  });

  it("maps Supabase / postgres errors to db_write", () => {
    expect(classifyError(new Error("supabase request failed"))).toBe("db_write");
    expect(classifyError(new Error('relation "upload_events" does not exist'))).toBe("db_write");
  });

  it("maps multipart / form-data errors to upload", () => {
    expect(classifyError(new Error("Invalid request body. Expected multipart/form-data."))).toBe(
      "upload"
    );
    expect(classifyError(new Error("Unable to parse multipart payload"))).toBe("upload");
  });

  it("maps validation errors to validation", () => {
    expect(classifyError(new Error("Invalid file type. Please upload a .mpp file."))).toBe(
      "validation"
    );
    expect(classifyError(new Error("File exceeds the Free maximum of 5 MB."))).toBe("validation");
    expect(classifyError(new Error("Bad extension"))).toBe("validation");
  });

  it("defaults unrecognized errors to unknown", () => {
    expect(classifyError(new Error("something weird"))).toBe("unknown");
    expect(classifyError("string error")).toBe("unknown");
    expect(classifyError(null)).toBe("unknown");
    expect(classifyError(undefined)).toBe("unknown");
  });
});

describe("sanitizeError", () => {
  it("returns a short string for a plain Error", () => {
    expect(sanitizeError(new Error("Boom"))).toBe("Boom");
  });

  it("returns 'Unknown error' for null / undefined", () => {
    expect(sanitizeError(null)).toBe("Unknown error");
    expect(sanitizeError(undefined)).toBe("Unknown error");
  });

  it("returns the input string verbatim for string errors (when nothing to scrub)", () => {
    expect(sanitizeError("Simple failure message")).toBe("Simple failure message");
  });

  it("strips Unix absolute paths", () => {
    const msg = sanitizeError(
      new Error("ENOENT: no such file at /Users/tolitz/dev/aism/secret.key")
    );
    expect(msg).not.toMatch(/\/Users\//);
    expect(msg).toContain("<path>");
  });

  it("strips Windows absolute paths", () => {
    const msg = sanitizeError(new Error("File not found at C:\\\\Users\\\\Alice\\\\plan.mpp"));
    expect(msg).not.toMatch(/C:\\/);
    expect(msg).toContain("<path>");
  });

  it("redacts bearer tokens", () => {
    const msg = sanitizeError(
      new Error("Upstream rejected: Bearer sk_live_abc123def456ghi789")
    );
    expect(msg).not.toMatch(/sk_live_abc/);
    expect(msg).toContain("<redacted>");
  });

  it("redacts JWT-shaped tokens", () => {
    const fakeJwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.aaaa-bbbb_cccc";
    const msg = sanitizeError(new Error(`Auth failed: ${fakeJwt}`));
    expect(msg).not.toContain(fakeJwt);
    expect(msg).toContain("<jwt>");
  });

  it("redacts authorization headers", () => {
    const msg = sanitizeError(
      new Error("authorization: Basic dXNlcjpwYXNz; cookie: session=abc")
    );
    expect(msg).not.toMatch(/dXNlcjpwYXNz/);
    expect(msg).not.toMatch(/session=abc/);
    expect(msg.toLowerCase()).toContain("<redacted>");
  });

  it("redacts secret-bearing query params", () => {
    const msg = sanitizeError(
      new Error("Fetch failed with api_key=sk_test_abc123 and password=hunter2")
    );
    expect(msg).not.toMatch(/sk_test_abc123/);
    expect(msg).not.toMatch(/hunter2/);
    expect(msg).toContain("<redacted>");
  });

  it("strips process.env references", () => {
    const msg = sanitizeError(new Error("Missing process.env.STRIPE_SECRET_KEY"));
    expect(msg).not.toMatch(/STRIPE_SECRET_KEY/);
    expect(msg).toContain("process.env.<name>");
  });

  it("keeps only the first line of multi-line stack traces", () => {
    const err = new Error("Boom");
    err.stack =
      "Error: Boom\n    at /Users/foo/bar.ts:42:11\n    at /Users/foo/baz.ts:100:8";
    const msg = sanitizeError(err);
    // err.message is "Boom"; the function reads .message not .stack, so this
    // just verifies multi-line inputs don't bleed through.
    const withNewlines = sanitizeError(
      new Error("Top message\n    at /Users/foo/bar.ts:42:11\n    at handler")
    );
    expect(withNewlines).not.toMatch(/\n/);
    expect(withNewlines).not.toMatch(/\/Users\//);
    expect(msg).toBe("Boom");
  });

  it("caps output at the documented length", () => {
    const long = "x".repeat(1000);
    const msg = sanitizeError(new Error(long));
    expect(msg.length).toBeLessThanOrEqual(300);
    expect(msg.endsWith("…")).toBe(true);
  });

  it("serializes non-Error objects defensively", () => {
    const msg = sanitizeError({ code: 503, reason: "upstream" });
    expect(msg).toContain("503");
    expect(msg).toContain("upstream");
  });
});

describe("hashFilename", () => {
  it("returns null for empty input", async () => {
    expect(await hashFilename("")).toBeNull();
  });

  it("returns a 64-char hex string", async () => {
    const hash = await hashFilename("project-plan-q3.mpp");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", async () => {
    const a = await hashFilename("plan.mpp");
    const b = await hashFilename("plan.mpp");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", async () => {
    const a = await hashFilename("plan-a.mpp");
    const b = await hashFilename("plan-b.mpp");
    expect(a).not.toBe(b);
  });

  it("is case-sensitive (treats different cases as different files)", async () => {
    const a = await hashFilename("Plan.mpp");
    const b = await hashFilename("plan.mpp");
    expect(a).not.toBe(b);
  });
});
