import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const steps = [
  {
    title: "١. ضيف بيانات عميلك",
    desc: "الصق المنيو والأسعار، لينك الانستجرام والفيسبوك، أو الموقع الشخصي. مش محتاج تكتب سكريبت — الـ Agent بيذاكر كل التفاصيل بنفسه.",
  },
  {
    title: "٢. اربط رقم Twilio",
    desc: "هتاخد رقم أمريكي من Twilio (فيه باقة تجريبية مجانية)، وتحطه في لوحة التحكم في دقيقة.",
  },
  {
    title: "٣. العميل يتصل ويتكلم عادي",
    desc: "الـ Agent بيرد بعامية مصرية طبيعية، يفهم طلب العميل، يأكده، ويبعته لصاحب البراند فورًا — من غير ما حد يحس إنه بيكلم AI.",
  },
];

const faqs = [
  {
    q: "هل ده مجاني فعلاً؟",
    a: "Twilio بيديك رقم أمريكي تجريبي مجاني، بس فيه حسابات تانية مطلوبة عشان الـ Agent يفهم ويرد بصوت طبيعي (تحويل الصوت لنص، والذكاء الاصطناعي، وتوليد الصوت) — دي بتشتغل بنظام الدفع حسب الاستخدام وغالبًا فيها رصيد تجريبي مجاني في البداية. احنا بنوضحلك كل التكاليف المتوقعة في صفحة الإعداد قبل ما تبدأ.",
  },
  {
    q: "هل لازم أعرف برمجة؟",
    a: "لأ. كل اللي محتاجه إنك تضيف بيانات البراند من لوحة التحكم وتربط رقم Twilio — ده كله من غير كود.",
  },
  {
    q: "الـ Agent بياخد الأوردر إزاي؟",
    a: "بيتحاور مع العميل، يأكد الطلب، وبعدين يبعته أوتوماتيك بالإيميل لصاحب البراند، وبيظهر كمان في لوحة التحكم لحظياً.",
  },
];

export default function Page() {
  return (
    <main>
      <Navbar />

      <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            إيجنت صوتي بعامية مصرية
          </span>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
            رد على عملائك <span className="text-primary">صوتيًا</span>، ٢٤ ساعة،
            بعامية مصرية زي البني آدمين
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
            ديه خدمة بتقدمها لعملائك (مطاعم، متاجر، أي براند). تديله رقم تليفون
            وحيداً، والـ Agent بياخد التفاصيل من المنيو وصفحاته، ويرد على
            التليفونات، وياخد الأوردرات، ويبعتهالك جاهزة.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-full bg-primary px-8 py-3 font-bold text-black hover:brightness-110"
            >
              ابدأ دلوقتي
            </Link>
            <a
              href="#how"
              className="rounded-full border border-white/15 px-8 py-3 font-bold text-white hover:bg-white/5"
            >
              إزاي بيشتغل؟
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-extrabold">إزاي بيشتغل</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="font-bold text-primary">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold">الشفافية في التكلفة</h2>
          <p className="mt-4 text-white/60">
            المنصة نفسها من غير مصاريف، لكن التشغيل بيعتمد على خدمات خارجية
            بتحسب حسب الاستخدام (المكالمات، تحويل الصوت لنص، الذكاء الاصطناعي،
            توليد الصوت). معظمها بيديك رصيد تجريبي مجاني كافي تجرب بيه كذا
            عميل قبل ما تدفع أي حاجة.
          </p>
          <div className="mt-8 grid gap-4 text-right sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h4 className="font-bold">Twilio (الرقم والمكالمات)</h4>
              <p className="mt-2 text-sm text-white/60">
                رقم أمريكي تجريبي مجاني + رصيد مجاني بيغطي عدد مكالمات محدود.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h4 className="font-bold">الذكاء الاصطناعي والصوت</h4>
              <p className="mt-2 text-sm text-white/60">
                بتدفع على قد استخدامك بس (بالسنت مش بالدولارات لكل مكالمة).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-extrabold">أسئلة شائعة</h2>
          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h4 className="font-bold">{f.q}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
