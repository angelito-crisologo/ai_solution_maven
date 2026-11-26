import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSameOrigin } from "../origin";
import { clientIp, createRateLimiter } from "../rateLimit";
import { fieldErrors, normalise, singleLine, tooLong } from "../validate";

describe("validate", () => {
  it("trims fields and ignores non-strings", () => {
    const input = normalise({ name: "  Ann ", email: 5, message: "\nHi\n" });
    expect(input).toMatchObject({ name: "Ann", email: "", message: "Hi", organisation: "" });
  });

  it("flags missing name, bad email and missing message", () => {
    expect(fieldErrors({ name: "", email: "nope", message: " " })).toEqual({
      name: true,
      email: true,
      message: true,
    });
    expect(fieldErrors({ name: "Ann", email: "a@b.co", message: "Hi" })).toEqual({});
  });

  it("enforces length limits", () => {
    const base = normalise({ name: "Ann", email: "a@b.co", message: "Hi" });
    expect(tooLong(base)).toBe(false);
    expect(tooLong({ ...base, name: "x".repeat(101) })).toBe(true);
    expect(tooLong({ ...base, organisation: "x".repeat(151) })).toBe(true);
    expect(tooLong({ ...base, message: "x".repeat(5001) })).toBe(true);
    expect(tooLong({ ...base, email: `${"x".repeat(250)}@b.co` })).toBe(true);
  });

  it("strips newlines and control characters for headers", () => {
    expect(singleLine("Ann\r\nBcc: x@y.z")).toBe("Ann Bcc: x@y.z");
  });
});

describe("rate limit", () => {
  it("allows up to the limit in a window, then blocks, then resets", () => {
    const allow = createRateLimiter(2, 1000);
    expect(allow("ip", 0)).toBe(true);
    expect(allow("ip", 10)).toBe(true);
    expect(allow("ip", 20)).toBe(false);
    expect(allow("other", 20)).toBe(true);
    expect(allow("ip", 1001)).toBe(true);
  });

  it("reads the first forwarded IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("origin check", () => {
  it("accepts same-origin and rejects others", () => {
    const ok = new Headers({ host: "aisolutionmaven.com", origin: "https://aisolutionmaven.com" });
    const other = new Headers({ host: "aisolutionmaven.com", origin: "https://evil.example" });
    const referer = new Headers({ host: "localhost:3000", referer: "http://localhost:3000/contact" });
    expect(isSameOrigin(ok)).toBe(true);
    expect(isSameOrigin(other)).toBe(false);
    expect(isSameOrigin(referer)).toBe(true);
    expect(isSameOrigin(new Headers({ host: "a.com" }))).toBe(false);
  });
});

describe("POST /api/contact", () => {
  const env = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_FROM_EMAIL = "from@example.com";
    process.env.CONTACT_TO_EMAIL = "to@example.com";
    fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function post(body: unknown, headers: Record<string, string> = {}) {
    const { POST } = await import("@/app/api/contact/route");
    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": "9.9.9.9",
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    const response = await POST(request);
    return { status: response.status, data: await response.json() };
  }

  const valid = { name: "Ann", email: "ann@example.com", message: "Hello" };

  it("sends a plain-text email with reply_to and the organisation", async () => {
    const { status, data } = await post({ ...valid, organisation: "Acme", projectType: "MVP" });
    expect(status).toBe(200);
    expect(data).toEqual({ ok: true });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.reply_to).toBe("ann@example.com");
    expect(sent.text).toContain("Organisation: Acme");
    expect(sent.text).toContain("Project type: MVP");
  });

  it("returns field errors for missing fields", async () => {
    const { status, data } = await post({ name: "", email: "bad", message: "" });
    expect(status).toBe(400);
    expect(data.fields).toEqual({ name: true, email: true, message: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects over-length input", async () => {
    const { status } = await post({ ...valid, message: "x".repeat(5001) });
    expect(status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions without sending", async () => {
    const { status, data } = await post({ ...valid, website: "spam" });
    expect(status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests", async () => {
    const { status } = await post(valid, { origin: "https://evil.example" });
    expect(status).toBe(403);
  });

  it("rate limits repeated requests from one IP", async () => {
    const { POST } = await import("@/app/api/contact/route");
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const response = await POST(
        new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: { host: "localhost:3000", origin: "http://localhost:3000", "x-forwarded-for": "7.7.7.7" },
          body: JSON.stringify(valid),
        }),
      );
      last = response.status;
    }
    expect(last).toBe(429);
  });

  it("never leaks the provider error or env names", async () => {
    fetchMock.mockResolvedValueOnce(new Response("secret provider detail", { status: 422 }));
    const { status, data } = await post(valid);
    expect(status).toBe(502);
    expect(JSON.stringify(data)).not.toContain("secret provider detail");

    delete process.env.RESEND_API_KEY;
    const missing = await post(valid, { "x-forwarded-for": "8.8.8.8" });
    expect(missing.status).toBe(500);
    expect(JSON.stringify(missing.data)).not.toMatch(/RESEND|CONTACT_/);
  });
});
