import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#05070a]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-xl font-extrabold">
          Sawty <span className="text-primary">صوتي</span>
        </span>
        <div className="hidden items-center gap-8 text-sm text-white/70 sm:flex">
          <a href="#how" className="hover:text-white">إزاي بيشتغل</a>
          <a href="#pricing" className="hover:text-white">الأسعار</a>
          <a href="#faq" className="hover:text-white">أسئلة شائعة</a>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-black hover:brightness-110"
        >
          لوحة التحكم
        </Link>
      </div>
    </nav>
  );
}
