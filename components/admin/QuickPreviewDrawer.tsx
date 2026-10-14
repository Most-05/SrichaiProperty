'use client';

/**
 * ==============================================================================
 * [SEARCH: ADMIN_QUICK_PREVIEW_DRAWER] [UI: ลิ้นชักพรีวิวทรัพย์แอดมิน] [STYLE: PREVIEW_DRAWER_OVERLAY]
 * ลิ้นชักพรีวิวข้อมูลทรัพย์สินด่วนสำหรับผู้ดูแลระบบ (Admin Quick Preview Drawer)
 * /components/admin/QuickPreviewDrawer.tsx
 * ==============================================================================
 * วัตถุประสงค์และฟังก์ชันหลัก:
 * 1. Customer-matched Design System: ปรับโทนสี Typography และการ์ดข้อมูลให้ตรงกับ
 *    หน้ารายละเอียดอสังหาริมทรัพย์ฝั่งลูกค้า (/property/[id]) 100% (WYSIWYG)
 * 2. Rapid Moderation Flow: สไลด์เปิดดูภาพ สเปก ทำเล โฉนดที่ดิน และข้อมูลนายหน้า
 *    พร้อมปุ่ม "อนุมัติ", "ตีกลับ", หรือ "แก้ไขประกาศ" ได้ในที่เดียว
 * 3. SLA & Deed Auditing: แสดงโฉนดที่ดินและเวลา SLA สำหรับการตรวจสอบความปลอดภัย
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Car,
  Layers,
  ShieldCheck,
  FileText,
  ExternalLink,
  Phone,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Pencil,
  Eye,
  ImageIcon,
  Waves,
  Dumbbell,
  Video,
  Trees,
  Smile,
  Building2,
  ArrowUpDown,
  PawPrint
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

// ปิด SSR สำหรับแผนที่เสมอ — Leaflet เข้าถึง window/document ตอนโหลดโมดูล
const PropertyLocationMap = dynamic(() => import('@/components/property/PropertyLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-52 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 text-xs font-bold">
      กำลังโหลดแผนที่...
    </div>
  )
});

// ----------------------------------------------------------------------------
// HELPER: ดึงไอคอนสิ่งอำนวยความสะดวกแบบเดียวกับหน้าลูกค้า (/property/[id])
// ----------------------------------------------------------------------------
function getAmenityIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('ว่ายน้ำ') || n.includes('pool')) return Waves;
  if (n.includes('ฟิตเนส') || n.includes('fitness') || n.includes('ยิม') || n.includes('gym')) return Dumbbell;
  if (n.includes('จอดรถ') || n.includes('parking')) return Car;
  if (n.includes('ปลอดภัย') || n.includes('security') || n.includes('รปภ')) return ShieldCheck;
  if (n.includes('กล้อง') || n.includes('cctv') || n.includes('วงจรปิด')) return Video;
  if (n.includes('สวน') || n.includes('park') || n.includes('garden')) return Trees;
  if (n.includes('เด็ก') || n.includes('playground')) return Smile;
  if (n.includes('คลับ') || n.includes('สโมสร') || n.includes('club')) return Building2;
  if (n.includes('ลิฟต์') || n.includes('lift') || n.includes('elevator')) return ArrowUpDown;
  if (n.includes('สัตว์') || n.includes('pet')) return PawPrint;
  return CheckCircle2;
}

export interface QuickPreviewProperty {
  id: string;
  title: string;
  price: string;
  listingType: 'sale' | 'rent';
  type: string;
  location: string;
  province?: string;
  amphure?: string;
  district?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  parkingSpaces?: number;
  floors?: number;
  ownershipType?: string;
  agentName: string;
  agentEmail?: string;
  agentPhone?: string;
  agentLineId?: string;
  agentProfileImage?: string | null;
  agentPlan: string;
  createdAt: string;
  image: string | null;
  images?: string[];
  imageCount: number;
  amenities?: string[];
  documents?: { id: string; url: string; type: string }[];
  slaLabel: string;
  slaLevel: 'normal' | 'warning' | 'urgent' | 'overdue';
  slaMinutesLeft: number;
  slaUrgent?: boolean;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  reviewDurationLabel?: string | null;
  reviewWithinSla?: boolean | null;
  status?: string;
}

interface QuickPreviewDrawerProps {
  property: QuickPreviewProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (property: QuickPreviewProperty) => void;
}

export default function QuickPreviewDrawer({
  property,
  isOpen,
  onClose,
  onApprove,
  onReject
}: QuickPreviewDrawerProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // รีเซ็ตดัชนีรูปภาพเมื่อเปลี่ยนอสังหาริมทรัพย์ (ตามแนวทาง React Recommended Pattern)
  const [prevPropertyId, setPrevPropertyId] = useState(property?.id);
  if (property?.id !== prevPropertyId) {
    setPrevPropertyId(property?.id);
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
  }

  const images = property?.images && property.images.length > 0
    ? property.images
    : property?.image
    ? [property.image]
    : [];

  const currentImage = images[activeImageIndex] || null;

  const nextImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // ดักจับปุ่มบนคีย์บอร์ด: Escape (ปิด), ลูกศรซ้าย/ขวา (เลื่อนดูรูปภาพ)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (images.length > 1) {
          setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
        }
      } else if (e.key === 'ArrowRight') {
        if (images.length > 1) {
          setActiveImageIndex((prev) => (prev + 1) % images.length);
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLightboxOpen, images.length]);

  if (!isOpen || !property) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} แล้ว`);
  };

  const mapSearchUrl = property.latitude && property.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location || '')}`;

  const slaBadgeColor = (level: QuickPreviewProperty['slaLevel']) => {
    if (level === 'urgent' || level === 'overdue') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (level === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Container (ขยายกว้าง max-w-2xl ถึง max-w-3xl ให้สัดส่วนดูโปร่งแบบหน้าลูกค้า) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside
          aria-label="พรีวิวประกาศด่วน"
          className="w-screen max-w-2xl lg:max-w-3xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200"
        >
          {/* Header Bar ด้านบนสุดสไตล์มินิมอลโมเดิร์น */}
          <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="bg-blue-600 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider shadow-xs">
                QUICK PREVIEW
              </span>
              <span className="text-xs text-slate-300 font-mono">
                #{property.id.slice(0, 8)}
              </span>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${slaBadgeColor(
                  property.slaLevel
                )}`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span>SLA: {property.slaLabel}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* ปุ่มเปิดดูหน้าเว็บจริงของลูกค้า (เผื่อทดสอบมุมมองจริง) */}
              <Link
                href={`/property/${property.id}`}
                target="_blank"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                title="เปิดดูหน้าลูกค้าจริงในแท็บใหม่"
              >
                <Eye className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                <span className="hidden sm:inline">หน้าเว็บลูกค้า</span>
              </Link>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="ปิดแถบพรีวิว (Esc)"
              >
                <X className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Scrollable Content (ใช้โทนสีและสเปซิ่งเดียวกับหน้าลูกค้า /property/[id]) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">

            {/* ================================================================
             * 1. PHOTO GALLERY (แกลเลอรีรูปภาพหลัก + สไลด์เลื่อน)
             * ================================================================ */}
            <div className="space-y-3">
              <div
                onClick={() => currentImage && setIsLightboxOpen(true)}
                className={`relative aspect-video sm:h-84 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs group flex items-center justify-center ${
                  currentImage ? 'cursor-zoom-in' : ''
                }`}
                title={currentImage ? 'คลิกเพื่อดูรูปขนาดเต็ม (Lightbox)' : undefined}
              >
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={property.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    priority
                  />
                ) : (
                  <div className="text-center text-slate-400 font-bold text-xs flex flex-col items-center gap-1.5">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <span>ไม่มีรูปภาพแนบในประกาศนี้</span>
                  </div>
                )}

                {/* Badge ปุ่มคลิกขยายรูปใหญ่ (ล่างซ้าย) */}
                {currentImage && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm flex items-center gap-1.5 backdrop-blur-xs transition pointer-events-none">
                    <Maximize2 className="w-3 h-3 shrink-0" />
                    <span>คลิกดูรูปเต็มจอ (หรือกดปุ่มลูกศร)</span>
                  </div>
                )}

                {/* Badge นับจำนวนรูปภาพแบบเดียวกับหน้าลูกค้า */}
                {images.length > 0 && (
                  <div className="absolute top-3.5 right-3.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full z-10 shadow-sm flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeImageIndex + 1} / {images.length} รูป</span>
                  </div>
                )}

                {/* ลูกศรเลื่อนรูปภาพ ซ้าย / ขวา */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition cursor-pointer z-10"
                      title="รูปก่อนหน้า (ปุ่มลูกศรซ้าย)"
                    >
                      <ChevronLeft className="w-5 h-5 shrink-0" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition cursor-pointer z-10"
                      title="รูปถัดไป (ปุ่มลูกศรขวา)"
                    >
                      <ChevronRight className="w-5 h-5 shrink-0" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Strip ด้านล่างรูปใหญ่ */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-500/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`thumb-${idx}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ================================================================
             * 2. MAIN HEADER (หัวข้อ ราคา ป้ายประเภท และรหัสทรัพย์)
             * ================================================================ */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-blue-100">
                  {property.type}
                </span>
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                    property.listingType === 'rent'
                      ? 'bg-violet-50 text-violet-700 border-violet-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  {property.listingType === 'rent' ? 'สำหรับเช่า' : 'สำหรับขาย'}
                </span>
                <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-rose-100">
                  {property.listingType === 'rent' ? 'เช่าด่วน' : 'ขายด่วน'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {property.title}
                </h1>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-2xl sm:text-3xl font-black text-blue-700">
                    ฿ {Number(property.price).toLocaleString()}
                    {property.listingType === 'rent' && (
                      <span className="text-xs text-slate-400 font-semibold ml-1">/ เดือน</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    รหัสทรัพย์: #{String(property.id).slice(-6).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <p>{property.location}</p>
              </div>

              {/* ================================================================
               * 3. KEY SPECS GRID (4 ช่องสเปกหลักแบบเดียวกับหน้าลูกค้า)
               * ================================================================ */}
              <div className="border border-slate-200/60 py-4 grid grid-cols-2 sm:grid-cols-4 gap-y-3 text-center text-slate-600 bg-slate-50/70 rounded-2xl text-[11px] font-bold">
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">ห้องนอน</p>
                  <p className="font-extrabold text-xs text-slate-800 inline-flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>{property.bedrooms} ห้อง</span>
                  </p>
                </div>
                <div className="border-l border-slate-200/60">
                  <p className="text-slate-400 font-medium mb-0.5">ห้องน้ำ</p>
                  <p className="font-extrabold text-xs text-slate-800 inline-flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>{property.bathrooms} ห้อง</span>
                  </p>
                </div>
                <div className="border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-2 sm:pt-0">
                  <p className="text-slate-400 font-medium mb-0.5">ที่จอดรถ</p>
                  <p className="font-extrabold text-xs text-slate-800 inline-flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>{property.parkingSpaces ?? 0} คัน</span>
                  </p>
                </div>
                <div className="border-l border-slate-200/60 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <p className="text-slate-400 font-medium mb-0.5">พื้นที่ใช้สอย</p>
                  <p className="font-extrabold text-xs text-slate-800 inline-flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>{property.area} ตร.ม.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ================================================================
             * 4. SPECIFICATIONS TABLE (ข้อมูลจำเพาะเชิงลึก)
             * ================================================================ */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-2xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>ข้อมูลจำเพาะ</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60">
                <div className="flex justify-between border-b border-slate-200/40 pb-2">
                  <span className="text-slate-400 font-medium">ประเภทอสังหาฯ</span>
                  <span className="font-bold text-slate-700">{property.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/40 pb-2">
                  <span className="text-slate-400 font-medium">รูปแบบการเสนอ</span>
                  <span className="font-bold text-slate-700">{property.listingType === 'rent' ? 'สำหรับเช่า' : 'สำหรับขาย'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/40 pb-2">
                  <span className="text-slate-400 font-medium">กรรมสิทธิ์</span>
                  <span className="font-bold text-slate-700">{property.ownershipType || 'ขายขาด (Freehold)'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/40 pb-2">
                  <span className="text-slate-400 font-medium">จำนวนชั้น</span>
                  <span className="font-bold text-slate-700">{property.floors || 1} ชั้น</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/40 pb-2">
                  <span className="text-slate-400 font-medium">จังหวัด</span>
                  <span className="font-bold text-slate-700">{property.province || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/40 pb-2">
                  <span className="text-slate-400 font-medium">อำเภอ / เขต</span>
                  <span className="font-bold text-slate-700">{property.amphure || property.district || '-'}</span>
                </div>
              </div>
            </div>

            {/* ================================================================
             * 5. AMENITIES (สิ่งอำนวยความสะดวก)
             * ================================================================ */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>สิ่งอำนวยความสะดวก</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((item, idx) => {
                    const AmenityIcon = getAmenityIcon(item);
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <AmenityIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{item}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================================================================
             * 6. DESCRIPTION (รายละเอียดประกาศ)
             * ================================================================ */}
            {property.description && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>รายละเอียดประกาศ</span>
                </h3>
                <div className="p-4 sm:p-5 bg-slate-50/60 rounded-2xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap font-sans">
                  {property.description}
                </div>
              </div>
            )}

            {/* ================================================================
             * 7. LOCATION & MAP (ทำเลและสถานที่ตั้ง)
             * ================================================================ */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>ทำเลและสถานที่ตั้ง</span>
                </h3>

                <a
                  href={mapSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>เปิด Google Maps</span>
                </a>
              </div>

              <div className="p-3.5 bg-slate-50/60 rounded-2xl border border-slate-200/60 space-y-1">
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  {property.location}
                </p>
                {(property.district || property.amphure || property.province) && (
                  <p className="text-[11px] text-slate-500">
                    {[property.district, property.amphure, property.province].filter(Boolean).join(', ')}
                  </p>
                )}
                {property.latitude && property.longitude && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    พิกัดปักหมุด: {Number(property.latitude).toFixed(5)}, {Number(property.longitude).toFixed(5)}
                  </p>
                )}
              </div>

              {/* แผนที่ Interactive Leaflet / OpenStreetMap */}
              <div className="h-52 rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs">
                <PropertyLocationMap
                  latitude={property.latitude != null ? Number(property.latitude) : null}
                  longitude={property.longitude != null ? Number(property.longitude) : null}
                  height={208}
                  editable={false}
                />
              </div>
            </div>

            {/* ================================================================
             * 8. DEEDS & DOCUMENTS (เอกสารสิทธิ์และโฉนดที่ดิน - ข้อมูลเฉพาะแอดมิน)
             * ================================================================ */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>เอกสารสิทธิ์ / โฉนดที่ดิน (สำหรับตรวจสอบ)</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {property.documents?.length || 0} ไฟล์
                </span>
              </div>

              {property.documents && property.documents.length > 0 ? (
                <div className="space-y-2">
                  {property.documents.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          เอกสารสิทธิ์ที่ {idx + 1} ({doc.type.toUpperCase()})
                        </span>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>เปิดดูโฉนด</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3.5 rounded-2xl border border-dashed border-slate-200">
                  ไม่มีเอกสารสิทธิ์หรือโฉนดแนบมาในประกาศนี้
                </p>
              )}
            </div>

            {/* ================================================================
             * 9. AGENT CONTACT CARD (การ์ดนายหน้าผู้ดูแลประกาศ)
             * ================================================================ */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  ผู้ดูแลประกาศ (นายหน้า)
                </span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    property.agentPlan === 'pro'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>{property.agentPlan === 'pro' ? 'Verified PRO' : 'Basic Tier'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-base overflow-hidden shrink-0 border-2 border-white/20">
                  {property.agentProfileImage ? (
                    <Image
                      src={property.agentProfileImage}
                      alt={property.agentName}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    property.agentName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-sm text-white truncate">
                    {property.agentName}
                  </p>
                  <p className="text-xs text-slate-300 truncate">
                    {property.agentEmail || 'ไม่ระบุอีเมล'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                {property.agentPhone && (
                  <a
                    href={`tel:${property.agentPhone}`}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{property.agentPhone}</span>
                  </a>
                )}

                {property.agentLineId && (
                  <button
                    onClick={() => copyToClipboard(property.agentLineId || '', 'LINE ID')}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="คัดลอก LINE ID"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="truncate">LINE: {property.agentLineId}</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* ================================================================
           * 10. STICKY ACTION FOOTER (แถบปุ่มดำเนินการล่างสุด)
           * ================================================================ */}
          <div className="p-4 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>

              {/* [UI: ปุ่มไปหน้าแก้ไขประกาศของนายหน้า] */}
              <Link
                href={`/agent/edit-property/${property.id}`}
                target="_blank"
                className="px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="เปิดหน้าแก้ไขประกาศในแท็บใหม่"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                <span>แก้ไขประกาศ</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {/* [UI: ปุ่มตีกลับ/ส่งแก้ไขในลิ้นชัก] */}
              {onReject && (
                <button
                  onClick={() => onReject(property)}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>ส่งกลับแก้ไข / ตีกลับ</span>
                </button>
              )}

              {/* [UI: ปุ่มอนุมัติประกาศในลิ้นชัก] */}
              {onApprove && (
                <button
                  onClick={() => onApprove(property.id)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>อนุมัติขึ้นเว็บไซต์</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ================================================================
       * LIGHTBOX MODAL (ขยายรูปภาพขนาดเต็มจอสำหรับตรวจสอบลายน้ำ/ความคมชัด)
       * ================================================================ */}
      {isLightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header Bar ใน Lightbox */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-white py-2 shrink-0 border-b border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-200">
                รูปที่ {activeImageIndex + 1} จาก {images.length}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                (กดปุ่มลูกศร &larr; &rarr; บนคีย์บอร์ดเพื่อเปลี่ยนรูป)
              </span>
            </div>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="ปิดหน้าต่างรูปใหญ่ (Esc)"
            >
              <X className="w-4 h-4 shrink-0" />
              <span>ปิด (Esc)</span>
            </button>
          </div>

          {/* รูปภาพขนาดใหญ่ตรงกลาง */}
          <div
            className="relative flex-1 w-full max-w-6xl my-4 flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-h-[75vh] flex items-center justify-center">
              <Image
                src={currentImage}
                alt={`${property.title} - รูปที่ ${activeImageIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* ลูกศรเลื่อนรูปขนาดใหญ่ใน Lightbox */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-white/20 shadow-xl flex items-center justify-center transition cursor-pointer z-10"
                  title="รูปก่อนหน้า (ปุ่มลูกศรซ้าย)"
                >
                  <ChevronLeft className="w-7 h-7 shrink-0" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-white/20 shadow-xl flex items-center justify-center transition cursor-pointer z-10"
                  title="รูปถัดไป (ปุ่มลูกศรขวา)"
                >
                  <ChevronRight className="w-7 h-7 shrink-0" />
                </button>
              </>
            )}
          </div>

          {/* แถบ Thumbnails ขนาดเล็กล่างสุดใน Lightbox */}
          {images.length > 1 && (
            <div
              className="w-full max-w-4xl flex gap-2 overflow-x-auto py-2 justify-center shrink-0 no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-400/50 scale-105 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`thumb-lightbox-${idx}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
