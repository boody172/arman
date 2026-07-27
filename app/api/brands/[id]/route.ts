import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteBrand, getBrand, saveBrand } from "@/lib/store";
import { isAuthorized } from "@/lib/auth";

const brandUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  businessType: z.enum(["restaurant", "cafe", "shop", "service", "other"]).optional(),
  ownerEmail: z.string().email().optional(),
  notifyEmail: z.string().email().optional(),
  twilioPhoneNumber: z.string().optional(),
  menuText: z.string().optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  extraNotes: z.string().optional(),
  greeting: z.string().optional(),
  voiceId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const brand = await getBrand(params.id);
  if (!brand) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ brand });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const existing = await getBrand(params.id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const parsed = brandUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات غلط", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = {
    ...existing,
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  // Only persists to the in-memory layer (see lib/store.ts) — on Vercel
  // this edit is lost on the next cold start. Real edits to a live brand
  // belong in data/brands.ts.
  await saveBrand(updated);
  return NextResponse.json({ brand: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await deleteBrand(params.id);
  return NextResponse.json({ ok: true });
}
