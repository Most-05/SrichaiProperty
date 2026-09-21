import Link from 'next/link'; // ใช้ลิงก์ไปหน้าเข้าสู่ระบบสำหรับนายหน้า

export default function AgentPortalBanner() {
  return (
    <div className="mt-8 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
      <span className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
        <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        สำหรับนายหน้า (Agent Portal)
      </span>
      <p className="text-[11px] text-slate-500 mb-3">
        คุณต้องการลงประกาศอสังหาริมทรัพย์และจัดการผู้สนใจซื้อใช่หรือไม่?
      </p>
      <div className="flex gap-2 w-full">
        <Link 
          href="/login/agent" 
          className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
        >
          เข้าสู่ระบบนายหน้า
        </Link>
        <Link 
          href="/register/agent" 
          className="flex-1 text-center bg-white hover:bg-slate-50 text-emerald-700 font-bold py-2 rounded-xl text-xs border border-emerald-200 transition cursor-pointer"
        >
          สมัครเป็นนายหน้า
        </Link>
      </div>
    </div>
  );
}
