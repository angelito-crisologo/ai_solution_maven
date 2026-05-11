import type { AIPayload } from "./types";

/**
 * Anthropic's documented rule of thumb: roughly 4 characters per token for
 * English text. The real token count depends on the tokenizer, but the
 * heuristic is within ~10% for JSON-shaped content and avoids an API call
 * per build. The token-budget tests use this estimate; if a fixture ever
 * comes within 10% of the 10k ceiling we tighten caps, not the estimator.
 */
const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count for an AIPayload by serializing it the same way it
 * will be sent to Claude (compact JSON, no pretty-print) and dividing by
 * the chars-per-token heuristic.
 *
 * Pure, synchronous, no I/O.
 */
export function estimatePayloadTokens(payload: AIPayload): number {
  const serialized = JSON.stringify(payload);
  return Math.ceil(serialized.length / CHARS_PER_TOKEN);
}
