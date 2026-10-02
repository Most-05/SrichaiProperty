'use client';

/**
 * ==============================================================================
 * หน้าจองคิวนัดหมายเข้าชมสถานที่จริง (Book Appointment Page)
 * /app/(customer)/book-appointment/page.tsx
 * ==============================================================================
 * วัตถุประสงค์หลัก:
 * 1. ดึงวันและรอบเวลาที่เปิดว่างจริงจากนายหน้า (`property_viewing_slots`) สำหรับอสังหาริมทรัพย์หลังนี้
 * 2. แสดงปฏิทินให้ลูกค้าเลือกวันที่สะดวก และเลือกรอบเวลา (รอบเช้า 09:00-12:00 น. / รอบบ่าย 13:00-17:00 น.)
 * 3. บันทึกข้อมูลคำขอนัดหมายลงตาราง `appointments` ในฐานข้อมูลจริงผ่าน API
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApp } from '@/context/AppContext';
import BookingSidebar from '@/components/customer/BookingSidebar';
import BookingCalendar from '@/components/customer/BookingCalendar';
import { NO_SHOW_LIMIT, timeSlotRange } from '@/lib/constants';
import { toast } from '@/components/ui/toast';
import { Bell, Check, Loader2, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';

// รายชื่อเดือนภาษาไทยสำหรับแสดงผลวันที่แบบข้อความอ่านง่าย
const MONTH_NAMES_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

function BookAppointmentForm() {
  // ----------------------------------------------------------------------------
  // 1. ROUTER & URL PARAMS
  // ----------------------------------------------------------------------------
  const searchParams = useSearchParams();
  const router = useRouter();
  const propertyId = searchParams.get('propertyId'); // รหัสอสังหาฯ ที่ส่งมาจากหน้าก่อนหน้า (?propertyId=uuid)
  const today = new Date();

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  const { status: authStatus } = useSession();
  const isGuest = authStatus === 'unauthenticated';
  const returnUrl = propertyId ? `/book-appointment?propertyId=${propertyId}` : '/book-appointment';

  // ----------------------------------------------------------------------------
  // 2. LOCAL COMPONENT STATE (สถานะภายในฟอร์ม)
  // ----------------------------------------------------------------------------
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());  // ปีของปฏิทินที่เปิดอยู่
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());   // เดือนของปฏิทินที่เปิดอยู่
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');          // วันที่ผู้ใช้เลือก (รูปแบบ "YYYY-MM-DD")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');        // ช่วงเวลาที่เลือก (รอบเช้า / รอบบ่าย)
  const [note, setNote] = useState('');                                         // ข้อความเพิ่มเติมถึงนายหน้า
  const [submitting, setSubmitting] = useState(false);                          // สถานะกำลังส่งข้อมูล (ป้องกันการกดซ้ำ)
  const [holidays, setHolidays] = useState<string[]>([]);                       // รายการวันหยุดประจำปี
  const [viewingSlots, setViewingSlots] = useState<{ date: string; timeSlot: string; isBooked: boolean; agentBusyElsewhere: boolean }[]>([]); // รอบเวลาที่เปิดว่างจริง
  // รอบที่ลูกค้าคนนี้ลงคิวรอไว้แล้ว เก็บเป็นคีย์ "วันที่|รอบเวลา" ให้เช็คเร็วตอนเรนเดอร์
  const [waitlistKeys, setWaitlistKeys] = useState<string[]>([]);
  const [waitlistBusy, setWaitlistBusy] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);                       // สถานะกำลังดึงข้อมูลรอบเวลา

  // ----------------------------------------------------------------------------
  // 3. GLOBAL CONTEXT
  // ----------------------------------------------------------------------------
  const { properties, propertiesLoading, refreshAppointments, appointments } = useApp();

  // ค้นหาอสังหาริมทรัพย์ที่ตรงกับ propertyId
  const property = properties.find((p) => String(p.id) === String(propertyId));

  // (ตรงกับที่ POST /api/appointments เช็คไว้อยู่แล้ว อันนี้แค่แจ้งเตือนล่วงหน้าก่อนกดจองจริง)
  const isBlockedByNoShow = appointments.filter((a) => a.status === 'no_show').length >= NO_SHOW_LIMIT;

  // ----------------------------------------------------------------------------
  // 4. EFFECTS & FETCHING (ดึงข้อมูลวันว่างและวันหยุดจาก API)
  // ----------------------------------------------------------------------------
  
  // 4.1 โหลดวันและช่วงเวลาที่นายหน้าเปิดว่างสำหรับบ้านหลังนี้โดยเฉพาะ
  useEffect(() => {
    if (!property?.id) return;
    let active = true;
    fetch(`/api/properties/viewing-slots?propertyId=${property.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.slots)) setViewingSlots(data.slots);
      })
      .catch(console.error)
      .finally(() => active && setSlotsLoading(false));

    return () => { active = false; };
  }, [property?.id]);

  // 4.1.1 โหลดรอบที่ตัวเองลงคิวรอไว้กับบ้านหลังนี้ (ใช้ตัดสินว่าปุ่มควรขึ้นว่า "รออยู่แล้ว")
  useEffect(() => {
    if (!property?.id) return;
    let active = true;
    fetch(`/api/appointments/waitlist?propertyId=${property.id}`)
      .then((res) => res.json())
      .then((data) => { if (active && data.success) setWaitlistKeys(data.waitlistKeys || []); })
      .catch(() => {}); // โหลดไม่ได้ก็แค่ไม่โชว์สถานะคิว ไม่ต้องขัดจังหวะการจอง
    return () => { active = false; };
  }, [property?.id]);

  // 🔑 KEYWORD: ลงคิวรอ / ยกเลิกคิวรอ รอบที่จองไม่ได้
  const toggleWaitlist = async (dateStr: string, timeSlot: string) => {
    if (isGuest) {
      toast.error('กรุณาเข้าสู่ระบบก่อนลงคิวรอ');
      router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    const key = `${dateStr}|${timeSlot}`;
    const joined = waitlistKeys.includes(key);
    setWaitlistBusy(key);
    try {
      const res = await fetch('/api/appointments/waitlist', {
        method: joined ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property?.id, date: dateStr, timeSlot })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'ทำรายการไม่สำเร็จ'); return; }
      setWaitlistKeys((prev) => (joined ? prev.filter((k) => k !== key) : [...prev, key]));
      toast.success(joined ? 'ยกเลิกคิวรอแล้ว' : 'ลงคิวรอแล้ว จะแจ้งเตือนทันทีที่รอบนี้ว่าง');
    } catch {
      toast.error('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
    } finally {
      setWaitlistBusy(null);
    }
  };

  // 4.2 โหลดข้อมูลวันหยุดนักขัตฤกษ์ประจำปี
  useEffect(() => {
    let active = true;
    fetch(`/api/holidays?year=${currentYear}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.holidays)) setHolidays(data.holidays);
      })
      .catch(console.error);

    return () => { active = false; };
  }, [currentYear]);

  // ----------------------------------------------------------------------------
  // 5. COMPUTED & MEMOIZED VALUES
  // ----------------------------------------------------------------------------
  // 5.1 คำนวณแยก 2 กลุ่ม: วันที่มีรอบว่างให้จองได้ (availableDates) vs วันที่เปิดรับนัดแต่ถูกจองเต็มแล้วทุกรอบ (fullyBookedDates)
  const { availableDates, fullyBookedDates } = useMemo(() => {
    const dateMap = new Map<string, { total: number; bookedCount: number }>();

    viewingSlots.forEach((slot) => {
      const current = dateMap.get(slot.date) || { total: 0, bookedCount: 0 };
      current.total += 1;
      if (slot.isBooked || slot.agentBusyElsewhere) {
        current.bookedCount += 1;
      }
      dateMap.set(slot.date, current);
    });

    const available: string[] = [];
    const fullyBooked: string[] = [];

    dateMap.forEach((info, date) => {
      if (info.total > 0 && info.bookedCount >= info.total) {
        fullyBooked.push(date); // นายหน้าเปิดรอบรับนัด แต่ถูกจองเต็มแล้วทุกรอบ
      } else if (info.total > info.bookedCount) {
        available.push(date);   // ยังมีอย่างน้อย 1 รอบว่างให้จอง
      }
    });

    return { availableDates: available, fullyBookedDates: fullyBooked };
  }, [viewingSlots]);

  // ตรวจสอบว่าวันที่กำลังเลือกอยู่เป็น "วันนัดเต็มแล้ว" หรือไม่
  const isSelectedDateFullyBooked = useMemo(() => {
    if (!selectedDateStr) return false;
    return fullyBookedDates.includes(selectedDateStr);
  }, [selectedDateStr, fullyBookedDates]);

  // 5.2 กรองเฉพาะรอบเวลาของ "วันที่ที่เลือกอยู่ปัจจุบัน"
  const slotsForSelectedDate = useMemo(() => 
    viewingSlots.filter((s) => s.date === selectedDateStr)
  , [viewingSlots, selectedDateStr]);

  const morningSlot = slotsForSelectedDate.find((s) => s.timeSlot === 'morning');
  const afternoonSlot = slotsForSelectedDate.find((s) => s.timeSlot === 'afternoon');

  // ฟังก์ชันเลือกวันที่ในปฏิทิน (ล้างรอบเวลาเดิมทิ้งเมื่อเปลี่ยนวันใหม่)
  const handleDateSelect = (date: string) => {
    setSelectedDateStr(date);
    setSelectedTimeSlot('');
  };

  // จัดข้อความสรุปวันที่เลือกสำหรับแสดงผลบน Badge หัวข้อขั้นตอนที่ 2
  const getThaiPreviewDate = () => {
    if (!selectedDateStr) return 'ยังไม่ได้เลือกวันที่';
    try {
      const [, m, d] = selectedDateStr.split('-');
      return `วันที่ ${parseInt(d)} ${MONTH_NAMES_TH[parseInt(m) - 1]?.substring(0, 3)}.`;
    } catch {
      return '';
    }
  };

  // ----------------------------------------------------------------------------
  // 6. FORM SUBMISSION HANDLER (บันทึกคำขอนัดหมายลง DB)
  // ----------------------------------------------------------------------------
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการจองนัดหมาย');
      router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (!property || !selectedDateStr || !selectedTimeSlot || isBlockedByNoShow) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          date: selectedDateStr,
          timeSlot: selectedTimeSlot,
          note
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถทำนัดหมายได้');

      toast.success(`ส่งขอจองนัดหมายสำหรับ "${property.title}" เรียบร้อยแล้ว!`);
      await refreshAppointments(); // ดึงนัดหมายล่าสุดเข้า Context
      router.push('/appointments'); // นำทางไปยังหน้ารายการนัดหมายของฉัน
    } catch (err) {
      toast.error((err as Error).message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  // แสดงผล Spinner ระหว่างรอโหลดรายการบ้าน
  if (propertiesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // กรณีหาอสังหาริมทรัพย์รหัสนี้ไม่เจอ
  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-bold gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p>ไม่พบอสังหาริมทรัพย์ที่ต้องการจองนัดหมาย</p>
        <button onClick={() => router.push('/search')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition">
          ค้นหาบ้าน/คอนโด
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 7. RENDERING SECTION
  // ----------------------------------------------------------------------------
  return (
    <div className="font-sans bg-slate-50/50 min-h-screen text-slate-800 antialiased text-sm pb-24 pt-6 sm:pt-8">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* หัวข้อหน้าและปุ่มย้อนกลับ */}
        <div className="mb-8">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-blue-600 font-bold text-xs flex items-center gap-1.5 mb-2 transition cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับไปหน้ารายละเอียด</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ทำการนัดหมาย</h1>
          <p className="text-slate-500 text-xs mt-0.5">เลือกวันและเวลาที่คุณสะดวก เพื่อเข้าชมสถานที่จริง</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* การ์ดสรุปข้อมูลอสังหาฯ และนายหน้าฝั่งซ้าย */}
          <BookingSidebar property={property} />

          {/* ฟอร์มการจองนัดหมายฝั่งขวา (3 ขั้นตอน) */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-sm space-y-8">
            {/* แจ้งเตือนกรณีเป็น Guest ยังไม่ได้ล็อกอิน */}
            {isGuest && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-blue-950">คุณกำลังเข้าชมในฐานะผู้เยี่ยมชม</p>
                    <p className="text-blue-700 text-[11px]">กรุณาเข้าสู่ระบบเพื่อให้ข้อมูลการจองเชื่อมโยงกับบัญชีของคุณ</p>
                  </div>
                </div>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(returnUrl)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs shrink-0 cursor-pointer text-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              </div>
            )}

            {/* แจ้งเตือนก่อนจองว่าถูกจำกัดจากประวัติไม่มาตามนัด */}
            {isBlockedByNoShow && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  บัญชีของคุณมีประวัติไม่มาตามนัดครบ {NO_SHOW_LIMIT} ครั้ง จึงถูกจำกัดการจองนัดใหม่ชั่วคราว
                  กรุณาติดต่อทีมงานหากต้องการความช่วยเหลือ
                </span>
              </div>
            )}
            <form onSubmit={handleBookingSubmit} className="space-y-8">
              
              {/* ================================================================
                  ขั้นตอนที่ 1: เลือกวันที่ในปฏิทิน
                  ================================================================ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold">1</span>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">เลือกวันที่สะดวก</label>
                </div>

                <BookingCalendar
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  setCurrentYear={setCurrentYear}
                  setCurrentMonth={setCurrentMonth}
                  selectedDateStr={selectedDateStr}
                  setSelectedDateStr={handleDateSelect}
                  holidays={holidays}
                  availableDates={availableDates}
                  fullyBookedDates={fullyBookedDates}
                />

                {/* ข้อความเตือนกรณีไม่มีวันว่างเปิดให้จองเลย */}
                {!slotsLoading && availableDates.length === 0 && fullyBookedDates.length === 0 && (
                  <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>นายหน้ายังไม่ได้เปิดวันว่างสำหรับบ้านหลังนี้ กรุณาติดต่อนายหน้าโดยตรง</span>
                  </div>
                )}
                {!slotsLoading && availableDates.length === 0 && fullyBookedDates.length > 0 && (
                  <div className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>วันนัดหมายที่เปิดไว้ถูกจองเต็มทั้งหมดแล้ว คุณสามารถคลิกวันที่ต้องการเพื่อลงชื่อคิวรอรับการแจ้งเตือนได้</span>
                  </div>
                )}
              </div>

              {/* ================================================================
                  ขั้นตอนที่ 2: เลือกรอบเวลา (รอบเช้า / รอบบ่าย)
                  ================================================================ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold">2</span>
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider">เลือกรอบเวลา</label>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    {getThaiPreviewDate()}
                  </span>
                </div>

                {/* แจ้งเตือนเมื่อเลือกวันที่ถูกจองเต็มแล้วทุกรอบ */}
                {isSelectedDateFullyBooked && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-rose-950">วันนี้นัดหมายเต็มทุกรอบแล้ว</p>
                      <p className="text-rose-700 text-[11px] mt-0.5 leading-relaxed">
                        นายหน้าเปิดรับนัดในวันนี้ แต่มีผู้จองเต็มครบทุกรอบแล้ว คุณสามารถกดปุ่ม <span className="font-black text-rose-900">"แจ้งเตือนฉันถ้ารอบนี้ว่าง"</span> ที่รอบเวลาด้านล่าง เพื่อเข้าคิวรอรับการแจ้งเตือนทันทีหากมีผู้ยกเลิกนัด
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'morning', title: 'รอบเช้า', time: timeSlotRange('morning'), fullText: `รอบเช้า (${timeSlotRange('morning')} น.)`, slot: morningSlot },
                    { key: 'afternoon', title: 'รอบบ่าย', time: timeSlotRange('afternoon'), fullText: `รอบบ่าย (${timeSlotRange('afternoon')} น.)`, slot: afternoonSlot },
                  ].map(({ key, title, time, fullText, slot }) => {
                    const isSelected = selectedTimeSlot.includes(title);
                    
                    // นายหน้าเปิดวันว่างซ้อนกันได้หลายบ้าน แต่ไปนำชมได้ทีละที่ — ถ้ามีนัดจริงกับบ้านหลังอื่น
                    // ชนวัน+เวลานี้อยู่แล้ว ต้องปิดไม่ให้ลูกค้ากดจองซ้ำ (server กันซ้ำอยู่แล้ว แต่บอกไว้ก่อนดีกว่า)
                    const isDisabled = !slot || slot.isBooked || slot.agentBusyElsewhere;

                    // รอบที่ "มีคนจองแล้ว" หรือ "นายหน้าติดนัดบ้านหลังอื่น" ยังมีโอกาสว่างได้
                    // ถ้าฝั่งนั้นยกเลิก/ถูกปฏิเสธ/ขอเลื่อนวัน จึงให้ลงคิวรอไว้ได้
                    // ส่วนรอบที่นายหน้าไม่ได้เปิดเลย (ไม่มี slot) ไม่มีอะไรให้รอ
                    const canWait = Boolean(slot) && (slot!.isBooked || slot!.agentBusyElsewhere);
                    const waitKey = `${selectedDateStr}|${key}`;
                    const isWaiting = waitlistKeys.includes(waitKey);

                    return (
                      <div key={key} className="space-y-1.5">
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedTimeSlot((prev) => (prev.includes(title) ? '' : fullText))}
                        className={`p-4 rounded-2xl border text-left transition flex justify-between items-center ${
                          isDisabled
                            ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                            : isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/10 cursor-pointer'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer'
                        }`}
                      >
                        <div>
                          <h4 className="font-extrabold text-xs">{title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{time}</p>
                        </div>
                        {!selectedDateStr ? (
                          <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[8px] font-bold">เลือกวันก่อน</span>
                        ) : slot?.isBooked ? (
                          <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-[8px] font-bold">มีคนจองแล้ว</span>
                        ) : slot?.agentBusyElsewhere ? (
                          <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[8px] font-bold">นายหน้าติดนัดบ้านหลังอื่น</span>
                        ) : slot ? (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-bold inline-flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0 stroke-[3]" />
                            ว่างให้จอง
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[8px] font-bold">ไม่เปิดว่าง</span>
                        )}
                      </button>

                      {/* 🔑 KEYWORD: ปุ่มลงคิวรอรอบที่จองไม่ได้ */}
                      {canWait && (
                        <button
                          type="button"
                          disabled={waitlistBusy === waitKey}
                          onClick={() => toggleWaitlist(selectedDateStr, key)}
                          className={`w-full px-3 py-2 rounded-xl border text-[10px] font-extrabold transition cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                            isWaiting
                              ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          {waitlistBusy === waitKey ? (
                            <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin shrink-0" /> กำลังบันทึก...</span>
                          ) : isWaiting ? (
                            <span className="flex items-center justify-center gap-1.5"><Check className="w-3 h-3 shrink-0 text-blue-600" /> รออยู่ — กดอีกครั้งเพื่อยกเลิกคิว</span>
                          ) : (
                            <span className="flex items-center justify-center gap-1.5"><Bell className="w-3 h-3 shrink-0" /> แจ้งเตือนฉันถ้ารอบนี้ว่าง</span>
                          )}
                        </button>
                      )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================================================================
                  ขั้นตอนที่ 3: ฝากข้อความถึงนายหน้า และ ปุ่มยืนยันการจอง
                  ================================================================ */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold">3</span>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">ข้อความเพิ่มเติม & ยืนยัน</label>
                </div>

                <textarea
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ฝากข้อความถึงนายหน้า (เช่น ขอไปเจอกันที่หน้าโครงการหมู่บ้านเลย).."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition text-slate-800 font-bold text-xs resize-none placeholder-slate-400"
                />

                <button
                  type="submit"
                  disabled={submitting || !selectedDateStr || !selectedTimeSlot || isBlockedByNoShow}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition shadow flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed text-xs cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin shrink-0" /> กำลังบันทึกข้อมูลนัดชม...</span>
                  ) : (!selectedDateStr || !selectedTimeSlot) ? (
                    isSelectedDateFullyBooked ? 'วันนี้นัดหมายเต็มทุกรอบแล้ว (กดปุ่มลงคิวรอด้านบน)' : 'กรุณาเลือกวันและช่วงเวลาก่อน'
                  ) : (
                    'ยืนยันการนัดหมาย'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ใช้ Suspense เพื่อรองรับ useSearchParams() ใน Next.js App Router
export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <BookAppointmentForm />
    </Suspense>
  );
}