'use client';

/**
 * ==============================================================================
 * หน้าประวัติรายการนัดหมายสำหรับลูกค้า (Customer Appointments Page)
 * /app/(customer)/appointments/page.tsx
 * ==============================================================================
 * วัตถุประสงค์หลัก:
 * 1. แสดงรายการนัดหมายเข้าชมบ้านของลูกค้า แบ่งเป็น 3 แท็บ:
 *    - "กำลังจะมาถึง / รอยืนยัน" (status: approved, pending)
 *    - "ประวัติที่ผ่านมา" (status: completed)
 *    - "ยกเลิกแล้ว / ปฏิเสธแล้ว" (status: cancelled, rejected)
 * 2. รองรับการยกเลิกนัดหมายพร้อมเลือก/พิมพ์ระบุเหตุผล (ยิง DELETE /api/appointments)
 * 3. เปิดทางลัดส่งข้อความแชทตรงถึงนายหน้าผู้ดูแลทรัพย์สิน (`/chat?sessionId=...`)
 * 4. รองรับการให้คะแนนรีวิวนายหน้าสำหรับการนัดหมายที่เข้าชมเสร็จสิ้นแล้ว (`ReviewModal`)
 * ==============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReviewModal from '@/components/customer/ReviewModal';
import { NO_SHOW_LIMIT, timeSlotStart } from '@/lib/constants';
import { toast } from '@/components/ui/toast';
import {
  Calendar,
  CalendarDays,
  CalendarClock,
  MessageSquare,
  Star,
  AlertTriangle,
  X,
  Check,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Ban,
  Loader2,
  Bell,
  Clock,
  Trash2,
  Phone,
  ExternalLink,
  Info
} from 'lucide-react';

interface AppointmentItem {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyPrice: string;
  propertyImage: string;
  propertyType?: string;
  date: string;
  timeSlot: string;
  timeSlotText: string;
  status: 'pending' | 'approved' | 'awaiting_customer' | 'rejected' | 'completed' | 'cancelled' | 'no_show' | string;
  note: string;
  cancelReason?: string;
  noShowNote?: string;
  originalDate?: string | null;
  originalTimeSlot?: string | null;
  wasEdited?: boolean;
  agentName: string;
  agentPhone: string;
  agentImage?: string;
  review?: { id: string; rating: number; comment?: string } | null;
}

interface WaitlistItem {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyPrice: string;
  propertyImage: string;
  agentName: string;
  agentPhone: string;
  date: string;
  timeSlot: string;
  timeSlotText: string;
  notifiedAt: string | null;
  createdAt: string;
}

const MONTH_NAMES_TH = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

// ฟังก์ชันช่วยคืนค่าสี ข้อความ และไอคอนตามสถานะการนัดหมาย
const getStatusDetails = (status: string, isPast: boolean) => {
  switch (status) {
    case 'approved':
      if (isPast) {
        return { text: "รอนายหน้ายืนยันผล", bg: "bg-amber-50 border-amber-200", color: "text-amber-800", Icon: Clock };
      }
      return { text: "ยืนยันแล้ว", bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-800", Icon: CheckCircle2 };
    case 'pending':
      return { text: "รอนายหน้ายืนยันคิว", bg: "bg-amber-50 border-amber-200", color: "text-amber-800", Icon: Clock };
    case 'awaiting_customer':
      return { text: "นายหน้าขอเลื่อนวัน", bg: "bg-indigo-50 border-indigo-200", color: "text-indigo-800", Icon: CalendarClock };
    case 'rejected':
      return { text: "นายหน้าไม่สะดวกในรอบนี้", bg: "bg-rose-50 border-rose-200", color: "text-rose-800", Icon: XCircle };
    case 'cancelled':
      return { text: "ยกเลิกแล้ว", bg: "bg-slate-100 border-slate-200", color: "text-slate-700", Icon: Ban };
    case 'no_show':
      return { text: "ไม่ได้มาตามนัด", bg: "bg-red-50 border-red-200", color: "text-red-700", Icon: AlertTriangle };
    case 'completed':
      return { text: "เข้าชมเรียบร้อยแล้ว", bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-800", Icon: CheckCheck };
    default:
      return { text: "ประวัตินัดหมาย", bg: "bg-slate-100 border-slate-200", color: "text-slate-700", Icon: Calendar };
  }
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled' | 'waitlist'>('upcoming');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [cancelingWaitlistId, setCancelingWaitlistId] = useState<string | null>(null);
  // นัดที่จะถึงภายในวันนี้/พรุ่งนี้ — API คำนวณมาให้พร้อมกับตอนส่งแจ้งเตือน
  const [upcomingReminders, setUpcomingReminders] = useState<{ appointmentId: string; date: string; timeSlot: string; propertyTitle: string; counterpartName: string; isToday: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------------------------
  // 1. ฟังก์ชันโหลด/รีเฟรชข้อมูลคิวนัดหมายและคิวรอจาก API หลังบ้าน
  // ----------------------------------------------------------------------------
  const loadAppointments = useCallback(async () => {
    try {
      const [aptRes, waitlistRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/appointments/waitlist')
      ]);
      const aptData = await aptRes.json();
      const waitlistData = await waitlistRes.json();

      if (aptData.success && Array.isArray(aptData.appointments)) {
        setAppointments(aptData.appointments);
        setUpcomingReminders(Array.isArray(aptData.upcomingReminders) ? aptData.upcomingReminders : []);
      }
      if (waitlistData.success && Array.isArray(waitlistData.waitlist)) {
        setWaitlist(waitlistData.waitlist);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ใช้ asynchronous promise callback (.then) ภายใน useEffect เพื่อป้องกันเตือน Cascading Renders
  useEffect(() => {
    Promise.all([
      fetch('/api/appointments').then(res => res.json()),
      fetch('/api/appointments/waitlist').then(res => res.json())
    ])
      .then(([aptData, waitlistData]) => {
        if (aptData.success && Array.isArray(aptData.appointments)) {
          setAppointments(aptData.appointments);
          setUpcomingReminders(Array.isArray(aptData.upcomingReminders) ? aptData.upcomingReminders : []);
        }
        if (waitlistData.success && Array.isArray(waitlistData.waitlist)) {
          setWaitlist(waitlistData.waitlist);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ฟังก์ชันยกเลิกคิวรอของลูกค้า
  const cancelWaitlist = async (item: WaitlistItem) => {
    if (!confirm(`คุณต้องการยกเลิกคิวรอเข้าชมโครงการ "${item.propertyName}" ใช่หรือไม่?`)) return;
    setCancelingWaitlistId(item.id);
    try {
      const res = await fetch('/api/appointments/waitlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitlistId: item.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('ยกเลิกคิวรอเรียบร้อยแล้ว');
        setWaitlist(prev => prev.filter(w => w.id !== item.id));
      } else {
        toast.error(data.error || 'ยกเลิกคิวไม่สำเร็จ');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการยกเลิกคิว');
    } finally {
      setCancelingWaitlistId(null);
    }
  };

  // ----------------------------------------------------------------------------
  // 2. ระบบโมดัลยกเลิกนัดหมายแบบระบุเหตุผล (Cancel Modal Logic)
  // ----------------------------------------------------------------------------
  const [cancelingApt, setCancelingApt] = useState<AppointmentItem | null>(null);
  const [cancelReasonOption, setCancelReasonOption] = useState<string>('ติดภารกิจด่วน / การเดินทางไม่สะดวก');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // 🔑 KEYWORD: ลูกค้ากดตกลงวันใหม่ที่นายหน้าขอเลื่อน
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const acceptNewDate = async (apt: AppointmentItem) => {
    setAcceptingId(String(apt.id));
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: apt.id, action: 'customer_accept' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadAppointments();
      } else {
        alert(data.error || 'ยืนยันวันใหม่ไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setAcceptingId(null);
    }
  };

  const openCancelModal = (apt: AppointmentItem) => {
    setCancelingApt(apt);
    setCancelReasonOption('ติดภารกิจด่วน / การเดินทางไม่สะดวก');
    setCustomReasonText('');
  };

  const closeCancelModal = () => {
    setCancelingApt(null);
    setCancelReasonOption('ติดภารกิจด่วน / การเดินทางไม่สะดวก');
    setCustomReasonText('');
  };

  // ยืนยันการยกเลิกนัดหมายลงฐานข้อมูลจริง
  const confirmCancelAppointment = async () => {
    if (!cancelingApt) return;
    const finalReason = cancelReasonOption === 'อื่นๆ' ? customReasonText.trim() : cancelReasonOption;
    if (cancelReasonOption === 'อื่นๆ' && !finalReason) {
      toast.warning('กรุณาระบุเหตุผลการยกเลิก');
      return;
    }

    setSubmittingCancel(true);

    // อัปเดต UI หน้าบ้านทันทีเพื่อความรวดเร็ว (Optimistic UI)
    setAppointments(prev => prev.map(a => String(a.id) === String(cancelingApt.id) ? { ...a, status: 'cancelled', cancelReason: finalReason } : a));
    setActiveTab('cancelled');

    try {
      // ส่งคำขอยกเลิกนัดหมายไปยัง API หลังบ้าน
      const res = await fetch(`/api/appointments?id=${encodeURIComponent(cancelingApt.id)}&reason=${encodeURIComponent(finalReason)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('ยกเลิกนัดหมายเรียบร้อยแล้ว');
        await loadAppointments();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการยกเลิกนัดหมาย');
        await loadAppointments();
      }
    } catch (err) {
      console.error('Cancel appointment error:', err);
    } finally {
      setSubmittingCancel(false);
      closeCancelModal();
    }
  };

  // ----------------------------------------------------------------------------
  // 3. คำนวณยอดรวมนัดหมายในแต่ละกลุ่ม และกรองรายการตามแท็บที่เลือก
  // ----------------------------------------------------------------------------

  // ดึงวันที่ปัจจุบันรูปแบบ YYYY-MM-DD ตามเวลาท้องถิ่น
  const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayKey = getTodayKey();

  const getTomorrowKey = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const tomorrowKey = getTomorrowKey();

  // จัดกลุ่มนัดหมาย:
  // - ยกเลิกแล้ว / ปฏิเสธแล้ว: status เป็น cancelled หรือ rejected
  // - กำลังจะมาถึง / รอยืนยัน: status เป็น pending หรือ awaiting_customer หรือ (approved ที่ยังไม่เลยวันนัด)
  // - ประวัติที่ผ่านมา: status เป็น completed หรือ no_show หรือ (approved ที่เลยวันนัดไปแล้ว)
  const isCancelledApt = (apt: AppointmentItem) => apt.status === 'cancelled' || apt.status === 'rejected';
  const isPastApt = (apt: AppointmentItem) =>
    apt.status === 'completed' ||
    apt.status === 'no_show' ||
    (!isCancelledApt(apt) && apt.status === 'approved' && apt.date < todayKey);
  const isUpcomingApt = (apt: AppointmentItem) =>
    !isCancelledApt(apt) &&
    apt.status !== 'completed' &&
    apt.status !== 'no_show' &&
    (apt.status === 'pending' || apt.status === 'awaiting_customer' || (apt.status === 'approved' && apt.date >= todayKey));

  const upcomingCount = appointments.filter(isUpcomingApt).length;
  const cancelledCount = appointments.filter(isCancelledApt).length;
  const pastCount = appointments.filter(isPastApt).length;
  
  const noShowCount = appointments.filter(a => a.status === 'no_show').length;

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'upcoming') return isUpcomingApt(apt);
    if (activeTab === 'past') return isPastApt(apt);
    if (activeTab === 'cancelled') return isCancelledApt(apt);
    return false;
  });

  // เปิดแชทสนทนากับนายหน้าประจำทรัพย์สิน
  const handleOpenChat = async (propertyId: string) => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      });
      const data = await res.json();
      if (data.success && data.sessionId) {
        router.push(`/chat?sessionId=${data.sessionId}`);
      } else {
        router.push('/chat');
      }
    } catch {
      router.push('/chat');
    }
  };

  // ข้อมูลนัดหมายที่จะเปิดโมดัลรีวิว (เก็บคะแนนและความคิดเห็นเดิมไว้ด้วยถ้ามี)
  const [reviewModalApt, setReviewModalApt] = useState<{
    id: string;
    agentName: string;
    propertyName: string;
    initialRating?: number;
    initialComment?: string;
  } | null>(null);

  return (
    <div className="font-sans bg-slate-50 min-h-screen text-slate-800 antialiased overflow-x-hidden text-sm flex flex-col">
      {/* 4.1 แบนเนอร์หัวข้อหน้า */}
      <div className="pt-8 pb-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <span className="bg-amber-100 text-amber-500 w-12 h-12 flex items-center justify-center rounded-xl shadow-sm">
            <Calendar className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ประวัติการนัดหมายของคุณ</h1>
            <p className="text-slate-500 text-xs">จัดการตารางเข้าชมอสังหาริมทรัพย์และติดตามสถานะคิวการยืนยันการนัดหมาย</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        {/* 4.2 เมนูแท็บสลับสถานะ */}
        <div className="flex space-x-2 sm:space-x-3 mb-6 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('upcoming')} 
            className={`px-4 py-2 border-b-2 font-bold text-xs whitespace-nowrap transition cursor-pointer ${activeTab === 'upcoming' ? 'border-slate-900 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            กำลังจะมาถึง / รอยืนยัน 
            {upcomingCount > 0 && (
              <span className="bg-blue-600 text-white ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black">{upcomingCount}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('past')} 
            className={`px-4 py-2 border-b-2 font-bold text-xs whitespace-nowrap transition cursor-pointer ${activeTab === 'past' ? 'border-slate-900 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            ประวัติที่ผ่านมา
            {pastCount > 0 && (
              <span className="bg-slate-200 text-slate-700 ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{pastCount}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('cancelled')} 
            className={`px-4 py-2 border-b-2 font-bold text-xs whitespace-nowrap transition cursor-pointer ${activeTab === 'cancelled' ? 'border-slate-900 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            ยกเลิกแล้ว / ถูกปฏิเสธ
            {cancelledCount > 0 && (
              <span className="bg-slate-200 text-slate-700 ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{cancelledCount}</span>
            )}
          </button>


          <button 
            onClick={() => setActiveTab('waitlist')} 
            className={`px-4 py-2 border-b-2 font-bold text-xs whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'waitlist' ? 'border-slate-900 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>คิวรอแจ้งเตือน</span>
            {waitlist.length > 0 && (
              <span className="bg-blue-600 text-white ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black">{waitlist.length}</span>
            )}
          </button>
        </div>

        {/* 🔑 KEYWORD: แถบเตือนก่อนถึงวันนัด — กระดิ่งอย่างเดียวหลายคนไม่กดดู */}
        {upcomingReminders.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-blue-800">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>
                {upcomingReminders.some(r => r.isToday) ? 'คุณมีนัดเข้าชมบ้านวันนี้' : 'คุณมีนัดเข้าชมบ้านพรุ่งนี้'}
                {upcomingReminders.length > 1 && ` (${upcomingReminders.length} รายการ)`}
              </span>
            </div>
            <ul className="space-y-1">
              {upcomingReminders.map(r => (
                <li key={r.appointmentId} className="text-[11px] font-bold text-blue-700 leading-relaxed">
                  <span className={`inline-block px-1.5 py-0.5 rounded mr-1.5 text-[9px] font-black ${r.isToday ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {r.isToday ? 'วันนี้' : 'พรุ่งนี้'}
                  </span>
                  {timeSlotStart(r.timeSlot)} น. — {r.propertyTitle} (นายหน้า: {r.counterpartName})
                </li>
              ))}
            </ul>
            <p className="text-[10px] font-bold text-blue-600/80">
              ถ้าไม่สะดวกไปตามนัด กรุณากดยกเลิกล่วงหน้า จะได้ไม่ถูกบันทึกว่าไม่มาตามนัด
            </p>
          </div>
        )}

                {noShowCount > 0 && noShowCount < NO_SHOW_LIMIT && (
          <div className="mb-6 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              คุณมีประวัติไม่มาตามนัด {noShowCount} ครั้ง หากสะสมครบ {NO_SHOW_LIMIT} ครั้ง
              ระบบจะจำกัดการจองนัดใหม่ชั่วคราว กรุณายกเลิกนัดล่วงหน้าหากไม่สะดวกไปตามนัด
            </span>
          </div>
        )}
        {noShowCount >= NO_SHOW_LIMIT && (
          <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              บัญชีของคุณมีประวัติไม่มาตามนัดครบ {NO_SHOW_LIMIT} ครั้ง จึงถูกจำกัดการจองนัดใหม่ชั่วคราว
              กรุณาติดต่อทีมงานหากต้องการความช่วยเหลือ
            </span>
          </div>
        )}

        {/* แบนเนอร์เตือนคิวนัดหมายวันนี้ */}
        {(() => {
          const todayApprovedApt = appointments.find(a => a.date === todayKey && a.status === 'approved');
          if (!todayApprovedApt || activeTab !== 'upcoming') return null;
          return (
            <div className="mb-6 flex items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-xs font-bold text-blue-900 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center">
                  <Calendar className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <span className="inline-block font-extrabold text-sm text-blue-950">
                    วันนี้คุณมีนัดหมายเข้าชมโครงการ!
                  </span>
                  <p className="text-xs text-blue-700 font-medium mt-0.5">
                    &ldquo;{todayApprovedApt.propertyName}&rdquo; &bull; {todayApprovedApt.timeSlotText || todayApprovedApt.timeSlot}
                  </p>
                </div>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 text-[11px] font-bold shadow-xs">
                นัดหมายวันนี้
              </span>
            </div>
          );
        })()}

        {/* 4.3 รายการการ์ดนัดหมาย หรือ รายการคิวรอแจ้งเตือน */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'waitlist' ? (
            waitlist.length === 0 ? (
              <div className="text-center py-14 bg-white border border-slate-100 rounded-2xl text-slate-400 font-bold space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-extrabold text-sm">คุณยังไม่มีรายการที่ลงคิวรอแจ้งเตือน</p>
                <p className="text-xs text-slate-400 font-medium">
                  เมื่อรอบเวลาเข้าชมเต็ม คุณสามารถกด &ldquo;แจ้งเตือนฉันเมื่อมีรอบว่าง&rdquo; ได้ที่หน้าจองนัดหมาย
                </p>
              </div>
            ) : (
              waitlist.map((item) => {
                const dateObj = new Date(item.date);
                const dayStr = isNaN(dateObj.getTime()) ? item.date : dateObj.getDate().toString();
                const monthStr = isNaN(dateObj.getTime()) ? 'ส.ค.' : MONTH_NAMES_TH[dateObj.getMonth()];

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 hover:shadow-md transition relative overflow-hidden"
                  >
                    {/* แสดงวันที่และรอบเวลา */}
                    <div className="flex gap-3 sm:gap-4 items-center w-full lg:w-1/3">
                      <div className="w-16 h-20 bg-blue-50/70 rounded-xl border border-blue-100 flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">{monthStr}</span>
                        <span className="text-2xl font-extrabold text-slate-900 leading-none my-0.5">{dayStr}</span>
                        <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded shadow-sm mt-1">{item.timeSlotText || item.timeSlot}</span>
                      </div>
                      <div className="w-full h-20 rounded-lg overflow-hidden relative border border-slate-100">
                        <Image
                          src={item.propertyImage}
                          width={120}
                          height={80}
                          className="w-full h-full object-cover"
                          alt={item.propertyName}
                          unoptimized
                        />
                      </div>
                    </div>

                    {/* รายละเอียดทรัพย์สิน */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.notifiedAt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse">
                            <Check className="w-3 h-3 shrink-0" /> มีรอบว่างแล้ว (ระบบแจ้งเตือนแล้ว)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black bg-blue-50 text-blue-700 border-blue-200">
                            <Clock className="w-3 h-3 shrink-0" /> อยู่ในคิวรอแจ้งเตือน
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1">{item.propertyName}</h3>
                      <div className="text-blue-700 font-extrabold text-xs">{item.propertyPrice}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span>นายหน้า: {item.agentName} ({item.agentPhone})</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        ระบบจะส่งแจ้งเตือนทันทีที่มีลูกค้ายกเลิกหรือรอบเวลานี้เปิดรับจองใหม่
                      </p>
                    </div>

                    {/* ปุ่มการทำงาน */}
                    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                      <Link
                        href={`/properties/${item.propertyId}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        ดูประกาศ
                      </Link>
                      <Link
                        href={`/book-appointment?propertyId=${item.propertyId}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> ดูรอบว่าง
                      </Link>
                      <button
                        onClick={() => cancelWaitlist(item)}
                        disabled={cancelingWaitlistId === item.id}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold text-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        {cancelingWaitlistId === item.id ? 'กำลังยกเลิก...' : 'ยกเลิกคิวรอ'}
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl text-slate-400 font-bold">
              ไม่มีข้อมูลการนัดหมายในหมวดหมู่นี้
            </div>
          ) : (
            filteredAppointments.map((apt) => {
              const pastThisApt = isPastApt(apt);
              const cancelledThisApt = isCancelledApt(apt);
              const statusDetails = getStatusDetails(apt.status, pastThisApt);
              const StatusIcon = statusDetails.Icon;

              const dateObj = new Date(apt.date);
              const dayStr = isNaN(dateObj.getTime()) ? apt.date : dateObj.getDate().toString();
              const monthStr = isNaN(dateObj.getTime()) ? 'ส.ค.' : MONTH_NAMES_TH[dateObj.getMonth()];
              const isToday = apt.status === 'approved' && apt.date === todayKey;
              const isTomorrow = apt.status === 'approved' && apt.date === tomorrowKey;

              return (
                <div 
                  key={apt.id} 
                  className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm flex flex-col gap-4 hover:shadow-md transition relative overflow-hidden ${
                    cancelledThisApt ? 'bg-slate-50/70 border-slate-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* แสดงวันที่และรูปภาพทรัพย์สิน */}
                    <div className="flex gap-3 sm:gap-4 items-center w-full lg:w-72 shrink-0">
                      <div className="w-16 h-20 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                        <span className="text-[10px] font-bold text-red-500 uppercase">{monthStr}</span>
                        <span className="text-2xl font-extrabold text-slate-900 leading-none my-0.5">{dayStr}</span>
                        <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded shadow-sm mt-1">{apt.timeSlotText || apt.timeSlot}</span>
                      </div>
                      <Link href={`/properties/${apt.propertyId}`} className="w-full h-20 rounded-lg overflow-hidden relative border border-slate-100 block group">
                        <Image 
                          src={apt.propertyImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600"} 
                          width={140} 
                          height={80} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                          alt={apt.propertyName} 
                          unoptimized
                        />
                      </Link>
                    </div>

                    {/* รายละเอียดทรัพย์สิน สถานะ และนายหน้า */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black ${statusDetails.bg} ${statusDetails.color}`}>
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{statusDetails.text}</span>
                        </span>
                        {isToday && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black bg-blue-100 text-blue-800 border-blue-300 animate-pulse">
                            <Calendar className="w-3 h-3 shrink-0" />
                            นัดหมายวันนี้
                          </span>
                        )}
                        {isTomorrow && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black bg-indigo-50 text-indigo-700 border-indigo-200">
                            <Calendar className="w-3 h-3 shrink-0" />
                            นัดหมายวันพรุ่งนี้
                          </span>
                        )}
                      </div>

                      <div>
                        <Link href={`/properties/${apt.propertyId}`} className="font-extrabold text-slate-900 text-sm hover:text-blue-600 transition line-clamp-1">
                          {apt.propertyName}
                        </Link>
                        <div className="text-blue-700 font-extrabold text-xs mt-0.5">{apt.propertyPrice}</div>
                      </div>

                      {/* ข้อมูลนายหน้าผู้ดูแล */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium pt-0.5">
                        <span className="font-bold text-slate-800">นายหน้า: {apt.agentName}</span>
                        {apt.agentPhone && apt.agentPhone !== '-' && (
                          <a href={`tel:${apt.agentPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" /> {apt.agentPhone}
                          </a>
                        )}
                      </div>

                      {/* หมายเหตุที่ลูกค้าเขียนไว้ตอนขอนัด */}
                      {apt.note && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 inline-block">
                          <span className="font-bold text-slate-600">ข้อความของคุณ:</span> &ldquo;{apt.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* กล่องข้อความอธิบายสถานะและการดำเนินการถัดไป (Contextual Explanation & Next Steps) */}
                  {apt.status === 'rejected' && (
                    <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3.5 space-y-2.5 text-xs text-rose-900">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <div className="font-black text-rose-800 flex flex-wrap items-center gap-1.5">
                            <span>นายหน้าไม่สะดวกในรอบเวลานี้</span>
                            <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-rose-200 text-rose-700">
                              ระบบคืนรอบเวลาให้แล้ว
                            </span>
                          </div>
                          <p className="text-rose-700 leading-relaxed font-semibold">
                            <span className="font-black text-rose-900">เหตุผลที่นายหน้าแจ้ง:</span> &ldquo;{apt.cancelReason || 'นายหน้าติดภารกิจด่วนในช่วงเวลาดังกล่าว จึงไม่สามารถเปิดรอบนำชมได้'}&rdquo;
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 border border-rose-200/80 rounded-lg p-3 space-y-1.5 text-[11px]">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>ขั้นตอนถัดไปที่คุณสามารถทำได้:</span>
                        </div>
                        <ul className="space-y-1 text-slate-700 font-medium pl-5 list-disc">
                          <li>
                            <span className="font-bold text-blue-800">ทักแชทปรึกษานายหน้า:</span> เพื่อสอบถามช่วงวันและเวลาที่นายหน้าสะดวกตรงกัน และนัดหมายรอบใหม่
                          </li>
                          <li>
                            <span className="font-bold text-indigo-800">จองนัดหมายรอบใหม่:</span> เลือกรอบวัน/เวลาอื่นที่เปิดว่างอยู่ในตารางได้ทันที
                          </li>
                          <li>
                            <span className="font-bold text-slate-800">โทรติดต่อสอบถาม:</span> ติดต่อเบอร์ {apt.agentPhone || 'นายหน้า'} โดยตรงเพื่อความรวดเร็ว
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {apt.status === 'awaiting_customer' && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 space-y-2 text-xs text-indigo-900">
                      <div className="flex items-start gap-2">
                        <CalendarClock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <p className="font-extrabold text-indigo-950">
                            นายหน้าติดภารกิจ จึงเสนอขอปรับเปลี่ยนวัน/เวลาเข้าชมใหม่
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                            {apt.originalDate && (
                              <span className="text-slate-400 line-through">
                                เดิม: {apt.originalDate} ({apt.originalTimeSlot === 'afternoon' ? 'ช่วงบ่าย' : 'ช่วงเช้า'})
                              </span>
                            )}
                            <span className="text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-black">
                              เสนอใหม่: {apt.date} ({apt.timeSlotText || apt.timeSlot})
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-800 font-medium">
                            หากท่านสะดวกในวันเวลานี้ สามารถกด &ldquo;ตกลงรับวันใหม่&rdquo; ได้ทันที หรือหากต้องการวันอื่น สามารถกด &ldquo;แชทคุยกับนายหน้า&rdquo; เพื่อเลือกเวลาที่สะดวกตรงกัน
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {apt.status === 'pending' && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1 text-xs text-amber-900">
                      <div className="flex items-center gap-2 font-black text-amber-900">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>รอนายหน้าตรวจสอบและยืนยันคิว</span>
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium pl-5 leading-relaxed">
                        คำขอนัดหมายส่งถึงนายหน้าแล้ว นายหน้ากำลังตรวจสอบตารางการนำชม หากมีข้อสงสัยหรือต้องการสอบถามรายละเอียดเพิ่มเติม สามารถทักแชทสอบถามนายหน้าได้ล่วงหน้า
                      </p>
                    </div>
                  )}

                  {apt.status === 'approved' && !pastThisApt && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 space-y-1 text-xs text-emerald-900">
                      <div className="flex items-center gap-2 font-black text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>นัดหมายยืนยันแล้ว — พร้อมเข้าชมตามกำหนดการ</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium pl-5 leading-relaxed">
                        กรุณาเดินทางไปถึงจุดนัดหมายตามวันและเวลาที่กำหนด หากติดขัดปัญหาการเดินทาง สามารถโทรหรือแชทแจ้งนายหน้าได้ทันที
                      </p>
                    </div>
                  )}

                  {apt.status === 'approved' && pastThisApt && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1 text-xs text-amber-900">
                      <div className="flex items-center gap-2 font-black text-amber-900">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>รอบเวลาเข้าชมผ่านไปแล้ว — รอนายหน้าบันทึกผล</span>
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium pl-5 leading-relaxed">
                        ระบบกำลังรอนายหน้ายืนยันผลการเข้าชม เมื่อนายหน้ายืนยันเสร็จสิ้นแล้ว คุณจะสามารถให้คะแนนรีวิวการบริการของนายหน้าได้
                      </p>
                    </div>
                  )}

                  {apt.status === 'cancelled' && (
                    <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 space-y-1 text-xs text-slate-800">
                      <div className="flex items-center gap-2 font-black text-slate-700">
                        <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>การนัดหมายถูกยกเลิกแล้ว</span>
                      </div>
                      {apt.cancelReason && (
                        <p className="text-[11px] text-slate-600 pl-5 font-semibold">
                          เหตุผลการยกเลิก: &ldquo;{apt.cancelReason}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {apt.status === 'no_show' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1 text-xs text-red-900">
                      <div className="flex items-center gap-2 font-black text-red-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>บันทึกสถานะ: ไม่ได้มาตามนัดหมาย</span>
                      </div>
                      <p className="text-[11px] text-red-700 pl-5 font-semibold">
                        เหตุผลที่บันทึก: {apt.noShowNote || 'ไม่ได้เข้าชมตามเวลาที่นัดหมาย'}
                      </p>
                    </div>
                  )}

                  {apt.status === 'completed' && (
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 space-y-1 text-xs text-emerald-900">
                      <div className="flex items-center gap-2 font-black text-emerald-900">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>เข้าชมอสังหาริมทรัพย์เรียบร้อยแล้ว</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium pl-5">
                        ขอบคุณที่ให้ความไว้วางใจในการใช้บริการ สามารถให้คะแนนรีวิวนายหน้าเพื่อเป็นประโยชน์ต่อผู้ใช้บริการท่านอื่นได้ด้านล่าง
                      </p>
                    </div>
                  )}

                  {/* แถบปุ่มดำเนินการ (Actions Bar) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/properties/${apt.propertyId}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" /> ดูประกาศ
                      </Link>

                      {apt.agentPhone && apt.agentPhone !== '-' && (
                        <a
                          href={`tel:${apt.agentPhone}`}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" /> โทรหา ({apt.agentPhone})
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* ปุ่มแชทกับนายหน้า */}
                      <button 
                        onClick={() => handleOpenChat(apt.propertyId)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>{apt.status === 'rejected' ? 'แชทปรึกษาวันสะดวก' : 'แชทกับนายหน้า'}</span>
                      </button>

                      {/* รีวิวนายหน้า (เฉพาะ status === 'completed') */}
                      {apt.status === 'completed' && (
                        apt.review ? (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1">
                            <span className="text-amber-800 font-extrabold text-[11px] flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                              ให้คะแนนแล้ว ({apt.review.rating}/5)
                            </span>
                            <button
                              onClick={() => setReviewModalApt({
                                id: String(apt.id),
                                agentName: apt.agentName,
                                propertyName: apt.propertyName,
                                initialRating: apt.review?.rating || 5,
                                initialComment: apt.review?.comment || ''
                              })}
                              className="text-[10px] font-black text-blue-700 hover:text-blue-800 underline ml-1 cursor-pointer"
                            >
                              แก้ไข
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewModalApt({ 
                              id: String(apt.id), 
                              agentName: apt.agentName, 
                              propertyName: apt.propertyName,
                              initialRating: 5,
                              initialComment: ''
                            })}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-slate-950" /> ให้คะแนนการบริการ
                          </button>
                        )
                      )}

                      {/* กรณี rejected หรือ cancelled: ปุ่มจองรอบใหม่ */}
                      {(apt.status === 'rejected' || apt.status === 'cancelled') && (
                        <Link
                          href={`/book-appointment?propertyId=${apt.propertyId}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
                        >
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>จองนัดหมายรอบใหม่</span>
                        </Link>
                      )}

                      {/* กรณีนายหน้าขอเลื่อนวัน: ปุ่มยืนยันรับวันใหม่ */}
                      {apt.status === 'awaiting_customer' && (
                        <button
                          onClick={() => acceptNewDate(apt)}
                          disabled={acceptingId === String(apt.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs transition cursor-pointer active:scale-95 disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
                        >
                          {acceptingId === String(apt.id) ? (
                            <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังบันทึก...</span>
                          ) : (
                            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> ตกลงรับวันใหม่</span>
                          )}
                        </button>
                      )}

                      {/* ปุ่มยกเลิกนัด: เฉพาะนัดที่ยังไม่ถึงวัน และสถานะยังไม่สิ้นสุด */}
                      {!pastThisApt && !cancelledThisApt && (apt.status === 'approved' || apt.status === 'pending' || apt.status === 'awaiting_customer') && (
                        <button
                          onClick={() => openCancelModal(apt)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold text-xs transition cursor-pointer active:scale-95"
                        >
                          ยกเลิกนัด
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4.4 โมดัลยืนยันการยกเลิกนัดหมายแบบระบุเหตุผล */}
      {cancelingApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-red-600 text-base flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> ยืนยันการยกเลิกนัดหมาย
              </h3>
              <button onClick={closeCancelModal} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500">อสังหาริมทรัพย์ที่ขอนัดดู:</p>
              <p className="text-sm font-extrabold text-slate-900 line-clamp-1">{cancelingApt.propertyName}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">นายหน้า: {cancelingApt.agentName}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700">กรุณาเลือกเหตุผลในการยกเลิก:</label>
              
              {[
                "ติดภารกิจด่วน / การเดินทางไม่สะดวก",
                "ได้อสังหาริมทรัพย์หลังอื่นแล้ว",
                "ต้องการเปลี่ยนไปจองวัน/เวลารอบใหม่",
                "งบประมาณหรือแผนเปลี่ยน",
                "อื่นๆ"
              ].map((reasonOpt, idx) => (
                <label key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition cursor-pointer text-xs font-bold text-slate-700">
                  <input 
                    type="radio" 
                    name="cancelReasonOption" 
                    value={reasonOpt} 
                    checked={cancelReasonOption === reasonOpt}
                    onChange={(e) => setCancelReasonOption(e.target.value)}
                    className="accent-red-600"
                  />
                  <span>{reasonOpt}</span>
                </label>
              ))}

              {cancelReasonOption === 'อื่นๆ' && (
                <textarea
                  rows={2}
                  placeholder="พิมพ์ระบุเหตุผลเพิ่มเติม..."
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-red-500 mt-2"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={closeCancelModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={confirmCancelAppointment}
                disabled={submittingCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow disabled:opacity-50"
              >
                {submittingCancel ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิกนัด'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.5 โมดัลสำหรับให้คะแนนรีวิวนายหน้า */}
      {reviewModalApt && (
        <ReviewModal
          isOpen={true}
          appointmentId={reviewModalApt.id}
          agentName={reviewModalApt.agentName}
          propertyName={reviewModalApt.propertyName}
          initialRating={reviewModalApt.initialRating}
          initialComment={reviewModalApt.initialComment}
          onClose={() => setReviewModalApt(null)}
          onSuccess={() => {
            setReviewModalApt(null);
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}