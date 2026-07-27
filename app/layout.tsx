import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "Sawty — إيجنت صوتي بيتكلم عربي مصري لعملائك",
  description:
    "خلي عميلك يكلم إيجنت صوتي مدرّب على بيانات براندك (منيو، أسعار، صفحاتك) وياخد الأوردر ويبعته لك أوتوماتيك — على رقم أمريكي من Twilio.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className="font-arabic antialiased">{children}</body>
    </html>
  );
}
