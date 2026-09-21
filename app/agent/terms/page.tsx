'use client';

import React from 'react';
import Link from 'next/link';

export default function AgentTermsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ข้อกำหนดการใช้งานนายหน้า (Agent Terms)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">เงื่อนไขการลงประกาศขายบ้าน และการสมัครแพ็กเกจ Verified PRO</p>
        </div>
        <Link href="/agent/profile" className="px-3.5 py-1.5 bg-slate-100 font-bold text-xs rounded-xl text-slate-700 hover:bg-slate-200 transition">
          ← โปรไฟล์นายหน้า
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5 text-xs text-slate-700 leading-relaxed">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 font-medium flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>การยอมรับเงื่อนไข:</strong> นายหน้าผู้ฝากขายยอมรับข้อตกลงเรื่องความถูกต้องของประกาศขายบ้านและการชำระเงิน PRO
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-black text-slate-900 border-b pb-1 text-sm">1. ความถูกต้องของประกาศ</h3>
          <p className="text-slate-600">นายหน้าต้องระบุรายละเอียด ราคา ตำแหน่งที่ตั้ง และรูปภาพบ้านที่เป็นจริง ไม่อนุญาตให้ลงข้อมูลเท็จหรือบิดเบือน</p>

          <h3 className="font-black text-slate-900 border-b pb-1 text-sm">2. แพ็กเกจ Verified PRO (฿599/เดือน)</h3>
          <p className="text-slate-600">เมื่อโอนเงินและแนบสลิปผ่านระบบ แล้วได้รับการอนุมัติจากแอดมิน จะได้รับโควต้าลงประกาศไม่จำกัดเป็นเวลา 30 วัน</p>
        </div>

        <div className="pt-4 border-t flex justify-between items-center text-[11px] text-slate-400">
          <span>ศรีชัย พร็อพเพอร์ตี้ (Srichai Property) • สงขลา - หาดใหญ่</span>
          <Link href="/agent/privacy" className="text-amber-600 font-bold hover:underline flex items-center gap-1">
            <span>นโยบายความเป็นส่วนตัว (Agent Privacy)</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
