import { Brand, Order } from "./types";

/**
 * Emails a new order to the brand owner. If RESEND_API_KEY isn't configured
 * this is a no-op (the order still lives in the dashboard's order feed as a
 * fallback delivery channel).
 */
export async function notifyNewOrder(brand: Brand, order: Order): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const itemsHtml = order.items.map((item) => `<li>${item}</li>`).join("");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: brand.notifyEmail || brand.ownerEmail,
      subject: `طلب جديد من ${brand.name} 📞`,
      html: `
        <div dir="rtl" style="font-family: sans-serif;">
          <h2>طلب جديد عن طريق الـ Voice Agent</h2>
          <p><strong>البراند:</strong> ${brand.name}</p>
          <p><strong>رقم العميل:</strong> ${order.callerPhone}</p>
          <p><strong>ملخص الطلب:</strong> ${order.summary}</p>
          <ul>${itemsHtml}</ul>
          <p style="color:#666;font-size:12px">تم الإرسال أوتوماتيك من مكالمة صوتية.</p>
        </div>
      `,
    }),
  });

  return res.ok;
}
