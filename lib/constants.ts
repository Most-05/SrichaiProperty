// จำนวนประกาศฟรีสูงสุดสำหรับนายหน้าที่ยังไม่อัปเกรดเป็น PRO
export const FREE_LISTING_QUOTA = 3;

// ลูกค้าที่เบี้ยวนัด (no_show) ครบจำนวนนี้ -> จองนัดใหม่ไม่ได้ (ดู noShowService.ts)
export const NO_SHOW_LIMIT = 3;
// จำนวนวันที่รอนายหน้ากดยืนยันผล (มาจริง/ไม่มา) ก่อนระบบจะ auto-complete ให้เอง
// ให้ประโยชน์แก่ลูกค้าถ้านายหน้าลืมกด ไม่ปล่อยค้างเป็น "รอผล" ตลอดไป
export const VISIT_CONFIRM_GRACE_DAYS = 7;

// 🔑 KEYWORD: สถานะนัดหมายทั้งหมดในระบบ
// รวมไว้ที่เดียวกันเผื่อเช็คซ้ำหลายที่ — ค่าต้องตรงกับที่เก็บใน appointments.status
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',                      // ลูกค้าจองมา รอนายหน้ายืนยัน
  APPROVED: 'approved',                    // นายหน้ายืนยันแล้ว
  AWAITING_CUSTOMER: 'awaiting_customer',  // นายหน้าขอเลื่อนวัน รอลูกค้ายืนยันวันใหม่
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

// 🔑 KEYWORD: เวลาของรอบเข้าชม (รอบเช้า / รอบบ่าย)
// รวมไว้ที่เดียว — เดิมแต่ละหน้าเขียนเวลาเองจนมี 6 แบบไม่ตรงกัน (BUG-18)
// ถ้าจะเปลี่ยนเวลารอบ แก้ตรงนี้ที่เดียว ทุกหน้า + ข้อความแจ้งเตือนจะเปลี่ยนตาม
export const TIME_SLOT_INFO = {
  morning: { name: 'รอบเช้า', start: '09:00', end: '12:00' },
  afternoon: { name: 'รอบบ่าย', start: '13:00', end: '17:00' },
} as const;

type SlotKey = keyof typeof TIME_SLOT_INFO;
const slotInfo = (slot: string | null | undefined) =>
  TIME_SLOT_INFO[(slot === 'afternoon' ? 'afternoon' : 'morning') as SlotKey];

/** ช่วงเวลาของรอบ เช่น "09:00 - 12:00" */
export const timeSlotRange = (slot: string | null | undefined) => {
  const s = slotInfo(slot);
  return `${s.start} - ${s.end}`;
};

/** เวลาเริ่มของรอบ เช่น "09:00" */
export const timeSlotStart = (slot: string | null | undefined) => slotInfo(slot).start;
