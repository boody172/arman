import { NextRequest, NextResponse } from "next/server";
import { getBrand } from "@/lib/store";
import { synthesizeSpeech } from "@/lib/ai";

/**
 * Twilio's <Play> verb fetches audio from a public URL — this is that URL.
 * Everything needed to (re)generate the audio (brand id, text) is passed
 * in via query params rather than looked up from a server-side cache, so
 * this works regardless of which serverless instance handles the request.
 */
export async function GET(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get("b") || "";
  const text = req.nextUrl.searchParams.get("t") || "";

  const brand = await getBrand(brandId);
  if (!brand || !text) {
    return NextResponse.json({ error: "missing brand or text" }, { status: 400 });
  }

  try {
    const { buffer, contentType } = await synthesizeSpeech(text, brand);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // Twilio's <Play> just gets a failed fetch either way, but this keeps
    // the failure visible and specific in Vercel's function logs instead
    // of a generic unhandled-exception trace.
    console.error("TTS synthesis failed:", err);
    return NextResponse.json({ error: "tts synthesis failed" }, { status: 502 });
  }
}
