"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { Brand } from "@/lib/types";
import { TokenBar } from "@/components/dashboard/token-bar";
import { BrandForm } from "@/components/dashboard/brand-form";
import { BrandList } from "@/components/dashboard/brand-list";

export default function DashboardPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { brands } = await apiFetch("/api/brands");
      setBrands(brands);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حصل خطأ");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold">لوحة التحكم</h1>
        <p className="mt-1 text-white/60">
          ضيف براند لكل عميل، درّب الـ Agent على بياناته، واربط رقم Twilio بتاعه.
        </p>
      </div>

      <TokenBar />

      <p className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
        الفورم ده مفيد للتجربة بس. على Vercel البراندات المتضافة هنا مش
        متضمنة في الكود، فهتتمسح مع أي إعادة نشر. أي عميل حقيقي محتاج يفضل
        موجود دايمًا — ابعت بياناته في الشات وهيتضاف لملف <code>data/brands.ts</code>
        {" "}ويترفع (Deploy) على طول.
      </p>

      {error && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
      )}

      <BrandForm onCreated={(b) => setBrands((prev) => [b, ...prev])} />

      <div className="space-y-3">
        <h2 className="text-lg font-bold">البراندات</h2>
        <BrandList brands={brands} />
      </div>
    </main>
  );
}
