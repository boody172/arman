import { NextRequest, NextResponse } from "next/server";
import { getTtsAudio } from "@/lib/store";

/**
 * Twilio's <Play> verb fetches audio from a public URL — this endpoint
 * serves the short-lived MP3s generated per conversation turn.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const audio = getTtsAudio(params.id);
  if (!audio) {
    return NextResponse.json({ error: "expired or not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(audio.buffer), {
    headers: {
      "Content-Type": audio.contentType,
      "Cache-Control": "no-store",
    },
  });
}
