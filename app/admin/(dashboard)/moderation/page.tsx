'use client';

/**
 * ==============================================================================
 * หน้าจัดการตรวจสอบอนุมัติประกาศอสังหาริมทรัพย์สำหรับแอดมิน (Admin Moderation Page)
 * /app/admin/(dashboard)/moderation/page.tsx
 * ==============================================================================
 * ยกระดับสู่มาตรฐานระดับสากล (PropTech Enterprise Standard):
 * 1. Advanced Filters: กรองตามประเภทอสังหาฯ, ช่วงราคา, สถานะนายหน้า (PRO/ทั่วไป), จังหวัด/ทำเล
 * 2. Quick Preview Drawer: แถบข้างสไลด์โชว์รูปภาพทุกรูป, แผนที่ปักหมุด, โฉนด/เอกสาร, สิ่งอำนวยความสะดวก
 * 3. Batch Actions: ติ๊กเลือกหลายประกาศเพื่อ "อนุมัติทั้งหมดในคลิกเดียว" พร้อม Floating Action Bar
 * 4. Reject Reason Presets: ชิปเทมเพลตเหตุผลตีกลับสำเร็จรูปที่แก้ไขข้อความได้อิสระ
 * 5. ส่งออกไฟล์รายงาน CSV และระบบ SLA ติดตามผลการทำงานจริง
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from '@/components/ui/toast';
import QuickPreviewDrawer, { QuickPreviewProperty } from '@/components/admin/QuickPreviewDrawer';
import {
  Search,
  Home,
  Camera,
  MapPin,
  Square,
  Bed,
  Bath,
  Eye,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

export type PropertyData = QuickPreviewProperty;

interface SlaSummary {
  reviewedCount: number;
  averageLabel: string;
  withinSlaCount: number;
  withinSlaPercent: number;
}

// ชุดเทมเพลตเหตุผลตีกลับมาตรฐานสากล
const REJECT_PRESETS = [
  'รูปถ่ายไม่ชัดเจน มีลายน้ำจากเว็บไซต์อื่น หรือมีเบอร์โทรบดบังภาพหลัก',
  'ราคาไม่สมเหตุสมผล หรือระบุหลักตัวเลขผิดพลาด (เช่น ใส่หลักพันแทนหลักล้าน)',
  'ตำแหน่งพิกัดแผนที่ไม่ตรงกับที่ตั้งจริงของอสังหาริมทรัพย์',
  'เอกสารสิทธิ์หรือโฉนดไม่ตรงกับชื่อผู้ลงประกาศ หรือข้อมูลไม่ครบถ้วน',
  'คำบรรยายมีข้อความสแปม โฆษณาซ้ำซ้อน หรือละเมิดข้อกำหนดการใช้งาน',
  'ข้อมูลรายละเอียดทรัพย์ เช่น ขนาดพื้นที่/ห้องนอน/ห้องน้ำ ไม่ตรงกับความเป็นจริง',
];

function AdminModerationContent() {
  // ------------------------------------------------------------------------------
  // 1. STATE MANAGEMENT (การจัดการสถานะภายในคอมโพเนนต์)
  // ------------------------------------------------------------------------------
  // รายการประกาศอสังหาริมทรัพย์ที่ดึงมาจาก API (อิงตามสถานะที่เลือก เช่น pending, approved, rejected)
  const [properties, setProperties] = useState<PropertyData[]>([]);

  // ข้อมูลสถิติ SLA (Service Level Agreement) เช่น จำนวนที่เกินกำหนด, เวลาเฉลี่ยที่ใช้ตรวจ, และร้อยละที่ทันกำหนด
  const [slaSummary, setSlaSummary] = useState<SlaSummary | null>(null);

  // สถานะการโหลดข้อมูลครั้งแรก (แสดง Loading Spinner เต็มหน้าจอขณะยังไม่มีข้อมูล)
  const [loading, setLoading] = useState(true);

  // สถานะการกดปุ่มรีเฟรชข้อมูล (หมุนไอคอน RefreshCw ขณะกำลังดึงข้อมูลใหม่โดยไม่บล็อกหน้าจอ)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tabs & Primary Filters (แท็บสถานะและตัวกรองหลัก)
  // อ่าน query parameter จาก URL เพื่อรองรับ Direct Link เช่น ?tab=approved เมื่อคลิกจากระบบแจ้งเตือน
  const searchParams = useSearchParams();

  // กำหนดสถานะแท็บปัจจุบัน (ค่าเริ่มต้นตรวจจาก URL ถ้าไม่มีให้ใช้ 'pending' เป็นค่าเริ่มต้น)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>(() => {
    const tab = searchParams.get('tab');
    return tab === 'approved' || tab === 'rejected' ? tab : 'pending';
  });

  // ตัวกรองประเภทธุรกรรม: ทั้งหมด ('all'), เฉพาะขาย ('sale'), หรือเฉพาะเช่า ('rent')
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'sale' | 'rent'>('all');

  // ตัวเลือกเปิด/ปิดการจัดเรียงลำดับตามความเร่งด่วนของ SLA (true = เอาคิวที่ใกล้หมดเวลาขึ้นก่อน)
  const [sortBySla, setSortBySla] = useState(false);

  // ข้อความค้นหาด่วน (Search Query) สำหรับค้นหาชื่อประกาศ, ทำเล, ชื่อผู้ลง หรือรหัส ID ทันที
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Filters (ตัวกรองขั้นสูง)
  // ควบคุมการแสดงผลแถบตัวกรองขั้นสูง (เปิด/ปิด Drawer หรือ Dropdown แถบกรอง)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // กรองตามประเภทของอสังหาริมทรัพย์ เช่น บ้านเดี่ยว, คอนโด, ทาวน์โฮม, ที่ดิน (ค่าเริ่มต้นคือ 'all')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');

  // กรองตามช่วงระดับราคา: ต่ำกว่า 3 ล้าน, 3-10 ล้าน หรือ มากกว่า 10 ล้านบาท
  const [priceRangeFilter, setPriceRangeFilter] = useState<'all' | 'under_3m' | '3m_10m' | 'over_10m'>('all');

  // กรองตามระดับสมาชิกของนายหน้า: นายหน้าทั่วไป (basic) หรือ ยืนยันตัวตนแล้ว (pro)
  const [agentTierFilter, setAgentTierFilter] = useState<'all' | 'pro' | 'basic'>('all');

  // กรองตามจังหวัดที่ตั้งของอสังหาริมทรัพย์ (เช่น สงขลา, กรุงเทพมหานคร ฯลฯ)
  const [provinceFilter, setProvinceFilter] = useState('all');

  // Quick Preview Drawer State (สถานะลิ้นชักแสดงตัวอย่างประกาศแบบรวดเร็ว)
  // เก็บข้อมูลอสังหาริมทรัพย์ที่คลิกเพื่อเปิดดูรายละเอียดในแผง Preview Drawer ทางขวามือ
  const [previewProperty, setPreviewProperty] = useState<PropertyData | null>(null);

  // Batch Actions State (สถานะการเลือกหลายรายการพร้อมกัน)
  // ใช้ Set เพื่อเก็บ ID ของรายการที่ติ๊กเลือก ป้องกัน ID ซ้ำและตรวจสอบค่าได้เร็วในระดับ O(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // บันทึกสถานะการส่งคำขออนุมัติแบบกลุ่มไปยัง Server (ป้องกันการกดปุ่มซ้ำขณะประมวลผล)
  const [isBatchApproving, setIsBatchApproving] = useState(false);

  // Reject Modal State (สถานะกล่องข้อความปฏิเสธ/ตีกลับประกาศ)
  // เก็บออบเจกต์ประกาศที่ถูกเลือกเพื่อทำการตีกลับ พร้อมส่งเหตุผลให้นายหน้าแก้ไข
  const [rejectingProperty, setRejectingProperty] = useState<PropertyData | null>(null);

  // ข้อความเหตุผลในการตีกลับ (ตั้งค่าเริ่มต้นจาก REJECT_PRESETS รายการแรก)
  const [rejectReason, setRejectReason] = useState(REJECT_PRESETS[0]);

  // สถานะการบันทึกข้อมูลการตีกลับลงฐานข้อมูล
  const [submittingReject, setSubmittingReject] = useState(false);

  // ------------------------------------------------------------------------------
  // 2. DATA FETCHING (ฟังก์ชันดึงข้อมูลจาก API คิวตรวจสอบ)
  // ------------------------------------------------------------------------------
  // ดึงรายการประกาศตามสถานะ (pending, approved, rejected) และประเภทธุรกรรม (all, sale, rent)
  const fetchProperties = (status: string, listingType: string) => {
    // สร้าง query parameter สำหรับประเภทธุรกรรม (ถ้าเป็น 'all' จะไม่แนบไปใน URL)
    const query = listingType === 'all' ? '' : `&listingType=${listingType}`;

    // ส่งคำขอแบบ GET ไปยัง API ฝั่งแอดมินเพื่อโหลดคิวประกาศตามเงื่อนไข
    fetch(`/api/admin/moderation?status=${status}${query}`)
      .then(res => res.json()) // แปลงผลลัพธ์การตอบกลับของ Server ให้อยู่ในรูป JSON
      .then(data => {
        // ตรวจสอบว่า API ส่งผลลัพธ์สำเร็จ (success: true) หรือไม่
        if (data.success) {
          // บันทึกรายการประกาศลงใน State (หากไม่มี ให้ใช้ Array ว่างป้องกัน runtime error)
          setProperties(data.properties || []);
          // บันทึกข้อมูลสรุปเวลา SLA สำหรับประเมินประสิทธิภาพการทำงาน
          setSlaSummary(data.slaSummary ?? null);
        }
      })
      .catch(err => {
        // บันทึกข้อผิดพลาดใน Console กรณีเชื่อมต่อเครือข่ายล้มเหลว
        console.error("เกิดข้อผิดพลาดในการโหลดคิวประกาศ:", err);
      })
      .finally(() => {
        // ปิดสถานะโหลดข้อมูลทั้งการโหลดครั้งแรกและสถานะปุ่มรีเฟรช
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  // ดักจับการเปลี่ยนแปลงของแท็บสถานะ (activeTab) หรือตัวกรองธุรกรรม (listingTypeFilter)
  useEffect(() => {
    fetchProperties(activeTab, listingTypeFilter);
  }, [activeTab, listingTypeFilter]);

  // ฟังก์ชันรองรับการกดปุ่มรีเฟรชข้อมูลด้วยตนเอง (Triggered by Refresh Button)
  const handleRefresh = () => {
    setIsRefreshing(true); // เปิดเอฟเฟกต์หมุนไอคอน
    fetchProperties(activeTab, listingTypeFilter); // โหลดข้อมูลล่าสุด
  };

  // Distinct Lists for Dynamic Filter Dropdowns (สร้างรายการตัวเลือกที่ไม่ซ้ำกันสำหรับ Dropdown)
  // ดึงประเภทอสังหาริมทรัพย์ที่ไม่ซ้ำกันจากรายการปัจจุบันมาทำตัวเลือก Dropdown
  const distinctPropertyTypes = useMemo(() => {
    const set = new Set<string>(); // ใช้ Set กรองค่าที่ซ้ำออกโดยอัตโนมัติ
    properties.forEach(p => {
      if (p.type) set.add(p.type); // เพิ่มประเภททรัพย์เฉพาะที่มีค่า
    });
    return Array.from(set); // แปลง Set กลับเป็น Array เพื่อใช้ map ใน JSX
  }, [properties]);

  // ดึงรายชื่อจังหวัดที่ไม่ซ้ำกันจากรายการปัจจุบันมาทำตัวเลือก Dropdown
  const distinctProvinces = useMemo(() => {
    const set = new Set<string>(); // ใช้ Set คัดกรองจังหวัดที่ไม่ซ้ำ
    properties.forEach(p => {
      if (p.province) set.add(p.province); // เพิ่มจังหวัดเฉพาะที่มีค่า
    });
    return Array.from(set); // แปลง Set กลับเป็น Array เพื่อวนลูปสร้าง <option>
  }, [properties]);

  // Filtered Properties Pipeline (กระบวนการกรองและจัดเรียงข้อมูลแบบ Multi-stage)
  const displayedProperties = useMemo(() => {
    let list = properties; // เริ่มต้นจากรายการประกาศทั้งหมดที่โหลดมา

    // ขั้นตอนที่ 1: กรองตามคำค้นหา (Search Query) โดยแปลงเป็นตัวพิมพ์เล็กและตัดช่องว่าง
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||      // ค้นหาจากชื่อหัวข้อประกาศ
        (p.location || '').toLowerCase().includes(q) ||   // ค้นหาจากทำเลที่ตั้ง
        (p.agentName || '').toLowerCase().includes(q) ||  // ค้นหาจากชื่อนายหน้า
        (p.id || '').toLowerCase().includes(q)            // ค้นหาจากรหัสประกาศ
      );
    }

    // ขั้นตอนที่ 2: กรองตามประเภทอสังหาริมทรัพย์ (Property Type)
    if (propertyTypeFilter !== 'all') {
      list = list.filter(p => p.type === propertyTypeFilter);
    }

    // ขั้นตอนที่ 3: กรองตามช่วงราคา (Price Range)
    if (priceRangeFilter !== 'all') {
      list = list.filter(p => {
        const price = Number(p.price) || 0; // แปลงราคาเป็นตัวเลข Number
        if (priceRangeFilter === 'under_3m') return price < 3000000;                     // ต่ำกว่า 3 ล้านบาท
        if (priceRangeFilter === '3m_10m') return price >= 3000000 && price <= 10000000; // ระหว่าง 3 - 10 ล้านบาท
        if (priceRangeFilter === 'over_10m') return price > 10000000;                     // มากกว่า 10 ล้านบาทขึ้นไป
        return true;
      });
    }

    // ขั้นตอนที่ 4: กรองตามระดับสมาชิกของนายหน้า (Agent Tier)
    if (agentTierFilter !== 'all') {
      list = list.filter(p => {
        if (agentTierFilter === 'pro') return p.agentPlan === 'pro';   // เฉพาะ Verified PRO Agent
        if (agentTierFilter === 'basic') return p.agentPlan !== 'pro'; // นายหน้าทั่วไป (Basic)
        return true;
      });
    }

    // ขั้นตอนที่ 5: กรองตามจังหวัด (Province)
    if (provinceFilter !== 'all') {
      list = list.filter(p => p.province === provinceFilter);
    }

    // ขั้นตอนที่ 6: จัดเรียงลำดับตามความเร่งด่วนของเวลา SLA (Sort by SLA)
    return sortBySla
      ? [...list].sort((a, b) => a.slaMinutesLeft - b.slaMinutesLeft) // เรียงจากเวลาที่เหลือน้อยที่สุดขึ้นก่อน
      : list; // หากไม่ได้เลือก ให้แสดงผลตามลำดับเดิมที่ได้จากฐานข้อมูล
  }, [
    properties,
    searchQuery,
    propertyTypeFilter,
    priceRangeFilter,
    agentTierFilter,
    provinceFilter,
    sortBySla
  ]);

  // ฟังก์ชันล้างค่าตัวกรองทั้งหมดกลับสู่สถานะเริ่มต้น
  const resetAllFilters = () => {
    setSearchQuery('');          // ล้างช่องค้นหา
    setPropertyTypeFilter('all'); // รีเซ็ตประเภทอสังหาฯ
    setPriceRangeFilter('all');   // รีเซ็ตช่วงราคา
    setAgentTierFilter('all');    // รีเซ็ตระดับสมาชิกนายหน้า
    setProvinceFilter('all');     // รีเซ็ตจังหวัด
    setListingTypeFilter('all');  // รีเซ็ตประเภทธุรกรรม
    setSortBySla(false);          // ปิดการจัดเรียงตาม SLA
  };

  // ตรวจสอบว่ามีตัวกรองขั้นสูงใดกำลังเปิดใช้งานอยู่หรือไม่ (สำหรับแสดงจุดแจ้งเตือนสีฟ้า)
  const hasActiveAdvancedFilters =
    propertyTypeFilter !== 'all' ||
    priceRangeFilter !== 'all' ||
    agentTierFilter !== 'all' ||
    provinceFilter !== 'all';

  // ------------------------------------------------------------------------------
  // 3. ACTION HANDLERS (ฟังก์ชันจัดการการกระทำของแอดมิน)
  // ------------------------------------------------------------------------------
  // ฟังก์ชันหลักในการอัปเดตสถานะประกาศ (อนุมัติ / ปฏิเสธ) ไปยัง API
  const updateStatus = async (id: string, newStatus: string, reason?: string) => {
    try {
      // ส่งคำขอแบบ PATCH ไปยัง /api/properties เพื่อเปลี่ยนสถานะ
      const res = await fetch('/api/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, ...(reason ? { reason } : {}) }) // แนบเหตุผลเพิ่มเติมกรณีปฏิเสธ
      });
      const data = await res.json(); // ถอดรหัส JSON จากการตอบกลับ
      if (data.success) {
        toast.success("อัปเดตสถานะประกาศเรียบร้อยแล้ว"); // แจ้งเตือนความสำเร็จ
        fetchProperties(activeTab, listingTypeFilter);     // ดึงข้อมูลใหม่เพื่ออัปเดตตาราง
        if (previewProperty?.id === id) setPreviewProperty(null); // ปิดลิ้นชัก Preview หากเป็นรายการเดียวกัน
      } else {
        toast.error("เกิดข้อผิดพลาด: " + data.error); // แจ้งเตือนข้อผิดพลาดจากฝั่ง Backend
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ:", err);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  // ฟังก์ชันจัดการเมื่อคลิกปุ่มอนุมัติประกาศเดี่ยว (พร้อมกล่องถามยืนยัน)
  const handleApprove = async (id: string) => {
    // แสดงกล่องข้อความยืนยันก่อนบันทึกจริงเพื่อป้องกันการกดพลาด
    if (!confirm('ยืนยันการอนุมัติประกาศนี้เพื่อเปิดแสดงผลบนเว็บไซต์?')) return;
    await updateStatus(id, 'approved'); // ส่งคำขออนุมัติไปยังฐานข้อมูล
  };

  // Batch Selection Logic (ระบบการเลือกหลายรายการพร้อมกัน)
  // ฟังก์ชันสลับสถานะเลือก/ไม่เลือกของประกาศรายการนั้นๆ
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds); // ทำสำเนา Set เดิมเพื่อไม่ให้กระทบการ Render ก่อนหน้า
    if (next.has(id)) {
      next.delete(id); // ถ้ามีอยู่แล้ว ให้ลบออกจากการเลือก
    } else {
      next.add(id);    // ถ้ายังไม่มี ให้เพิ่มเข้าไปใน Set
    }
    setSelectedIds(next); // อัปเดต State รายการที่เลือก
  };

  // ฟังก์ชันเลือกทั้งหมด หรือ ยกเลิกการเลือกทั้งหมด
  const handleSelectAll = () => {
    // ถ้าจำนวนที่เลือกเท่ากับจำนวนรายการที่แสดงอยู่ ให้ยกเลิกทั้งหมด
    if (selectedIds.size === displayedProperties.length) {
      setSelectedIds(new Set()); // ล้าง Set ให้ว่างเปล่า
    } else {
      // ถ้ายังไม่ครบ ให้เลือกทุก ID ที่กำลังแสดงอยู่ในตารางปัจจุบัน
      setSelectedIds(new Set(displayedProperties.map(p => p.id)));
    }
  };

  // ฟังก์ชันอนุมัติรายการประกาศที่เลือกไว้พร้อมกันทั้งหมด (Batch Approval)
  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds); // แปลง Set เป็น Array เพื่อส่งใน Request Body
    if (ids.length === 0) return; // หากไม่มีรายการที่เลือก ให้หยุดการทำงาน
    if (!confirm(`ยืนยันการอนุมัติประกาศทั้งหมด ${ids.length} รายการที่เลือกไว้พร้อมกัน?`)) return;

    setIsBatchApproving(true); // เปิดสถานะกำลังประมวลผล เพื่อปิดการใช้งานปุ่มซ้ำ
    try {
      // ส่งคำขอแบบ PATCH แบบแนบรายการ IDs ไปยัง API
      const res = await fetch('/api/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'approved' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`อนุมัติสำเร็จ ${data.count || ids.length} รายการเรียบร้อยแล้ว`);
        setSelectedIds(new Set()); // ล้างรายการที่เลือกไว้ทั้งหมด
        fetchProperties(activeTab, listingTypeFilter); // โหลดคิวประกาศใหม่
      } else {
        toast.error("เกิดข้อผิดพลาด: " + (data.error || "ไม่สามารถอนุมัติได้"));
      }
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    } finally {
      setIsBatchApproving(false); // ปิดสถานะประมวลผล
    }
  };

  // Reject Modal Handlers (ฟังก์ชันจัดการการปฏิเสธประกาศพร้อมระบุเหตุผล)
  // เปิดกล่อง Modal ปฏิเสธประกาศสำหรับรายการที่กำหนด
  const openRejectModal = (property: PropertyData) => {
    setRejectingProperty(property); // กำหนดประกาศเป้าหมาย
    setRejectReason(REJECT_PRESETS[0]); // ตั้งค่าเหตุผลเริ่มต้นจากเทมเพลตมาตรฐาน
  };

  // ปิดกล่อง Modal ปฏิเสธประกาศ
  const closeRejectModal = () => {
    setRejectingProperty(null); // เคลียร์ประกาศเป้าหมาย
  };

  // ยืนยันการปฏิเสธประกาศและส่งข้อมูลเหตุผลไปยัง Backend
  const confirmReject = async () => {
    if (!rejectingProperty) return;
    if (!rejectReason.trim()) {
      toast.warning('กรุณาระบุเหตุผลการปฏิเสธประกาศ'); // แจ้งเตือนหากไม่ได้กรอกเหตุผล
      return;
    }

    setSubmittingReject(true); // เปิดสถานะกำลังบันทึก
    // เรียก updateStatus เพื่อเปลี่ยนสถานะเป็น 'rejected' พร้อมระบุข้อความเหตุผล
    await updateStatus(rejectingProperty.id, 'rejected', rejectReason.trim());
    setSubmittingReject(false); // ปิดสถานะกำลังบันทึก
    closeRejectModal();         // ปิดหน้าต่าง Modal
  };

  // CSV Export (ฟังก์ชันส่งออกข้อมูลตารางคิวตรวจสอบเป็นไฟล์ CSV)
  const handleExportCSV = () => {
    // ตรวจสอบว่ามีข้อมูลสำหรับส่งออกหรือไม่
    if (displayedProperties.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    // กำหนดหัวตารางของไฟล์ CSV
    const headers = ['รหัสประกาศ', 'หัวข้อ', 'ราคา', 'ประเภทธุรกรรม', 'ประเภทอสังหาฯ', 'จังหวัด', 'อำเภอ', 'ทำเล', 'นายหน้า', 'แพ็กเกจ', 'เวลาที่ลงประกาศ'];

    // แปลงข้อมูลแต่ละแถวให้อยู่ในฟอร์แมต CSV (ครอบข้อความด้วยเครื่องหมายคำพูดสองชั้นเพื่อป้องกันปัญหามีจุลภาคคั่นในข้อความ)
    const rows = displayedProperties.map(p => [
      `"${p.id}"`,
      `"${p.title.replace(/"/g, '""')}"`, // escape เครื่องหมายคำพูด
      p.price,
      p.listingType === 'rent' ? 'เช่า' : 'ขาย',
      `"${p.type}"`,
      `"${p.province || ''}"`,
      `"${p.amphure || ''}"`,
      `"${p.location.replace(/"/g, '""')}"`,
      `"${p.agentName}"`,
      p.agentPlan === 'pro' ? 'Verified PRO' : 'Basic',
      `"${new Date(p.createdAt).toLocaleString('th-TH')}"`
    ]);

    // เติม Byte Order Mark (\uFEFF) นำหน้า เพื่อให้ Microsoft Excel รองรับภาษาไทยได้สมบูรณ์โดยไม่แสดงผลเป็นภาษาต่างดาว
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); // สร้าง Blob ออบเจกต์
    const url = URL.createObjectURL(blob); // สร้าง Temporary URL สำหรับดาวน์โหลด
    const link = document.createElement('a'); // สร้างแท็ก <a> จำลองในหน่วยความจำ
    link.setAttribute('href', url);
    link.setAttribute('download', `srichai_moderation_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); // เพิ่มแท็กเข้า DOM ชั่วคราว
    link.click();                    // กระตุ้นการคลิกเพื่อดาวน์โหลดไฟล์ลงเครื่องผู้ใช้
    document.body.removeChild(link); // ลบแท็กออกจาก DOM คืนหน่วยความจำ
    toast.success('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
  };

  // ฟังก์ชันคำนวณคลาสสีของป้ายกำกับ SLA (ใช้โทนสีเทาสุภาพเดียวกันทั้งหมดเพื่อความเรียบง่าย ไม่ซับซ้อน)
  const slaBadgeClass = (_level?: PropertyData['slaLevel']) => {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // ------------------------------------------------------------------------------
  // 4. JSX RENDERING (การเรนเดอร์โครงสร้างหน้าจอ UI)
  // ------------------------------------------------------------------------------
  return (
    <>
      {/* ========================================================================
       * แถบหัวกระดาษด้านบน (Top Header Bar)
       * แสดงหัวข้อหน้าจอ, คำอธิบาย, ช่องค้นหาด่วน, ปุ่มเปิดตัวกรอง และปุ่มส่งออก CSV
       * ======================================================================== */}
      <header className="min-h-16 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 shrink-0 relative z-0">
        {/* ข้อความไตเติลและคำบรรยายระบบ */}
        <div>
          <h1 className="text-lg font-extrabold text-slate-800">คิวตรวจสอบประกาศ (Listing Moderation)</h1>
          <p className="text-xs text-slate-500 font-medium">
            ระบบตรวจสอบความถูกต้อง รูปถ่าย และเอกสารสิทธิ์อสังหาริมทรัพย์ระดับพรีเมียม
          </p>
        </div>

        {/* แถบเครื่องมือค้นหาและปุ่มจัดการทางขวา */}
        <div className="flex items-center gap-2">
          {/* ช่องค้นหาด่วน (Live Search Input) รองรับการค้นหาตามชื่อ, ทำเล, รหัส หรือชื่อนายหน้า */}
          <div className="relative w-full sm:w-64">
            {/* ไอคอนแว่นขยาย Search นำหน้าช่องป้อนข้อมูล */}
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // อัปเดตข้อความค้นหาเรียลไทม์
              placeholder="ค้นหาชื่อประกาศ, ทำเล, นายหน้า..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700 text-xs shadow-xs"
            />
            {/* ปุ่มล้างคำค้นหา (กากบาท X) ปรากฏเฉพาะเมื่อมีการพิมพ์ข้อความค้นหา */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')} // ล้างข้อความค้นหาให้ว่าง
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ปุ่มเปิด/ปิด แถบตัวกรองขั้นสูง (Advanced Filters Toggle) */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} // สลับสถานะแสดงแผงตัวกรอง
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition border cursor-pointer shrink-0 ${
              showAdvancedFilters || hasActiveAdvancedFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200' // สีฟ้าเมื่อเปิดใช้งานหรือมีตัวกรองค้างอยู่
                : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200' // สีขาวปกติ
            }`}
            title="ตัวกรองขั้นสูง"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ตัวกรอง</span>
            {/* จุดแจ้งเตือนสีน้ำเงิน แสดงเมื่อมีเงื่อนไขตัวกรองขั้นสูงกำลังทำงานอยู่ */}
            {hasActiveAdvancedFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            )}
          </button>

          {/* ปุ่มรีเฟรชข้อมูล (Refresh Button) เพื่อดึงคิวประกาศล่าสุดจาก Server */}
          <button
            onClick={handleRefresh} // ดึงข้อมูลใหม่
            disabled={isRefreshing} // ปิดการกดระหว่างกำลังหมุนรีเฟรช
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer shrink-0 disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>

          {/* ปุ่มส่งออกรายงานเป็นไฟล์ CSV (CSV Export Button) */}
          <button
            onClick={handleExportCSV} // ส่งออกข้อมูลในตารางเป็นไฟล์ .csv พร้อมรองรับฟอนต์ไทยใน Excel
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition border border-slate-200 shadow-xs cursor-pointer shrink-0"
            title="ส่งออกไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>
        </div>
      </header>

      {/* ========================================================================
       * พื้นที่ทำงานหลัก (Main Workspace)
       * ประกอบด้วย แท็บสถานะ, สรุปผล SLA, ตัวกรองละเอียด, ตารางรายการ และปุ่ม Batch Action
       * ======================================================================== */}
      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
        {/* แท็บสถานะและตัวจัดเรียงด่วน (Status Tabs & Quick Sorters) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          {/* กลุ่มปุ่มสลับแท็บสถานะ: รอตรวจสอบ, อนุมัติแล้ว, ถูกระงับ/ปฏิเสธ */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl max-w-full overflow-x-auto no-scrollbar w-fit border border-slate-200">
            {/* แท็บ 1: รอตรวจสอบ (Pending) พร้อมป้ายแสดงจำนวนประกาศที่รอคิว */}
            <button
              onClick={() => { setActiveTab('pending'); setLoading(true); }} // สลับเป็นแท็บ pending พร้อมเปิด loading
              className={`px-5 py-2 rounded-lg font-bold transition-all text-xs flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60' // แท็บที่เลือก: พื้นขาว ขอบชัด มีเงา
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'     // แท็บปกติ
              }`}
            >
              <span>รอตรวจสอบ</span>
              {/* แสดงตัวนับจำนวนคิวที่ค้างตรวจสีส้ม */}
              {activeTab === 'pending' && properties.length > 0 && (
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[10px] font-black">
                  {properties.length}
                </span>
              )}
            </button>

            {/* แท็บ 2: อนุมัติแล้ว (Approved) */}
            <button
              onClick={() => { setActiveTab('approved'); setLoading(true); }} // สลับเป็นแท็บ approved
              className={`px-5 py-2 rounded-lg font-bold transition-all text-xs whitespace-nowrap cursor-pointer ${
                activeTab === 'approved'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              อนุมัติแล้ว
            </button>

            {/* แท็บ 3: ถูกระงับ/ปฏิเสธ (Rejected) */}
            <button
              onClick={() => { setActiveTab('rejected'); setLoading(true); }} // สลับเป็นแท็บ rejected
              className={`px-5 py-2 rounded-lg font-bold transition-all text-xs whitespace-nowrap cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              ถูกระงับ/ปฏิเสธ
            </button>
          </div>

          {/* แถบตัวกรองด่วนด้านขวา (Quick Filters) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* ตัวเลือกกรองประเภทสัญญา ขาย / เช่า */}
            <select
              value={listingTypeFilter}
              onChange={(e) => { setListingTypeFilter(e.target.value as 'all' | 'sale' | 'rent'); setLoading(true); }}
              className="bg-white border border-slate-200 text-slate-600 font-bold py-2 px-3 sm:px-4 rounded-lg text-xs hover:bg-slate-50 transition shadow-xs cursor-pointer outline-none"
            >
              <option value="all">ขาย/เช่าทั้งหมด</option>
              <option value="sale">เฉพาะขาย</option>
              <option value="rent">เฉพาะเช่า</option>
            </select>

            {/* 
              [UI: ปุ่ม SLA]
              [SEARCH: SLA_BUTTON]

              หน้าที่:
              ปุ่มสลับการจัดเรียงคิวตรวจสอบประกาศ ให้แสดงรายการที่ใกล้ครบกำหนด SLA (ด่วนที่สุด) ขึ้นมาด้านบนสุด

              ข้อความ:
              "เรียงตาม SLA (ด่วนสุด)" พร้อมไอคอน Clock

              Style:
              - สถานะเปิดใช้งาน (Active / sortBySla = true): bg-blue-600 border-blue-600 text-white (พื้นน้ำเงิน ข้อความขาว)
              - สถานะปกติ (Inactive / sortBySla = false): bg-white border-slate-200 text-slate-600 hover:bg-slate-50 (พื้นขาว ขอบเทาอ่อน)
              - รูปทรง: border font-bold py-2 px-3 sm:px-4 rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5

              การทำงาน:
              ผูกกับ Event onClick={() => setSortBySla((prev) => !prev)} เพื่อสลับ State sortBySla (true/false)

              ความสัมพันธ์:
              - ควบคุมการเรียงลำดับใน State properties / filteredProperties
              - คำนวณเวลาผ่าน calculateModerationSla() ใน lib/services/slaService.ts

              จุดที่ต้องตรวจสอบเมื่อแก้ไข:
              - ปรับสี/ขนาด: แก้ที่ className ภายในปุ่มนี้
              - ปรับเกณฑ์เวลาด่วน: ต้องไปแก้ไขที่ lib/services/slaService.ts (MODERATION_SLA_URGENT_HOURS)
            */}
            <button
              onClick={() => setSortBySla((prev) => !prev)}
              className={`border font-bold py-2 px-3 sm:px-4 rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5 ${
                sortBySla
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>เรียงตามเวลารอตรวจ (นานสุดก่อน)</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------------------
         * ADVANCED FILTERS PANEL
         * ------------------------------------------------------------------------------ */}
        {showAdvancedFilters && (
          <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>ตัวกรองละเอียด (Advanced Filters)</span>
              </span>
              {hasActiveAdvancedFilters && (
                <button
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างตัวกรองทั้งหมด</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Property Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">ประเภทอสังหาฯ</label>
                <select
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">ทุกประเภท</option>
                  {distinctPropertyTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* 2. Price Range */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">ช่วงราคา</label>
                <select
                  value={priceRangeFilter}
                  onChange={(e) => setPriceRangeFilter(e.target.value as 'all' | 'under_3m' | '3m_10m' | 'over_10m')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">ทุกช่วงราคา</option>
                  <option value="under_3m">ต่ำกว่า 3,000,000 บาท</option>
                  <option value="3m_10m">3,000,000 – 10,000,000 บาท</option>
                  <option value="over_10m">มากกว่า 10,000,000 บาท</option>
                </select>
              </div>

              {/* 3. Agent Tier */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">สถานะนายหน้า</label>
                <select
                  value={agentTierFilter}
                  onChange={(e) => setAgentTierFilter(e.target.value as 'all' | 'pro' | 'basic')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">นายหน้าทั้งหมด</option>
                  <option value="pro">เฉพาะ Verified PRO</option>
                  <option value="basic">นายหน้าทั่วไป (Basic)</option>
                </select>
              </div>

              {/* 4. Province */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">จังหวัด / ทำเล</label>
                <select
                  value={provinceFilter}
                  onChange={(e) => setProvinceFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">ทุกจังหวัด</option>
                  {distinctProvinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SLA Summary Performance Card */}
        {activeTab !== 'pending' && slaSummary && slaSummary.reviewedCount > 0 && (
          <div className="mb-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ตรวจแล้วในชุดนี้</p>
              <p className="text-xl font-black text-slate-900">{slaSummary.reviewedCount} ประกาศ</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">เวลาเฉลี่ยที่ใช้ตรวจ</p>
              <p className="text-xl font-black text-blue-600">{slaSummary.averageLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ตรวจทันกำหนด</p>
              <p className={`text-xl font-black ${slaSummary.withinSlaPercent >= 90 ? 'text-emerald-600' : slaSummary.withinSlaPercent >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {slaSummary.withinSlaPercent}%
                <span className="text-xs font-bold text-slate-400 ml-1.5">({slaSummary.withinSlaCount}/{slaSummary.reviewedCount})</span>
              </p>
            </div>
            <p className="text-[10px] font-bold text-slate-400 ml-auto max-w-xs leading-relaxed">
              คำนวณจากบันทึกเวลาจริงของประกาศที่ผ่านการตรวจสอบแล้ว
            </p>
          </div>
        )}

        {/* Batch Select All Toolbar for Pending tab */}
        {activeTab === 'pending' && displayedProperties.length > 0 && (
          <div className="mb-4 px-3 py-2 bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === displayedProperties.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span>เลือกทั้งหมด ({displayedProperties.length} รายการ)</span>
            </label>

            {selectedIds.size > 0 && (
              <span className="font-extrabold text-blue-600">
                เลือกแล้ว {selectedIds.size} รายการ
              </span>
            )}
          </div>
        )}

        {/* Content Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold">กำลังโหลดคิวประกาศ...</p>
          </div>
        ) : displayedProperties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <Home className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h2 className="text-lg font-bold text-slate-700 mb-1">ไม่พบรายการประกาศ</h2>
            <p className="text-slate-500 font-medium text-xs">ไม่มีประกาศที่ตรงกับตัวกรองที่คุณเลือกในขณะนี้</p>
            {hasActiveAdvancedFilters && (
              <button
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProperties.map((property) => {
              const isSelected = selectedIds.has(property.id);

              return (
                <div
                  key={property.id}
                  className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-all ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex">
                    {/* Left Accent Bar */}
                    <div
                      className={`w-1.5 shrink-0 ${
                        activeTab === 'pending'
                          ? 'bg-slate-400'
                          : activeTab === 'approved'
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />

                    <div className="flex-1 p-5 flex flex-col xl:flex-row gap-5">
                      {/* Left: Checkbox + Photo Preview */}
                      <div className="xl:w-[260px] shrink-0 space-y-2">
                        <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 group border border-slate-200 flex items-center justify-center">
                          {/* Checkbox (in pending tab) */}
                          {activeTab === 'pending' && (
                            <div className="absolute top-2.5 left-2.5 z-20">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(property.id)}
                                className="w-5 h-5 rounded-md text-blue-600 bg-white/90 border-slate-300 accent-blue-600 cursor-pointer shadow-md"
                              />
                            </div>
                          )}

                          {property.image ? (
                            <Image
                              src={property.image}
                              alt={property.title}
                              width={260}
                              height={176}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                              onClick={() => setPreviewProperty(property)}
                            />
                          ) : (
                            <div
                              onClick={() => setPreviewProperty(property)}
                              className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 font-bold text-xs gap-1 cursor-pointer"
                            >
                              <Camera className="w-8 h-8 text-slate-300 mb-1" />
                              <span>ไม่มีรูปภาพแนบ</span>
                            </div>
                          )}

                          {property.imageCount > 0 && (
                            <button
                              onClick={() => setPreviewProperty(property)}
                              className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md z-10 flex items-center gap-1 hover:bg-blue-600 transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{property.imageCount} รูป</span>
                            </button>
                          )}
                        </div>

                        {/* Sub thumbnails preview */}
                        {property.images && property.images.length > 1 && (
                          <div className="grid grid-cols-3 gap-1.5">
                            {property.images.slice(1, 3).map((subImg, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewProperty(property)}
                                className="h-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer relative"
                              >
                                <Image
                                  src={subImg}
                                  alt={`thumb-${idx}`}
                                  fill
                                  sizes="80px"
                                  className="object-cover opacity-80 hover:opacity-100 transition"
                                />
                              </div>
                            ))}
                            {property.imageCount > 3 && (
                              <button
                                onClick={() => setPreviewProperty(property)}
                                className="h-14 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200 transition cursor-pointer"
                              >
                                +{property.imageCount - 3} รูป
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Property Details & Actions */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {/* Badges Bar */}
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-md border border-blue-100">
                                {property.type || 'HOUSE'}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${
                                  property.listingType === 'rent'
                                    ? 'bg-violet-50 text-violet-700 border-violet-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}
                              >
                                {property.listingType === 'rent' ? 'ให้เช่า (Rent)' : 'ขาย (Sale)'}
                              </span>
                              {property.documents && property.documents.length > 0 && (
                                <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  <span>มีโฉนด/เอกสาร</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                                ID: {property.id.slice(0, 8)}
                              </span>

                              {/* ป้ายเวลารอตรวจในแท็บ pending */}
                              {activeTab === 'pending' && (
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${slaBadgeClass(
                                    property.slaLevel
                                  )}`}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{property.slaLabel}</span>
                                </span>
                              )}

                              {/* Review Audit in approved/rejected */}
                              {activeTab !== 'pending' && property.reviewerName && (
                                <span className="text-[10px] font-bold text-slate-400">
                                  ตรวจโดย {property.reviewerName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Title & Price */}
                          <h2
                            onClick={() => setPreviewProperty(property)}
                            className="text-base font-extrabold text-slate-900 leading-snug mb-1 hover:text-blue-600 transition cursor-pointer"
                          >
                            {property.title}
                          </h2>

                          <p className="text-xl font-black text-blue-600 mb-3">
                            ฿ {Number(property.price).toLocaleString()}
                            {property.listingType === 'rent' && (
                              <span className="text-xs text-slate-400 font-semibold ml-1">/ เดือน</span>
                            )}
                          </p>

                          {/* Specs */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500 mb-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span className="truncate max-w-xs">{property.location}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                              <span>{property.area} ตร.ม.</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5 text-slate-400" />
                              <span>{property.bedrooms} นอน</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="w-3.5 h-3.5 text-slate-400" />
                              <span>{property.bathrooms} น้ำ</span>
                            </span>
                          </div>
                        </div>

                        {/* Footer: Agent profile and Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3 mt-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs border border-blue-200 shrink-0">
                              {property.agentName ? property.agentName.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-extrabold text-slate-800 text-xs">{property.agentName}</p>
                                {property.agentPlan === 'pro' && (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                    PRO
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">
                                ส่งเมื่อ {new Date(property.createdAt).toLocaleDateString('th-TH')}
                              </p>
                            </div>
                          </div>

                          {/* กลุ่มปุ่มดำเนินการสำหรับประกาศแต่ละรายการ (Card Action Buttons) */}
                          <div className="flex items-center gap-2">
                            {/* [UI: ปุ่มดูพรีวิวแบบละเอียด] [SEARCH: QUICK_PREVIEW_DRAWER_BTN] */}
                            {/* เปิดลิ้นชักทางขวาเพื่อตรวจดูรูปภาพทั้งหมด ข้อมูลโฉนด และข้อมูลนายหน้า */}
                            <button
                              onClick={() => setPreviewProperty(property)} // กำหนดออบเจกต์ประกาศที่จะพรีวิว
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                              title="เปิดดูตัวอย่างประกาศแบบเต็ม"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูพรีวิวแบบละเอียด</span>
                            </button>

                            {/* ปุ่มการกระทำเฉพาะในแท็บรอตรวจสอบ (Pending): ตีกลับ และ อนุมัติ */}
                            {activeTab === 'pending' && (
                              <>
                                {/* [UI: ปุ่มตีกลับประกาศ] [SEARCH: MODERATION_REJECT_BTN] */}
                                {/* เปิด Modal เพื่อเลือกหรือพิมพ์เหตุผลในการตีกลับให้นายหน้าแก้ไข */}
                                <button
                                  onClick={() => openRejectModal(property)} // เปิดหน้าต่างระบุเหตุผลการตีกลับ
                                  className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                  title="ส่งกลับให้นายหน้าแก้ไข"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>ตีกลับ</span>
                                </button>

                                {/* [UI: ปุ่มอนุมัติประกาศ] [SEARCH: MODERATION_APPROVE_BTN] */}
                                {/* บันทึกสถานะประกาศเป็น approved ทันที เพื่อนำขึ้นแสดงบนเว็บไซต์ */}
                                <button
                                  onClick={() => handleApprove(property.id)} // บันทึกอนุมัติประกาศ
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                                  title="อนุมัติเพื่อเผยแพร่บนเว็บไซต์"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>อนุมัติ</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------------
       * FLOATING BATCH ACTION BAR (ลอยขึ้นมาเมื่อมีการติ๊กเลือก ≥ 1 ประกาศ)
       * ------------------------------------------------------------------------------ */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200">
              เลือกอยู่ <strong className="text-white text-sm">{selectedIds.size}</strong> รายการ
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700" />

          {/* 
            [UI: ปุ่มอนุมัติทั้งหมด]
            [SEARCH: BATCH_APPROVE_BUTTON]

            หน้าที่:
            อนุมัติประกาศที่ถูกติ๊กเลือกทั้งหมดในครั้งเดียว (Batch Approval)

            ข้อความ:
            "อนุมัติทั้งหมด ({selectedIds.size})" หรือ "กำลังอนุมัติ..."

            Style:
            - พื้นหลัง: bg-emerald-600 hover:bg-emerald-700 text-white
            - รูปทรง: px-4 py-2 font-black text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5

            การทำงาน:
            ผูกกับ onClick={handleBatchApprove} ยิง API อนุมัติทีละรายการพร้อมกัน
          */}
          <button
            onClick={handleBatchApprove}
            disabled={isBatchApproving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isBatchApproving ? 'กำลังอนุมัติ...' : `อนุมัติทั้งหมด (${selectedIds.size})`}</span>
          </button>

          {/* 
            [UI: ปุ่มยกเลิกการเลือก]
            [SEARCH: CANCEL_BATCH_SELECTION_BUTTON]
          */}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-slate-400 hover:text-white transition font-medium cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------------------
       * QUICK PREVIEW DRAWER (สไลด์จากขวา)
       * ------------------------------------------------------------------------------ */}
      <QuickPreviewDrawer
        property={previewProperty}
        isOpen={Boolean(previewProperty)}
        onClose={() => setPreviewProperty(null)}
        onApprove={activeTab === 'pending' ? handleApprove : undefined}
        onReject={activeTab === 'pending' ? openRejectModal : undefined}
      />

      {/* ------------------------------------------------------------------------------
       * [UI: Modal ระบุเหตุผลการตีกลับประกาศ]
       * [SEARCH: REJECT_REASON_MODAL]
       * ------------------------------------------------------------------------------ */}
      {rejectingProperty && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-red-600 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>ระบุเหตุผลการตีกลับ / ส่งแก้ไข</span>
              </h3>
              <button
                onClick={closeRejectModal}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Property */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase">ประกาศที่ต้องการส่งกลับ:</p>
              <p className="text-sm font-extrabold text-slate-800 line-clamp-1">{rejectingProperty.title}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">นายหน้า: {rejectingProperty.agentName}</p>
            </div>

            {/* Presets Chips */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">
                เลือกเทมเพลตเหตุผลด่วน (Reject Presets):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {REJECT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className={`text-left text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                      rejectReason === preset
                        ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea for Customized Reason */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                ข้อความแจ้งเตือนนายหน้า (สามารถแก้ไขเพิ่มเติมได้):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุข้อความแนะนำสิ่งที่นายหน้าต้องแก้ไข..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-slate-800"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              {/* [UI: ปุ่มยกเลิกใน Modal] [SEARCH: CANCEL_REJECT_BUTTON] */}
              <button
                type="button"
                onClick={closeRejectModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition"
              >
                ยกเลิก
              </button>
              {/* [UI: ปุ่มยืนยันการส่งกลับแก้ไข] [SEARCH: CONFIRM_REJECT_BUTTON] */}
              <button
                type="button"
                onClick={confirmReject}
                disabled={submittingReject}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-red-600/20 transition disabled:opacity-50"
              >
                {submittingReject ? 'กำลังส่งข้อมูล...' : 'ยืนยันการส่งกลับแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// useSearchParams ต้องอยู่ใน Suspense (แบบเดียวกับหน้าแชทนายหน้า) ไม่งั้น build หน้า static ไม่ผ่าน
export default function AdminModerationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">กำลังโหลดรายการประกาศ...</div>}>
      <AdminModerationContent />
    </Suspense>
  );
}
