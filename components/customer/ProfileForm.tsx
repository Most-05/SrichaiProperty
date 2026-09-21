'use client';

/**
 * ==============================================================================
 * ฟอร์มจัดการข้อมูลส่วนตัว ความปลอดภัย และศูนย์ PDPA (Profile Form Component)
 * /components/customer/ProfileForm.tsx
 * ==============================================================================
 * วัตถุประสงค์หลัก:
 * 1. ออกแบบตามมาตรฐาน UI/UX มืออาชีพ (Professional Web Standards)
 * 2. ใช้ SVG Icons สไตล์มินิมอลทั้งหมด (หลีกเลี่ยงการใช้ Unicode Emojis หลากสี)
 * 3. จัดเลย์เอาต์ 3 ส่วนชัดเจนในหน้าเดียว:
 *    - ข้อมูลส่วนบุคคล (General Profile)
 *    - ความปลอดภัยและรหัสผ่าน (Security & Audit Log)
 *    - ศูนย์ความเป็นส่วนตัวและสิทธิ PDPA (Privacy & PDPA Center)
 * ==============================================================================
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { toast } from '@/components/ui/toast';

/** Props สำหรับ ProfileForm Component */
interface ProfileFormProps {
  firstName: string;                                   // ชื่อจริง
  setFirstName: (val: string) => void;                // ฟังก์ชันอัปเดตชื่อจริง
  lastName: string;                                    // นามสกุล
  setLastName: (val: string) => void;                 // ฟังก์ชันอัปเดตนามสกุล
  phone: string;                                       // เบอร์โทรศัพท์
  setPhone: (val: string) => void;                    // ฟังก์ชันอัปเดตเบอร์โทร
  lineId: string;                                      // LINE ID
  setLineId: (val: string) => void;                   // ฟังก์ชันอัปเดต LINE ID
  email: string;                                       // อีเมลผู้ใช้ (อ่านอย่างเดียว)
  emailNotification: boolean;                          // ความยินยอมรับข่าวสารทางอีเมล
  setEmailNotification: (val: boolean) => void;       // ฟังก์ชันสลับความยินยอมอีเมล
  smsNotification: boolean;                            // ความยินยอมรับแจ้งเตือนทาง SMS
  setSmsNotification: (val: boolean) => void;         // ฟังก์ชันสลับความยินยอม SMS
  currentPassword: string;                             // รหัสผ่านปัจจุบัน
  setCurrentPassword: (val: string) => void;          // ฟังก์ชันอัปเดตรหัสผ่านปัจจุบัน
  newPassword: string;                                 // รหัสผ่านใหม่
  setNewPassword: (val: string) => void;              // ฟังก์ชันอัปเดตรหัสผ่านใหม่
  confirmPassword: string;                             // ยืนยันรหัสผ่านใหม่
  setConfirmPassword: (val: string) => void;          // ฟังก์ชันอัปเดตยืนยันรหัสผ่านใหม่
  isSaving: boolean;                                   // สภาวะกำลังบันทึกข้อมูล
  isLoadingProfile: boolean;                           // สภาวะกำลังโหลดข้อมูลโปรไฟล์
  statusMsg: { type: 'success' | 'error'; text: string } | null; // ข้อความแจ้งสถานะ
  lastLoginTime: string;                               // วันเวลาเข้าสู่ระบบล่าสุด
  loginDevice: string;                                 // อุปกรณ์ที่ใช้เข้าสู่ระบบ
  loginIp: string;                                     // หมายเลข IP ที่ใช้เข้าสู่ระบบ
  isVerified: boolean;                                 // สถานะการยืนยันตัวตน
  handleSaveProfile: (e: React.FormEvent) => void;     // ฟังก์ชันบันทึกข้อมูลโปรไฟล์
  onResetProfile: () => void;                          // ฟังก์ชันคืนค่าฟอร์มเป็นค่าเดิม
}

const DELETE_CONFIRM_TEXT = 'ลบบัญชี';

export default function ProfileForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  lineId,
  setLineId,
  email,
  emailNotification,
  setEmailNotification,
  smsNotification,
  setSmsNotification,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isSaving,
  isLoadingProfile,
  statusMsg,
  lastLoginTime,
  loginDevice,
  loginIp,
  isVerified,
  handleSaveProfile,
  onResetProfile,
}: ProfileFormProps) {
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <main className="flex-1 space-y-6">
      {/* 1. กล่องแจ้งเตือนสถานะความสำเร็จ / ข้อผิดพลาด */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-3 shadow-xs animate-fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* การ์ดที่ 1: ข้อมูลส่วนบุคคล (General Profile) */}
      {/* =================================================================== */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-100 space-y-6">
        {/* หัวข้อการ์ดและป้ายสถานะยืนยันอีเมล */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">ข้อมูลส่วนบุคคล</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                ข้อมูลสำหรับติดต่อและประสานงานเกี่ยวกับการนัดหมายและเอกสารสัญญา
              </p>
            </div>
          </div>

          <div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ยืนยันอีเมลแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> ยังไม่ยืนยันอีเมล
              </span>
            )}
          </div>
        </div>

        {/* ฟอร์มแก้ไขข้อมูลส่วนตัว */}
        <form onSubmit={handleSaveProfile} className={`space-y-5 ${isLoadingProfile ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อจริง <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="กรอกชื่อจริง"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="กรอกนามสกุล"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เบอร์โทรศัพท์มือถือ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                LINE ID (สำหรับการติดต่อด่วน)
              </label>
              <input
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="ใส่ LINE ID เพื่อการติดต่อที่สะดวกรวดเร็ว"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">อีเมลบัญชีผู้ใช้</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>ไม่อนุญาตให้แก้ไขอีเมลด้วยตนเองเพื่อความปลอดภัย หากต้องการเปลี่ยนกรุณาติดต่อผู้ดูแลระบบ</span>
            </p>
          </div>

          {/* ปุ่มบันทึกข้อมูลส่วนบุคคล */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onResetProfile}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer text-xs"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนบุคคล'}
            </button>
          </div>
        </form>
      </section>

      {/* =================================================================== */}
      {/* การ์ดที่ 2: ความปลอดภัยและประวัติการเข้าใช้งาน (Security & Audit Log) */}
      {/* =================================================================== */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">ความปลอดภัยและรหัสผ่าน</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              จัดการรหัสผ่านและตรวจสอบประวัติการเข้าใช้งานล่าสุดเพื่อความปลอดภัยของบัญชี
            </p>
          </div>
        </div>

        {/* ฟอร์มเปลี่ยนรหัสผ่าน */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            เปลี่ยนรหัสผ่านใหม่
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">รหัสผ่านปัจจุบัน</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">รหัสผ่านใหม่</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving || !newPassword}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-xs transition text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'อัปเดตรหัสผ่านใหม่'}
            </button>
          </div>
        </form>

        {/* ประวัติการเข้าสู่ระบบล่าสุด (Audit Log) */}
        <div className="space-y-3 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              ประวัติการเข้าสู่ระบบล่าสุด (Security Audit Log)
            </h4>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800">เข้าใช้งานล่าสุดเมื่อ:</span>
              </div>
              <span className="font-mono text-slate-600 font-bold">
                {isLoadingProfile ? 'กำลังโหลด...' : lastLoginTime}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1 border-t border-slate-200/60 pt-2 font-mono">
              <p className="truncate">
                <strong>อุปกรณ์/เบราว์เซอร์:</strong> {loginDevice || 'เว็บเบราว์เซอร์ทั่วไป'}
              </p>
              <p>
                <strong>หมายเลข IP Address:</strong> {loginIp || 'ไม่ระบุ'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* การ์ดที่ 3: ศูนย์ความเป็นส่วนตัวและสิทธิ PDPA (Privacy & PDPA Center) */}
      {/* =================================================================== */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">ศูนย์ความเป็นส่วนตัวและสิทธิ PDPA</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              จัดการความยินยอมในการรับข้อมูลข่าวสาร การคุ้มครองข้อมูลส่วนบุคคล และสิทธิตามกฎหมาย PDPA
            </p>
          </div>
        </div>

        {/* 3.1 การจัดการความยินยอม (Consent Management) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              การจัดการความยินยอม (Consent Management)
            </h4>
          </div>
          <p className="text-slate-500 text-[11px]">
            ท่านสามารถเลือกเปิดหรือปิดความยินยอมในการรับข้อมูลข่าวสารได้ตลอดเวลา โดยการเปลี่ยนแปลงจะมีผลทันที
          </p>

          <div className="space-y-3 pt-1">
            {/* ความยินยอมที่ 1: อีเมล */}
            <label className="flex items-start gap-3.5 p-4 bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl cursor-pointer transition">
              <input
                type="checkbox"
                checked={emailNotification}
                onChange={(e) => setEmailNotification(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800">
                  ยินยอมรับข้อมูลข่าวสารโครงการใหม่และสิทธิพิเศษทางอีเมล
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  รับข่าวสารเปิดตัวโครงการใหม่ โปรโมชันส่วนลดพิเศษ และบทวิเคราะห์อสังหาริมทรัพย์ส่งตรงถึงอีเมลของคุณ
                </p>
              </div>
            </label>

            {/* ความยินยอมที่ 2: SMS */}
            <label className="flex items-start gap-3.5 p-4 bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl cursor-pointer transition">
              <input
                type="checkbox"
                checked={smsNotification}
                onChange={(e) => setSmsNotification(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800">
                  ยินยอมรับการแจ้งเตือนด่วนทาง SMS
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  รับข้อความแจ้งเตือนสำคัญ เช่น การยืนยันคิวนัดหมายด่วน หรือการปรับลดราคาของบ้านในรายการโปรด
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 3.2 การจัดการข้อมูลส่วนบุคคลและนโยบายความเป็นส่วนตัว (Data Subject Rights & Policy) */}
        <div className="space-y-3 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              นโยบายความเป็นส่วนตัว (Privacy Policy)
            </h4>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">นโยบายความเป็นส่วนตัวของแพลตฟอร์ม</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  อ่านรายละเอียดการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
                </p>
              </div>
              <Link
                href="/privacy-policy"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 font-bold text-xs rounded-xl transition shadow-xs flex-shrink-0"
              >
                <span>อ่านนโยบายฉบับเต็ม</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* 3.3 พื้นที่อันตราย (Danger Zone): ขอลบบัญชีผู้ใช้ถาวร */}
        <div className="pt-5 border-t border-slate-100">
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-5 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-rose-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <h4 className="font-extrabold text-xs">
                  พื้นที่อันตราย: ขอลบบัญชีผู้ใช้ถาวร (Delete Account)
                </h4>
              </div>
              <p className="text-rose-600 text-[11px] leading-relaxed">
                การลบบัญชีเป็นการใช้สิทธิขอลบข้อมูลส่วนบุคคลตามกฎหมาย PDPA ข้อมูลทั้งหมด ได้แก่ ประวัติการเข้าชม รายการที่บันทึกไว้ และข้อความแชทจะถูกลบถาวรทันทีและไม่สามารถกู้คืนได้
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`พิมพ์ "${DELETE_CONFIRM_TEXT}" เพื่อยืนยัน`}
                className="flex-1 px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition text-slate-900 text-xs font-bold"
              />
              <button
                type="button"
                disabled={deleteConfirmText !== DELETE_CONFIRM_TEXT || isDeleting}
                onClick={async () => {
                  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้อย่างถาวร? การกระทำนี้ไม่สามารถยกเลิกได้')) {
                    setIsDeleting(true);
                    try {
                      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
                      const data = await res.json().catch(() => null);
                      if (res.ok) {
                        toast.success('ลบบัญชีของคุณเรียบร้อยแล้ว');
                        signOut({ callbackUrl: '/login' });
                      } else {
                        toast.error(data?.error || 'ไม่สามารถลบบัญชีได้');
                      }
                    } catch {
                      toast.error('ไม่สามารถลบบัญชีได้');
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบบัญชีถาวร'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
