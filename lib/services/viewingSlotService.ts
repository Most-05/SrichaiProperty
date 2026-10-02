
import { db } from '@/lib/db';

/**
 * สถานะนัดหมายที่ยัง "จองอยู่จริง" — กันชนเฉพาะนัดที่ยังไม่ถูกยกเลิก/ปฏิเสธ/ปิดงาน
 * awaiting_customer ต้องนับด้วย: นายหน้าเสนอวันใหม่ไปแล้วและรอบนั้นถูกล็อกไว้รอลูกค้าตอบ
 * ถ้าไม่นับ นายหน้าจะเลื่อนนัดอีกใบมาทับวัน+รอบเดียวกันได้
 */
export const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'approved', 'awaiting_customer'];

/**
 * เช็คว่านายหน้าคนนี้มีนัดหมายที่ยัง active อยู่แล้วในวัน+เวลานี้ กับ "บ้านหลังอื่น" หรือไม่
 * ใช้ล็อกตอนลูกค้ากดจองจริง (จุดเดียวที่ต้องกันชน) แทนการล็อกตั้งแต่ตอนเปิดวันว่าง
 * นายหน้าไปนำชมได้ทีละที่ ถ้ามีนัดที่บ้าน A เวลานี้แล้ว จะรับนัดบ้าน B เวลาเดียวกันซ้อนไม่ได้
 */
export async function hasAgentBookingConflict(
  agentId: string,
  excludePropertyId: string,
  appointmentDate: Date,
  timeSlot: string
): Promise<boolean> {
  const conflict = await db.appointments.findFirst({
    where: {
      agent_id: agentId,
      property_id: { not: excludePropertyId },
      appointment_date: appointmentDate,
      time_slot: timeSlot,
      status: { in: ACTIVE_APPOINTMENT_STATUSES }
    },
    select: { id: true }
  });
  return !!conflict;
}

/** วันนี้ (เวลาไทย) เป็น Date เที่ยงคืน UTC — รูปแบบเดียวกับ available_date / appointment_date ใน DB */
function todayKeyBangkok(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

/**
 * ตรวจวัน + รอบที่ผู้ใช้ส่งมา ก่อนเอาไปจอง / เปิดรอบว่าง
 * คืนข้อความ error ภาษาไทย ถ้าไม่ผ่าน · คืน null ถ้าผ่าน
 * - รอบต้องเป็น morning / afternoon
 * - วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD และไม่ใช่วันที่ผ่านไปแล้ว (วันนี้ยังได้)
 * (หน้าเว็บกันวันในอดีตไว้แล้ว แต่ API ต้องกันเองด้วย เพราะยิง API ตรงได้ — BUG-12)
 */
export function validateSlotInput(date: unknown, timeSlot: unknown): string | null {
  if (timeSlot !== 'morning' && timeSlot !== 'afternoon') return 'รอบเวลาไม่ถูกต้อง';
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date).getTime())) {
    return 'รูปแบบวันที่ไม่ถูกต้อง';
  }
  if (date < todayKeyBangkok()) return 'ไม่สามารถเลือกวันที่ผ่านมาแล้วได้';
  return null;
}
