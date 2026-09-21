// จำนวนประกาศฟรีสูงสุดสำหรับนายหน้าที่ยังไม่อัปเกรดเป็น PRO
export const FREE_LISTING_QUOTA = 3;

// ลูกค้าที่เบี้ยวนัด (no_show) ครบจำนวนนี้ -> จองนัดใหม่ไม่ได้ (ดู noShowService.ts)
export const NO_SHOW_LIMIT = 3;
// จำนวนวันที่รอนายหน้ากดยืนยันผล (มาจริง/ไม่มา) ก่อนระบบจะ auto-complete ให้เอง
// ให้ประโยชน์แก่ลูกค้าถ้านายหน้าลืมกด ไม่ปล่อยค้างเป็น "รอผล" ตลอดไป
export const VISIT_CONFIRM_GRACE_DAYS = 7;
