import twilio from "twilio";

const { VoiceResponse } = twilio.twiml;

function baseUrl() {
  return process.env.APP_BASE_URL || "http://localhost:3000";
}

/**
 * Appends a <Play> pointing at /api/tts with the brand + text encoded in
 * the query string, instead of pre-synthesizing and caching audio here.
 * Synthesis happens lazily, inside the single request Twilio makes to
 * fetch that URL — see app/api/tts/route.ts. That keeps this stateless
 * (no dependency on a previous request's server memory, which Vercel does
 * not share across separate function invocations).
 */
export function playText(
  twimlResponse: InstanceType<typeof VoiceResponse>,
  brandId: string,
  text: string
) {
  const url = new URL("/api/tts", baseUrl());
  url.searchParams.set("b", brandId);
  url.searchParams.set("t", text);
  twimlResponse.play(url.toString());
}
