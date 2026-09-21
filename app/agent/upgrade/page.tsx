'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Step = 'details' | 'payment' | 'success';

export default function UpgradePage() {
  const { status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('details');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProUser, setIsProUser] = useState(false);
  const [planExpiredAt, setPlanExpiredAt] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user?.isPro) {
          setIsProUser(true);
          setPlanExpiredAt(data.user.planExpiredAt || null);
        }
      })
      .catch(console.error);
  }, []);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('ไฟล์มีขนาดใหญ่เกิน 5MB กรุณาลดขนาดไฟล์ก่อน');
      return;
    }
    setErrorMsg('');
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSlipPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = async () => {
    if (!slipFile) {
      setErrorMsg('กรุณาแนบรูปสลิปการโอนเงินก่อน');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // ส่งไฟล์สลิปตรงไปที่ checkout API (multipart/form-data)
      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('packageId', '1');
      formData.append('amount', '599');

      const res = await fetch('/api/packages/checkout', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล');

      setStep('success');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ===== ALREADY PRO MEMBER SCREEN =====
  if (isProUser) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-slate-100">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-200 text-slate-950">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div className="space-y-1">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              VERIFIED PRO ACTIVE
            </span>
            <h1 className="text-xl font-black text-slate-900 pt-2">คุณใช้งานสมาชิก PRO อยู่แล้ว</h1>
            <p className="text-slate-500 text-xs leading-relaxed">
              บัญชีของคุณได้รับสิทธิ์สมาชิกพรีเมียมเรียบร้อยแล้ว ไม่ต้องอัปเกรดซ้ำ
            </p>
          </div>

          <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/60 text-left space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-amber-900 border-b border-amber-200/50 pb-2">
              <span>สถานะแพ็กเกจ</span>
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px]">ใช้งานอยู่</span>
            </div>
            <p className="text-xs text-amber-900 font-semibold flex justify-between pt-1">
              <span>วันหมดอายุสิทธิ์:</span>
              <span className="font-extrabold">{planExpiredAt ? new Date(planExpiredAt).toLocaleDateString('th-TH') : 'ใช้งานต่อเนื่อง'}</span>
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/agent/add-property"
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-md shadow-amber-200/60 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>ลงประกาศบ้านพรีเมียมทันที</span>
            </Link>
            <Link
              href="/agent/home"
              className="w-full block py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center"
            >
              กลับสู่หน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== SUCCESS SCREEN =====
  if (step === 'success') {
    return (
      <div className="pt-6 sm:pt-8 min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-5 border border-slate-100">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              ส่งข้อมูลเรียบร้อยแล้ว
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">รอการยืนยันจาก Admin</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            เราได้รับสลิปการโอนเงินของคุณแล้ว ทีมงานจะตรวจสอบและเปิดใช้งาน <strong>Verified PRO</strong> ให้คุณภายใน <strong>1 วันทำการ</strong>
          </p>
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-left space-y-2">
            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>สิทธิประโยชน์ที่คุณจะได้รับ</span>
            </p>
            <ul className="space-y-1.5">
              {[
                'ลงประกาศไม่จำกัดจำนวน',
                'แบดจ์ Verified PRO ติดโปรไฟล์',
                'ดันประกาศขึ้นหน้าแรกฟรี',
                'สถิติยอดวิวและแชทแบบละเอียด',
                'Priority Support จากทีมงาน',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                  <svg className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/agent/home"
            className="w-full block py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-black rounded-xl text-sm transition text-center"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // ===== PAYMENT STEP =====
  if (step === 'payment') {
    return (
      <div className="pt-6 sm:pt-8 min-h-screen bg-slate-50 p-4">
        <div className="max-w-lg mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('details')} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-sm">
              ←
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900">แนบหลักฐานการชำระเงิน</h1>
              <p className="text-xs text-slate-400 font-semibold">ขั้นตอน 2 / 2</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center space-y-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 inline-block">
              <div className="bg-white rounded-xl p-2 w-40 h-40 flex items-center justify-center">
                {/* QR Code Placeholder - ใน production ใช้ QR จริง */}
                <div className="text-center">
                  <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* QR Pattern Simulation */}
                    <rect width="100" height="100" fill="white"/>
                    {/* Corner squares */}
                    <rect x="5" y="5" width="25" height="25" rx="3" fill="#1e293b"/>
                    <rect x="8" y="8" width="19" height="19" rx="2" fill="white"/>
                    <rect x="11" y="11" width="13" height="13" rx="1" fill="#1e293b"/>
                    <rect x="70" y="5" width="25" height="25" rx="3" fill="#1e293b"/>
                    <rect x="73" y="8" width="19" height="19" rx="2" fill="white"/>
                    <rect x="76" y="11" width="13" height="13" rx="1" fill="#1e293b"/>
                    <rect x="5" y="70" width="25" height="25" rx="3" fill="#1e293b"/>
                    <rect x="8" y="73" width="19" height="19" rx="2" fill="white"/>
                    <rect x="11" y="76" width="13" height="13" rx="1" fill="#1e293b"/>
                    {/* Data modules */}
                    {[35,40,45,50,55,60].map((x, i) =>
                      [5,10,15,20,25].filter((_, j) => (i + j) % 2 === 0).map(y => (
                        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill="#1e293b"/>
                      ))
                    )}
                    {[5,10,15,20,25,30].map((y, i) =>
                      [35,40,45,50,55,60].filter((_, j) => (i + j) % 3 !== 0).map(x => (
                        <rect key={`m-${x}-${y}`} x={x} y={y} width="4" height="4" fill="#1e293b"/>
                      ))
                    )}
                    {[35,38,41,44,47,50,53,56,59,62,65,68].map((x, i) =>
                      [35,40,45,50,55,60,65].filter((_, j) => (i * 3 + j * 7) % 5 !== 0).map(y => (
                        <rect key={`d-${x}-${y}`} x={x} y={y} width="3" height="3" fill="#1e293b"/>
                      ))
                    )}
                    {/* Center logo hint */}
                    <rect x="43" y="43" width="14" height="14" rx="2" fill="white"/>
                    <text x="50" y="53" textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="bold">฿</text>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">PromptPay / พร้อมเพย์</p>
              <p className="text-2xl font-black text-slate-900 mt-1 tracking-wider">081-234-5678</p>
              <p className="text-sm text-slate-500 font-semibold">บริษัท ศรีชัย พร็อพเพอร์ตี้ จำกัด</p>
            </div>
            <div className="bg-amber-50 rounded-2xl py-3 px-4 border border-amber-200">
              <p className="text-xs text-amber-700 font-bold">จำนวนเงินที่ต้องโอน</p>
              <p className="text-3xl font-black text-amber-600">฿599<span className="text-sm font-bold text-amber-400">.00</span></p>
              <p className="text-xs text-amber-600 font-semibold">Verified PRO · 30 วัน</p>
            </div>
          </div>

          {/* Upload Slip */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>แนบสลิปการโอนเงิน</span>
            </h3>

            <div
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-400 bg-amber-50'
                  : slipPreview
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              {slipPreview ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slipPreview || ''}
                    alt="สลิปการโอนเงิน"
                    className="mx-auto max-h-48 rounded-xl object-contain shadow-md"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      แนบสลิปแล้ว
                    </span>
                    <span className="text-slate-400 text-xs">· {slipFile?.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">กดเพื่อเปลี่ยนรูปสลิป</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">วางหรือกดเพื่อเลือกรูปสลิป</p>
                    <p className="text-xs text-slate-400 font-semibold mt-1">รองรับ JPG, PNG, WEBP · ขนาดไม่เกิน 5MB</p>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-xs font-bold border border-red-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !slipFile}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                  กำลังส่งข้อมูล...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>ส่งหลักฐานการชำระเงิน</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>ข้อมูลและสลิปของคุณจะถูกเก็บเป็นความลับและปลอดภัย</span>
            </p>
          </div>

        </div>
      </div>
    );
  }

  // ===== DETAILS STEP (default) =====
  return (
    <div className="pt-6 sm:pt-8 min-h-screen bg-slate-50 p-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/agent/home"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-900">อัปเกรด Verified PRO</h1>
            <p className="text-xs text-slate-400 font-semibold">ขั้นตอน 1 / 2 · ตรวจสอบแพ็กเกจ</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -translate-y-10 translate-x-10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full translate-y-8 -translate-x-8 blur-2xl" />

          <div className="flex items-start justify-between relative">
            <div className="space-y-3">
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                <svg className="w-3 h-3 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                VERIFIED PRO
              </span>
              <h2 className="text-xl font-black tracking-tight leading-tight">
                ขยายธุรกิจแบบ<br />ไร้ขีดจำกัด
              </h2>
              <p className="text-slate-300 text-[11px] leading-relaxed max-w-xs">
                ดันประกาศและฟีเจอร์พรีเมียมเฉพาะตัวแทนที่อัปเกรดเพื่อรับยอดเข้าชมและฐานลูกค้าที่กว้างขวางขึ้น
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase">ราคา</p>
              <p className="text-3xl font-black text-amber-400">฿599</p>
              <p className="text-[10px] text-slate-400 font-semibold">/เดือน</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>สิทธิประโยชน์ที่คุณจะได้รับ</span>
          </h3>
          <div className="space-y-3">
            {[
              { 
                icon: (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.178 8c5.096 0 5.096 8 0 8-2.613 0-4.32-2.316-6.178-4-1.858 1.684-3.565 4-6.178 4-5.096 0-5.096-8 0-8 2.613 0 4.32 2.316 6.178 4 1.858-1.684 3.565-4 6.178-4z" />
                  </svg>
                ), 
                title: 'ลงประกาศไม่จำกัด', 
                desc: 'จากเดิม 3 รายการ → ไม่จำกัดจำนวน' 
              },
              { 
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ), 
                title: 'แบดจ์ Verified PRO', 
                desc: 'ติดโปรไฟล์เพื่อสร้างความน่าเชื่อถือ' 
              },
              { 
                icon: (
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ), 
                title: 'ดันประกาศขึ้นหน้าแรก', 
                desc: 'รับสิทธิ์ boost ฟรี 5 ครั้ง/เดือน' 
              },
              { 
                icon: (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ), 
                title: 'สถิติแบบละเอียด', 
                desc: 'ยอดวิว, แชท, อัตราการนัดหมาย' 
              },
              { 
                icon: (
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ), 
                title: 'Priority Support', 
                desc: 'ทีมงานดูแลคุณก่อนในทุกปัญหา' 
              },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-xs">{b.title}</p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{b.desc}</p>
                </div>
                <span className="ml-auto text-emerald-600 text-xs font-black">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>สรุปคำสั่งซื้อ</span>
          </h3>
          <div className="space-y-2 text-xs font-semibold">
            <div className="flex justify-between text-slate-600">
              <span>Verified PRO Package · 30 วัน</span>
              <span>฿599.00</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
              <span>รวมอยู่แล้ว</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between text-slate-900 font-black text-sm">
              <span>ยอดรวมสุทธิ</span>
              <span className="text-amber-500">฿599.00</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setStep('payment')}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-sm transition shadow-lg shadow-amber-200/60 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>ดำเนินการชำระเงิน</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        <p className="text-center text-[11px] text-slate-400 font-semibold pb-4">
          การชำระเงินผ่านระบบ PromptPay · หลังแอดมินยืนยันภายใน 1 วันทำการ
        </p>

      </div>
    </div>
  );
}
