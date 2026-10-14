/**
 * ==============================================================================
 * [SEARCH: ADMIN_SYSTEM_SETTINGS] [DATA: SYSTEM_CONFIGS] [UI: ตั้งค่าระบบกลาง]
 * แผงตั้งค่าระบบกลางสำหรับผู้ดูแลระบบ (Admin System Settings & Configurations)
 * ไฟล์: app/admin/(dashboard)/settings/page.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. จัดการข้อมูลการตั้งค่าระบบส่วนกลางทั้งหมดผ่านตาราง system_configs และ listing_packages
 * 2. ปรับแต่งข้อมูลแบรนด์และการติดต่อ (ชื่อแพลตฟอร์ม, อีเมล, เบอร์โทรศัพท์, LINE OA)
 * 3. ปรับราคาและอายุการใช้งานของแพ็กเกจการลงประกาศอสังหาริมทรัพย์ (Listing Packages)
 * 4. กำหนดเกณฑ์ SLA ในการตรวจสอบประกาศ, จำนวนครั้งเบี้ยวนัด (No-show), โควตาลงประกาศฟรี, อัตราคอมมิชชั่น
 * 5. จัดการแถบข้อความประกาศด่วนบนหน้าเว็บ (Live System Banner) พร้อมโหมดสีแจ้งเตือน
 * 6. สวิตช์เปิด/ปิดโหมดปิดปรับปรุงระบบชั่วคราว (Maintenance Mode)
 * ==============================================================================
 */

'use client';

// นำเข้า React และ Hooks สำหรับจัดการ State และ Lifecycle ของคอมโพเนนต์
import React, { useState, useEffect } from 'react';
// นำเข้า Toast Notification สำหรับแจ้งเตือนผลการบันทึกหรือข้อผิดพลาด
import { toast } from '@/components/ui/toast';
// นำเข้าชุดไอคอนจาก lucide-react เพื่อให้สอดคล้องกับมาตรฐาน UI (ห้ามใช้อิโมจิดิบ)
import {
  Settings,
  CreditCard,
  Sliders,
  Bell,
  ShieldAlert,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  AlertOctagon,
  HardDrive,
  Building,
  Mail,
  Phone,
  MessageSquare,
  Percent,
  FileText
} from 'lucide-react';

// ความยาวสูงสุดของค่าตั้งค่า = ขนาดคอลัมน์ system_configs.value ในฐานข้อมูล (API ตรวจค่าเดียวกัน — ป้องกัน BUG-41)
const CONFIG_VALUE_MAX_LENGTH = 255;

/**
 * โครงสร้างข้อมูลแพ็กเกจการลงประกาศ (Listing Package Model)
 */
interface PackageItem {
  id: number;              // รหัสแพ็กเกจ (Primary Key)
  name: string;            // ชื่อแพ็กเกจ (เช่น Standard, Premium, Exclusive)
  price: number;           // ราคาค่าบริการ (บาท)
  maxDurationDays: number; // ระยะเวลาการแสดงประกาศ (วัน)
}

/**
 * คอมโพเนนต์หน้าตั้งค่าระบบกลางของผู้ดูแลระบบ (Admin Settings Page)
 */
export default function AdminSettingsPage() {
  // [STATE: แท็บการตั้งค่าที่กำลังเลือกดู] ค่าเริ่มต้นคือ 'general'
  const [activeTab, setActiveTab] = useState<'general' | 'packages' | 'rules' | 'banner' | 'maintenance'>('general');
  
  // [STATE: สถานะกำลังโหลดข้อมูลการตั้งค่าเริ่มต้น]
  const [loading, setLoading] = useState(true);
  
  // [STATE: สถานะกำลังส่งข้อมูลไปบันทึกบนเซิร์ฟเวอร์]
  const [saving, setSaving] = useState(false);
  
  // [STATE: รายการแพ็กเกจลงประกาศทั้งหมด]
  const [packages, setPackages] = useState<PackageItem[]>([]);
  
  // [STATE: อ็อบเจกต์เก็บค่าคอนฟิกคู่ Key-Value ทั้งหมดของระบบ]
  const [configs, setConfigs] = useState<Record<string, string>>({
    site_name: 'Srichai Property',                                                                                 // ชื่อเว็บไซต์
    contact_email: 'support@srichaiproperty.com',                                                                 // อีเมลฝ่ายสนับสนุน
    contact_phone: '074-123-4567',                                                                                // เบอร์โทรศัพท์ติดต่อ
    line_oa: '@srichaiproperty',                                                                                  // ไอดี Line Official
    default_commission_rate: '3.0',                                                                               // อัตราคอมมิชชั่นเริ่มต้น (%)
    max_free_listings: '3',                                                                                       // โควตาลงประกาศฟรีสูงสุด
    sla_moderation_hours: '24',                                                                                   // กรอบเวลา SLA ตรวจประกาศ (ชม.)
    noshow_penalty_threshold: '3',                                                                                // เกณฑ์จำนวนครั้งเบี้ยวนัด
    max_upload_size_mb: '10',                                                                                     // ขนาดไฟล์อัปโหลดสูงสุด (MB)
    system_banner_enabled: 'false',                                                                               // สวิตช์เปิดแถบประกาศบนเว็บ
    system_banner_type: 'info',                                                                                   // ประเภทสีของแถบประกาศ
    system_banner_text: 'ระบบเปิดให้บริการตามปกติ ยินดีต้อนรับสู่ Srichai Property',                                  // ข้อความในแถบประกาศ
    maintenance_mode: 'false',                                                                                    // สวิตช์โหมดปิดปรับปรุงระบบ
    maintenance_message: 'ระบบกำลังปิดปรับปรุงชั่วคราวเพื่ออัปเกรดประสิทธิภาพ กรุณากลับมาใหม่อีกครั้งในภายหลัง'        // ข้อความแจ้งเตือนเมื่อปิดปรับปรุง
  });

  /**
   * ฟังก์ชันดึงข้อมูลการตั้งค่าและแพ็กเกจจาก API (/api/admin/settings)
   * รองรับการกดปุ่ม "รีเฟรช" ด้วยตนเอง พร้อมเทคนิค cache-busting timestamp
   */
  const fetchSettings = async () => {
    try {
      // เปิดสถานะ Loading
      setLoading(true);
      // ส่งคำขอ GET พร้อมแนบ timestamp เพื่อป้องกัน Cache
      const res = await fetch(`/api/admin/settings?t=${Date.now()}`);
      // แปลงข้อมูลการตอบกลับเป็น JSON
      const data = await res.json();
      
      // หากสำเร็จ ให้อัปเดต State packages และ configs
      if (data.success) {
        setPackages(data.packages || []);
        if (data.configs) {
          // รวมค่าคอนฟิกใหม่เข้ากับค่าเริ่มต้นเดิม
          setConfigs(prev => ({ ...prev, ...data.configs }));
        }
      } else {
        // แจ้งเตือนข้อผิดพลาดจากข้อความที่ส่งมาจากฝั่งเซิร์ฟเวอร์
        toast.error(data.error || 'ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
      }
    } catch (err) {
      // ดักจับข้อผิดพลาดกรณีเครือข่ายขัดข้อง
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า');
    } finally {
      // ปิดสถานะ Loading เสมอเมื่อสิ้นสุดการทำงาน
      setLoading(false);
    }
  };

  /**
   * Lifecycle Hook โหลดข้อมูลการตั้งค่าครั้งแรกเมื่อเข้าสู่หน้าเว็บ
   * ป้องกันปัญหา Race Condition และ Memory Leak ด้วยตัวแปร ignore
   */
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/settings?t=${Date.now()}`);
        const data = await res.json();
        // ตรวจสอบว่า Component ยัง Mount อยู่หรือไม่
        if (!ignore) {
          if (data.success) {
            setPackages(data.packages || []);
            if (data.configs) {
              setConfigs(prev => ({ ...prev, ...data.configs }));
            }
          } else {
            toast.error(data.error || 'ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
          }
        }
      } catch (err) {
        console.error(err);
        if (!ignore) toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    // ฟังก์ชัน Cleanup ป้องกัน State Update หลัง Unmount
    return () => {
      ignore = true;
    };
  }, []);

  /**
   * ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลแพ็กเกจ (ราคา หรือ จำนวนวัน)
   * @param id รหัสแพ็กเกจที่ต้องการแก้ไข
   * @param field ฟิลด์ที่แก้ไข ('price' หรือ 'maxDurationDays')
   * @param value ค่าตัวเลขใหม่
   */
  const handlePackageChange = (id: number, field: 'price' | 'maxDurationDays', value: number) => {
    setPackages(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  /**
   * ฟังก์ชันจัดการการเปลี่ยนแปลงค่าในตาราง system_configs แบบ Dynamic Key
   * @param key ชื่อคอนฟิก (เช่น 'site_name', 'sla_moderation_hours')
   * @param value ค่าข้อความใหม่
   */
  const handleConfigChange = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  /**
   * ฟังก์ชันบันทึกการตั้งค่าทั้งหมดลงฐานข้อมูลผ่าน HTTP PATCH /api/admin/settings
   * ส่งข้อมูลทั้ง packages และ configs พร้อมกันใน Payload ก้อนเดียว
   */
  const handleSave = async () => {
    // เปิดสถานะกำลังบันทึกข้อมูล
    setSaving(true);
    try {
      // ส่งคำขอแบบ PATCH ไปยัง API ตั้งค่าระบบ
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages, configs })
      });
      const data = await res.json();
      
      // แจ้งเตือนเมื่อบันทึกข้อมูลสำเร็จ
      if (data.success) {
        toast.success('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      } else {
        toast.error(data.error || 'ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อบันทึกข้อมูล');
    } finally {
      // ปิดสถานะกำลังบันทึกข้อมูล
      setSaving(false);
    }
  };

  return (
    <>
      {/* 
        [UI: แถบส่วนหัวของหน้าตั้งค่าระบบ (Header Bar)]
        แสดงชื่อระบบ, คำอธิบาย, ปุ่มรีเฟรช และปุ่มบันทึกการตั้งค่าทั้งหมด
      */}
      <header className="min-h-16 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 shrink-0 relative z-0">
        <div>
          {/* ชื่อหน้าพร้อมไอคอนรูปเฟือง Settings */}
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>ตั้งค่าระบบกลาง (System Settings)</span>
          </h2>
          {/* คำอธิบายขอบเขตการตั้งค่า */}
          <p className="text-xs text-slate-500 font-medium">
            จัดการราคาแพ็กเกจ, เกณฑ์เวลา SLA, ข้อความแจ้งเตือนหน้าเว็บ และโหมดปิดปรับปรุงระบบ
          </p>
        </div>
        
        {/* กลุ่มปุ่มคำสั่งหลักด้านขวา */}
        <div className="flex items-center gap-2">
          {/* ปุ่มรีเฟรชข้อมูล */}
          <button
            onClick={fetchSettings}
            disabled={loading || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            {/* ไอคอนหมุนเมื่อกำลังโหลด */}
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
          
          {/* ปุ่มบันทึกการตั้งค่าทั้งหมด */}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
          </button>
        </div>
      </header>

      {/* คอนเทนเนอร์เนื้อหาหลักแบบเลื่อนขึ้น-ลงได้ */}
      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto space-y-6">
        
        {/* 
          [UI: แท็บสลับหมวดหมู่การตั้งค่า (Navigation Tabs)]
          แบ่งเป็น 5 หมวด: ข้อมูลทั่วไป, ราคาแพ็กเกจ, เกณฑ์ SLA, แถบประกาศ, ปิดปรับปรุง
        */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          {/* แท็บที่ 0: ข้อมูลทั่วไปและการติดต่อ */}
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'general'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4 text-blue-600" />
            <span>ข้อมูลทั่วไป & ติดต่อ</span>
          </button>

          {/* แท็บที่ 1: ราคาและอายุแพ็กเกจ */}
          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'packages'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>ราคาแพ็กเกจ (Pricing)</span>
          </button>

          {/* แท็บที่ 2: เกณฑ์ระบบและการควบคุม SLA */}
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'rules'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>เกณฑ์ระบบ & SLA</span>
          </button>

          {/* แท็บที่ 3: แถบประกาศข้อความพิเศษ */}
          <button
            type="button"
            onClick={() => setActiveTab('banner')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'banner'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>แถบประกาศหน้าเว็บ (Banner)</span>
          </button>

          {/* แท็บที่ 4: โหมดปิดปรับปรุงระบบชั่วคราว */}
          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'maintenance'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>ปิดปรับปรุงระบบ (Maintenance)</span>
          </button>
        </div>

        {/* ตรวจสอบสถานะการโหลดข้อมูล: หากกำลังโหลดให้แสดง Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-500 font-bold text-xs">กำลังโหลดการตั้งค่าระบบ...</p>
          </div>
        ) : (
          <>
            {/* ==============================================================================
             * TAB 0: ข้อมูลทั่วไปและการติดต่อ (GENERAL & CONTACT)
             * จัดเก็บในตาราง system_configs สำหรับแสดงผลบนหน้าเว็บไซต์และระบบติดต่อ
             * ============================================================================== */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                  {/* หัวข้อของการตั้งค่าทั่วไป */}
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span>ข้อมูลทั่วไปและช่องทางติดต่อแพลตฟอร์ม</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        ข้อมูลจริงที่จัดเก็บในตาราง system_configs สำหรับแสดงผลบนหน้าเว็บไซต์และระบบติดต่อ
                      </p>
                    </div>
                    {/* ป้ายแสดงชื่อตารางฐานข้อมูล */}
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      ตาราง system_configs
                    </span>
                  </div>

                  {/* กริดฟอร์มช่องกรอกข้อมูล 2 คอลัมน์ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* [FIELD: ชื่อแพลตฟอร์ม (site_name)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>ชื่อแพลตฟอร์ม (Site Name)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">ชื่อแบรนด์ที่จะแสดงในส่วนหัวและชื่อเรื่องของเว็บไซต์</p>
                      <input
                        type="text"
                        value={configs.site_name}
                        maxLength={CONFIG_VALUE_MAX_LENGTH}
                        onChange={e => handleConfigChange('site_name', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Srichai Property"
                      />
                    </div>

                    {/* [FIELD: อีเมลฝ่ายบริการลูกค้า (contact_email)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        <span>อีเมลฝ่ายบริการลูกค้า (Contact Email)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">อีเมลสำหรับรับเรื่องร้องเรียนและติดต่อฝ่ายสนับสนุน</p>
                      <input
                        type="email"
                        value={configs.contact_email}
                        maxLength={CONFIG_VALUE_MAX_LENGTH}
                        onChange={e => handleConfigChange('contact_email', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="support@srichaiproperty.com"
                      />
                    </div>

                    {/* [FIELD: เบอร์โทรศัพท์ติดต่อส่วนกลาง (contact_phone)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>เบอร์โทรศัพท์ติดต่อส่วนกลาง (Contact Phone)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">หมายเลขติดต่อสำหรับลูกค้าและนายหน้า</p>
                      <input
                        type="text"
                        value={configs.contact_phone}
                        maxLength={CONFIG_VALUE_MAX_LENGTH}
                        onChange={e => handleConfigChange('contact_phone', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="074-123-4567"
                      />
                    </div>

                    {/* [FIELD: LINE Official Account (line_oa)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                        <span>LINE Official Account (Line OA)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">ID สำหรับให้ลูกค้าแอดเพื่อนเพื่อสอบถามข้อมูลด่วน</p>
                      <input
                        type="text"
                        value={configs.line_oa}
                        maxLength={CONFIG_VALUE_MAX_LENGTH}
                        onChange={e => handleConfigChange('line_oa', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="@srichaiproperty"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================================
             * TAB 1: ราคาและอายุแพ็กเกจลงประกาศ (PACKAGE PRICING)
             * จัดการข้อมูลตาราง listing_packages สำหรับแสดงให้นายหน้าเลือกซื้อและใช้ตรวจสอบยอดชำระ
             * ============================================================================== */}
            {activeTab === 'packages' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  {/* หัวข้อของการตั้งค่าแพ็กเกจ */}
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span>กำหนดราคาและอายุแพ็กเกจลงประกาศ</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        ข้อมูลนี้จะแสดงในหน้ารับชำระเงินของนายหน้า และใช้สำหรับตรวจสอบยอดโอนในหน้า Payments
                      </p>
                    </div>
                    {/* ป้ายแสดงชื่อตารางฐานข้อมูล */}
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      ตาราง listing_packages
                    </span>
                  </div>

                  {/* หากไม่มีรายการแพ็กเกจในระบบ */}
                  {packages.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">ไม่พบรายการแพ็กเกจในระบบ</p>
                  ) : (
                    // แสดงการ์ดแพ็กเกจแต่ละตัวในรูปแบบกริด Responsive
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {packages.map(pkg => (
                        <div
                          key={pkg.id}
                          className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 relative hover:border-blue-300 transition"
                        >
                          {/* ส่วนหัวการ์ดแพ็กเกจ: ชื่อและ ID */}
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>{pkg.name}</span>
                            </span>
                            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                              ID: {pkg.id}
                            </span>
                          </div>

                          {/* ฟิลด์แก้ไขราคาและระยะเวลา */}
                          <div className="space-y-3 text-xs">
                            {/* ช่องแก้ไขราคาแพ็กเกจ (บาท) */}
                            <div>
                              <label className="block text-slate-600 font-bold mb-1">
                                ราคาแพ็กเกจ (บาท):
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-400 font-bold">฿</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={pkg.price}
                                  onChange={e =>
                                    handlePackageChange(pkg.id, 'price', Number(e.target.value))
                                  }
                                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                              </div>
                            </div>

                            {/* ช่องแก้ไขระยะเวลาใช้งาน (วัน) */}
                            <div>
                              <label className="block text-slate-600 font-bold mb-1">
                                ระยะเวลาใช้งาน (วัน):
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="1"
                                  value={pkg.maxDurationDays}
                                  onChange={e =>
                                    handlePackageChange(
                                      pkg.id,
                                      'maxDurationDays',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================================
             * TAB 2: เกณฑ์การควบคุมระบบและ SLA (SYSTEM RULES & SLA)
             * กำหนดมาตรฐานเวลาการทำงานและมาตรการป้องกันความเสี่ยงของแพลตฟอร์ม
             * ============================================================================== */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                  {/* หัวข้อของการตั้งค่ากฎและเกณฑ์ */}
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <span>เกณฑ์การควบคุมระบบและ SLA</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      กำหนดมาตรฐานเวลาการทำงานและมาตรการป้องกันความเสี่ยงของแพลตฟอร์ม
                    </p>
                  </div>

                  {/* กริด 3 คอลัมน์สำหรับแต่ละเกณฑ์ควบคุม */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* [RULE 1: กรอบเวลา SLA ตรวจประกาศ (sla_moderation_hours)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Clock className="w-4 h-4" />
                        <h4 className="font-extrabold text-xs text-slate-800">กรอบเวลา SLA ตรวจประกาศ</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        ระยะเวลาสูงสุดที่ต้องตรวจรับรองประกาศให้เสร็จ หากเหลือน้อยกว่า 4 ชม. ระบบจะขึ้นเตือนไฟด่วน
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          min="1"
                          max="72"
                          value={configs.sla_moderation_hours}
                          onChange={e => handleConfigChange('sla_moderation_hours', e.target.value)}
                          className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-600">ชั่วโมง</span>
                      </div>
                    </div>

                    {/* [RULE 2: เกณฑ์จำกัดการเบี้ยวนัด (noshow_penalty_threshold)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <h4 className="font-extrabold text-xs text-slate-800">เกณฑ์จำกัดการเบี้ยวนัด (No-show)</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        จำนวนครั้งที่ลูกค้าเบี้ยวนัดดูบ้าน แล้วระบบจะขึ้นป้ายเตือนความเสี่ยงในหน้านัดหมาย
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={configs.noshow_penalty_threshold}
                          onChange={e => handleConfigChange('noshow_penalty_threshold', e.target.value)}
                          className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-600">ครั้ง</span>
                      </div>
                    </div>

                    {/* [RULE 3: ขนาดไฟล์อัปโหลดสูงสุด (max_upload_size_mb)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <HardDrive className="w-4 h-4" />
                        <h4 className="font-extrabold text-xs text-slate-800">ขนาดไฟล์อัปโหลดสูงสุด</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        จำกัดขนาดไฟล์รูปภาพอสังหาฯ และเอกสารแนบ KYC เพื่อประหยัดพื้นที่จัดเก็บ
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={configs.max_upload_size_mb}
                          onChange={e => handleConfigChange('max_upload_size_mb', e.target.value)}
                          className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-600">MB</span>
                      </div>
                    </div>

                    {/* [RULE 4: อัตราค่าคอมมิชชั่นมาตรฐาน (default_commission_rate)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Percent className="w-4 h-4" />
                        <h4 className="font-extrabold text-xs text-slate-800">อัตราค่าคอมมิชชั่นมาตรฐาน</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        อัตราค่าคอมมิชชั่นขั้นพื้นฐานสำหรับการปิดการขายอสังหาริมทรัพย์
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={configs.default_commission_rate}
                          onChange={e => handleConfigChange('default_commission_rate', e.target.value)}
                          className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-600">%</span>
                      </div>
                    </div>

                    {/* [RULE 5: โควตาลงประกาศฟรีต่อนายหน้า (max_free_listings)] */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-violet-600">
                        <FileText className="w-4 h-4" />
                        <h4 className="font-extrabold text-xs text-slate-800">โควตาลงประกาศฟรีต่อนายหน้า</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        จำนวนการลงประกาศอสังหาฯ ฟรีสูงสุดต่อบัญชีนายหน้าทั่วไป
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={configs.max_free_listings}
                          onChange={e => handleConfigChange('max_free_listings', e.target.value)}
                          className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="text-xs font-bold text-slate-600">ประกาศ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================================
             * TAB 3: แถบประกาศข้อความพิเศษบนหน้าเว็บ (SYSTEM BANNER & NOTICE)
             * แสดงแถบข้อความประกาศความปลอดภัยหรือข่าวสารสำคัญบนแถบบนสุดของเว็บไซต์
             * ============================================================================== */}
            {activeTab === 'banner' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-500" />
                        <span>แถบประกาศข้อความพิเศษบนหน้าเว็บ (System Banner)</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        แสดงแถบข้อความประกาศความปลอดภัยหรือข่าวสารสำคัญบนแถบบนสุดของเว็บไซต์
                      </p>
                    </div>

                    {/* [SWITCH: เปิด/ปิดการแสดงแถบประกาศบนเว็บไซต์] */}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">เปิดแสดงแถบประกาศ:</span>
                      <input
                        type="checkbox"
                        checked={configs.system_banner_enabled === 'true'}
                        onChange={e =>
                          handleConfigChange('system_banner_enabled', e.target.checked ? 'true' : 'false')
                        }
                        className="sr-only peer"
                      />
                      {/* วิดเจ็ต Toggle Switch สวยงามสไตล์ Tailwind */}
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative" />
                    </label>
                  </div>

                  {/* [SELECTOR: เลือกรูปแบบและโทนสีของแถบประกาศ] */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-2">
                      เลือกรูปแบบและโทนสีของแถบประกาศ:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* ตัวเลือกที่ 1: ข่าวสารทั่วไป (Info - สีฟ้า) */}
                      <label
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                          configs.system_banner_type === 'info'
                            ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="bannerType"
                          value="info"
                          checked={configs.system_banner_type === 'info'}
                          onChange={e => handleConfigChange('system_banner_type', e.target.value)}
                          className="accent-blue-600"
                        />
                        <Info className="w-4 h-4 text-blue-600" />
                        <span className="text-xs">ข่าวสารทั่วไป (Info - สีฟ้า)</span>
                      </label>

                      {/* ตัวเลือกที่ 2: แจ้งเตือนสำคัญ (Warning - สีส้ม) */}
                      <label
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                          configs.system_banner_type === 'warning'
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="bannerType"
                          value="warning"
                          checked={configs.system_banner_type === 'warning'}
                          onChange={e => handleConfigChange('system_banner_type', e.target.value)}
                          className="accent-amber-600"
                        />
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs">แจ้งเตือนสำคัญ (Warning - สีส้ม)</span>
                      </label>

                      {/* ตัวเลือกที่ 3: ปรับปรุงระบบ (Maintenance - สีแดง) */}
                      <label
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                          configs.system_banner_type === 'maintenance'
                            ? 'bg-red-50 text-red-900 border-red-300 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="bannerType"
                          value="maintenance"
                          checked={configs.system_banner_type === 'maintenance'}
                          onChange={e => handleConfigChange('system_banner_type', e.target.value)}
                          className="accent-red-600"
                        />
                        <AlertOctagon className="w-4 h-4 text-red-600" />
                        <span className="text-xs">ปรับปรุงระบบ (Maintenance - สีแดง)</span>
                      </label>
                    </div>
                  </div>

                  {/* [TEXTAREA: ข้อความประกาศ] */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      ข้อความประกาศ:
                    </label>
                    <textarea
                      rows={2}
                      value={configs.system_banner_text}
                      maxLength={CONFIG_VALUE_MAX_LENGTH}
                      onChange={e => handleConfigChange('system_banner_text', e.target.value)}
                      placeholder="พิมพ์ข้อความที่ต้องการประกาศ เช่น ระบบจะปิดปรับปรุงชั่วคราวเวลา 02:00 - 04:00 น...."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  {/* [PREVIEW: ตัวอย่างการแสดงผลแถบประกาศจริงแบบ Live Preview] */}
                  <div className="pt-2">
                    <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      ตัวอย่างการแสดงผลบนหน้าเว็บไซต์ (Live Preview):
                    </span>
                    <div
                      className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                        configs.system_banner_type === 'maintenance'
                          ? 'bg-red-600 text-white border-red-700 shadow-sm'
                          : configs.system_banner_type === 'warning'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                          : 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      }`}
                    >
                      {/* ไอคอนตามประเภทที่เลือก */}
                      {configs.system_banner_type === 'maintenance' && <AlertOctagon className="w-4 h-4" />}
                      {configs.system_banner_type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                      {configs.system_banner_type === 'info' && <Info className="w-4 h-4" />}
                      <span>{configs.system_banner_text || 'ข้อความประกาศตัวอย่าง'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================================
             * TAB 4: โหมดปิดปรับปรุงระบบชั่วคราว (MAINTENANCE MODE)
             * เมื่อเปิดใช้งาน ผู้ใช้ทั่วไปจะไม่สามารถเข้าสู่ระบบหรือทำธุรกรรมได้ ยกเว้นแอดมิน
             * ============================================================================== */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>โหมดปิดปรับปรุงระบบชั่วคราว (Maintenance Mode)</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        เมื่อเปิดใช้งาน ผู้ใช้ทั่วไปจะไม่สามารถเข้าสู่ระบบหรือทำธุรกรรมได้ ยกเว้นแอดมิน
                      </p>
                    </div>

                    {/* [SWITCH: เปิด/ปิดโหมดปิดปรับปรุงระบบ] */}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">เปิดโหมดปิดปรับปรุง:</span>
                      <input
                        type="checkbox"
                        checked={configs.maintenance_mode === 'true'}
                        onChange={e =>
                          handleConfigChange('maintenance_mode', e.target.checked ? 'true' : 'false')
                        }
                        className="sr-only peer"
                      />
                      {/* สวิตช์ปุ่มสีแดงเตือนความปลอดภัยสูง */}
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 relative" />
                    </label>
                  </div>

                  {/* แถบเตือนพิเศษสีแดงเมื่อโหมดปิดปรับปรุงกำลังทำงาน */}
                  {configs.maintenance_mode === 'true' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 text-xs font-bold animate-pulse">
                      <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
                      <span>ขณะนี้โหมดปิดปรับปรุงระบบกำลังเปิดใช้งานอยู่ ผู้ใช้งานทั่วไปจะไม่สามารถเข้าถึงหน้าเว็บได้</span>
                    </div>
                  )}

                  {/* [TEXTAREA: ข้อความชี้แจงผู้ใช้งานเมื่อเข้าสู่ระบบในระหว่างปิดปรับปรุง] */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      ข้อความแจ้งเตือนผู้ใช้งานเมื่อปิดปรับปรุง:
                    </label>
                    <textarea
                      rows={3}
                      value={configs.maintenance_message}
                      maxLength={CONFIG_VALUE_MAX_LENGTH}
                      onChange={e => handleConfigChange('maintenance_message', e.target.value)}
                      placeholder="เช่น ระบบกำลังปิดปรับปรุงชั่วคราว..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

