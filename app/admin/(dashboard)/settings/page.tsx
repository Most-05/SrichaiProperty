'use client';

import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/toast';
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

interface PackageItem {
  id: number;
  name: string;
  price: number;
  maxDurationDays: number;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'packages' | 'rules' | 'banner' | 'maintenance'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [configs, setConfigs] = useState<Record<string, string>>({
    site_name: 'Srichai Property',
    contact_email: 'support@srichaiproperty.com',
    contact_phone: '074-123-4567',
    line_oa: '@srichaiproperty',
    default_commission_rate: '3.0',
    max_free_listings: '3',
    sla_moderation_hours: '24',
    noshow_penalty_threshold: '3',
    max_upload_size_mb: '10',
    system_banner_enabled: 'false',
    system_banner_type: 'info',
    system_banner_text: 'ระบบเปิดให้บริการตามปกติ ยินดีต้อนรับสู่ Srichai Property',
    maintenance_mode: 'false',
    maintenance_message: 'ระบบกำลังปิดปรับปรุงชั่วคราวเพื่ออัปเกรดประสิทธิภาพ กรุณากลับมาใหม่อีกครั้งในภายหลัง'
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/settings?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setPackages(data.packages || []);
        if (data.configs) {
          setConfigs(prev => ({ ...prev, ...data.configs }));
        }
      } else {
        toast.error(data.error || 'ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/settings?t=${Date.now()}`);
        const data = await res.json();
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
    return () => {
      ignore = true;
    };
  }, []);

  const handlePackageChange = (id: number, field: 'price' | 'maxDurationDays', value: number) => {
    setPackages(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages, configs })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      } else {
        toast.error(data.error || 'ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="min-h-16 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 shrink-0 relative z-0">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>ตั้งค่าระบบกลาง (System Settings)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            จัดการราคาแพ็กเกจ, เกณฑ์เวลา SLA, ข้อความแจ้งเตือนหน้าเว็บ และโหมดปิดปรับปรุงระบบ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={loading || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
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

      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-500 font-bold text-xs">กำลังโหลดการตั้งค่าระบบ...</p>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------------------------------------
             * TAB 0: GENERAL & CONTACT (system_configs)
             * ------------------------------------------------------------------------------ */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
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
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      ตาราง system_configs
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Site Name */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>ชื่อแพลตฟอร์ม (Site Name)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">ชื่อแบรนด์ที่จะแสดงในส่วนหัวและชื่อเรื่องของเว็บไซต์</p>
                      <input
                        type="text"
                        value={configs.site_name}
                        onChange={e => handleConfigChange('site_name', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Srichai Property"
                      />
                    </div>

                    {/* Contact Email */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        <span>อีเมลฝ่ายบริการลูกค้า (Contact Email)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">อีเมลสำหรับรับเรื่องร้องเรียนและติดต่อฝ่ายสนับสนุน</p>
                      <input
                        type="email"
                        value={configs.contact_email}
                        onChange={e => handleConfigChange('contact_email', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="support@srichaiproperty.com"
                      />
                    </div>

                    {/* Contact Phone */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>เบอร์โทรศัพท์ติดต่อส่วนกลาง (Contact Phone)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">หมายเลขติดต่อสำหรับลูกค้าและนายหน้า</p>
                      <input
                        type="text"
                        value={configs.contact_phone}
                        onChange={e => handleConfigChange('contact_phone', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="074-123-4567"
                      />
                    </div>

                    {/* Line OA */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                        <span>LINE Official Account (Line OA)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">ID สำหรับให้ลูกค้าแอดเพื่อนเพื่อสอบถามข้อมูลด่วน</p>
                      <input
                        type="text"
                        value={configs.line_oa}
                        onChange={e => handleConfigChange('line_oa', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="@srichaiproperty"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------------------
             * TAB 1: PACKAGE PRICING
             * ------------------------------------------------------------------------------ */}
            {activeTab === 'packages' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
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
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      ตาราง listing_packages
                    </span>
                  </div>

                  {packages.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">ไม่พบรายการแพ็กเกจในระบบ</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {packages.map(pkg => (
                        <div
                          key={pkg.id}
                          className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 relative hover:border-blue-300 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>{pkg.name}</span>
                            </span>
                            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                              ID: {pkg.id}
                            </span>
                          </div>

                          <div className="space-y-3 text-xs">
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

            {/* ------------------------------------------------------------------------------
             * TAB 2: SYSTEM RULES & SLA
             * ------------------------------------------------------------------------------ */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <span>เกณฑ์การควบคุมระบบและ SLA</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      กำหนดมาตรฐานเวลาการทำงานและมาตรการป้องกันความเสี่ยงของแพลตฟอร์ม
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* SLA Moderation Hours */}
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

                    {/* No-show Penalty Threshold */}
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

                    {/* Max File Upload Size */}
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

                    {/* Default Commission Rate */}
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

                    {/* Max Free Listings */}
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

            {/* ------------------------------------------------------------------------------
             * TAB 3: SYSTEM BANNER & NOTICE
             * ------------------------------------------------------------------------------ */}
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

                    {/* Enable Toggle Switch */}
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
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative" />
                    </label>
                  </div>

                  {/* Banner Type Selection */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-2">
                      เลือกรูปแบบและโทนสีของแถบประกาศ:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                  {/* Banner Message Textarea */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      ข้อความประกาศ:
                    </label>
                    <textarea
                      rows={2}
                      value={configs.system_banner_text}
                      onChange={e => handleConfigChange('system_banner_text', e.target.value)}
                      placeholder="พิมพ์ข้อความที่ต้องการประกาศ เช่น ระบบจะปิดปรับปรุงชั่วคราวเวลา 02:00 - 04:00 น...."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  {/* Live Banner Preview Box */}
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
                      {configs.system_banner_type === 'maintenance' && <AlertOctagon className="w-4 h-4" />}
                      {configs.system_banner_type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                      {configs.system_banner_type === 'info' && <Info className="w-4 h-4" />}
                      <span>{configs.system_banner_text || 'ข้อความประกาศตัวอย่าง'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------------------
             * TAB 4: MAINTENANCE MODE
             * ------------------------------------------------------------------------------ */}
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

                    {/* Maintenance Switch */}
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
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 relative" />
                    </label>
                  </div>

                  {configs.maintenance_mode === 'true' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 text-xs font-bold animate-pulse">
                      <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
                      <span>ขณะนี้โหมดปิดปรับปรุงระบบกำลังเปิดใช้งานอยู่ ผู้ใช้งานทั่วไปจะไม่สามารถเข้าถึงหน้าเว็บได้</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      ข้อความแจ้งเตือนผู้ใช้งานเมื่อปิดปรับปรุง:
                    </label>
                    <textarea
                      rows={3}
                      value={configs.maintenance_message}
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
