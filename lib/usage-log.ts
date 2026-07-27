/**
 * Structured usage events, one console.log line per event, prefixed so
 * they're easy to grep out of Vercel's runtime logs later (Vercel Functions
 * → Logs, or the get_runtime_logs API/MCP tool) for the daily cost/profit
 * report. This is intentionally NOT written to a database — see
 * lib/store.ts for why persistent state is hard on Vercel; logs are the
 * pragmatic place to durably-enough emit per-call events without adding
 * new infrastructure.
 *
 * Each event already carries an estimated USD cost (via lib/pricing-rates)
 * so the aggregation step doesn't need to re-derive pricing logic — it just
 * sums `costUsd` per brand.
 */

export const USAGE_LOG_PREFIX = "SAWTY_USAGE";

export type UsageEvent =
  | {
      type: "whisper";
      brandId: string;
      seconds: number;
      costUsd: number;
    }
  | {
      type: "gpt";
      brandId: string;
      promptTokens: number;
      completionTokens: number;
      costUsd: number;
    }
  | {
      type: "tts";
      brandId: string;
      provider: "openai" | "elevenlabs";
      characters: number;
      costUsd: number;
    }
  | {
      type: "twilio_voice";
      brandId: string;
      seconds: number;
      costUsd: number;
    };

export function logUsage(event: UsageEvent): void {
  console.log(
    `${USAGE_LOG_PREFIX} ${JSON.stringify({ ...event, at: new Date().toISOString() })}`
  );
}
