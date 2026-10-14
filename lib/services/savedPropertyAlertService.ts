import { db } from '@/lib/db';

/**
 * ==============================================================================
 * เซอร์วิสแจ้งเตือนผู้บันทึกบ้านเมื่อมีการเปิดรอบว่างเพิ่ม (Saved Property Alert Service)
 * /lib/services/savedPropertyAlertService.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * 1. ค้นหารายชื่อลูกค้าที่เคยกดบันทึกบ้านหลังนี้ไว้ในรายการโปรด (Saved Properties)
 * 2. เมื่อนายหน้าเปิดรอบวันว่างเพิ่มเติม ระบบจะส่งการแจ้งเตือนหาลูกค้ากลุ่มนี้ทันที
 * 3. มีระบบ Cooldown 24 ชม. ป้องกันการส่งแจ้งเตือนซ้ำซ้อน
 *
 * [SEARCH: SAVED_PROPERTY_ALERT_SERVICE]
 * [LOGIC: การแจ้งเตือนผู้บันทึกบ้านเมื่อเปิดรอบใหม่]
 * ==============================================================================
 */

/** ชนิดการแจ้งเตือน ใช้ทั้งตอนสร้างและตอนเช็คว่าเพิ่งเตือนไปหรือยัง */
export const SAVED_ALERT_TYPE = 'saved_property_slots';

/** เตือนลูกค้าคนเดิมเรื่องบ้านหลังเดิมซ้ำได้เร็วสุดกี่ชั่วโมง */
export const SAVED_ALERT_COOLDOWN_HOURS = 24;

/**
 * คืนรายชื่อ userId ที่ควรได้รับการแจ้งเตือนว่าบ้านหลังนี้เปิดวันว่างเพิ่ม
 *
 * ตัดออก 2 กลุ่ม:
 * 1. เจ้าของประกาศเอง (นายหน้าอาจกดบันทึกบ้านตัวเองไว้)
 * 2. คนที่เพิ่งได้รับแจ้งเตือนเรื่องบ้านหลังนี้ไปภายใน cooldown
 *    (นายหน้าอาจกดบันทึกหลายครั้งติดกันตอนจัดตาราง ไม่ควรเด้ง 5 อันรวด)
 */
export async function findUsersToAlertForNewSlots(
  propertyId: string,
  now: Date = new Date()
): Promise<string[]> {
  const [saved, property] = await Promise.all([
    db.saved_properties.findMany({ where: { property_id: propertyId }, select: { user_id: true } }),
    db.properties.findUnique({ where: { id: propertyId }, select: { agent_id: true } })
  ]);
  if (saved.length === 0) return [];

  const candidates = saved
    .map((s) => s.user_id)
    .filter((uid) => uid !== property?.agent_id);
  if (candidates.length === 0) return [];

  const cooldownSince = new Date(now.getTime() - SAVED_ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);
  const recent = await db.notifications.findMany({
    where: {
      user_id: { in: candidates },
      type: SAVED_ALERT_TYPE,
      link_url: { contains: propertyId },
      created_at: { gte: cooldownSince }
    },
    select: { user_id: true }
  });
  const alreadyAlerted = new Set(recent.map((n) => n.user_id));

  return candidates.filter((uid) => !alreadyAlerted.has(uid));
}

/** ข้อความแจ้งเตือน แยกออกมาให้ API และเทสใช้ชุดเดียวกัน */
export function buildSavedPropertyAlert(propertyId: string, propertyTitle: string, addedCount: number) {
  return {
    title: 'บ้านที่คุณบันทึกไว้เปิดวันว่างเพิ่ม',
    content: `"${propertyTitle}" เพิ่งเปิดรอบเข้าชมเพิ่มอีก ${addedCount} รอบ กดเข้าไปจองได้เลย`,
    type: SAVED_ALERT_TYPE,
    linkUrl: `/book-appointment?propertyId=${propertyId}`
  };
}
