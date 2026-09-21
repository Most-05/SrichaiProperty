import React, { useState } from 'react';
import Image from 'next/image';
import { compressImage, formatBytes } from '@/lib/utils/compressImage';

/**
 * ==============================================================================
 * คอมโพเนนต์อัปโหลดและแสดงตัวอย่างรูปภาพประกาศ (Image Uploader Component)
 * /components/property/ImageUploader.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. รับไฟล์รูปภาพบ้าน/คอนโดจากผู้ใช้ บีบอัดเป็น .webp ฝั่งเบราว์เซอร์ แล้วยิงส่งไปยัง API `/api/upload`
 * 2. แสดงตัวอย่างรูปภาพ (Thumbnail Preview) ที่อัปโหลดแล้ว
 * 3. มีปุ่มลบรูปภาพแต่ละรูปออกได้ตามต้องการ
 * ==============================================================================
 */

/** Props สำหรับ ImageUploader Component */
interface Props {
  uploadedImages: string[];                                          // รายชื่อ URL รูปภาพที่อัปโหลดแล้ว
  setUploadedImages: React.Dispatch<React.SetStateAction<string[]>>;// ฟังก์ชันอัปเดตอาร์เรย์ URL รูปภาพ
}

export default function ImageUploader({ uploadedImages, setUploadedImages }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setStatusMessage(`กำลังบีบอัดและเตรียมรูปภาพ 0/${files.length}...`);

    const newUrls: string[] = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (let i = 0; i < files.length; i++) {
      setStatusMessage(`กำลังบีบอัดรูปที่ ${i + 1}/${files.length} ให้เล็กลง (.webp)...`);
      
      // ⚡ บีบอัดรูปภาพที่เบราว์เซอร์ก่อนส่งขึ้นเซิร์ฟเวอร์
      const compressed = await compressImage(files[i], {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82,
        targetMimeType: 'image/webp',
      });

      totalOriginalSize += compressed.originalSize;
      totalCompressedSize += compressed.compressedSize;

      const formData = new FormData();
      formData.append('file', compressed.file);

      try {
        setStatusMessage(`กำลังอัปโหลดรูปที่ ${i + 1}/${files.length}...`);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) newUrls.push(data.url);
      } catch (err) {
        console.error(err);
      }
    }

    if (newUrls.length > 0) {
      setUploadedImages(prev => [...prev, ...newUrls]);
      const savedPct = totalOriginalSize > 0 
        ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
        : 0;
      setStatusMessage(`สำเร็จ! อัปโหลด ${newUrls.length} รูป (ประหยัดพื้นที่ ${savedPct}% จาก ${formatBytes(totalOriginalSize)} เหลือ ${formatBytes(totalCompressedSize)})`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage(null);
    }

    setIsProcessing(false);
    // รีเซ็ตค่า input เพื่อให้สามารถเลือกรูปเดิมซ้ำได้ถ้าต้องการ
    e.target.value = '';
  };

  return (
    <div>
      <label className="block font-bold mb-1 text-slate-700">รูปภาพประกาศ (ภาพบ้าน/คอนโด) <span className="text-red-500">*</span></label>
      <input 
        type="file" 
        id="photo-file-input"
        multiple 
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <div 
        onClick={() => !isProcessing && document.getElementById('photo-file-input')?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-1.5 transition ${
          isProcessing 
            ? 'border-blue-400 bg-blue-50/40 cursor-wait' 
            : 'border-blue-200 hover:border-blue-500 bg-blue-50/20 cursor-pointer'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${
          isProcessing ? 'bg-blue-200 text-blue-700' : 'bg-blue-100 text-blue-600'
        }`}>
          {isProcessing ? (
            <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>
        <p className="font-extrabold text-blue-700 text-xs">
          {isProcessing ? 'กำลังประมวลผลและบีบอัดรูปภาพ...' : 'ลากไฟล์รูปภาพมาวางที่นี่'}
        </p>
        <p className="text-[9px] text-slate-400">
          {isProcessing 
            ? 'ระบบกำลังแปลงเป็น .webp เพื่อลดขนาดไฟล์และเพิ่มความเร็ว' 
            : <>หรือ <span className="underline font-bold text-blue-600">คลิกเพื่อเลือกไฟล์</span> (เลือกได้หลายรูป รองรับการย่อขนาดอัตโนมัติ)</>}
        </p>
      </div>

      {/* แถบแจ้งสถานะการบีบอัด / อัปโหลด */}
      {statusMessage && (
        <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border ${
          statusMessage.startsWith('สำเร็จ') 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
        }`}>
          {statusMessage.startsWith('สำเร็จ') && (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2 pt-3">
          {uploadedImages.map((url, idx) => (
            <div key={`${url}-${idx}`} className="relative aspect-[4/3] rounded-lg overflow-hidden border shadow-sm group">
              <Image src={url} alt={`Upload ${idx+1}`} fill className="object-cover" unoptimized />
              <button 
                type="button" 
                onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 bg-slate-900/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors cursor-pointer"
                title="ลบรูปภาพ"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
