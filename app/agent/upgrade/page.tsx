'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  BarChart3, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Copy,
  UploadCloud,
  Paperclip,
  AlertCircle,
  Send,
  Lock,
  Receipt
} from 'lucide-react';
import { PRO_MONTHLY, PRO_YEARLY } from '@/lib/pro';
import { compressImage } from '@/lib/utils/compressImage';

type Step = 'details' | 'payment' | 'success';
type BillingCycle = 'monthly' | 'yearly';

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
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [renewing, setRenewing] = useState(false);
  const [nowTs, setNowTs] = useState(0);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);

  // แผนแพ็กเกจตามรอบบิลที่เลือก (ราคา/จำนวนวันจากค่ากลาง lib/pro)
  const plan = billingCycle === 'yearly' ? PRO_YEARLY : PRO_MONTHLY;
  const daysLeft = planExpiredAt && nowTs
    ? Math.ceil((new Date(planExpiredAt).getTime() - nowTs) / (1000 * 60 * 60 * 24))
    : null;

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText('0812345678');
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  React.useEffect(() => {
    const nowTimer = setTimeout(() => setNowTs(Date.now()), 0);
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user?.isPro) {
          setIsProUser(true);
          setPlanExpiredAt(data.user.planExpiredAt || null);
        }
      })
      .catch(console.error);
    return () => clearTimeout(nowTimer);
  }, []);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)');
      return;
    }
    setErrorMsg('');
    try {
      // ⚡ บีบอัดรูปภาพอัตโนมัติ (รองรับภาพถ่ายจากมือถือความละเอียดสูง)
      const compressed = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.85 });
      setSlipFile(compressed.file);
      const reader = new FileReader();
      reader.onload = (e) => setSlipPreview(e.target?.result as string);
      reader.readAsDataURL(compressed.file);
    } catch {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setSlipPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
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
      formData.append('billingCycle', billingCycle);
      formData.append('packageId', String(plan.packageId));

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

  // ===== ALREADY PRO MEMBER SCREEN (แสดงสถานะ + ปุ่มต่ออายุล่วงหน้า) =====
  if (isProUser && !renewing) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-slate-100">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-200 text-slate-950">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              VERIFIED PRO ACTIVE
            </span>
            <h1 className="text-xl font-black text-slate-900 pt-2">คุณใช้งานสมาชิก PRO อยู่</h1>
            <p className="text-slate-500 text-xs leading-relaxed">
              ต่ออายุล่วงหน้าได้ทันที ระบบจะทบวันใหม่จากวันหมดอายุเดิมให้อัตโนมัติ ไม่ตัดวันที่เหลือทิ้ง
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
            <p className="text-xs text-amber-800 font-bold flex items-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{daysLeft != null ? `เหลือเวลาอีก ${Math.max(0, daysLeft)} วัน` : 'ไม่ระบุวันหมดอายุ'}</span>
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setRenewing(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-md shadow-amber-200/60 active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ต่ออายุล่วงหน้า (Renew PRO)</span>
            </button>
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
            <CheckCircle2 className="w-10 h-10" />
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
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>สิทธิประโยชน์ที่ใช้งานได้จริงในระบบ</span>
            </p>
            <ul className="space-y-1.5">
              {[
                'ลงประกาศได้ไม่จำกัดจำนวน (จากเดิม Basic สูงสุด 3 รายการ)',
                'แบดจ์ Verified PRO ติดบนการ์ดประกาศและโปรไฟล์ของคุณ',
                'ดันประกาศขึ้นอันดับแรกในหน้าค้นหาตลอดอายุแพ็กเกจ (Priority Boost)',
                'กล่องรับรองตัวแทนนายหน้าในหน้ารายละเอียดทรัพย์ สร้างความมั่นใจให้ผู้ซื้อ',
                'ติดตามยอดวิว แชท และจัดการคำขอนัดหมายบนแดชบอร์ดแบบเรียลไทม์',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{benefit}</span>
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
            <button onClick={() => setStep('details')} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-sm cursor-pointer" aria-label="ย้อนกลับ">
              <ArrowLeft className="w-4 h-4" />
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
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-2xl font-black text-slate-900 tracking-wider">081-234-5678</p>
                <button
                  type="button"
                  onClick={handleCopyPromptPay}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="คัดลอกเบอร์พร้อมเพย์"
                >
                  {copiedPromptPay ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>คัดลอก</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-500 font-semibold mt-1">บริษัท ศรีชัย พร็อพเพอร์ตี้ จำกัด</p>
            </div>
            <div className="bg-amber-50 rounded-2xl py-3 px-4 border border-amber-200">
              <p className="text-xs text-amber-700 font-bold">จำนวนเงินที่ต้องโอน</p>
              <p className="text-3xl font-black text-amber-600">฿{plan.amount.toLocaleString()}<span className="text-sm font-bold text-amber-400">.00</span></p>
              <p className="text-xs text-amber-600 font-semibold">Verified PRO · {plan.shortLabel} · {plan.days} วัน</p>
            </div>
          </div>

          {/* Upload Slip */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-slate-500" />
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
                accept="image/jpeg,image/png,image/webp"
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
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>แนบสลิปแล้ว</span>
                    </span>
                    <span className="text-slate-400 text-xs">· {slipFile?.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">กดเพื่อเปลี่ยนรูปสลิป</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">วางหรือกดเพื่อเลือกรูปสลิป</p>
                    <p className="text-xs text-slate-400 font-semibold mt-1">ระบบปรับขนาดภาพอัตโนมัติ · รองรับภาพถ่ายจากมือถือ</p>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-xs font-bold border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !slipFile}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                  กำลังส่งข้อมูล...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ส่งหลักฐานการชำระเงิน</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-4 h-4" />
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
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950 shrink-0" />
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
              <p className="text-3xl font-black text-amber-400">฿{plan.amount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-semibold">/{billingCycle === 'yearly' ? 'ปี' : 'เดือน'}</p>
            </div>
          </div>
        </div>

        {/* Billing Cycle Switch */}
        <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-2xl px-3 py-3 text-left transition cursor-pointer border ${
              billingCycle === 'monthly'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span className="block text-xs font-black">รายเดือน</span>
            <span className="block text-[11px] font-bold mt-0.5">299 บ. / 30 วัน</span>
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`relative rounded-2xl px-3 py-3 text-left transition cursor-pointer border ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span className="block text-xs font-black">รายปี</span>
            <span className="block text-[11px] font-bold mt-0.5">2,690 บ. / 365 วัน</span>
            <span className="absolute -top-2 right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
              ประหยัด 25%
            </span>
          </button>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>สิทธิประโยชน์ที่ใช้งานได้จริงในระบบ</span>
          </h3>
          <div className="space-y-3">
            {[
              { 
                icon: <Layers className="w-5 h-5 text-blue-600 shrink-0" />, 
                title: 'ลงประกาศได้ไม่จำกัดจำนวน', 
                desc: 'ปลดล็อกโควตาจากเดิม Basic สูงสุด 3 รายการ เป็นไม่จำกัดจำนวน' 
              },
              { 
                icon: <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />, 
                title: 'แบดจ์ Verified PRO สีทอง', 
                desc: 'แสดงตราสัญลักษณ์บนการ์ดประกาศ, หน้ารวมนายหน้า และโปรไฟล์ของคุณ' 
              },
              { 
                icon: <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />, 
                title: 'ดันประกาศขึ้นอันดับแรกอัตโนมัติ (Priority Boost)', 
                desc: 'ทุกประกาศของคุณจะถูกจัดอันดับขึ้นก่อนประกาศทั่วไปในหน้าค้นหาตลอดอายุแพ็กเกจ' 
              },
              { 
                icon: <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />, 
                title: 'กล่องการันตีตัวตนในหน้ารายละเอียดทรัพย์', 
                desc: 'แสดงกล่องรับรองตัวแทนนายหน้ามืออาชีพ เพิ่มความมั่นใจให้ลูกค้ากล้าติดต่อนัดชม' 
              },
              { 
                icon: <BarChart3 className="w-5 h-5 text-slate-700 shrink-0" />, 
                title: 'แดชบอร์ดติดตามสถิติและคิวนัดหมาย', 
                desc: 'ดูยอดเข้าชมทรัพย์รายประกาศ, แชทลูกค้า และจัดการคำขอนัดหมายแบบเรียลไทม์' 
              },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-xs">{b.title}</p>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{b.desc}</p>
                </div>
                <span className="ml-auto text-emerald-600 text-xs font-black shrink-0">
                  <Check className="w-4 h-4" />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-slate-500 shrink-0" />
            <span>สรุปคำสั่งซื้อ</span>
          </h3>
          <div className="space-y-2 text-xs font-semibold">
            <div className="flex justify-between text-slate-600">
              <span>Verified PRO Package · {plan.days} วัน ({plan.shortLabel})</span>
              <span>฿{plan.amount.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
              <span>รวมอยู่แล้ว</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between text-slate-900 font-black text-sm">
              <span>ยอดรวมสุทธิ</span>
              <span className="text-amber-500">฿{plan.amount.toLocaleString()}.00</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setStep('payment')}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-sm transition shadow-lg shadow-amber-200/60 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>ดำเนินการชำระเงิน</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-[11px] text-slate-400 font-semibold pb-4">
          การชำระเงินผ่านระบบ PromptPay · หลังแอดมินยืนยันภายใน 1 วันทำการ
        </p>

      </div>
    </div>
  );
}
