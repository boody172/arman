import { NextRequest, NextResponse } from "next/server";
import { listOrdersForBrand } from "@/lib/store";
import { isAuthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.json({ error: "brandId required" }, { status: 400 });
  }
  const orders = await listOrdersForBrand(brandId);
  return NextResponse.json({ orders });
}
