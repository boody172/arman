import { Brand, CallSession, Order } from "./types";
import { brands as committedBrands } from "@/data/brands";

/**
 * Brands come from two places:
 *  - `data/brands.ts`: committed to git, the durable source of truth for
 *    every real client on the live deployment (survives serverless cold
 *    starts because it's bundled code, not runtime state).
 *  - an in-memory Map: brands created through the dashboard form during
 *    local development. Handy for trying the flow out, but NOT durable on
 *    Vercel — a cold start loses them. Production brands belong in
 *    data/brands.ts instead.
 *
 * Sessions/orders/tts audio are inherently short-lived runtime state (one
 * phone call, a few minutes), so plain in-memory is fine for those even in
 * production — order delivery to the brand owner happens over email
 * (lib/notify.ts) independent of this store, so it doesn't depend on the
 * order surviving a cold start.
 */

interface StoreShape {
  brands: Map<string, Brand>;
  sessions: Map<string, CallSession>;
  orders: Map<string, Order>;
  ttsAudio: Map<string, { buffer: Buffer; contentType: string; expiresAt: number }>;
}

const globalForStore = globalThis as unknown as { __sawtyStore?: StoreShape };

const store: StoreShape =
  globalForStore.__sawtyStore ??
  (globalForStore.__sawtyStore = {
    brands: new Map(),
    sessions: new Map(),
    orders: new Map(),
    ttsAudio: new Map(),
  });

function allBrands(): Brand[] {
  const merged = new Map<string, Brand>();
  for (const brand of committedBrands) merged.set(brand.id, brand);
  for (const brand of store.brands.values()) merged.set(brand.id, brand);
  return Array.from(merged.values());
}

// ---- Brands ----

export async function listBrands(): Promise<Brand[]> {
  return allBrands().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBrand(id: string): Promise<Brand | undefined> {
  return store.brands.get(id) ?? committedBrands.find((b) => b.id === id);
}

export async function getBrandByPhoneNumber(
  phoneNumber: string
): Promise<Brand | undefined> {
  const normalized = phoneNumber.replace(/[\s-]/g, "");
  return allBrands().find(
    (b) => b.twilioPhoneNumber.replace(/[\s-]/g, "") === normalized
  );
}

/**
 * Saves to the in-memory layer only — see the module doc comment. This is
 * what the dashboard's create/edit forms call; it's fine for local dev but
 * won't persist on Vercel. Real clients go through data/brands.ts.
 */
export async function saveBrand(brand: Brand): Promise<Brand> {
  store.brands.set(brand.id, brand);
  return brand;
}

export async function deleteBrand(id: string): Promise<void> {
  store.brands.delete(id);
}

// ---- Call sessions (one per in-progress phone call) ----

export async function getSession(callSid: string): Promise<CallSession | undefined> {
  return store.sessions.get(callSid);
}

export async function saveSession(session: CallSession): Promise<CallSession> {
  store.sessions.set(session.callSid, session);
  return session;
}

export async function endSession(callSid: string): Promise<void> {
  store.sessions.delete(callSid);
}

// ---- Orders ----

export async function saveOrder(order: Order): Promise<Order> {
  store.orders.set(order.id, order);
  return order;
}

export async function listOrdersForBrand(brandId: string): Promise<Order[]> {
  return Array.from(store.orders.values())
    .filter((o) => o.brandId === brandId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---- Generated TTS audio, served back to Twilio via a short-lived URL ----

export function putTtsAudio(
  id: string,
  buffer: Buffer,
  contentType: string,
  ttlMs = 5 * 60 * 1000
): void {
  store.ttsAudio.set(id, { buffer, contentType, expiresAt: Date.now() + ttlMs });
  // Best-effort cleanup of stale entries so the map doesn't grow forever.
  for (const [key, value] of store.ttsAudio) {
    if (value.expiresAt < Date.now()) store.ttsAudio.delete(key);
  }
}

export function getTtsAudio(
  id: string
): { buffer: Buffer; contentType: string } | undefined {
  const entry = store.ttsAudio.get(id);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    store.ttsAudio.delete(id);
    return undefined;
  }
  return entry;
}
