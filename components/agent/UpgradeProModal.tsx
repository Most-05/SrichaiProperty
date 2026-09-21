'use client';

/**
 * ==============================================================================
 * หน้าต่างลอยแนบสลิปชำระเงินอัปเกรดนายหน้าเป็น PRO Agent (Upgrade Pro Modal)
 * /components/agent/UpgradeProModal.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. แสดง Pop-up ยืนยันข้อมูลสิทธิประโยชน์แพ็กเกจ PRO Agent (599 บาท/เดือน)
 * 2. ช่องทางแนบสลิปการโอนเงิน (FormData) ส่งไปยัง API `/api/packages/checkout`
 * 3. แจ้งเตือนสถานะเมื่อยื่นสลิปสำเร็จเพื่อรอแอนมินตรวจสอบ
 * ==============================================================================
 */

import React, { useState } from 'react';
import { toast } from '@/components/ui/toast';
import { compressImage } from '@/lib/utils/compressImage';

/** Props สำหรับ UpgradeProModal Component */
interface UpgradeProModalProps {
  isOpen: boolean;       // สภาวะเปิด/ปิด Modal
  onClose: () => void;   // ฟังก์ชันปิด Modal
  onSuccess?: () => void;// ฟังก์ชัน Callback เมื่อยื่นสลิปชำระเงินสำเร็จ
}

export default function UpgradeProModal({ isOpen, onClose, onSuccess }: UpgradeProModalProps) {
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!slipFile) {
      toast.warning('กรุณาแนบไฟล์รูปภาพสลิปการโอนเงิน');
      return;
    }
    setSubmittingPayment(true);
    try {
      // ⚡ บีบอัดสลิปโอนเงินก่อนส่งขึ้นเซิร์ฟเวอร์
      const compressed = await compressImage(slipFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      const formData = new FormData();
      formData.append('slip', compressed.file);
      formData.append('packageId', '1');
      formData.append('amount', '599');

      const res = await fetch('/api/packages/checkout', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success('ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว! ทีมงานจะตรวจสอบและอนุมัติแพ็กเกจ PRO ภายใน 1-2 ชม.');
        setSlipFile(null);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('ส่งสลิปชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span>สมัครสมาชิก Verified PRO</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer" aria-label="ปิด">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] font-black text-amber-700 uppercase">ค่าบริการแพ็กเกจ</span>
          <p className="text-2xl font-black text-slate-900">฿ 599 <span className="text-xs font-normal text-slate-500">/ 30 วัน</span></p>
          <p className="text-[10px] text-slate-500 font-medium">สิทธิ์ลงประกาศไม่จำกัด + โควต้าดันโพสต์ฟรี 30 วัน</p>
        </div>

        <div className="space-y-2 border-t pt-3">
          <h4 className="font-extrabold text-xs text-slate-800">1. ชำระเงินผ่าน PromptPay / ธนาคาร</h4>
          <div className="bg-slate-900 text-white rounded-2xl p-4 text-center space-y-2">
            <p className="text-xs font-bold text-amber-400">สแกน QR Code ชำระเงิน</p>
            <div className="w-40 h-40 bg-white mx-auto rounded-xl flex items-center justify-center p-2 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PROMPTPAY_599_SRICHAI" alt="PromptPay QR" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] text-slate-300 font-medium">บจก. ศรีชัย พร็อพเพอร์ตี้ (ธ.กสิกรไทย 012-3-45678-9)</p>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <h4 className="font-extrabold text-xs text-slate-800">2. แนบไฟล์รูปภาพสลิปโอนเงิน</h4>
          <input
            type="file"
            id="pro-slip-input"
            accept="image/*"
            className="hidden"
            onChange={e => setSlipFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => document.getElementById('pro-slip-input')?.click()}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none hover:bg-slate-100 font-bold text-slate-700 text-left cursor-pointer flex items-center gap-2"
          >
            {slipFile ? (
              <>
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                <span className="truncate">{slipFile.name}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>คลิกเพื่อเลือกไฟล์รูปภาพสลิป</span>
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition cursor-pointer">ยกเลิก</button>
          <button
            onClick={handleCheckout}
            disabled={submittingPayment}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center gap-1.5"
          >
            {submittingPayment ? (
              <span>กำลังส่งข้อมูล...</span>
            ) : (
              <>
                <span>ส่งสลิปชำระเงิน</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
