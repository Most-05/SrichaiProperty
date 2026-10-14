/**
 * ==============================================================================
 * [SEARCH: ROOT_LAYOUT] [UI: โครงสร้างหลักของระบบ HTML] [STYLE: GLOBAL_FONT_TYPOGRAPHY]
 * โครงร่างหลักระดับรากของเว็บไซต์ (Root Application Layout)
 * /app/layout.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. กำหนดฟอนต์ Google Fonts ภาษาไทย (Prompt) และภาษาอังกฤษ (Geist)
 * 2. กำหนด Metadata สำหรับ SEO และ OpenGraph
 * 3. ห่อหุ้มลูกทั้งหมดด้วย Providers (Session, Global State, Toast, Network Monitor)
 * ==============================================================================
 */

import type { Metadata } from "next";
import { Prompt, Geist } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "Srichai Property - ค้นหาบ้านและอสังหาริมทรัพย์",
  description: "ศูนย์รวมอสังหาริมทรัพย์คุณภาพ พร้อมระบบจองนัดหมายเข้าชมและแชทกับนายหน้าโดยตรง",
};

import { Providers } from "@/app/providers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={cn("h-full", "antialiased", prompt.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-800">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
