import { Brand } from "@/lib/types";

/**
 * Source of truth for every client brand running on the live deployment.
 *
 * Vercel's serverless functions are stateless (no shared disk/memory across
 * invocations or cold starts), so brands created only through the dashboard
 * form would silently disappear in production. This file is the fix: it's
 * a normal committed source file, so it bundles into every deployment and
 * survives cold starts like any other code.
 *
 * To add a real client: append a Brand object below, commit, and push (or
 * ask Claude to do it — send the brand's name, menu/prices, social links,
 * and owner email, and it edits this file and redeploys for you).
 */
export const brands: Brand[] = [];
