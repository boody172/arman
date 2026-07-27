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

const emptyForm = {
  name: "",
  businessType: "restaurant" as BusinessType,
  ownerEmail: "",
  notifyEmail: "",
  twilioPhoneNumber: "",
  menuText: "",
  instagramUrl: "",
  facebookUrl: "",
  websiteUrl: "",
  extraNotes: "",
  greeting: "",
  voiceId: "",
  monthlyFeeEgp: "",
  twilioNumberMonthlyFeeUsd: "1.15",
};

export function BrandForm({ onCreated }: { onCreated: (brand: Brand) => void }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { brand } = await apiFetch("/api/brands", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          monthlyFeeEgp: Number(form.monthlyFeeEgp) || 0,
          twilioNumberMonthlyFeeUsd: Number(form.twilioNumberMonthlyFeeUsd) || 0,
        }),
      });
      onCreated(brand);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <h3 className="text-lg font-bold">براند/عميل جديد</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم البراند *">
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="input"
            placeholder="مطعم كذا"
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

        <Field label="إيميلك (بتستلم عليه الأوردرات) *">
          <input
            required
            type="email"
            value={form.ownerEmail}
            onChange={(e) => update("ownerEmail", e.target.value)}
            className="input"
            dir="ltr"
            placeholder="owner@example.com"
          />
        </Field>

        <Field label="رقم Twilio اللي اشتريته للبراند ده">
          <input
            value={form.twilioPhoneNumber}
            onChange={(e) => update("twilioPhoneNumber", e.target.value)}
            className="input"
            dir="ltr"
            placeholder="+1XXXXXXXXXX"
          />
        </Field>

        <Field label="لينك الانستجرام">
          <input
            value={form.instagramUrl}
            onChange={(e) => update("instagramUrl", e.target.value)}
            className="input"
            dir="ltr"
            placeholder="https://instagram.com/..."
          />
        </Field>

        <Field label="لينك الفيسبوك">
          <input
            value={form.facebookUrl}
            onChange={(e) => update("facebookUrl", e.target.value)}
            className="input"
            dir="ltr"
            placeholder="https://facebook.com/..."
          />
        </Field>

        <Field label="الموقع الشخصي (لو موجود)">
          <input
            value={form.websiteUrl}
            onChange={(e) => update("websiteUrl", e.target.value)}
            className="input"
            dir="ltr"
            placeholder="https://..."
          />
        </Field>

        <Field label="جملة الترحيب (اختياري)">
          <input
            value={form.greeting}
            onChange={(e) => update("greeting", e.target.value)}
            className="input"
            placeholder="أهلاً بيك في..."
          />
        </Field>

        <Field label="الاشتراك الشهري اللي بتاخده من العميل (جنيه)">
          <input
            type="number"
            min="0"
            value={form.monthlyFeeEgp}
            onChange={(e) => update("monthlyFeeEgp", e.target.value)}
            className="input"
            dir="ltr"
            placeholder="500"
          />
        </Field>

        <Field label="إيجار رقم Twilio الشهري (دولار)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.twilioNumberMonthlyFeeUsd}
            onChange={(e) => update("twilioNumberMonthlyFeeUsd", e.target.value)}
            className="input"
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="المنيو والأسعار (المصدر الأهم — الصق كل التفاصيل هنا)">
        <textarea
          value={form.menuText}
          onChange={(e) => update("menuText", e.target.value)}
          className="input min-h-[140px]"
          placeholder={"مثال:\nبيتزا مارجريتا - وسط 120ج - كبير 160ج\nكشري - صغير 30ج - وسط 45ج"}
        />
      </Field>

      <Field label="ملاحظات إضافية (مواعيد العمل، مناطق التوصيل، عروض...)">
        <textarea
          value={form.extraNotes}
          onChange={(e) => update("extraNotes", e.target.value)}
          className="input min-h-[100px]"
        />
      </Field>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        disabled={loading}
        className="rounded-lg bg-primary px-6 py-2 font-bold text-black hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "بيتحفظ ويتدرب..." : "احفظ ودرّب الـ Agent"}
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
