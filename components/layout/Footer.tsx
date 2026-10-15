/**
 * ==============================================================================
 * [SEARCH: SITE_FOOTER] [UI: ฟุตเตอร์ท้ายเว็บไซต์] [STYLE: FOOTER_DARK_THEME]
 * คอมโพเนนต์ Footer ท้ายเว็บไซต์ (Footer Component)
 * /components/layout/Footer.tsx
 * ==============================================================================
 * วัตถุประสงค์หลัก:
 * 1. แสดงโลโก้ คำอธิบายแบรนด์ สรุปวัตถุประสงค์ของโครงงานระบบบริหารจัดการอสังหาริมทรัพย์
 * 2. แสดงลิงก์นำทางด่วน (Quick Links) ไปยังหน้าค้นหาบ้าน, สมัครนายหน้า, เข้าสู่ระบบ
 * 3. แสดงข้อมูลการติดต่อ (ที่อยู่, อีเมล, เบอร์โทรศัพท์)
 * 4. แสดงลิขสิทธิ์ประจำปี (&copy; 2026) และลิงก์นโยบายความเป็นส่วนตัว (PDPA) / ข้อกำหนดการใช้งาน
 * ==============================================================================
 */

"use client";

import Link from "next/link";
import { useSession } from "next-auth/react"; // ใช้ตรวจสอบบทบาทผู้ใช้เพื่อปรับลิงก์ที่แสดงในฟุตเตอร์
import { MapPin, Mail, Phone, ShieldCheck, FileText } from "lucide-react";

export default function Footer() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string | null } | undefined)?.role;

  return (
    // footer ท้ายเว็บ ใช้พื้นหลังสีเข้ม (bg-slate-900) และตัวอักษรสีเทา (text-slate-300)
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* ส่วนที่ 1: ข้อมูลแบรนด์และรายละเอียดโครงงาน (Brand Column) */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                Srichai<span className="text-blue-500">Property</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-md">
              Srichai Property — แพลตฟอร์มศูนย์รวมบ้านเดี่ยว คอนโดมิเนียม และอสังหาริมทรัพย์คุณภาพในหาดใหญ่และสงขลา พร้อมทีมงานนายหน้ามืออาชีพดูแลและให้คำปรึกษาทุกขั้นตอน
            </p>
          </div>

          {/* ส่วนที่ 2: เมนูด่วน (Quick Navigation Links) */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm">เมนูหลัก</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="hover:text-blue-400 transition">
                  ค้นหาบ้าน
                </Link>
              </li>
              {!session && (
                <li>
                  <Link href="/register/agent" className="hover:text-blue-400 transition">
                    สมัครเป็นนายหน้า
                  </Link>
                </li>
              )}
              {!session ? (
                <>
                  <li>
                    <Link href="/login" className="hover:text-blue-400 transition">
                      เข้าสู่ระบบ (ลูกค้า)
                    </Link>
                  </li>
                  <li>
                    <Link href="/login/agent" className="hover:text-blue-400 transition">
                      เข้าสู่ระบบ (นายหน้า)
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href={role === "agent" ? "/agent" : role === "admin" ? "/admin" : "/profile"}
                    className="hover:text-blue-400 transition"
                  >
                    บัญชีของฉัน
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* ส่วนที่ 3: ช่องทางการติดต่อ (Contact Info) */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm">ติดต่อเรา</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                <a
                  href="https://maps.google.com/?q=108+ถนนปุณณกัณฑ์+หาดใหญ่+สงขลา"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition"
                >
                  108 ถ.ปุณณกัณฑ์ ต.คอหงส์ อ.หาดใหญ่ จ.สงขลา 90110
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-slate-500" />
                <a href="mailto:contact@srichaiproperty.com" className="hover:text-blue-400 transition">
                  contact@srichaiproperty.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-slate-500" />
                <a href="tel:074288888" className="hover:text-blue-400 transition">
                  074-288-888, 081-234-5678
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} บริษัท ศรีชัย พร็อพเพอร์ตี้ จำกัด (Srichai Property Co., Ltd.) สงวนลิขสิทธิ์.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-medium">
            <Link href="/privacy-policy" className="hover:text-blue-400 transition flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              นโยบายความเป็นส่วนตัว (PDPA)
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/terms" className="hover:text-blue-400 transition flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              ข้อกำหนดการใช้งาน (Terms)
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
