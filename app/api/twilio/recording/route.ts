import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import twilio from "twilio";
import {
  endSession,
  getBrand,
  getSession,
  saveOrder,
  saveSession,
} from "@/lib/store";
import { generateReply, transcribeRecording } from "@/lib/ai";
import { notifyNewOrder } from "@/lib/notify";
import { playText } from "@/lib/twilio-tts";
import { Order } from "@/lib/types";

const { VoiceResponse } = twilio.twiml;
const MAX_TURNS = 12;
const MAX_EMPTY_RETRIES = 2;

/**
 * Handles one turn of the conversation: Twilio posts here after each
 * <Record>, we transcribe what the customer said, ask the LLM for a reply
 * (brand-aware), speak it back, and either keep listening or hang up.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callSid = String(form.get("CallSid") || "");
  const recordingUrl = String(form.get("RecordingUrl") || "");
  const recordingDuration = Number(form.get("RecordingDuration") || 0);
  const brandId = req.nextUrl.searchParams.get("brandId") || "";

  const twimlResponse = new VoiceResponse();

  const [brand, session] = await Promise.all([
    getBrand(brandId),
    getSession(callSid),
  ]);

  if (!brand || !session) {
    twimlResponse.say(
      { language: "ar-AE" },
      "معلش حصل خطأ فني، حاول تتصل تاني."
    );
    twimlResponse.hangup();
    return xmlResponse(twimlResponse.toString());
  }

  if (!recordingUrl || recordingDuration < 1) {
    if (session.turns >= MAX_EMPTY_RETRIES) {
      await playText(
        twimlResponse,
        brand.id,
        "معلش مسمعتش حاجة، هكلم حضرتك تاني بعدين. مع السلامة!",
        callSid,
        session.turns + 1
      );
      twimlResponse.hangup();
      await endSession(callSid);
      return xmlResponse(twimlResponse.toString());
    }

    await playText(
      twimlResponse,
      brand.id,
      "معلش مسمعتش حضرتك، ممكن تعيد تاني؟",
      callSid,
      session.turns + 1
    );
    twimlResponse.record({
      action: `/api/twilio/recording?brandId=${brand.id}`,
      method: "POST",
      maxLength: 25,
      timeout: 3,
      playBeep: false,
      trim: "trim-silence",
    });
    session.turns += 1;
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
    return xmlResponse(twimlResponse.toString());
  }

  let userText = "";
  try {
    userText = await transcribeRecording(recordingUrl);
  } catch {
    userText = "";
  }

  if (!userText) {
    await playText(
      twimlResponse,
      brand.id,
      "معلش مسمعتش حضرتك كويس، ممكن تقول تاني؟",
      callSid,
      session.turns + 1
    );
    twimlResponse.record({
      action: `/api/twilio/recording?brandId=${brand.id}`,
      method: "POST",
      maxLength: 25,
      timeout: 3,
      playBeep: false,
      trim: "trim-silence",
    });
    session.turns += 1;
    await saveSession(session);
    return xmlResponse(twimlResponse.toString());
  }

  const result = await generateReply(brand, session.history, userText);

  session.history.push({ role: "user", content: userText });
  session.history.push({ role: "assistant", content: result.reply });
  session.turns += 1;
  session.updatedAt = new Date().toISOString();

  if (result.order) {
    const order: Order = {
      id: nanoid(10),
      brandId: brand.id,
      callSid,
      callerPhone: session.callerPhone,
      summary: result.order.summary,
      items: result.order.items,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    await saveOrder(order);
    const sent = await notifyNewOrder(brand, order);
    order.status = sent ? "notified" : "new";
    await saveOrder(order);
  }

  await playText(twimlResponse, brand.id, result.reply, callSid, session.turns);

  const shouldHangUp = result.shouldEndCall || session.turns >= MAX_TURNS;

  if (shouldHangUp) {
    twimlResponse.hangup();
    session.status = "completed";
    await saveSession(session);
    await endSession(callSid);
  } else {
    twimlResponse.record({
      action: `/api/twilio/recording?brandId=${brand.id}`,
      method: "POST",
      maxLength: 25,
      timeout: 3,
      playBeep: false,
      trim: "trim-silence",
    });
    await saveSession(session);
  }

  return xmlResponse(twimlResponse.toString());
}

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}
