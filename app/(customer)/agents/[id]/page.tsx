'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BadgeCheck, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  Home, 
  Building2, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Share2, 
  Copy, 
  ArrowLeft, 
  UserCheck, 
  Check, 
  ChevronRight,
  ExternalLink,
  Briefcase,
  Clock,
  Shield
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import PropertyCard from '@/components/customer/PropertyCard';
import { Property } from '@/types';
import { toast } from '@/components/ui/toast';

interface AgentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  lineId: string | null;
  avatar: string;
  role: string;
  experience: string | null;
  specialtyZone: string;
  specialtyType: string;
  isVerified: boolean;
  isPro: boolean;
  createdAt: string;
  stats: {
    activeListingsCount: number;
    soldCount: number;
    reviewCount: number;
    averageRating: number;
    ratingBreakdown: Record<number, number>;
  };
}

interface CustomerReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customerName: string;
  customerImage?: string | null;
  propertyTitle: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const { favorites, toggleFavorite } = useApp();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLine, setCopiedLine] = useState(false);

  useEffect(() => {
    if (!agentId) return;

    fetch(`/api/agents/${agentId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('ไม่พบข้อมูลนายหน้าท่านนี้');
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.agent) {
          setAgent(data.agent);
          setProperties(data.properties || []);
          setReviews(data.reviews || []);
        } else {
          setError(data.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'ไม่สามารถโหลดข้อมูลนายหน้าได้');
        setLoading(false);
      });
  }, [agentId]);

  const handleCopyProfileUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('คัดลอกลิงก์โปรไฟล์นายหน้าแล้ว');
    }
  };

  const handleCopyLineId = (lineId: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(lineId);
      setCopiedLine(true);
      toast.success(`คัดลอก LINE ID: ${lineId} แล้ว`);
      setTimeout(() => setCopiedLine(false), 2000);
    }
  };

  // ฟังก์ชันคำนวณระยะเวลาร่วมงานเป็น ปี และ เดือน
  const formatTenureDuration = (createdDateStr: string) => {
    if (!createdDateStr) return '';
    const start = new Date(createdDateStr);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0 && months > 0) {
      return `${years} ปี ${months} เดือน`;
    } else if (years > 0) {
      return `${years} ปี`;
    } else if (months > 0) {
      return `${months} เดือน`;
    } else {
      return 'น้อยกว่า 1 เดือน';
    }
  };

  // แยกทำเลที่เชี่ยวชาญออกมาเป็นแท็ก
  const specialtyZonesList = agent?.specialtyZone
    ? agent.specialtyZone
        .split(/[/,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs font-semibold">กำลังโหลดข้อมูลนายหน้ามืออาชีพ...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">ไม่พบนายหน้าท่านนี้</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {error || 'ข้อมูลนายหน้าที่คุณค้นหาอาจถูกระงับ หรือไม่มีอยู่ในระบบ'}
          </p>
          <div className="pt-2">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้านายหน้าทั้งหมด</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reviewBreakdown = agent.stats.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviewCount = agent.stats.reviewCount || 0;

  return (
    <div className="bg-slate-50/60 min-h-screen text-slate-800 antialiased pb-24 lg:pb-16 font-sans text-sm">
      {/* 1. Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <Link href="/" className="hover:text-blue-600 transition font-medium">
            หน้าแรก
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href="/agents" className="hover:text-blue-600 transition font-medium">
            นายหน้ามืออาชีพ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-800 font-bold truncate">{agent.name}</span>
        </div>

        <button
          type="button"
          onClick={handleCopyProfileUrl}
          className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition cursor-pointer shrink-0 text-xs shadow-2xs"
          title="แชร์โปรไฟล์นายหน้า"
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">แชร์โปรไฟล์</span>
        </button>
      </div>

      {/* 2. Main 2-Column Responsive Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =============================================================== */}
          {/* คอลัมน์ซ้าย (70% - 8 Cols): ข้อมูลหลักของนายหน้าทั้งหมด           */}
          {/* =============================================================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 2.1 Hero Profile Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* รูปโปรไฟล์ */}
                <div className="relative shrink-0">
                  <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full overflow-hidden border-2 border-slate-100 shadow-md bg-slate-100 relative">
                    <Image
                      src={agent.avatar}
                      alt={agent.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {agent.isVerified && (
                    <div 
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                      title="ยืนยันตัวตนแล้วโดย Srichai Property"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* ข้อมูลประจำตัว */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {agent.name}
                    </h1>

                    {agent.isPro && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-xs">
                        <BadgeCheck className="w-3.5 h-3.5 shrink-0" /> Verified PRO
                      </span>
                    )}

                    {agent.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-blue-600" /> ยืนยันตัวตนแล้ว
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5">
                    <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{agent.role}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      ประสบการณ์ {agent.experience || formatTenureDuration(agent.createdAt)}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{agent.specialtyZone}</span>
                    </span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="text-slate-500">สมาชิก Srichai Property Network</span>
                  </div>
                </div>
              </div>

              {/* สรุป 4 สถิติภาพรวม */}
              <div className="pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 border-r border-slate-100 last:border-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ทรัพย์ที่ดูแล</p>
                  <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{agent.stats.activeListingsCount} ประกาศ</p>
                </div>

                <div className="p-2 sm:border-r border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ปิดการขายแล้ว</p>
                  <p className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">{agent.stats.soldCount} รายการ</p>
                </div>

                <div className="p-2 border-r border-slate-100 last:border-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">คะแนนความพึงพอใจ</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {agent.stats.averageRating > 0 ? agent.stats.averageRating.toFixed(1) : '-'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">({agent.stats.reviewCount})</span>
                  </div>
                </div>

                <div className="p-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะตรวจสอบ</p>
                  <div className="inline-flex items-center gap-1 text-blue-600 font-bold text-xs mt-1">
                    <BadgeCheck className="w-4 h-4 shrink-0" />
                    <span>รับรองโดยเครือข่าย</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.2 Section: ประวัติและความเชี่ยวชาญ */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Award className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 className="text-base font-extrabold text-slate-900">
                  ประวัติและความเชี่ยวชาญ
                </h2>
              </div>

              {/* ข้อมูลประสบการณ์ทำงาน: กี่ปี กี่เดือน */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                      ประสบการณ์ในวงการอสังหาฯ
                    </p>
                    <p className="text-base font-black text-slate-900">
                      {agent.experience || 'นายหน้ามืออาชีพ'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      เชี่ยวชาญด้านการจัดหาและให้คำปรึกษาซื้อ-ขาย-เช่า
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                      ร่วมงานกับ Srichai Property
                    </p>
                    <p className="text-base font-black text-slate-900">
                      {formatTenureDuration(agent.createdAt)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      เข้าร่วมเครือข่ายเมื่อ {new Date(agent.createdAt).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* ทำเลและประเภทอสังหาฯ */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-2">ทำเลที่ให้บริการหลัก:</h3>
                  <div className="flex flex-wrap gap-2">
                    {specialtyZonesList.length > 0 ? (
                      specialtyZonesList.map((zone) => (
                        <span
                          key={zone}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {zone}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">สงขลา และ หาดใหญ่</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-2">ประเภทอสังหาริมทรัพย์ที่ถนัด:</h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
                    <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>{agent.specialtyType}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>ผ่านการยืนยันตัวตน ตรวจสอบบัตรประชาชน และมีสัญญาแต่งตั้งตัวแทนนายหน้ากับเครือข่ายเรียบร้อย</span>
                </div>
              </div>
            </div>

            {/* 2.3 Section: อสังหาริมทรัพย์ที่ดูแล */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600 shrink-0" />
                  <h2 className="text-base font-extrabold text-slate-900">
                    อสังหาริมทรัพย์ที่ดูแลทั้งหมด ({properties.length} ประกาศ)
                  </h2>
                </div>

                {properties.length > 0 && (
                  <Link
                    href={`/search?agentId=${encodeURIComponent(agent.id)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    <span>ค้นหาแบบละเอียด</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </Link>
                )}
              </div>

              {properties.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-4 space-y-3">
                  <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Home className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">ยังไม่มีประกาศเปิดขายในขณะนี้</h3>
                  <p className="text-slate-500 text-xs">
                    นายหน้าท่านนี้อาจกำลังเตรียมลงรายการใหม่ หรือทรัพย์ก่อนหน้าถูกปิดการขายเรียบร้อยแล้ว
                  </p>
                  <div className="pt-2">
                    <a
                      href={`tel:${agent.phone}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>โทรสอบถามทรัพย์ใหม่โดยตรง</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {properties.map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      prop={prop}
                      isFav={favorites.includes(prop.id)}
                      toggleFavorite={toggleFavorite}
                      viewMode="grid"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 2.4 Section: รีวิวและความคิดเห็นจากลูกค้า */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Star className="w-5 h-5 text-amber-500 shrink-0 fill-amber-500" />
                <h2 className="text-base font-extrabold text-slate-900">
                  รีวิวและความคิดเห็นจากลูกค้า ({reviews.length})
                </h2>
              </div>

              {/* การ์ดสรุปคะแนนดาว */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="text-center sm:text-left shrink-0">
                    <p className="text-4xl font-black text-slate-900 tracking-tight">
                      {agent.stats.averageRating > 0 ? agent.stats.averageRating.toFixed(1) : '5.0'}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      จากทั้งหมด {totalReviewCount} ความคิดเห็น
                    </p>
                  </div>

                  <div className="flex-1 w-full space-y-1.5 text-xs">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewBreakdown[star] || 0;
                      const percent = totalReviewCount > 0 ? Math.round((count / totalReviewCount) * 100) : (star === 5 ? 100 : 0);
                      return (
                        <div key={star} className="flex items-center gap-2.5">
                          <span className="w-6 font-bold text-slate-600 flex items-center gap-0.5 text-xs">
                            {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                          </span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="w-6 text-right font-medium text-slate-400 text-[11px]">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* รายการรีวิว */}
              {reviews.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm max-w-md mx-auto space-y-2.5">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Star className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">ยังไม่มีรีวิวสำหรับนายหน้าท่านนี้</h3>
                  <p className="text-slate-500 text-xs">
                    เมื่อคุณได้นัดหมายและเข้าชมอสังหาริมทรัพย์จริง คุณจะสามารถเขียนรีวิวและให้คะแนนการบริการได้
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                              {rev.customerImage ? (
                                <Image
                                  src={rev.customerImage}
                                  alt={rev.customerName}
                                  width={28}
                                  height={28}
                                  className="object-cover w-full h-full"
                                  unoptimized
                                />
                              ) : (
                                rev.customerName.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs">{rev.customerName}</p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(rev.createdAt).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate max-w-[180px]">เกี่ยวกับ: {rev.propertyTitle}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold shrink-0 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ตรวจรับการเข้าชมแล้ว</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2.5 พื้นที่รองรับอนาคต: นโยบายคุ้มครองผู้ซื้อ */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-950 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-blue-900">มาตรฐานความปลอดภัยจาก Srichai Property Network</p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  นายหน้าทุกท่านในเครือข่ายผ่านการตรวจสอบประวัติและสัญญาตัวแทนเรียบร้อยแล้ว 
                  พร้อมมีทีมงานฝ่ายกฎหมายและสินเชื่อส่วนกลางดูแลให้คำปรึกษาตลอดทุกขั้นตอน
                </p>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* คอลัมน์ขวา (30% - 4 Cols): กล่องติดต่อ Sticky Sidebar ลอยข้างจอ  */}
          {/* =============================================================== */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            
            {/* Contact Action Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  ติดต่อสอบถามนายหน้า
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  พร้อมให้คำปรึกษาและพาชมสถานที่จริง
                </p>
              </div>

              {/* ปุ่มโทรด่วน (Primary Action) */}
              <a
                href={`tel:${agent.phone}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition active:scale-95 cursor-pointer"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>โทรติดต่อ {agent.phone}</span>
              </a>

              {/* ปุ่ม LINE (Secondary Action) */}
              {agent.lineId ? (
                <button
                  type="button"
                  onClick={() => handleCopyLineId(agent.lineId!)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>LINE ID: {agent.lineId}</span>
                  {copiedLine ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3 h-3 opacity-80" />}
                </button>
              ) : null}

              {/* ปุ่มส่งอีเมล */}
              <a
                href={`mailto:${agent.email}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span>ส่งอีเมลสอบถาม</span>
              </a>

              {/* ข้อมูลการให้บริการเพิ่มเติม */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">เวลาที่สะดวกติดต่อ:</span>
                  <span className="font-semibold text-slate-700">09:00 - 18:00 น.</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">การตอบกลับ:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ตอบกลับรวดเร็ว
                  </span>
                </div>
              </div>
            </div>

            {/* Srichai Trust Guarantee Badge Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <h4 className="font-bold text-xs">Srichai Verified Guarantee</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                อสังหาริมทรัพย์ทุกรายการผ่านการตรวจสอบเอกสารสิทธิ์และพิกัดแปลงที่ดินก่อนเปิดให้เข้าชมจริง
              </p>
              <div className="pt-1 flex items-center gap-2 text-[10px] text-blue-300 font-bold">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>ดูแลโดยทีมงานมืออาชีพ</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Mobile Floating Contact Bar (แสดงเฉพาะจอมือถือ) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 flex items-center gap-2.5 z-40 lg:hidden shadow-lg">
        <a
          href={`tel:${agent.phone}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>โทร {agent.phone}</span>
        </a>

        {agent.lineId && (
          <button
            type="button"
            onClick={() => handleCopyLineId(agent.lineId!)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>LINE: {agent.lineId}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopyProfileUrl}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer shrink-0"
          title="แชร์โปรไฟล์"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
