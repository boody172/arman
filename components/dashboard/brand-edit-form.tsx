"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { Brand, BusinessType } from "@/lib/types";

const businessTypes: { value: BusinessType; label: string }[] = [
  { value: "restaurant", label: "مطعم" },
  { value: "cafe", label: "كافيه" },
  { value: "shop", label: "متجر" },
  { value: "service", label: "خدمة" },
  { value: "other", label: "تاني" },
];

export function BrandEditForm({
  brand,
  onUpdated,
}: {
  brand: Brand;
  onUpdated: (brand: Brand) => void;
}) {
  const [form, setForm] = useState({
    name: brand.name,
    businessType: brand.businessType,
    ownerEmail: brand.ownerEmail,
    notifyEmail: brand.notifyEmail,
    twilioPhoneNumber: brand.twilioPhoneNumber,
    menuText: brand.menuText,
    instagramUrl: brand.instagramUrl,
    facebookUrl: brand.facebookUrl,
    websiteUrl: brand.websiteUrl,
    extraNotes: brand.extraNotes,
    greeting: brand.greeting,
    voiceId: brand.voiceId,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { brand: updated } = await apiFetch(`/api/brands/${brand.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      onUpdated(updated);
      setMessage("اتحفظ وأعاد تدريب الـ Agent على البيانات الجديدة ✓");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <h3 className="text-lg font-bold">بيانات البراند</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم البراند">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="نوع النشاط">
          <select
            value={form.businessType}
            onChange={(e) => update("businessType", e.target.value)}
            className="input"
          >
            {businessTypes.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="إيميل استلام الأوردرات">
          <input
            value={form.notifyEmail}
            onChange={(e) => update("notifyEmail", e.target.value)}
            className="input"
            dir="ltr"
          />
        </Field>

        <Field label="رقم Twilio">
          <input
            value={form.twilioPhoneNumber}
            onChange={(e) => update("twilioPhoneNumber", e.target.value)}
            className="input"
            dir="ltr"
          />
        </Field>

        <Field label="لينك الانستجرام">
          <input
            value={form.instagramUrl}
            onChange={(e) => update("instagramUrl", e.target.value)}
            className="input"
            dir="ltr"
          />
        </Field>

        <Field label="لينك الفيسبوك">
          <input
            value={form.facebookUrl}
            onChange={(e) => update("facebookUrl", e.target.value)}
            className="input"
            dir="ltr"
          />
        </Field>

        <Field label="الموقع">
          <input
            value={form.websiteUrl}
            onChange={(e) => update("websiteUrl", e.target.value)}
            className="input"
            dir="ltr"
          />
        </Field>

        <Field label="جملة الترحيب">
          <input
            value={form.greeting}
            onChange={(e) => update("greeting", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <Field label="المنيو والأسعار">
        <textarea
          value={form.menuText}
          onChange={(e) => update("menuText", e.target.value)}
          className="input min-h-[160px]"
        />
      </Field>

      <Field label="ملاحظات إضافية">
        <textarea
          value={form.extraNotes}
          onChange={(e) => update("extraNotes", e.target.value)}
          className="input min-h-[100px]"
        />
      </Field>

      {message && <p className="text-sm text-white/70">{message}</p>}

      <button
        disabled={loading}
        className="rounded-lg bg-primary px-6 py-2 font-bold text-black hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "بيتحفظ..." : "احفظ وأعد التدريب"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-white/70">{label}</span>
      {children}
    </label>
  );
}
