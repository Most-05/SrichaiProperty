/**
 * ==============================================================================
 * ยูทิลิตีสร้างรูปโปรไฟล์สำรอง (Fallback Avatar URL Generator)
 * /lib/utils/avatar.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - สร้าง URL รูปโปรไฟล์สำรอง (ตัวอักษรย่อบนพื้นสี) สำหรับผู้ใช้ที่ยังไม่ได้อัปโหลดรูป
 * - ต้องใส่ format=png เสมอ: เนื่องจาก ui-avatars.com ส่งกลับเป็น SVG สำหรับชื่อไทยบางชื่อ
 *   แต่ next/image ปฏิเสธ SVG จึงต้องบังคับเป็น PNG เพื่อป้องกันรูปแตก (BUG-32)
 *
 * [SEARCH: FALLBACK_AVATAR_UTIL]
 * [UI: รูปโปรไฟล์สำรอง]
 * ==============================================================================
 */

/**
 * ลิงก์รูปโปรไฟล์สำรอง (ตัวอักษรย่อบนพื้นสี) สำหรับผู้ใช้ที่ยังไม่ได้อัปโหลดรูป
 *
 * @param name  ชื่อที่ใช้ทำตัวอักษรย่อ
 * @param background สีพื้นแบบ hex ไม่มี # (ค่าเริ่มต้น '1e40af' สีน้ำเงินของเว็บ)
 */
export function fallbackAvatarUrl(name: string | null | undefined, background = '1e40af') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent((name || '').trim() || 'User')}&background=${background}&color=fff&format=png`;
}

