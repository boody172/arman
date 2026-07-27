"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";
import { Brand } from "@/lib/types";
import { TokenBar } from "@/components/dashboard/token-bar";
import { BrandEditForm } from "@/components/dashboard/brand-edit-form";
import { OrdersFeed } from "@/components/dashboard/orders-feed";

export default function BrandDetailPage({
  params,
}: {
  params: { brandId: string };
}) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [knowledgeText, setKnowledgeText] = useState("");
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    apiFetch(`/api/brands/${params.brandId}`)
      .then(({ brand }) => setBrand(brand))
      .catch((err) => setError(err.message));
  }, [params.brandId]);

  async function loadKnowledge() {
    setKnowledgeLoading(true);
    try {
      const { knowledgeText } = await apiFetch(
        `/api/brands/${params.brandId}/knowledge`
      );
      setKnowledgeText(knowledgeText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setKnowledgeLoading(false);
    }
  }

  const webhookUrl = `${origin}/api/twilio/voice`;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <Link href="/dashboard" className="text-sm text-white/50 hover:text-primary">
        ← رجوع لكل البراندات
      </Link>

      <TokenBar />

      {error && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
      )}

      {!brand ? (
        <p className="text-white/50">بيتحمّل...</p>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-extrabold">{brand.name}</h1>
            <p className="mt-1 text-white/60">
              آخر تحديث: {new Date(brand.updatedAt).toLocaleString("ar-EG")}
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="font-bold text-primary">خطوات ربط رقم Twilio بالبراند ده</h3>
            <ol className="list-inside list-decimal space-y-2 text-sm text-white/80">
              <li>سجّل حساب Twilio مجاني وهياديك رقم أمريكي تجريبي.</li>
              <li>من Twilio Console: Phone Numbers → اختار الرقم → Voice Configuration.</li>
              <li>
                في خانة &quot;A call comes in&quot; اختار Webhook والصق اللينك ده (POST):
              </li>
            </ol>
            <code
              dir="ltr"
              className="block break-all rounded-lg bg-black/50 p-3 text-sm text-primary"
            >
              {webhookUrl}
            </code>
            <p className="text-sm text-white/60">
              وبعدين انسخ نفس رقم Twilio وحطه في حقل &quot;رقم Twilio&quot; تحت واحفظ.
            </p>
          </div>

          <BrandEditForm brand={brand} onUpdated={setBrand} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">بيانات دُرّب عليها الـ Agent (معاينة)</h2>
              <button
                onClick={loadKnowledge}
                disabled={knowledgeLoading}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-50"
              >
                {knowledgeLoading ? "بيتحمّل..." : "اعرض/حدّث المعاينة"}
              </button>
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/60">
              {knowledgeText || "دوس على \"اعرض/حدّث المعاينة\" عشان تشوف اللي الـ Agent شايفه."}
            </pre>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold">الأوردرات</h2>
            <OrdersFeed brandId={brand.id} />
          </div>
        </>
      )}
    </main>
  );
}
