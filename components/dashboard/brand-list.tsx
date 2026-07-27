"use client";

import Link from "next/link";
import { Brand } from "@/lib/types";

export function BrandList({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-white/50">
        لسه معملتش ولا براند. ضيف أول عميل من الفورم فوق.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          href={`/dashboard/${brand.id}`}
          className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/60 hover:bg-white/10"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold">{brand.name}</h4>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
              {brand.businessType}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/50" dir="ltr">
            {brand.twilioPhoneNumber || "لسه محتاج تربط رقم Twilio"}
          </p>
        </Link>
      ))}
    </div>
  );
}
