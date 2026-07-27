import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getBrandByPhoneNumber, saveSession } from "@/lib/store";
import { playText } from "@/lib/twilio-tts";

const { VoiceResponse } = twilio.twiml;

/**
 * Entry point Twilio calls when a customer dials the number assigned to a
 * brand. Configure this URL (`{APP_BASE_URL}/api/twilio/voice`) as the
 * "A call comes in" webhook on the Twilio phone number, method POST.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callSid = String(form.get("CallSid") || "");
  const from = String(form.get("From") || "");
  const to = String(form.get("To") || "");

  const twimlResponse = new VoiceResponse();

  const brand = await getBrandByPhoneNumber(to);
  if (!brand) {
    twimlResponse.say(
      { language: "ar-AE" },
      "معلش، الرقم ده مش متظبط لحد النهارده. حاول تاني بعدين."
    );
    twimlResponse.hangup();
    return xmlResponse(twimlResponse.toString());
  }

  const greeting =
    brand.greeting ||
    `أهلاً بيك في ${brand.name}! معاك المساعد، تحب تطلب إيه النهارده؟`;

  await saveSession({
    callSid,
    brandId: brand.id,
    callerPhone: from,
    history: [{ role: "assistant", content: greeting }],
    turns: 0,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await playText(twimlResponse, brand.id, greeting, callSid, 0);

  twimlResponse.record({
    action: `/api/twilio/recording?brandId=${brand.id}`,
    method: "POST",
    maxLength: 25,
    timeout: 3,
    playBeep: false,
    trim: "trim-silence",
  });

  return xmlResponse(twimlResponse.toString());
}

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}
