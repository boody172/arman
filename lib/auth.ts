import { NextRequest } from "next/server";

/**
 * Minimal single-operator auth for the MVP: one shared admin token protects
 * the dashboard API. Fine for one person (or a tiny team) managing client
 * brands; swap for real per-user auth before onboarding other operators.
 */
export function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.DASHBOARD_ADMIN_TOKEN;
  if (!expected) return true; // no token configured yet -> allow (local dev)
  const provided = req.headers.get("x-admin-token");
  return provided === expected;
}
