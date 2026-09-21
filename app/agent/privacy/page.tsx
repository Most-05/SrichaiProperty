'use client';
import Link from 'next/link';

export default function AgentPrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            นโยบายความเป็นส่วนตัวนายหน้า (Agent PDPA)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">ข้อกำหนดการคุ้มครองข้อมูลส่วนบุคคลสำหรับนายหน้าและผู้ฝากขาย</p>
        </div>
        <Link href="/agent/profile" className="px-3.5 py-1.5 bg-slate-100 font-bold text-xs rounded-xl text-slate-700 hover:bg-slate-200 transition">
          ← โปรไฟล์นายหน้า
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5 text-xs text-slate-700 leading-relaxed">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 font-medium flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <strong>ขอบเขต:</strong> ศรีชัย พร็อพเพอร์ตี้ คุ้มครองข้อมูลเอกสาร KYC, เบอร์โทรศัพท์, LINE ID และประวัติการชำระเงิน PRO ฿599 ของนายหน้าทุกท่าน
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-black text-slate-900 border-b pb-1 text-sm">1. ข้อมูลส่วนบุคคลที่จัดเก็บ</h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>เอกสาร KYC:</strong> ภาพถ่ายบัตรประชาชน/ใบอนุญาต เพื่ออนุมัติสิทธิ์นายหน้า</li>
            <li><strong>ข้อมูลติดต่อสาธารณะ:</strong> เบอร์โทรศัพท์ และ LINE ID สำหรับสร้างปุ่มคุย LINE และปุ่มโทรในหน้าประกาศบ้าน</li>
            <li><strong>ประวัติการเงิน:</strong> สลิปโอนเงิน PromptPay ในระบบสำหรับการอนุมัติสิทธิ์ Verified PRO</li>
          </ul>

          <h3 className="font-black text-slate-900 border-b pb-1 text-sm">2. สิทธิการจัดการข้อมูลและลบบัญชี</h3>
          <p className="text-slate-600">
            นายหน้าสามารถแก้ไขข้อมูลส่วนตัว หรือกดลบบัญชีผู้ใช้ถาวร (Delete Account) ได้เองผ่านหน้าโปรไฟล์ (<Link href="/agent/profile" className="text-amber-600 font-bold">/agent/profile</Link>)
          </p>
        </div>

        <div className="pt-4 border-t flex justify-between items-center text-[11px] text-slate-400">
          <span>ศรีชัย พร็อพเพอร์ตี้ (Srichai Property) • สงขลา - หาดใหญ่</span>
          <Link href="/agent/terms" className="text-amber-600 font-bold hover:underline flex items-center gap-1">
            <span>ข้อกำหนดนายหน้า (Agent Terms)</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
