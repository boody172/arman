import { Brand, CallSession, Order } from "./types";

/**
 * In-memory store for the MVP. Good enough for local dev and a single
 * long-running server process (e.g. `next start` on one instance).
 *
 * NOT durable across serverless cold starts / multiple instances — before
 * putting this in front of real paying customers, swap the bodies of these
 * functions for calls to a real database (Vercel Postgres, Supabase, etc.)
 * and keep the same function signatures so nothing else has to change.
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

// ---- Brands ----

export async function listBrands(): Promise<Brand[]> {
  return Array.from(store.brands.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getBrand(id: string): Promise<Brand | undefined> {
  return store.brands.get(id);
}

export async function getBrandByPhoneNumber(
  phoneNumber: string
): Promise<Brand | undefined> {
  const normalized = phoneNumber.replace(/[\s-]/g, "");
  return Array.from(store.brands.values()).find(
    (b) => b.twilioPhoneNumber.replace(/[\s-]/g, "") === normalized
  );
}

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
