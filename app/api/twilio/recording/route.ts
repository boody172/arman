import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import twilio from "twilio";
import { getBrand, saveOrder } from "@/lib/store";
import { generateReply, transcribeRecording } from "@/lib/ai";
import { notifyNewOrder } from "@/lib/notify";
import { playText } from "@/lib/twilio-tts";
import { decodeCallState, encodeCallState, CallState } from "@/lib/call-state";
import { Order } from "@/lib/types";
import { estimateGptCost, estimateWhisperCost } from "@/lib/pricing-rates";
import { logUsage } from "@/lib/usage-log";

const { VoiceResponse } = twilio.twiml;
const MAX_TURNS = 12;
const MAX_EMPTY_RETRIES = 2;

function recordAgain(twimlResponse: InstanceType<typeof VoiceResponse>, state: CallState) {
  twimlResponse.record({
    action: `/api/twilio/recording?s=${encodeCallState(state)}`,
    method: "POST",
    maxLength: 25,
    timeout: 3,
    playBeep: false,
    trim: "trim-silence",
  });
}

/**
 * Handles one turn of the conversation: Twilio posts here after each
 * <Record>, we transcribe what the customer said, ask the LLM for a reply
 * (brand-aware), speak it back, and either keep listening or hang up.
 * Conversation state travels in the `s` query param — see lib/call-state.ts
 * for why (no shared memory between separate Vercel functions/requests).
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callerPhone = String(form.get("From") || "");
  const recordingUrl = String(form.get("RecordingUrl") || "");
  const recordingDuration = Number(form.get("RecordingDuration") || 0);

  const twimlResponse = new VoiceResponse();

  const encodedState = req.nextUrl.searchParams.get("s") || "";
  const state = decodeCallState(encodedState);
  const brand = state ? await getBrand(state.brandId) : undefined;

  if (!state || !brand) {
    twimlResponse.say(
      { language: "ar-AE" },
      "معلش حصل خطأ فني، حاول تتصل تاني."
    );
    twimlResponse.hangup();
    return xmlResponse(twimlResponse.toString());
  }

  if (!recordingUrl || recordingDuration < 1) {
    if (state.turns >= MAX_EMPTY_RETRIES) {
      playText(twimlResponse, brand.id, "معلش مسمعتش حاجة، هكلم حضرتك تاني بعدين. مع السلامة!");
      twimlResponse.hangup();
      return xmlResponse(twimlResponse.toString());
    }
    playText(twimlResponse, brand.id, "معلش مسمعتش حضرتك، ممكن تعيد تاني؟");
    recordAgain(twimlResponse, { ...state, turns: state.turns + 1 });
    return xmlResponse(twimlResponse.toString());
  }

  let userText = "";
  try {
    userText = await transcribeRecording(recordingUrl);
    logUsage({
      type: "whisper",
      brandId: brand.id,
      seconds: recordingDuration,
      costUsd: estimateWhisperCost(recordingDuration),
    });
  } catch (err) {
    console.error("Transcription failed:", err);
    userText = "";
  }

  if (!userText) {
    playText(twimlResponse, brand.id, "معلش مسمعتش حضرتك كويس، ممكن تقول تاني؟");
    recordAgain(twimlResponse, { ...state, turns: state.turns + 1 });
    return xmlResponse(twimlResponse.toString());
  }

  const result = await generateReply(brand, state.history, userText);

  logUsage({
    type: "gpt",
    brandId: brand.id,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    costUsd: estimateGptCost(result.promptTokens, result.completionTokens),
  });

  const updatedState: CallState = {
    brandId: brand.id,
    history: [
      ...state.history,
      { role: "user", content: userText },
      { role: "assistant", content: result.reply },
    ],
    turns: state.turns + 1,
  };

  if (result.order) {
    const order: Order = {
      id: nanoid(10),
      brandId: brand.id,
      callSid: String(form.get("CallSid") || ""),
      callerPhone,
      summary: result.order.summary,
      items: result.order.items,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    // Best-effort only — see lib/store.ts. Email is the reliable channel.
    await saveOrder(order);
    const sent = await notifyNewOrder(brand, order);
    order.status = sent ? "notified" : "new";
    await saveOrder(order);
  }

  playText(twimlResponse, brand.id, result.reply);

  const shouldHangUp = result.shouldEndCall || updatedState.turns >= MAX_TURNS;

  if (shouldHangUp) {
    twimlResponse.hangup();
  } else {
    recordAgain(twimlResponse, updatedState);
  }

  return xmlResponse(twimlResponse.toString());
}

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}
