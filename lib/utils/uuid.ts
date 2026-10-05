/**
 * ตรวจว่าค่าที่รับมาเป็น uuid (รูปแบบรหัสหลักของทุกตารางในฐานข้อมูล) หรือไม่
 *
 * ใช้เช็ครหัสที่มาจาก request ก่อนส่งให้ Prisma — ถ้าส่งรหัสผิดรูปแบบเข้าไปตรงๆ
 * PostgreSQL จะ error แล้ว API ตอบ 500 พร้อมข้อความภายในหลุดออกไป แทนที่จะเป็น 400 "ข้อมูลไม่ถูกต้อง"
 *
 * @param value ค่าที่ต้องการตรวจ (รับ unknown เพราะมาจาก body/query ที่ยังไม่รู้ชนิด)
 */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
