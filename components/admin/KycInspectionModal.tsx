'use client';

/**
 * ==============================================================================
 * [SEARCH: KYC_INSPECTION_MODAL] [UI: โมดอลตรวจสอบเอกสาร KYC] [LOGIC: การซูมหมุนและเลื่อนดูเอกสาร]
 * โมดอลตรวจสอบภาพถ่ายเอกสาร KYC นายหน้าอย่างละเอียด (KYC Document Inspector)
 * /components/admin/KycInspectionModal.tsx
 * ==============================================================================
 * วัตถุประสงค์และฟังก์ชันหลัก:
 * 1. Deep Inspection: สำหรับแอดมินใช้ตรวจสอบบัตรประชาชน, ทะเบียนบ้าน, หรือใบอนุญาตนายหน้า
 * 2. Image Manipulation:
 *    - ซูมเข้า/ซูมออก (Zoom In/Out)
 *    - หมุนภาพทีละ 90 องศา (Rotate CW / CCW) ป้องกันกรณีภาพถ่ายกลับหัว
 *    - ลากเลื่อนตำแหน่งภาพ (Pan / Drag) เพื่อดูรายละเอียดข้อความขนาดเล็ก
 *    - ขยายเต็มจอ (Fullscreen Toggle)
 * 3. Accessibility: ปิดด้วยปุ่ม ESC และล็อก Scrollbar เบื้องหลังอัตโนมัติ
 * ==============================================================================
 */

// นำเข้า React และ Hooks สำหรับจัดการ State, Event Listener และ DOM Reference
import React, { useState, useEffect, useRef } from 'react';
// นำเข้าคอมโพเนนต์ Image จาก Next.js สำหรับแสดงรูปภาพอย่างมีประสิทธิภาพ
import Image from 'next/image';
// นำเข้าชุดไอคอนจาก lucide-react เพื่อให้สอดคล้องกับมาตรฐาน UI (ห้ามใช้อิโมจิดิบ)
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Move
} from 'lucide-react';

/**
 * กำหนดประเภทข้อมูล Props ของโมดอลตรวจสอบเอกสาร
 */
interface Props {
  imageUrl: string | null; // URL ลิงก์รูปภาพเอกสาร KYC
  isOpen?: boolean;        // สถานะเปิด/ปิดโมดอล
  onClose: () => void;     // ฟังก์ชัน Callback เมื่อปิดโมดอล
  title: string;           // หัวข้อหรือชื่อของเอกสาร/นายหน้า
}

/**
 * คอมโพเนนต์โมดอลตรวจสอบเอกสาร KYC (KycInspectionModal)
 */
export default function KycInspectionModal({ imageUrl, isOpen = true, onClose, title }: Props) {
  // [STATE: องศาการหมุนของรูปภาพ] เริ่มต้นที่ 0 องศา (0, 90, 180, 270)
  const [rotation, setRotation] = useState(0);
  // [STATE: อัตราส่วนการขยายของรูปภาพ] เริ่มต้นที่ 1 (100%), สูงสุด 3 (300%), ต่ำสุด 0.5 (50%)
  const [scale, setScale] = useState(1);
  // [STATE: พิกัดตำแหน่งแกน X และ Y ของรูปภาพขณะทำการ Pan]
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // [STATE: สถานะกำลังคลิกลากเมาส์เลื่อนภาพหรือไม่]
  const [isDragging, setIsDragging] = useState(false);
  // [STATE: พิกัดเริ่มต้นของการคลิกลากเมาส์]
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // [STATE: โหมดแสดงผลเต็มหน้าจอหรือไม่]
  const [isFullscreen, setIsFullscreen] = useState(false);
  // [STATE: เก็บ URL รูปภาพก่อนหน้า เพื่อตรวจจับการเปลี่ยนรูปและรีเซ็ตค่า]
  const [prevImageUrl, setPrevImageUrl] = useState(imageUrl);
  // อ้างอิง DOM ของกล่องบรรจุภาพ
  const containerRef = useRef<HTMLDivElement>(null);

  // ตรวจสอบการเปลี่ยน URL ของรูปภาพ เพื่อรีเซ็ตค่าการซูมและหมุนกลับสู่ค่าเริ่มต้นทันที
  if (prevImageUrl !== imageUrl) {
    setPrevImageUrl(imageUrl);
    setRotation(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }

  /**
   * ดักจับการกดปุ่ม Escape (ESC) เพื่อปิดหน้าต่าง และล็อก Scroll ของ Body
   */
  useEffect(() => {
    // ฟังก์ชันจัดการ Event การกดปุ่มบนคีย์บอร์ด
    const handleKeyDown = (e: KeyboardEvent) => {
      // หากผู้ใช้กดปุ่ม ESC ให้สั่งปิดโมดอล
      if (e.key === 'Escape') onClose();
    };

    // หากโมดอลเปิดอยู่ ให้ลงทะเบียน Event Listener และปิด Scrollbar หน้าจอหลัก
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    // ฟังก์ชัน Cleanup เมื่อ Unmount หรือปิดโมดอล: คืนค่า Scrollbar และลบ Listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // หากโมดอลไม่ได้เปิด หรือไม่มี URL รูปภาพ ให้ไม่ Render ใดๆ
  if (!isOpen || !imageUrl) return null;

  /**
   * ฟังก์ชันหมุนรูปภาพตามเข็มนาฬิกาทีละ 90 องศา (วนรอบ 360 องศา)
   */
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  /**
   * ฟังก์ชันขยายขนาดรูปภาพขึ้นทีละ 25% (สูงสุดไม่เกิน 300%)
   */
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  /**
   * ฟังก์ชันย่อขนาดรูปภาพลงทีละ 25% (ต่ำสุดไม่เกิน 50%) พร้อมรีเซ็ตตำแหน่งหากกลับมาเท่าเดิม
   */
  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      // หากย่อลงมาเท่ากับหรือน้อยกว่าขนาดปกติ ให้ย้ายรูปกลับกึ่งกลาง
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  /**
   * ฟังก์ชันรีเซ็ตค่าการหมุน, การซูม และตำแหน่งการเลื่อนกลับสู่ค่าเริ่มต้นทั้งหมด
   */
  const handleReset = () => {
    setRotation(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  /**
   * ฟังก์ชันเริ่มการคลิกลากเมาส์ (Mouse Down Handler)
   * อนุญาตให้ลากเฉพาะเมื่อรูปถูกขยาย (scale > 1) เท่านั้น
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return; // หากไม่ขยาย ไม่ต้องเริ่มลาก
    setIsDragging(true);    // เปิดสถานะลาก
    // คำนวณพิกัดเริ่มต้นเทียบกับตำแหน่งปัจจุบัน
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  /**
   * ฟังก์ชันคำนวณตำแหน่งพิกัดขณะลากเมาส์ (Mouse Move Handler)
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    // อัปเดตพิกัดตำแหน่งรูปภาพตามการเลื่อนเมาส์
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  /**
   * ฟังก์ชันสิ้นสุดการคลิกลากเมาส์ (Mouse Up Handler)
   */
  const handleMouseUp = () => {
    setIsDragging(false); // ปิดสถานะลาก
  };

  return (
    // โครงครอบโมดอลแบบเต็มจอ Fixed Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* 
        [UI: แบ็กดรอปพื้นหลังโปร่งแสงสีมืดเข้ม]
        คลิกเพื่อปิดโมดอลได้ พร้อมเอฟเฟกต์เบลอฉากหลัง (Backdrop Blur)
      */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* 
        [UI: กล่องโมดอลหลักแสดงรูปภาพและแผงควบคุม]
        ปรับขนาดได้อัตโนมัติตามโหมด Fullscreen
      */}
      <div
        ref={containerRef}
        className={`relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden z-10 flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none border-none'
            : 'w-full max-w-4xl h-[85vh]'
        }`}
      >
        {/* แถบเครื่องมือด้านบนสุด (Top Control Bar) */}
        <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 text-white flex items-center justify-between shrink-0 gap-3">
          {/* ข้อมูลหัวข้อเอกสารที่กำลังตรวจสอบ */}
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-extrabold truncate text-white">
              เครื่องมือตรวจสอบเอกสาร (Inspection Tools)
            </h2>
            <p className="text-[11px] text-slate-400 truncate">{title}</p>
          </div>

          {/* แถบปุ่มคำสั่งควบคุมการดูรูปภาพ (Action Toolbar) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* ปุ่มหมุนภาพ 90 องศา */}
            <button
              onClick={handleRotate}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="หมุนภาพ 90° ตามเข็มนาฬิกา"
            >
              <RotateCw className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">หมุน 90° ({rotation}°)</span>
            </button>

            {/* ปุ่มซูมออก */}
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition disabled:opacity-40 cursor-pointer"
              title="ซูมออก (-25%)"
            >
              <ZoomOut className="w-4 h-4 text-slate-300" />
            </button>

            {/* ปุ่มแสดงเปอร์เซ็นต์การซูมและคลิกเพื่อรีเซ็ต */}
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition cursor-pointer"
              title="คลิกเพื่อรีเซ็ตขนาด"
            >
              {Math.round(scale * 100)}%
            </button>

            {/* ปุ่มซูมเข้า */}
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition disabled:opacity-40 cursor-pointer"
              title="ซูมเข้า (+25%)"
            >
              <ZoomIn className="w-4 h-4 text-blue-400" />
            </button>

            {/* ปุ่มสลับโหมดเต็มหน้าจอ (Fullscreen) */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              title={isFullscreen ? 'ย่อขนาด' : 'เต็มหน้าจอ'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-amber-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* ปุ่มปิดโมดอล */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer ml-1"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 
          [UI: พื้นที่แสดงภาพ (Viewport Workspace)]
          รองรับการคลิกลากแพนภาพเมื่อซูม
        */}
        <div
          className={`flex-1 relative overflow-hidden flex items-center justify-center select-none bg-slate-950 ${
            scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* กล่องจัดสไตล์ Transform สำหรับการ Translate, Rotate และ Scale */}
          <div
            className="transition-transform duration-100 ease-out will-change-transform flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`
            }}
          >
            {/* รูปภาพเอกสาร KYC */}
            <Image
              src={imageUrl}
              alt={title}
              width={900}
              height={600}
              className="max-h-[70vh] w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-none"
              priority
              unoptimized
            />
          </div>

          {/* ป้ายแนะนำการใช้งานเมื่อมีการซูมภาพ */}
          {scale > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-700 pointer-events-none shadow-lg">
              <Move className="w-3.5 h-3.5 text-blue-400" />
              <span>คลิกลากเพื่อเลื่อนดูรายละเอียดตัวเลขและวันหมดอายุ</span>
            </div>
          )}
        </div>

        {/* แถบแสดงสถานะด้านล่างสุด (Bottom Helper Bar) */}
        <div className="px-5 py-2.5 bg-slate-950/90 border-t border-slate-800 text-slate-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>หมุน: {rotation}°</span>
            <span>•</span>
            <span>ระดับการขยาย: {Math.round(scale * 100)}%</span>
          </div>

          {/* ปุ่มคืนค่าเริ่มต้นการดูรูป */}
          <button
            onClick={handleReset}
            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>คืนค่าเริ่มต้น</span>
          </button>
        </div>
      </div>
    </div>
  );
}

