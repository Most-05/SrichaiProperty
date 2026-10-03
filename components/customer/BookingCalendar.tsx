'use client';

/**
 * ==============================================================================
 * คอมโพเนนต์ปฏิทินเลือกวันนัดหมาย (BookingCalendar Component)
 * /components/customer/BookingCalendar.tsx
 * ==============================================================================
 * วัตถุประสงค์หลัก:
 * 1. คำนวณและแสดงผลตารางปฏิทินประจำเดือน พร้อมปุ่มเลื่อนเดือนถอยหลัง/เดินหน้า
 * 2. ตรวจสอบสถานะของแต่ละวันในเดือน:
 *    - วันที่ผ่านมาแล้ว (isPast)
 *    - วันที่เปิดว่างให้จอง (isAvailable) -> แสดงป้าย "ว่าง"
 *    - วันที่เปิดรับนัดแต่นัดเต็มแล้วทุกรอบ (isFullyBooked) -> แสดงป้าย "เต็ม"
 *    - วันหยุดนักขัตฤกษ์ (isHoliday) -> แสดงป้าย "หยุด"
 *    - วันที่นายหน้าไม่ได้เปิดรับนัด (isDisabled) -> สีเทาจาง กดไม่ได้
 * 3. ออกแบบช่องวันเป็น Tile ชัดเจน แสดงตัวเลขวันที่คู่กับป้ายสถานะภาษาไทยชัดเจน
 * ==============================================================================
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingCalendarProps {
  currentYear: number;
  currentMonth: number;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  setCurrentMonth: React.Dispatch<React.SetStateAction<number>>;
  selectedDateStr: string;
  setSelectedDateStr: (date: string) => void;
  holidays: string[];
  availableDates: string[];
  fullyBookedDates?: string[];
}

const MONTH_NAMES_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function BookingCalendar({
  currentYear,
  currentMonth,
  setCurrentYear,
  setCurrentMonth,
  selectedDateStr,
  setSelectedDateStr,
  holidays,
  availableDates,
  fullyBookedDates = []
}: BookingCalendarProps) {
  
  const changeMonth = (delta: number) => {
    const d = new Date(currentYear, currentMonth + delta, 1);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const holidaySet = useMemo(() => new Set(holidays), [holidays]);
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);
  const fullyBookedSet = useMemo(() => new Set(fullyBookedDates), [fullyBookedDates]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div className="border border-slate-200 rounded-3xl p-4 sm:p-5 max-w-lg mx-auto bg-white shadow-sm">
      
      {/* 4.1 แผงควบคุมเลื่อนเดือน (Header Control) */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button 
          type="button" 
          onClick={() => changeMonth(-1)} 
          className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
        </button>
        
        <span className="text-xs sm:text-sm font-black text-slate-800">
          {MONTH_NAMES_TH[currentMonth]} {currentYear + 543}
        </span>
        
        <button 
          type="button" 
          onClick={() => changeMonth(1)} 
          className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* 4.2 หัวแถววันในสัปดาห์ (Days of Week Header) */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black pb-2 mb-2 border-b border-slate-100">
        <span className="text-rose-500">อา</span>
        <span className="text-slate-400">จ</span>
        <span className="text-slate-400">อ</span>
        <span className="text-slate-400">พ</span>
        <span className="text-slate-400">พฤ</span>
        <span className="text-slate-400">ศ</span>
        <span className="text-blue-500">ส</span>
      </div>

      {/* 4.3 ตารางแสดงวันที่ทั้งหมดในเดือน (Calendar Days Grid) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold">
        
        {/* เติมบล็อกช่องว่างสำหรับวันก่อนวันที่ 1 ของเดือน */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="min-h-[50px] sm:min-h-[56px]" />
        ))}

        {/* วนลูปสร้างปุ่มกดตั้งแต่วันที่ 1 ถึงวันสุดท้ายของเดือน */}
        {Array.from({ length: totalDaysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          
          const isSelected = selectedDateStr === dateStr;
          const isHoliday = holidaySet.has(dateStr);
          const isAvailable = availableSet.has(dateStr);
          const isFullyBooked = fullyBookedSet.has(dateStr);
          const isPast = new Date(currentYear, currentMonth, dayNum) < todayStart;
          
          const isDisabled = isPast || (!isAvailable && !isFullyBooked);

          // ข้อความ Tooltip
          let tooltip = "";
          if (isPast) {
            tooltip = "วันที่ผ่านมาแล้ว";
          } else if (isFullyBooked) {
            tooltip = "นัดเต็มทุกรอบแล้ว (คลิกเพื่อลงชื่อคิวรอ)";
          } else if (isAvailable) {
            tooltip = "มีรอบว่างให้จอง";
          } else if (isHoliday) {
            tooltip = "วันหยุดพิเศษ";
          } else {
            tooltip = "ไม่เปิดรับนัด";
          }

          // สไตล์ของ Cell และ Badge ป้ายกำกับ
          let cellClass = "w-full min-h-[50px] sm:min-h-[56px] p-1 sm:p-1.5 rounded-xl border flex flex-col items-center justify-between transition-all ";
          let numClass = "text-xs sm:text-sm font-bold leading-none ";
          let badge: React.ReactNode = null;

          if (isPast) {
            cellClass += "border-transparent bg-slate-50/40 text-slate-300 cursor-not-allowed";
            numClass += "text-slate-300";
          } else if (isSelected) {
            cellClass += "border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30 cursor-pointer active:scale-95";
            numClass += "text-white font-extrabold";
            if (isFullyBooked) {
              badge = <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white text-rose-600 leading-none shadow-xs">เต็ม</span>;
            } else if (isAvailable) {
              badge = <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white text-emerald-700 leading-none shadow-xs">ว่าง</span>;
            } else {
              badge = <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500 text-white leading-none">เลือก</span>;
            }
          } else if (isFullyBooked) {
            // วันที่นายหน้าเปิดรับนัด แต่ถูกลูกค้าจองเต็มทุกรอบแล้ว
            cellClass += "border-2 border-rose-300 bg-rose-50/90 text-rose-700 hover:bg-rose-100 hover:border-rose-400 cursor-pointer shadow-xs active:scale-95";
            numClass += "text-rose-950 font-black";
            badge = (
              <span className="text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.5 rounded-md bg-rose-200/90 text-rose-900 border border-rose-300 leading-none">
                เต็ม
              </span>
            );
          } else if (isAvailable) {
            // วันที่นายหน้าเปิดและยังมีรอบว่างให้จอง
            cellClass += "border border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/70 hover:border-emerald-400 cursor-pointer shadow-xs active:scale-95";
            numClass += "text-emerald-950 font-bold";
            badge = (
              <span className="text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300/80 leading-none">
                ว่าง
              </span>
            );
          } else if (isHoliday) {
            cellClass += "border border-amber-200 bg-amber-50/50 text-amber-700 cursor-not-allowed";
            numClass += "text-amber-800";
            badge = <span className="text-[8px] font-medium text-amber-600 leading-none">หยุด</span>;
          } else {
            // วันที่ไม่ได้เปิดรับนัด
            cellClass += "border border-transparent bg-slate-50/40 text-slate-300 cursor-not-allowed";
            numClass += "text-slate-300";
            badge = <span className="text-[9px] text-slate-200 leading-none">·</span>;
          }

          return (
            <button
              key={dayNum}
              type="button"
              disabled={isDisabled}
              onClick={() => setSelectedDateStr(dateStr)}
              className={cellClass}
              title={tooltip}
            >
              <span className={numClass}>{dayNum}</span>
              {badge}
            </button>
          );
        })}
      </div>

      {/* 4.4 คำอธิบายสัญลักษณ์สีของปฏิทิน (Legend Indicator) */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-5 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border border-emerald-400 bg-emerald-100 shrink-0" /> 
          <span>ว่างให้จอง</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border-2 border-rose-300 bg-rose-200 shrink-0" /> 
          <span className="text-rose-700 font-extrabold">นัดเต็มแล้ว</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 shrink-0" /> 
          <span>กำลังเลือก</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border border-amber-300 bg-amber-100 shrink-0" /> 
          <span>วันหยุด</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 shrink-0" /> 
          <span className="text-slate-400 font-normal">ไม่เปิดรับนัด</span>
        </span>
      </div>

    </div>
  );
}