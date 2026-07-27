import { Brand, BrandInput } from "./types";

const FETCH_TIMEOUT_MS = 8000;

async function fetchPageText(url: string): Promise<string> {
  if (!url) return "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Some sites (incl. Instagram/Facebook) block non-browser user agents
        // or require login to render real content. This is a best-effort
        // fetch of whatever public HTML/meta tags are reachable — it is not
        // a scraper and will legitimately return little/nothing for pages
        // that require auth. Brand owners should also fill in the notes
        // field so the agent isn't solely dependent on this.
        "User-Agent":
          "Mozilla/5.0 (compatible; SawtyBot/1.0; +https://sawty.ai/bot)",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return "";
    const html = await res.text();

    const metaDescription = [
      ...html.matchAll(
        /<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/gi
      ),
    ].map((m) => m[1]);

    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";

    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    return [title, ...metaDescription, bodyText].filter(Boolean).join("\n");
  } catch {
    return "";
  }
}

/**
 * Compiles every source a brand owner provides (menu text, website,
 * Instagram/Facebook links, free-form notes) into one plain-text knowledge
 * block that gets injected into the voice agent's system prompt for that
 * brand.
 */
export async function buildKnowledgeText(input: BrandInput): Promise<string> {
  const [websiteText, instagramText, facebookText] = await Promise.all([
    fetchPageText(input.websiteUrl),
    fetchPageText(input.instagramUrl),
    fetchPageText(input.facebookUrl),
  ]);

  const sections = [
    `اسم البراند: ${input.name}`,
    `نوع النشاط: ${input.businessType}`,
    input.menuText && `المنيو والأسعار (المصدر الأساسي والأدق):\n${input.menuText}`,
    input.extraNotes && `ملاحظات إضافية من صاحب البراند:\n${input.extraNotes}`,
    websiteText && `محتوى من الموقع الرسمي (${input.websiteUrl}):\n${websiteText}`,
    instagramText &&
      `محتوى من صفحة الانستجرام (${input.instagramUrl}):\n${instagramText}`,
    facebookText &&
      `محتوى من صفحة الفيسبوك (${input.facebookUrl}):\n${facebookText}`,
  ].filter(Boolean);

  return sections.join("\n\n---\n\n");
}

const knowledgeCache = new Map<string, { text: string; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Same as buildKnowledgeText, but cached per (brand id + updatedAt) so a
 * multi-turn phone call doesn't re-fetch the brand's website/social pages
 * on every single reply. The cache key includes updatedAt, so editing a
 * brand naturally invalidates it.
 */
export async function getKnowledgeText(brand: Brand): Promise<string> {
  const key = `${brand.id}:${brand.updatedAt}`;
  const cached = knowledgeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.text;

  const text = await buildKnowledgeText(brand);
  knowledgeCache.set(key, { text, expiresAt: Date.now() + CACHE_TTL_MS });
  return text;
}
