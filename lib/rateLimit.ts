/**
 * ==============================================================================
 * ระบบจำกัดอัตราการเรียกใช้งาน API (In-Memory Sliding Window Rate Limiter)
 * /lib/rateLimit.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - ป้องกันการโจมตีแบบ Brute Force หรือ Spamming ต่อ API สำคัญ เช่น /api/auth/register, /api/upload
 * - ใช้ In-memory Map เก็บ Sliding Window Timestamp ตาม IP ของผู้เรียก (getClientIp)
 * - มี Garbage Collection อัตโนมัติทุก 10 นาทีเพื่อล้างหน่วยความจำ
 *
 * [SEARCH: RATE_LIMIT_UTILITY]
 * [LOGIC: การจำกัดอัตราการเรียกใช้งาน API]
 * ==============================================================================
 */

const buckets = new Map<string, number[]>();

// ล้าง entry เก่าเป็นระยะกันหน่วยความจำโตไม่รู้จบ
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of buckets) {
    const fresh = timestamps.filter(t => now - t < 60 * 60 * 1000);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}, 10 * 60 * 1000).unref?.();

/**
 * ตรวจสอบและบันทึกการเรียกใช้งานของ key นี้
 * @returns true = ยังไม่เกินโควตา (อนุญาต), false = เกินโควตาแล้ว (ปฏิเสธ)
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) || []).filter(t => now - t < windowMs);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}

// ดึง IP ของผู้เรียกจาก request headers (รองรับกรณีอยู่หลัง reverse proxy)
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
