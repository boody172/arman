import twilio from "twilio";
import { nanoid } from "nanoid";
import { getBrand, putTtsAudio } from "./store";
import { synthesizeSpeech } from "./ai";

const { VoiceResponse } = twilio.twiml;

function baseUrl() {
  return process.env.APP_BASE_URL || "http://localhost:3000";
}

/**
 * Synthesizes `text` for the given brand's voice and appends a <Play> to
 * the TwiML response. Falls back to Twilio's built-in Arabic <Say> if TTS
 * fails (missing/invalid API key, provider outage, ...) so a call never
 * just goes silent.
 */
export async function playText(
  twimlResponse: InstanceType<typeof VoiceResponse>,
  brandId: string,
  text: string,
  callSid: string,
  turn: number
) {
  try {
    const brand = await getBrand(brandId);
    if (!brand) throw new Error("brand missing");
    const { buffer, contentType } = await synthesizeSpeech(text, brand);
    const audioId = `${callSid}-${turn}-${nanoid(6)}`;
    putTtsAudio(audioId, buffer, contentType);
    twimlResponse.play(`${baseUrl()}/api/tts/${audioId}`);
  } catch {
    // Twilio's built-in <Say> voices have no Egyptian option; ar-AE is the
    // closest generic Arabic voice it offers for this last-resort fallback.
    twimlResponse.say({ language: "ar-AE" }, text);
  }
}
