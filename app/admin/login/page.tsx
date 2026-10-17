/**
 * ==============================================================================
 * [SEARCH: ADMIN_LOGIN_PAGE] [AUTH: CREDENTIALS_SIGNIN] [UI: หน้าล็อกอินแอดมิน]
 * หน้าเข้าสู่ระบบสำหรับผู้ดูแลระบบ (Admin Portal Login Page)
 * ไฟล์: app/admin/login/page.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. ฟอร์มล็อกอินเฉพาะผู้ดูแลระบบ (Admin Role Only) ป้องกันไม่ให้สมาชิกทั่วไปเข้าถึง
 * 2. เรียกใช้งาน NextAuth `signIn('credentials')` เพื่อตรวจสอบอีเมลและรหัสผ่าน
 * 3. ตรวจสอบ Role ของบัญชีผ่าน `/api/auth/session` หากไม่ใช่ Admin ให้ปฏิเสธการเข้าถึงทันที
 * 4. นำทางผู้ใช้ไปยัง `/admin/dashboard` เมื่อเข้าสู่ระบบสำเร็จ
 * ==============================================================================
 */

'use client';

// นำเข้า React และ useState สำหรับจัดการสถานะของฟอร์ม (อีเมล, รหัสผ่าน, ข้อผิดพลาด, สถานะโหลด)
import React, { useState } from 'react';
// นำเข้าฟังก์ชัน signIn จาก next-auth/react เพื่อยืนยันตัวตนผ่าน Credentials Provider
import { signIn } from 'next-auth/react';
// นำเข้า useRouter สำหรับการเปลี่ยนเส้นทางหน้าเว็บ (Redirect) ฝั่ง Client
import { useRouter } from 'next/navigation';
// นำเข้าชุดไอคอนมาตรฐานจาก lucide-react ตามมาตรฐาน UI ของระบบ
import { ShieldCheck, AlertCircle, Loader2, Lock } from 'lucide-react';

/**
 * คอมโพเนนต์หน้าล็อกอินของผู้ดูแลระบบ (Admin Login Component)
 */
export default function AdminLoginPage() {
  // [STATE: อีเมลแอดมิน] เก็บข้อความอีเมลที่ผู้ใช้กรอก
  const [email, setEmail] = useState('');
  // [STATE: รหัสผ่านแอดมิน] เก็บรหัสผ่านที่ผู้ใช้กรอก
  const [password, setPassword] = useState('');
  // [STATE: ข้อความแจ้งเตือนข้อผิดพลาด] เช่น รหัสผ่านผิด, ไม่มีสิทธิ์แอดมิน, เซิร์ฟเวอร์ขัดข้อง
  const [errorMsg, setErrorMsg] = useState('');
  // [STATE: สถานะกำลังประมวลผลการล็อกอิน] ใช้ปิดการกดปุ่มซ้ำและแสดง Spinner
  const [loading, setLoading] = useState(false);
  // ตัวจัดการเปลี่ยนเส้นทางหน้าเว็บ
  const router = useRouter();

  /**
   * ฟังก์ชันจัดการการส่งฟอร์มเข้าสู่ระบบ (Submit Handler)
   * 1. ป้องกันการรีเฟรชหน้าเว็บ (e.preventDefault)
   * 2. ตรวจสอบข้อมูลล็อกอินผ่าน NextAuth Credentials
   * 3. ตรวจสอบสิทธิ์ Role ว่าเป็น 'admin' หรือไม่
   * 4. หากผ่าน ส่งต่อไปยัง /admin/dashboard
   */
  const handleLogin = async (e: React.FormEvent) => {
    // ระงับการ Reload หน้าเว็บตามพฤติกรรมดั้งเดิมของ Form Submit
    e.preventDefault();
    // ตั้งสถานะกำลังประมวลผลเพื่อแสดง Loading UI
    setLoading(true);
    // ล้างข้อความผิดพลาดเดิมก่อนเริ่มรอบใหม่
    setErrorMsg('');

    try {
      // เรียกใช้ NextAuth signIn ด้วยประเภท credentials (ปิดการ redirect อัตโนมัติเพื่อตรวจสอบ Role ด้วยตนเอง)
      const res = await signIn('credentials', {
        redirect: false, // ปิด auto redirect เพื่อดักจับ Error และตรวจสอบ Role ในบรรทัดถัดไป
        email,           // อีเมลที่กรอกในฟอร์ม
        password,        // รหัสผ่านที่กรอกในฟอร์ม
      });

      // หาก NextAuth แจ้งว่าเกิด Error (เช่น รหัสผ่านผิด หรือ ไม่พบผู้ใช้)
      if (res?.error) {
        setErrorMsg(res.error); // นำข้อความแจ้งเตือนมาแสดงบน UI
        setLoading(false);      // ปลดสถานะ Loading
        return;                 // หยุดการทำงานทันที
      }

      // ตรวจสอบว่าผู้ใช้ที่เพิ่งล็อกอินมีสิทธิ์เป็น admin หรือไม่
      // โดยดึงข้อมูล Session ล่าสุดจาก Endpoint /api/auth/session
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      // ตรวจสอบ Role ของผู้ใช้จาก Payload ของ Session
      if (session?.user?.role === 'admin') {
        // หากเป็น Admin จริง ให้เปลี่ยนเส้นทางไปยังหน้าแผงควบคุมหลัก
        router.push('/admin/dashboard');
      } else {
        // หาก Role ไม่ใช่ admin แสดงข้อความปฏิเสธการเข้าถึง
        setErrorMsg('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบผู้ดูแลระบบ (Admin Only)');
        setLoading(false); // ปลดสถานะ Loading
      }
    } catch {
      // ดักจับข้อผิดพลาดกรณีเน็ตหลุด หรือ API ล่ม
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setLoading(false); // ปลดสถานะ Loading
    }
  };

  return (
    // คอนเทนเนอร์หลักเต็มจอ โทนสีมืดเข้ม (slate-900) บ่งบอกถึงพื้นที่ความปลอดภัยสูงของระบบ
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-sm font-sans">
      {/* การ์ดสีขาวสำหรับกรอกข้อมูลล็อกอิน ตรงกลางหน้าจอ */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6 border border-slate-700/20">
        
        {/* ส่วนหัวของการ์ด: ไอคอนระบบความปลอดภัย, ชื่อระบบ และคำอธิบาย */}
        <div className="text-center space-y-2">
          {/* กล่องไอคอนระบบความปลอดภัย */}
          <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto border border-slate-200 shadow-xs">
            {/* ไอคอนโล่ป้องกันระบบความปลอดภัยตามมาตรฐาน Lucide */}
            <ShieldCheck className="w-6 h-6 text-slate-800 shrink-0" />
          </div>
          {/* ชื่อระบบหลัก */}
          <h1 className="text-xl font-black text-slate-900">Admin Portal Login</h1>
          {/* คำอธิบายสั้นๆ ของระบบแอดมิน */}
          <p className="text-xs text-slate-500">เข้าสู่ระบบผู้ดูแลระบบ SrichaiProperty</p>
        </div>

        {/* กล่องแสดงข้อความผิดพลาด (จะแสดงเมื่อมี errorMsg เท่านั้น) */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 font-bold text-xs rounded-xl flex items-center gap-2">
            {/* ไอคอนเตือนอันตรายสีแดงตามมาตรฐาน Lucide */}
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            {/* ข้อความ Error ที่ระบบส่งกลับมา */}
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ฟอร์มรับข้อมูลล็อกอิน (อีเมลและรหัสผ่าน) */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* ช่องกรอกอีเมลแอดมิน */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">อีเมลผู้ดูแลระบบ</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-bold" 
              placeholder="admin@srichaiproperty.com"
            />
          </div>

          {/* ช่องกรอกรหัสผ่านแอดมิน */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">รหัสผ่าน</label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-bold" 
              placeholder="••••••••"
            />
          </div>

          {/* ปุ่มกดส่งฟอร์มเพื่อเข้าสู่ระบบ */}
          <button 
            type="submit" 
            disabled={loading} // ปิดการกดซ้ำขณะกำลังตรวจสอบ
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl transition cursor-pointer text-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {/* แสดงไอคอนหมุนขณะกำลังส่งข้อมูล หรือข้อความปกติ */}
            {loading ? (
              <>
                {/* ไอคอนหมุนแสดงสถานะกำลังโหลดตามมาตรฐาน Lucide */}
                <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              'เข้าสู่ระบบ Admin'
            )}
          </button>
        </form>

        {/* แถบด้านล่างสุด แสดงข้อความแจ้งเตือนความปลอดภัย */}
        <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
          {/* ไอคอนแม่กุญแจความปลอดภัยตามมาตรฐาน Lucide */}
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {/* ข้อความกำชับการเข้าถึงเฉพาะแอดมิน */}
          <span>เข้าถึงได้เฉพาะผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น</span>
        </div>
      </div>
    </div>
  );
}

