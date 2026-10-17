'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, ChevronRight, Lock } from 'lucide-react';

export default function AgentPrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>นโยบายความเป็นส่วนตัวนายหน้า (Agent PDPA)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">ข้อกำหนดการคุ้มครองข้อมูลส่วนบุคคลสำหรับนายหน้าและผู้ฝากขาย</p>
        </div>
        <Link href="/agent/profile" className="px-3.5 py-1.5 bg-slate-100 font-bold text-xs rounded-xl text-slate-700 hover:bg-slate-200 transition flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>โปรไฟล์นายหน้า</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5 text-xs text-slate-700 leading-relaxed">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 font-medium flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>ขอบเขต:</strong> ศรีชัย พร็อพเพอร์ตี้ คุ้มครองข้อมูลเอกสาร KYC, เบอร์โทรศัพท์, LINE ID และประวัติการชำระเงินแพ็กเกจ Verified PRO (฿299 / เดือน หรือ ฿2,690 / ปี) ของนายหน้าทุกท่าน
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-black text-slate-900 border-b border-slate-100 pb-1 text-sm">1. ข้อมูลส่วนบุคคลที่จัดเก็บ</h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>เอกสาร KYC:</strong> ภาพถ่ายบัตรประชาชน/ใบอนุญาต เพื่ออนุมัติสิทธิ์นายหน้า</li>
            <li><strong>ข้อมูลติดต่อสาธารณะ:</strong> เบอร์โทรศัพท์ และ LINE ID สำหรับสร้างปุ่มคุย LINE และปุ่มโทรในหน้าประกาศบ้าน</li>
            <li><strong>ประวัติการเงิน:</strong> สลิปโอนเงิน PromptPay ในระบบสำหรับการอนุมัติสิทธิ์ Verified PRO</li>
          </ul>

          <h3 className="font-black text-slate-900 border-b border-slate-100 pb-1 text-sm">2. สิทธิการจัดการข้อมูลและลบบัญชี</h3>
          <p className="text-slate-600">
            นายหน้าสามารถแก้ไขข้อมูลส่วนตัว หรือกดลบบัญชีผู้ใช้ถาวร (Delete Account) ได้เองผ่านหน้าโปรไฟล์ (<Link href="/agent/profile" className="text-amber-600 font-bold hover:underline">/agent/profile</Link>)
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
          <span>ศรีชัย พร็อพเพอร์ตี้ (Srichai Property) • สงขลา - หาดใหญ่</span>
          <Link href="/agent/terms" className="text-amber-600 font-bold hover:underline flex items-center gap-1">
            <span>ข้อกำหนดนายหน้า (Agent Terms)</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
