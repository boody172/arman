/**
 * Approximate provider pricing, used only to estimate cost per call for the
 * usage/profit report. These are NOT fetched live from any provider — they
 * are hand-entered snapshots and WILL drift out of date. Check your actual
 * OpenAI / Twilio / ElevenLabs billing dashboards periodically and update
 * the numbers below; treat report figures as estimates, not invoices.
 *
 * All USD unless noted.
 */
export const PRICING_RATES = {
  openai: {
    // Whisper transcription, per minute of audio.
    whisperPerMinute: 0.006,
    // gpt-4o-mini chat completions, per 1M tokens.
    gptInputPer1M: 0.15,
    gptOutputPer1M: 0.6,
    // tts-1, per 1M characters of input text.
    ttsPer1MChars: 15,
  },
  elevenlabs: {
    // ElevenLabs bills in plan-specific credits, not a flat $/character —
    // this is a rough blended estimate for a mid-tier plan. Replace with
    // your actual plan's $/character if you know it.
    estimatedPer1MChars: 30,
  },
  twilio: {
    // Inbound US voice, per minute. Varies by number type/region.
    voicePerMinute: 0.0085,
  },
} as const;

export function estimateWhisperCost(seconds: number): number {
  return (seconds / 60) * PRICING_RATES.openai.whisperPerMinute;
}

export function estimateGptCost(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1_000_000) * PRICING_RATES.openai.gptInputPer1M +
    (completionTokens / 1_000_000) * PRICING_RATES.openai.gptOutputPer1M
  );
}

export function estimateTtsCost(characters: number, provider: "openai" | "elevenlabs"): number {
  const rate =
    provider === "elevenlabs"
      ? PRICING_RATES.elevenlabs.estimatedPer1MChars
      : PRICING_RATES.openai.ttsPer1MChars;
  return (characters / 1_000_000) * rate;
}

export function estimateTwilioVoiceCost(seconds: number): number {
  return (seconds / 60) * PRICING_RATES.twilio.voicePerMinute;
}
