/**
 * Compute USD cost of a single Anthropic Claude Haiku 4.5 call from token
 * counts on the API response. Prices are constants in code (not in a DB
 * pricing table) because pricing changes are rare and a code constant is
 * simpler to reason about — when Anthropic updates pricing, bump these
 * values in one commit.
 *
 * Source: https://www.anthropic.com/pricing (Claude Haiku 4.5, USD per 1M tokens).
 *  - Input:        $1.00
 *  - Output:       $5.00
 *  - Cache read:   $0.10
 *  - Cache write:  $1.25  (5m TTL ephemeral cache)
 */

const HAIKU_PRICING_PER_1M_TOKENS = {
  input: 1.0,
  output: 5.0,
  cacheRead: 0.1,
  cacheWrite: 1.25
} as const;

export const HAIKU_MODEL_ID = "claude-haiku-4-5-20251001";

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

export function computeCostUsd(usage: TokenUsage): number {
  const inputCost =
    (usage.inputTokens / 1_000_000) * HAIKU_PRICING_PER_1M_TOKENS.input;
  const outputCost =
    (usage.outputTokens / 1_000_000) * HAIKU_PRICING_PER_1M_TOKENS.output;
  const cacheReadCost =
    (usage.cacheReadTokens / 1_000_000) * HAIKU_PRICING_PER_1M_TOKENS.cacheRead;
  const cacheWriteCost =
    (usage.cacheWriteTokens / 1_000_000) * HAIKU_PRICING_PER_1M_TOKENS.cacheWrite;

  const total = inputCost + outputCost + cacheReadCost + cacheWriteCost;
  // Round to 6 decimal places — matches numeric(10,6) on ai_usage_log.cost_usd.
  return Math.round(total * 1_000_000) / 1_000_000;
}

/**
 * Pull token usage from an Anthropic /v1/messages response shape. Tolerates
 * missing fields (older or newer API responses) by defaulting to 0.
 */
export function extractTokenUsage(usage: unknown): TokenUsage {
  if (typeof usage !== "object" || usage === null) {
    return {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0
    };
  }
  const u = usage as Record<string, unknown>;
  const num = (key: string): number => {
    const v = u[key];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };
  return {
    inputTokens: num("input_tokens"),
    outputTokens: num("output_tokens"),
    cacheReadTokens: num("cache_read_input_tokens"),
    cacheWriteTokens: num("cache_creation_input_tokens")
  };
}
