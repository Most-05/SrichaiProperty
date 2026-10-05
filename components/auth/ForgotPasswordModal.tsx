'use client';

import { SUPPORT_CONTACT } from '@/lib/constants'; // ช่องทางติดต่อทีมงาน

/**
 * หน้าต่าง "ลืมรหัสผ่าน" — แนะนำให้ติดต่อทีมงาน
 *
 * ระบบยังไม่มีการรีเซ็ตรหัสผ่านด้วยตัวเอง (ต้องมีระบบส่งอีเมลยืนยัน — วางแผนทำหลังนำเสนอ)
 * เดิมลิงก์ "ลืมรหัสผ่าน?" เป็น href="#" กดแล้วไม่ไปไหน (BUG-39) จึงเปลี่ยนเป็นหน้าต่างนี้
 * ข้อความตั้งใจไม่สัญญาว่าจะรีเซ็ตให้ได้ทันที บอกแค่ช่องทางขอความช่วยเหลือ
 */
interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[2rem] max-w-md w-full relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-extrabold text-slate-900">ลืมรหัสผ่าน?</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 cursor-pointer" aria-label="ปิด">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            ขณะนี้ระบบยังไม่รองรับการรีเซ็ตรหัสผ่านด้วยตัวเอง กรุณาติดต่อทีมงานพร้อมแจ้ง
            <span className="font-bold text-slate-800"> อีเมลที่ใช้สมัคร </span>
            ทีมงานจะยืนยันตัวตนและช่วยเหลือให้คุณกลับมาเข้าใช้งานได้
          </p>
          <ul className="space-y-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700">
            <li>อีเมล: <a href={`mailto:${SUPPORT_CONTACT.email}`} className="font-bold text-blue-700 hover:underline">{SUPPORT_CONTACT.email}</a></li>
            <li>โทร: <a href={`tel:${SUPPORT_CONTACT.phone.replace(/-/g, '')}`} className="font-bold text-blue-700 hover:underline">{SUPPORT_CONTACT.phone}</a></li>
            <li>LINE: <span className="font-bold text-slate-800">{SUPPORT_CONTACT.line}</span></li>
          </ul>
          <p className="text-xs text-slate-400">เพื่อความปลอดภัย ทีมงานจะไม่ขอรหัสผ่านเดิมของคุณ</p>
        </div>
        <div className="p-6 border-t border-slate-100 text-center">
          <button onClick={onClose} className="w-full sm:w-auto bg-slate-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 cursor-pointer">
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
