'use client';

/**
 * ==============================================================================
 * [SEARCH: ADMIN_STAT_CARDS] [UI: การ์ดสรุปสถิติแอดมิน] [STYLE: STAT_CARD_GRID]
 * การ์ดสรุปตัวเลขสถิติภาพรวมของผู้ดูแลระบบ (Admin Metric Stat Cards)
 * /components/admin/StatCards.tsx
 * ==============================================================================
 * วัตถุประสงค์และฟังก์ชันหลัก:
 * 1. แสดงตัวเลขสรุป 5 ตัวชี้วัดสำคัญของระบบ:
 *    - ประกาศรอตรวจสอบ (Pending Moderation) พร้อมป้ายเตือนหากมีงานค้าง
 *    - ยืนยันตัวตน KYC (Pending KYC Approval)
 *    - สลิปชำระเงินรอตรวจ (Pending Payment Verifications)
 *    - นัดหมายชมบ้าน (Pending Appointments)
 *    - ประกาศออนไลน์ทั้งหมด (Active Listings)
 * 2. ลิงก์นำทางด่วน (Quick Navigation Link) ไปยังหน้าจัดการที่เกี่ยวข้องทันที
 * 3. ดีไซน์ Dynamic Top Border Color: ขอบบนเปลี่ยนสีตามความเร่งด่วนของงาน
 * ==============================================================================
 */

// นำเข้า React สำหรับสร้างคอมโพเนนต์
import React from 'react';
// นำเข้า Link จาก Next.js สำหรับการคลิกเปลี่ยนหน้าแบบ Client-Side SPA ไม่ต้องโหลดใหม่ทั้งหน้า
import Link from 'next/link';

/**
 * กำหนดประเภทข้อมูล Props ที่รับเข้ามาสำหรับการ์ดสถิติ
 */
interface Props {
  pendingCount: number;             // จำนวนประกาศอสังหาฯ ที่รอการตรวจสอบ
  approvedListingsCount?: number;   // จำนวนประกาศที่อนุมัติแล้วและกำลังออนไลน์
  kycCount?: number;                // จำนวนคำขอยืนยันตัวตนนายหน้าที่รออนุมัติ
  paymentsCount?: number;           // จำนวนสลิปการโอนเงินค่าแพ็กเกจที่รอตรวจสอบ
  pendingAppointmentsCount?: number;// จำนวนคิวนัดหมายชมบ้านที่รอการประสานงาน
  agentsCount?: number;             // จำนวนนายหน้าทั้งหมดในระบบ
  proAgentsCount?: number;          // จำนวนนายหน้าระดับ PRO
}

/**
 * คอมโพเนนต์แสดงแผงการ์ดสถิติสรุปภาพรวม (Stat Cards Component)
 */
export default function StatCards({
  pendingCount = 0,             // ค่าเริ่มต้น: 0
  approvedListingsCount = 0,    // ค่าเริ่มต้น: 0
  kycCount = 0,                 // ค่าเริ่มต้น: 0
  paymentsCount = 0,            // ค่าเริ่มต้น: 0
  pendingAppointmentsCount = 0, // ค่าเริ่มต้น: 0
  agentsCount = 0,              // ค่าเริ่มต้น: 0
  proAgentsCount = 0            // ค่าเริ่มต้น: 0
}: Props) {
  // สร้างอาเรย์ของข้อมูลการ์ดทั้ง 5 ใบ พร้อมตรรกะเงื่อนไขสีและการนำทาง
  const stats = [
    // ใบที่ 1: ประกาศรอตรวจสอบ (Pending Moderation)
    {
      title: 'ประกาศรอตรวจสอบ',
      count: pendingCount,
      unit: 'รายการ',
      subtitle: pendingCount > 0 ? 'จำเป็นต้องตรวจก่อนขึ้นเว็บ' : 'ไม่มีประกาศค้างตรวจ',
      href: '/admin/moderation?tab=pending',
      // หากมีงานค้าง ให้ขอบบนเป็นสีส้มเพื่อเตือนความเร่งด่วน
      topBorderColor: pendingCount > 0 ? 'border-t-amber-500' : 'border-t-slate-200',
      badge: pendingCount > 0 ? { text: 'ต้องตรวจ', className: 'text-amber-800 bg-amber-50 border border-amber-200' } : null
    },
    // ใบที่ 2: ยืนยันตัวตน KYC นายหน้า
    {
      title: 'ยืนยันตัวตน KYC',
      count: kycCount,
      unit: 'ราย',
      subtitle: `นายหน้าทั้งหมด ${agentsCount} คน`,
      href: '/admin/kyc',
      // หากมีคิวรอ ให้ขอบบนเป็นสีคราม (Indigo)
      topBorderColor: kycCount > 0 ? 'border-t-indigo-500' : 'border-t-slate-200',
      badge: kycCount > 0 ? { text: 'รออนุมัติ', className: 'text-indigo-800 bg-indigo-50 border border-indigo-200' } : null
    },
    // ใบที่ 3: สลิปชำระเงินค่าแพ็กเกจรอตรวจ
    {
      title: 'สลิปชำระเงินรอตรวจ',
      count: paymentsCount,
      unit: 'รายการ',
      subtitle: `สมาชิก PRO ${proAgentsCount} คน`,
      href: '/admin/payments',
      // หากมีสลิปรอตรวจ ให้ขอบบนเป็นสีเขียวมรกต (Emerald)
      topBorderColor: paymentsCount > 0 ? 'border-t-emerald-500' : 'border-t-slate-200',
      badge: paymentsCount > 0 ? { text: 'รอตรวจสอบ', className: 'text-emerald-800 bg-emerald-50 border border-emerald-200' } : null
    },
    // ใบที่ 4: นัดหมายชมบ้าน
    {
      title: 'นัดหมายชมบ้าน',
      count: pendingAppointmentsCount,
      unit: 'นัด',
      subtitle: 'คิวนัดหมายที่รอดำเนินการ',
      href: '/admin/dashboard#appointments',
      // หากมีนัดหมายค้าง ให้ขอบบนเป็นสีฟ้า (Sky)
      topBorderColor: pendingAppointmentsCount > 0 ? 'border-t-sky-500' : 'border-t-slate-200',
      badge: pendingAppointmentsCount > 0 ? { text: 'มีคิวใหม่', className: 'text-sky-800 bg-sky-50 border border-sky-200' } : null
    },
    // ใบที่ 5: ประกาศออนไลน์ทั้งหมด
    {
      title: 'ประกาศออนไลน์',
      count: approvedListingsCount,
      unit: 'ประกาศ',
      subtitle: 'แสดงผลบนหน้าเว็บไซต์',
      href: '/admin/moderation?tab=approved',
      // ขอบบนสีเทาเรียบหรูสำหรับสถิติเชิงปริมาณทั่วไป
      topBorderColor: 'border-t-slate-400',
      badge: { text: 'Active', className: 'text-emerald-700 bg-emerald-50 border border-emerald-200' }
    }
  ];

  return (
    // การจัดวางแบบ Grid: มือถือ 2 คอลัมน์, จอใหญ่ 5 คอลัมน์
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-5">
      {stats.map((item, idx) => (
        // การ์ดคลิกได้ นำทางไปยัง URL ที่กำหนด
        <Link
          key={idx}
          href={item.href}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 ${item.topBorderColor} border-t-3 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between`}
        >
          <div>
            {/* ส่วนหัวการ์ด: ชื่อสถิติ และ Badge สถานะ */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-600">{item.title}</span>
              {item.badge && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badge.className}`}>
                  {item.badge.text}
                </span>
              )}
            </div>

            {/* ส่วนแสดงตัวเลขสถิติขนาดใหญ่ */}
            <div className="flex items-baseline gap-1.5 mt-1">
              {/* ตัวเลขสถิติพร้อมฟังก์ชันแปลงเป็นคอมม่าคั่นหลักพัน */}
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {item.count.toLocaleString()}
              </span>
              {/* หน่วยนับ เช่น รายการ, คน, ประกาศ */}
              <span className="text-sm text-slate-500 font-medium">{item.unit}</span>
            </div>
          </div>

          {/* ส่วนคำอธิบายด้านล่างของการ์ด */}
          <p className="text-xs text-slate-500 mt-3 font-medium truncate pt-2.5 border-t border-slate-100">
            {item.subtitle}
          </p>
        </Link>
      ))}
    </div>
  );
}

