'use client';

import { signOut } from 'next-auth/react'; // ใช้ออกจากระบบเมื่อกดปุ่มด้านล่าง

export default function PendingAgentGate() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl space-y-6">
        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto text-slate-950 shadow-md shadow-amber-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-black">บัญชีอยู่ระหว่างการตรวจสอบ</h1>
        <p className="text-slate-500 text-xs">ทีมงานจะใช้เวลาตรวจสอบ KYC 1-2 วันทำการ เพื่อความปลอดภัยของระบบ เมนูอื่น ๆ จะเปิดใช้งานทันทีที่บัญชีของคุณได้รับการอนุมัติ</p>
        <button onClick={() => signOut({ callbackUrl: '/login/agent' })} className="w-full bg-slate-900 text-white font-extrabold py-3.5 rounded-xl">ออกจากระบบ</button>
      </div>
    </div>
  );
}
