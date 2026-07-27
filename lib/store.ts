import { Brand, Order } from "./types";
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
 * Orders are also kept in-memory here, purely for the dashboard's live
 * feed. On Vercel this is genuinely best-effort (each API route is its own
 * serverless function with its own memory, so a request to /api/orders has
 * no guaranteed visibility into an order an entirely different function
 * instance just wrote) — don't rely on it. The one reliable delivery
 * channel is the order email sent at write time (lib/notify.ts), which
 * doesn't depend on this store at all.
 *
 * In-flight call state (conversation history for an active phone call) is
 * NOT kept here — see lib/call-state.ts for why, and how it's threaded
 * through Twilio's callback URL instead.
 */

interface StoreShape {
  brands: Map<string, Brand>;
  orders: Map<string, Order>;
}

const globalForStore = globalThis as unknown as { __sawtyStore?: StoreShape };

const store: StoreShape =
  globalForStore.__sawtyStore ??
  (globalForStore.__sawtyStore = {
    brands: new Map(),
    orders: new Map(),
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
