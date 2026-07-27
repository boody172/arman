import { NextRequest, NextResponse } from "next/server";
import { getBrand } from "@/lib/store";
import { getKnowledgeText } from "@/lib/knowledge";
import { isAuthorized } from "@/lib/auth";

/**
 * Computes (and caches) the knowledge block the voice agent actually gets
 * for this brand — used by the dashboard preview pane. Kept as its own
 * endpoint because building it can involve fetching the brand's
 * website/social pages, which is too slow to do on every brand list/detail
 * fetch.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const brand = await getBrand(params.id);
  if (!brand) return NextResponse.json({ error: "not found" }, { status: 404 });

  const knowledgeText = await getKnowledgeText(brand);
  return NextResponse.json({ knowledgeText });
}
