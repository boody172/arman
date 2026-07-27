import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { listBrands, saveBrand } from "@/lib/store";
import { isAuthorized } from "@/lib/auth";
import { Brand } from "@/lib/types";

const brandInputSchema = z.object({
  name: z.string().min(1),
  businessType: z.enum(["restaurant", "cafe", "shop", "service", "other"]),
  ownerEmail: z.string().email(),
  notifyEmail: z.string().email().or(z.literal("")).optional(),
  twilioPhoneNumber: z.string().optional().default(""),
  menuText: z.string().optional().default(""),
  instagramUrl: z.string().optional().default(""),
  facebookUrl: z.string().optional().default(""),
  websiteUrl: z.string().optional().default(""),
  extraNotes: z.string().optional().default(""),
  greeting: z.string().optional().default(""),
  voiceId: z.string().optional().default(""),
  monthlyFeeEgp: z.number().min(0).optional().default(0),
  twilioNumberMonthlyFeeUsd: z.number().min(0).optional().default(1.15),
});

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const brands = await listBrands();
  return NextResponse.json({ brands });
}

/**
 * Creates a brand in the in-memory layer only (see lib/store.ts). Handy for
 * trying the dashboard out locally, but on Vercel this does NOT persist
 * across cold starts — real clients must be added to data/brands.ts and
 * deployed.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = brandInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات ناقصة أو غلط", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = {
    ...parsed.data,
    notifyEmail: parsed.data.notifyEmail || parsed.data.ownerEmail,
  };

  const now = new Date().toISOString();

  const brand: Brand = {
    ...input,
    id: nanoid(10),
    createdAt: now,
    updatedAt: now,
  };

  await saveBrand(brand);
  return NextResponse.json({ brand }, { status: 201 });
}
