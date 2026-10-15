'use client';

import React, { useState } from 'react';
import Link from 'next/link'; 
import { signIn } from 'next-auth/react'; // ฟังก์ชันจากไลบรารี NextAuth ใช้สำหรับส่งข้อมูลไปตรวจสอบว่า login ผ่านหรือไม่
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'; // ปุ่ม login ผ่าน Google/Facebook ฯลฯ (แยกเป็นคอมโพเนนต์ย่อย)
import AgentPortalBanner from '@/components/auth/AgentPortalBanner'; // แบนเนอร์แนะนำ/ลิงก์สำหรับ "นายหน้า" (agent)
import PolicyModal from '@/components/auth/PolicyModal'; // popup แสดงเนื้อหานโยบายความเป็นส่วนตัว/ข้อตกลงการใช้งาน
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal'; // หน้าต่าง "ลืมรหัสผ่าน" (แนะนำติดต่อทีมงาน)
import CookieBanner from '@/components/auth/CookieBanner'; // แถบแจ้งเตือนขอความยินยอมใช้คุกกี้ (ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล)
import { AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// คอมโพเนนต์หลักของหน้า "เข้าสู่ระบบ" — React จะ render ฟังก์ชันนี้เป็นหน้าเว็บ
export default function LoginPage() {
  // ===== ตัวแปรสถานะ (State) ของหน้านี้ =====
  
  const [passwordVisible, setPasswordVisible] = useState(false); // true = แสดงรหัสผ่านเป็นตัวอักษร, false = ซ่อนเป็นจุด (•••)
  const [isLoading, setIsLoading] = useState(false); // true ระหว่างที่กำลังส่งข้อมูลไปตรวจสอบ login (ใช้ปิดปุ่ม/แสดง spinner กันคนกดซ้ำ)
  const [email, setEmail] = useState(''); // เก็บค่าที่ผู้ใช้พิมพ์ในช่องอีเมล
  const [password, setPassword] = useState(''); // เก็บค่าที่ผู้ใช้พิมพ์ในช่องรหัสผ่าน
  const [errorMsg, setErrorMsg] = useState(''); // ข้อความ error ที่จะโชว์เมื่อ login ไม่สำเร็จ (ว่าง = ไม่มี error)
  const [policyType, setPolicyType] = useState<'privacy' | 'terms' | null>(null); // ระบุว่าจะเปิด popup นโยบายแบบไหน (privacy/terms) หรือไม่เปิดเลย (null)
  const [forgotOpen, setForgotOpen] = useState(false); // เปิดหน้าต่าง "ลืมรหัสผ่าน"
  const [showCookies, setShowCookies] = useState(true); // true = ยังโชว์แถบแจ้งเตือนคุกกี้อยู่ (เริ่มต้นให้โชว์ก่อนเสมอ)

    const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. เรียกใช้ NextAuth signIn เพื่อตรวจสอบอีเมล/รหัสผ่าน
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      // 2. ถ้าล็อกอินไม่ผ่าน (รหัสผิด, เมลไม่มี) จะได้ error กลับมา
      if (res?.error) {
        setErrorMsg(res.error);
        setIsLoading(false);
      } else {
        // 3. ถ้าล็อกอินผ่าน ดึงข้อมูล Session ปัจจุบันเพื่อดูว่าคนนี้เป็น Role อะไร
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;

        // 4. สั่งพาผู้ใช้ไปหน้าเว็บที่ถูกต้องตาม Role
        if (role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (role === 'agent') {
          window.location.href = '/agent/home';
        } else {
          // ถ้าถูกพามาจากหน้าที่ต้อง login (proxy.ts ใส่ ?callbackUrl= มาให้) → กลับไปหน้าเดิม
          // รับเฉพาะ path ภายในเว็บเรา (ขึ้นต้น / แต่ไม่ใช่ // หรือ /\) กันการพาไปเว็บอื่น
          const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
          const isSafe = !!callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') && !callbackUrl.startsWith('/\\');
          window.location.href = isSafe ? callbackUrl : '/';
        }
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อระบบความปลอดภัยหลังบ้านได้");
      setIsLoading(false);
    }
  };

  // ===== ส่วนแสดงผล (UI) ของหน้า =====
  // โครงสร้างหลักแบ่งเป็น 2 คอลัมน์ (flex-row) บนจอใหญ่ (lg ขึ้นไป):
  //   - ซ้าย: รูปภาพพื้นหลัง + ข้อความต้อนรับ (โชว์เฉพาะจอใหญ่)
  //   - ขวา: ฟอร์มกรอกอีเมล/รหัสผ่านสำหรับ login
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative font-sans bg-white text-slate-800">
      {/* ===== ฝั่งซ้าย: แบนเนอร์รูปภาพต้อนรับ (ซ่อนบนมือถือ, โชว์เฉพาะจอ lg ขึ้นไป) ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden h-screen sticky top-0">
        {/* รูปพื้นหลัง ปรับให้ค่อยๆ ซูมเข้าเล็กน้อยเวลาชี้เมาส์ (hover:scale-105) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-[10000ms] hover:scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
        />
        {/* เลเยอร์ไล่สีดำทับรูป เพื่อให้ตัวหนังสือสีขาวด้านบนอ่านง่ายขึ้น */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* กล่องข้อความ/โลโก้ ลอยอยู่เหนือรูปภาพ (z-10) */}
        <div className="relative z-10 p-12 text-white max-w-xl">
          <Link href="/" className="flex items-center gap-2 mb-8 cursor-pointer hover:opacity-90 transition">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-600/30">S</div>
            <span className="text-3xl font-extrabold tracking-tight">Srichai<span className="text-blue-400">Property</span></span>
          </Link>
          <h1 className="text-5xl font-extrabold mb-6 leading-[1.2]">ยินดีต้อนรับสู่<br />Srichai Property</h1>
          <p className="text-slate-300 text-lg font-light leading-relaxed">เข้าถึงบ้านเดี่ยว คอนโด และที่ดินคุณภาพ พร้อมบริการที่ปรึกษาอสังหาริมทรัพย์ระดับมืออาชีพในหาดใหญ่และสงขลา</p>
        </div>
      </div>

      {/* ===== ฝั่งขวา: ฟอร์มเข้าสู่ระบบ (โชว์เสมอทั้งมือถือและจอใหญ่) ===== */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8 bg-white min-h-screen overflow-y-auto">
        <div className="w-full max-w-sm my-auto py-8">

          {/* โลโก้ขนาดเล็ก โชว์เฉพาะตอนจอเล็ก (มือถือ) เพราะฝั่งซ้ายที่มีโลโก้ใหญ่ถูกซ่อนไปแล้ว */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center cursor-pointer">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">S</div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">Srichai<span className="text-blue-600">Property</span></span>
          </Link>

          {/* หัวข้อ + คำอธิบายสั้นๆ ของฟอร์ม */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">เข้าสู่ระบบ</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">กรุณากรอกอีเมลและรหัสผ่านของคุณเพื่อดำเนินการต่อ</p>
          </div>

          {/* ปุ่ม login ผ่านบริการภายนอก (เช่น Google) — โค้ดจริงอยู่ในคอมโพเนนต์แยกต่างหาก */}
          <SocialLoginButtons />

          {/* เส้นคั่น พร้อมข้อความ "หรือใช้อีเมลของคุณ" ตรงกลาง เพื่อแยกโซน social login กับฟอร์มกรอกเอง */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 font-bold uppercase tracking-widest text-[9px]">หรือใช้อีเมลของคุณ</span>
            </div>
          </div>

          {/* ฟอร์มหลัก: เมื่อกด submit (กดปุ่มหรือกด Enter) จะเรียก handleLogin ด้านบน */}
          <form onSubmit={handleLogin} className="space-y-4.5">
            {/* กล่องแสดง error — โชว์ก็ต่อเมื่อ errorMsg ไม่ใช่ค่าว่าง */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ช่องกรอกอีเมล */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">อีเมล (Email)</label>
              <div className="relative">
                {/* ไอคอนอีเมล วางลอยทับซ้ายของช่อง input */}
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email} // ค่าปัจจุบันมาจาก state (controlled input) เพื่อให้ React ควบคุมค่าตลอดเวลา
                  onChange={(e) => setEmail(e.target.value)} // ทุกครั้งที่พิมพ์ จะอัปเดต state email ทันที
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800 text-xs"
                  required // บังคับกรอกก่อน submit ได้ (ตรวจสอบเบื้องต้นโดยเบราว์เซอร์)
                />
              </div>
            </div>

            {/* ช่องกรอกรหัสผ่าน */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">รหัสผ่าน (Password)</label>
              <div className="relative">
                {/* ไอคอนกุญแจล็อก วางลอยทับซ้ายของช่อง input */}
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={passwordVisible ? "text" : "password"} // สลับชนิด input ตาม state: "text" = เห็นตัวอักษรจริง, "password" = ซ่อนเป็นจุด
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800 text-xs"
                  required
                />
                {/* ปุ่มไอคอนตา — กดเพื่อสลับโชว์/ซ่อนรหัสผ่าน (ไม่ใช่ปุ่ม submit จึงต้องกำหนด type="button") */}
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-blue-600 transition cursor-pointer"
                >
                  {passwordVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* ลิงก์ "ลืมรหัสผ่าน?" → หน้าต่างแนะนำติดต่อทีมงาน (BUG-39)
                เอาช่อง "จำฉันไว้" ออก: ไม่เคยผูกการทำงาน และระบบจำการล็อกอินไว้ 8 ชม. อยู่แล้ว (session maxAge) */}
            <div className="flex items-center justify-end">
              <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0">ลืมรหัสผ่าน?</button>
            </div>

            {/* ปุ่มกด submit ฟอร์ม — ปิดการกด (disabled) ระหว่าง isLoading เพื่อกันผู้ใช้กดซ้ำหลายครั้ง */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-blue-700/10 active:scale-[0.98] mt-3 text-sm cursor-pointer"
            >
              {isLoading ? (
                // ระหว่างรอผลลัพธ์ login จะเปลี่ยนข้อความบนปุ่มพร้อมเอฟเฟกต์กระพริบ (animate-pulse)
                <span className="flex items-center justify-center gap-2 animate-pulse">กำลังเข้าสู่ระบบ...</span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </form>

          {/* ลิงก์ไปหน้าสมัครสมาชิก สำหรับคนที่ยังไม่มีบัญชี */}
          <p className="mt-6 text-center text-slate-600 font-medium text-xs">
            ยังไม่มีบัญชี? <Link href="/register" className="text-blue-600 font-bold hover:underline ml-1">สมัครสมาชิกฟรี</Link>
          </p>

          {/* แบนเนอร์แนะนำระบบ/ช่องทางสำหรับนายหน้าอสังหาริมทรัพย์ */}
          <AgentPortalBanner />

          {/* แถวลิงก์ท้ายฟอร์ม: เปิด popup นโยบายความเป็นส่วนตัว/ข้อตกลงการใช้งาน หรือกลับไปหน้า Home */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="flex justify-center gap-5 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex-wrap">
              <button onClick={() => setPolicyType('privacy')} className="hover:text-blue-600 transition cursor-pointer bg-transparent border-none">Privacy Policy</button>
              <button onClick={() => setPolicyType('terms')} className="hover:text-blue-600 transition cursor-pointer bg-transparent border-none">Terms of Use</button>
              <Link href="/home" className="hover:text-blue-600 transition italic">Home &rarr;</Link>
            </div>
          </div>
        </div>
      </div>

      {/* แถบแจ้งเตือนขอความยินยอมใช้คุกกี้ — ควบคุมด้วย state showCookies, กดยอมรับแล้วจะซ่อนไปและไม่โชว์อีก (จนกว่าจะรีเฟรช/กลับมาใหม่) */}
      <CookieBanner
        show={showCookies}
        onAccept={() => setShowCookies(false)}
        onOpenPrivacy={() => setPolicyType('privacy')}
      />

      {/* Popup แสดงเนื้อหานโยบาย — ถูกควบคุมด้วย state policyType (null = ปิดอยู่, 'privacy'/'terms' = เปิดและโชว์เนื้อหาตามประเภท) */}
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <PolicyModal
        policyType={policyType}
        onClose={() => setPolicyType(null)}
      />
    </div>
  );
}
