"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { Order } from "@/lib/types";

export function OrdersFeed({ brandId }: { brandId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    try {
      const { orders } = await apiFetch(`/api/orders?brandId=${brandId}`);
      setOrders(orders);
    } catch {
      // silently ignore — token bar above already surfaces auth errors
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-white/50">
        لسه مفيش أوردرات. أول ما حد يتصل ويطلب هيظهر هنا لحظياً.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-sm text-white/50">
            <span dir="ltr">{order.callerPhone}</span>
            <span>{new Date(order.createdAt).toLocaleString("ar-EG")}</span>
          </div>
          <p className="mt-2 font-semibold">{order.summary}</p>
          <ul className="mt-1 list-inside list-disc text-sm text-white/70">
            {order.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <span
            className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
              order.status === "notified"
                ? "bg-primary/15 text-primary"
                : "bg-yellow-500/15 text-yellow-300"
            }`}
          >
            {order.status === "notified" ? "اتبعت بالإيميل" : "محتاج مراجعة"}
          </span>
        </div>
      ))}
    </div>
  );
}
