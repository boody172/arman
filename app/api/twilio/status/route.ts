import { NextRequest, NextResponse } from "next/server";
import { getBrandByPhoneNumber } from "@/lib/store";
import { estimateTwilioVoiceCost } from "@/lib/pricing-rates";
import { logUsage } from "@/lib/usage-log";

/**
 * Twilio's "Call status changes" webhook — configure this on the phone
 * number (Voice Configuration → Call status changes → POST) alongside the
 * main "A call comes in" webhook. Only used to log accurate call-minute
 * usage once a call finishes (Twilio includes CallDuration only when
 * CallStatus is "completed"); it has no effect on how the call itself is
 * handled, so it's safe to leave unconfigured if you don't need the
 * minutes-based cost figure in the usage report.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const to = String(form.get("To") || "");
  const callStatus = String(form.get("CallStatus") || "");
  const callDuration = Number(form.get("CallDuration") || 0);

  if (callStatus === "completed" && callDuration > 0) {
    const brand = await getBrandByPhoneNumber(to);
    if (brand) {
      logUsage({
        type: "twilio_voice",
        brandId: brand.id,
        seconds: callDuration,
        costUsd: estimateTwilioVoiceCost(callDuration),
      });
    }
  }

  return new NextResponse(null, { status: 204 });
}
