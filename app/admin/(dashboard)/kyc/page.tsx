'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminKycAgentCard, { AgentData } from '@/components/admin/AdminKycAgentCard';
import KycInspectionModal from '@/components/admin/KycInspectionModal';
import { toast } from '@/components/ui/toast';
import {
  Search,
  Inbox,
  RefreshCw,
  Download,
  X,
  Filter,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminKycPage() {
  // ----------------------------------------------------------------------------
  // 1. STATE MANAGEMENT (การจัดการสถานะภายในหน้าตรวจสอบ KYC)
  // ----------------------------------------------------------------------------
  // รายชื่อนายหน้าที่ดึงมาจาก API (อิงตามแท็บสถานะที่เลือก เช่น pending, approved, rejected)
  const [agents, setAgents] = useState<AgentData[]>([]);

  // สถานะการโหลดข้อมูลครั้งแรก (แสดง Loading Spinner เต็มหน้าจอขณะเริ่มดึงข้อมูล)
  const [loading, setLoading] = useState(true);

  // สถานะการกดปุ่มรีเฟรชข้อมูลด้วยตนเอง (หมุนไอคอน RefreshCw ขณะกำลังโหลด)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // สถานะแท็บปัจจุบัน: 'pending' (รอตรวจสอบ), 'approved' (อนุมัติแล้ว), 'rejected' (ปฏิเสธ/ส่งกลับ)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // ข้อความค้นหาด่วน (Search Query) รองรับการค้นชื่อ, อีเมล, เบอร์โทร, LINE ID หรือ User ID
  const [searchQuery, setSearchQuery] = useState('');

  // ตัวกรองประเภทไฟล์เอกสาร: 'all' (ทั้งหมด), 'image' (เฉพาะรูปถ่ายบัตร), 'pdf' (เฉพาะเอกสาร PDF)
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'image' | 'pdf'>('all');

  // ข้อมูลเอกสารที่แอดมินกำลังคลิกเปิดดูใน Modal ขยายใหญ่ (Inspect Modal)
  const [inspectingDoc, setInspectingDoc] = useState<{ url: string; title: string } | null>(null);

  // ----------------------------------------------------------------------------
  // 2. DATA FETCHING (ฟังก์ชันดึงข้อมูลรายการ KYC จาก API)
  // ----------------------------------------------------------------------------
  // ดึงข้อมูลนายหน้าตามสถานะที่ระบุ พร้อมป้องกันปัญหาแคชด้วย Timestamp
  const fetchAgents = async (status: string) => {
    try {
      // ส่งคำขอแบบ GET ไปยัง /api/admin/kyc พร้อมปิดการแคชระดับเบราว์เซอร์
      const res = await fetch(`/api/admin/kyc?status=${status}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      // ตรวจสอบว่า API ส่งผลลัพธ์สำเร็จและมี Array รายชื่อนายหน้า
      if (data.success && Array.isArray(data.users)) {
        setAgents(data.users); // บันทึกรายชื่อนายหน้าลง State
      } else {
        setAgents([]);        // หากไม่มีข้อมูล ให้กำหนดเป็น Array ว่าง
      }
    } catch (err) {
      console.error(err);
      setAgents([]);
      toast.error('ไม่สามารถโหลดข้อมูล KYC ได้');
    } finally {
      // ปิดสถานะการโหลดข้อมูลทั้งแบบปกติและแบบรีเฟรช
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ดักจับการสลับแท็บสถานะ (activeTab) เพื่อดึงข้อมูลใหม่ทันที
  useEffect(() => {
    let ignore = false; // Flag ป้องกัน Race Condition เมื่อสลับแท็บเร็วกว่าที่ Request จะตอบกลับ
    const loadData = async () => {
      try {
        const res = await fetch(`/api/admin/kyc?status=${activeTab}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        // อัปเดต State เฉพาะเมื่อ Effect นี้ยังคงมีผลอยู่ (ยังไม่ถูก Clean up)
        if (!ignore) {
          if (data.success && Array.isArray(data.users)) {
            setAgents(data.users);
          } else {
            setAgents([]);
          }
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setAgents([]);
      } finally {
        if (!ignore) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };
    loadData();
    // Cleanup Function ยกเลิกผลการตอบกลับหากมีการเปลี่ยนแท็บก่อนโหลดเสร็จ
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // ฟังก์ชันรองรับการคลิกปุ่มรีเฟรชข้อมูลด้วยตนเอง
  const handleRefresh = () => {
    setIsRefreshing(true);  // หมุนไอคอนรีเฟรช
    fetchAgents(activeTab); // ดึงข้อมูลล่าสุด
  };

  // ----------------------------------------------------------------------------
  // 3. ACTION HANDLERS (ฟังก์ชันอนุมัติ ปฏิเสธ และลบบัญชี)
  // ----------------------------------------------------------------------------
  // ฟังก์ชันอัปเดตสถานะ KYC (อนุมัติ หรือ ปฏิเสธพร้อมระบุเหตุผล)
  const handleUpdateStatus = async (userId: string, newStatus: string, reason?: string, note?: string) => {
    // ใช้ Optimistic UI: นำรายการออกจากหน้าจอทันทีเพื่อความรู้สึกลื่นไหล
    setAgents(prev => prev.filter(a => a.id !== userId));

    try {
      // ส่งคำขอแบบ PATCH เพื่อบันทึกสถานะลงฐานข้อมูล
      const res = await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus, reason, note })
      });
      const data = await res.json();
      if (data.success) {
        // แสดงข้อความแจ้งเตือนความสำเร็จตามสถานะที่เลือก
        toast.success(newStatus === 'approved' ? 'อนุมัติสิทธิ์นายหน้าเรียบร้อยแล้ว' : 'ส่งบันทึกการปฏิเสธเอกสารเรียบร้อยแล้ว');
        fetchAgents(activeTab); // ซิงก์ข้อมูลจริงจากฐานข้อมูลใหม่อีกครั้ง
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (data.error || ''));
        fetchAgents(activeTab); // กรณีล้มเหลว โหลดข้อมูลเดิมกลับคืนมา
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      fetchAgents(activeTab);
    }
  };

  // ฟังก์ชันลบบัญชีนายหน้าออกจากระบบอย่างถาวร
  const handleDeleteAgent = async (userId: string) => {
    // แสดงกล่องถามยืนยันก่อนลบเพื่อความปลอดภัยสูงสุด
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้ออกจากระบบอย่างถาวร?')) return;

    // Optimistic UI ลบออกจากหน้าจอก่อน
    setAgents(prev => prev.filter(a => a.id !== userId));

    try {
      // ส่งคำขอแบบ DELETE ไปยัง API
      const res = await fetch(`/api/admin/kyc?userId=${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('ลบบัญชีสำเร็จ');
        fetchAgents(activeTab);
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (data.error || ''));
        fetchAgents(activeTab);
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการลบบัญชี');
      fetchAgents(activeTab);
    }
  };

  // ----------------------------------------------------------------------------
  // 4. COMPUTATIONS & FILTER PIPELINE (การนับจำนวนเอกสารและกระบวนการกรอง)
  // ----------------------------------------------------------------------------
  // คำนวณสรุปจำนวนเอกสารแยกตามประเภท (PDF vs รูปภาพ)
  const docCounts = useMemo(() => {
    let images = 0; // ตัวนับไฟล์รูปภาพ (.jpg, .png ฯลฯ)
    let pdfs = 0;   // ตัวนับไฟล์เอกสาร PDF
    agents.forEach(a => {
      if (a.kyc_doc) {
        if (a.kyc_doc.toLowerCase().endsWith('.pdf')) {
          pdfs++;   // ถ้าลงท้ายด้วย .pdf ให้นับเป็นเอกสาร PDF
        } else {
          images++; // มิฉะนั้นนับเป็นไฟล์รูปภาพ
        }
      }
    });
    return { all: agents.length, image: images, pdf: pdfs };
  }, [agents]);

  // กรองรายชื่อนายหน้าตามคำค้นหา (Multi-field Search) และประเภทไฟล์เอกสาร
  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      // ขั้นที่ 1: ตรวจสอบคำค้นหา
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase(); // ชื่อ-นามสกุล
        const email = (a.email || '').toLowerCase();                             // อีเมล
        const phone = (a.phone || '').toLowerCase();                             // เบอร์โทรศัพท์
        const id = (a.id || '').toLowerCase();                                   // รหัสประจำตัว
        const line = (a.line_id || '').toLowerCase();                             // ไอดี LINE
        // ตรวจว่ามีฟิลด์ใดฟิลด์หนึ่งตรงกับคำค้นหาหรือไม่
        const match = name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q) || line.includes(q);
        if (!match) return false;
      }

      // ขั้นที่ 2: กรองตามประเภทของไฟล์เอกสารที่แนบมา
      if (docTypeFilter === 'pdf') {
        return a.kyc_doc && a.kyc_doc.toLowerCase().endsWith('.pdf');     // เฉพาะไฟล์ PDF
      } else if (docTypeFilter === 'image') {
        return a.kyc_doc && !a.kyc_doc.toLowerCase().endsWith('.pdf');    // เฉพาะไฟล์รูปถ่าย
      }

      return true; // หากเลือก 'all' ให้ผ่านการกรองทั้งหมด
    });
  }, [agents, searchQuery, docTypeFilter]);

  // ----------------------------------------------------------------------------
  // 5. CSV EXPORT (ส่งออกรายงาน KYC เป็นไฟล์ CSV)
  // ----------------------------------------------------------------------------
  const handleExportCSV = () => {
    if (filteredAgents.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    // กำหนดหัวตารางของไฟล์ CSV
    const headers = ['User ID', 'ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทรศัพท์', 'LINE ID', 'สถานะ KYC', 'มีเอกสารแนบ', 'รูปแบบไฟล์', 'วันที่ส่งเอกสาร'];

    // แปลงข้อมูลแต่ละแถวเป็น CSV Format
    const rows = filteredAgents.map(a => [
      `"${a.id}"`,
      `"${a.first_name || ''} ${a.last_name || ''}"`,
      `"${a.email || ''}"`,
      `"${a.phone || '-'}"`,
      `"${a.line_id || '-'}"`,
      `"${a.status}"`,
      `"${a.kyc_doc ? 'ใช่' : 'ไม่ใช่'}"`,
      `"${a.kyc_doc ? (a.kyc_doc.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Image') : 'None'}"`,
      `"${new Date(a.created_at).toLocaleString('th-TH')}"`
    ]);

    // เติม Byte Order Mark (\uFEFF) นำหน้า เพื่อให้ Microsoft Excel รองรับภาษาไทยได้ถูกต้อง
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); // สร้าง Blob Object
    const url = URL.createObjectURL(blob);                                     // สร้าง URL สำหรับดาวน์โหลด
    const link = document.createElement('a');                                 // สร้างแท็ก <a> เสมือน
    link.setAttribute('href', url);
    link.setAttribute('download', `srichai_kyc_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();                    // กระตุ้นการดาวน์โหลด
    document.body.removeChild(link); // ล้างหน่วยความจำ
    toast.success('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
  };

  return (
    <>
      <header className="min-h-16 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 shrink-0 relative z-0">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">ตรวจสอบเอกสารยืนยันตัวตน (KYC Moderation)</h2>
          <p className="text-xs text-slate-500 font-medium">
            ตรวจรับรองเอกสารประจำตัว อนุมัติ หรือส่งบันทึกคำแนะนำปฏิเสธสิทธิ์การเปิดบัญชีนายหน้า
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition border border-slate-200 shadow-sm cursor-pointer"
            title="ส่งออกไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
        {/* Controls: Tabs, Filters & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl max-w-full overflow-x-auto border border-slate-200">
            <button 
              onClick={() => { setActiveTab('pending'); setLoading(true); }}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-xs flex items-center gap-2 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>รอตรวจสอบ</span>
              {activeTab === 'pending' && agents.length > 0 && (
                <span className="bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none">
                  {agents.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('approved'); setLoading(true); }}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                activeTab === 'approved'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              อนุมัติแล้ว
            </button>
            <button 
              onClick={() => { setActiveTab('rejected'); setLoading(true); }}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ไม่อนุมัติ / ตีกลับ
            </button>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Document Type Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shadow-xs text-xs font-semibold text-slate-600">
              <span className="px-2 py-1 text-slate-400 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ประเภทไฟล์:</span>
              </span>
              <button
                type="button"
                onClick={() => setDocTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  docTypeFilter === 'all'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                ทั้งหมด ({docCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setDocTypeFilter('image')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  docTypeFilter === 'image'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-3 h-3 text-slate-500" />
                <span>รูปภาพ ({docCounts.image})</span>
              </button>
              <button
                type="button"
                onClick={() => setDocTypeFilter('pdf')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  docTypeFilter === 'pdf'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3 h-3 text-slate-500" />
                <span>PDF ({docCounts.pdf})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, อีเมล, LINE ID..." 
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700 text-xs shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-500 font-bold text-xs">กำลังโหลดข้อมูลผู้ยื่นคำขอ...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              ไม่พบรายการ{activeTab === 'pending' ? 'รอตรวจสอบ' : ''}
            </h3>
            <p className="text-slate-500 text-xs">
              {searchQuery || docTypeFilter !== 'all' 
                ? 'ไม่พบข้อมูลที่ตรงกับตัวกรองของคุณ' 
                : 'ไม่มีข้อมูลนายหน้าในสถานะนี้ในขณะนี้'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAgents.map((agent) => (
              <AdminKycAgentCard 
                key={agent.id} 
                agent={agent} 
                activeTab={activeTab} 
                onUpdateStatus={handleUpdateStatus} 
                onDeleteAgent={handleDeleteAgent}
                onInspectDoc={(url, title) => setInspectingDoc({ url, title })}
              />
            ))}
          </div>
        )}
      </div>

      {/* KYC Document Inspection Modal (90 deg rotate, zoom 50-300%, pan, fullscreen) */}
      {inspectingDoc && (
        <KycInspectionModal
          imageUrl={inspectingDoc.url}
          title={inspectingDoc.title}
          onClose={() => setInspectingDoc(null)}
        />
      )}
    </>
  );
}
