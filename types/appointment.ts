/**
 * ==============================================================================
 * นิยามโครงสร้างข้อมูลนัดหมายเข้าชมบ้าน (Appointment Data Contract)
 * /types/appointment.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - กำหนด Type กลางสำหรับการนัดหมายระหว่าง "ผู้ซื้อ/ผู้สนใจ" กับ "นายหน้าเจ้าของทรัพย์"
 * - ใช้ร่วมกันระหว่าง Frontend (เช่น BookingCalendar, appointments/page.tsx) 
 *   และ Backend API (/api/appointments)
 *
 * [SEARCH: APPOINTMENT_TYPE]
 * [DATA: โครงสร้างข้อมูลนัดหมาย]
 * ==============================================================================
 */

export interface Appointment {
  /** รหัสประจำนัดหมาย (UUID จากฐานข้อมูล appointments.id) */
  id: string | number;

  /** รหัสอสังหาริมทรัพย์ที่ขอนัดเข้าชม (properties.id) */
  propertyId: number | string;

  /** วันที่นัดหมายในรูปแบบข้อความ (เช่น "2026-10-25" หรือรูปแบบจัดแสดงผล) */
  date: string;

  /** ช่วงเวลาที่นัด เช่น "09:00 - 12:00" หรือ "รอบเช้า" */
  timeSlot: string;

  /** ข้อความบันทึกเพิ่มเติมจากผู้ขอเข้าชม เช่น "ขอนำครอบครัวไปด้วย 3 คน" */
  note: string;

  /** 
   * [STATE: สถานะของนัดหมาย]
   * - 'pending': ลูกค้าส่งคำขอ รอนายหน้ากดยืนยัน
   * - 'approved': นายหน้ายืนยันนัดแล้ว
   * - 'upcoming': นัดหมายที่กำลังจะมาถึงในอนาคต
   * - 'past': นัดหมายที่ผ่านวันเวลามาแล้ว
   * - 'completed': การเข้าชมเสร็จสิ้นเรียบร้อย
   * - 'cancelled': นัดหมายถูกยกเลิก (โดยลูกค้าหรือนายหน้า)
   * - 'rejected': นายหน้าปฏิเสธคำขอนัดหมาย
   * - 'no_show': ลูกค้าเบี้ยวนัด ไม่มาตามนัดหมาย (ดู noShowService.ts)
   */
  status: 'upcoming' | 'past' | 'cancelled' | 'pending' | 'approved' | 'completed' | 'rejected' | 'no_show';

  /** ชื่อหัวข้อประกาศอสังหาริมทรัพย์ */
  propertyName: string;

  /** ราคาที่แสดงผล เช่น "฿3,500,000" */
  propertyPrice: string;

  /** URL รูปภาพหน้าปกของอสังหาริมทรัพย์ */
  propertyImage: string;

  /** ประเภทอสังหาฯ เช่น "บ้านเดี่ยว", "คอนโด" */
  propertyType: string;

  /** ชื่อ-นามสกุลของนายหน้าผู้รับผิดชอบ */
  agentName: string;

  /** รูปโปรไฟล์ของนายหน้า */
  agentImage: string;

  /** 
   * ค่า 'morning' | 'afternoon' จริงจาก DB (ใช้ตอนส่ง PATCH แก้วัน/รอบ)
   * เพื่อส่งต่อให้ระบบคำนวณสล็อตว่างใน slotAvailabilityService.ts
   */
  rawTimeSlot?: string;
}