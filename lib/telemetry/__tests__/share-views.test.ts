import { describe, expect, it } from "vitest";
import { recordShareView } from "../share-views";

describe("recordShareView", () => {
  it("resolves without throwing when shareId is missing", async () => {
    await expect(
      recordShareView({
        shareId: "",
        viewerUserId: null,
        isOwnerView: false,
        userAgent: null
      })
    ).resolves.toBeUndefined();
  });

  it("resolves without throwing when Supabase is not configured", async () => {
    // No SUPABASE_SERVICE_ROLE_KEY in the vitest env →
    // createSupabaseServiceClient() returns null → helper returns
    // silently. Demonstrates the fire-and-forget contract.
    await expect(
      recordShareView({
        shareId: "abc-123",
        viewerUserId: "user-uuid",
        isOwnerView: false,
        userAgent: "Mozilla/5.0"
      })
    ).resolves.toBeUndefined();
  });

  it("resolves without throwing for any input shape", async () => {
    // Defensive: malformed input still doesn't throw. The route's
    // user-facing response must not depend on telemetry behavior.
    await expect(
      recordShareView({
        shareId: "abc",
        viewerUserId: null,
        isOwnerView: true,
        userAgent: "A".repeat(2000) // longer than MAX_USER_AGENT_CHARS
      })
    ).resolves.toBeUndefined();
  });
});
