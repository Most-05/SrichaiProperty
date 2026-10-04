/**
 * ลิงก์รูปโปรไฟล์สำรอง (ตัวอักษรย่อบนพื้นสี) สำหรับผู้ใช้ที่ยังไม่ได้อัปโหลดรูป
 *
 * ต้องใส่ format=png เสมอ: ui-avatars.com ส่งกลับเป็น SVG สำหรับชื่อไทยบางชื่อ (เช่น "สมชาย นายหน้าดี")
 * แต่ next/image ปฏิเสธ SVG (dangerouslyAllowSVG ปิดไว้เพื่อความปลอดภัย) → /_next/image ตอบ 400
 * "image type is not allowed" รูปจึงหาย (BUG-32)
 *
 * @param name  ชื่อที่ใช้ทำตัวอักษรย่อ
 * @param background สีพื้นแบบ hex ไม่มี # (ค่าเริ่มต้นสีน้ำเงินของเว็บ)
 */
export function fallbackAvatarUrl(name: string | null | undefined, background = '1e40af') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent((name || '').trim() || 'User')}&background=${background}&color=fff&format=png`;
}
