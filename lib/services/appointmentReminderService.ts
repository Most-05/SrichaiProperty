import { db } from '@/lib/db';
import { APPOINTMENT_STATUS } from '@/lib/constants';

/**
 * ==============================================================================
 * ระบบเตือนก่อนถึงวันนัด (Appointment Reminder)
 * ==============================================================================
 * ระบบ No-show ที่ทำไว้ก่อนหน้านี้ตอบคำถามว่า "ใครไม่มาตามนัด" แต่ไม่ได้ช่วยลด
 * จำนวนคนที่ไม่มา ซึ่งสาเหตุส่วนใหญ่คือลืม ไม่ใช่ตั้งใจเบี้ยว ไฟล์นี้จึงเติมอีกด้าน
 * คือเตือนล่วงหน้าให้ทั้งลูกค้าและนายหน้าก่อนถึงวันนัด
 *
 * ยืมโครงมาจาก slotAvailabilityService.ts ทั้งหมด (หา -> กรองที่เพิ่งเตือนไป -> ส่ง)
 * เพราะเงื่อนไขเหมือนกันคือ "ต้องเตือนซ้ำได้เรื่อยๆ แต่ห้ามถี่จนกระดิ่งท่วม"
 *
 * ทำไมไม่ใช้ cron: โปรเจกต์นี้ไม่มี background job (ดู auto-complete ของ No-show
 * ซึ่งก็ทำงานตอนมีคนเปิดหน้าเหมือนกัน) การเช็คตอนผู้ใช้เปิดเว็บจึงเป็นรูปแบบเดียว
 * ที่ใช้กันทั้งระบบอยู่แล้ว และเพียงพอเพราะคนที่ต้องได้รับการเตือนคือคนที่เปิดเว็บ
 * ==============================================================================
 */

/** ชนิดการแจ้งเตือน ใช้ทั้งตอนสร้างและตอนเช็คว่าเพิ่งเตือนไปหรือยัง */
export const REMINDER_TYPE = 'appointment_reminder';

/**
 * เตือนนัดที่จะถึงภายในกี่วันข้างหน้า
 * 1 = เตือนทั้งนัดของ "วันนี้" และ "พรุ่งนี้"
 * รวมวันนี้ด้วยเพราะคนที่เปิดเว็บตอนเช้าวันนัดคือคนที่ได้ประโยชน์จากการเตือนที่สุด
 */
export const REMINDER_LOOKAHEAD_DAYS = 1;

/** เตือนนัดใบเดิมซ้ำได้เร็วสุดกี่ชั่วโมง (20 = ราววันละครั้ง ไม่เด้งทุกครั้งที่รีเฟรช) */
export const REMINDER_COOLDOWN_HOURS = 20;

export interface UpcomingAppointment {
  appointmentId: string;
  /** "YYYY-MM-DD" */
  date: string;
  timeSlot: string;
  propertyTitle: string;
  /** ชื่ออีกฝ่าย — ฝั่งลูกค้าจะเป็นชื่อนายหน้า ฝั่งนายหน้าจะเป็นชื่อลูกค้า */
  counterpartName: string;
  /** true = นัดวันนี้ (ต้องเตือนให้ด่วนกว่านัดพรุ่งนี้) */
  isToday: boolean;
}

/** แปลง Date เป็น "YYYY-MM-DD" อ่านแบบ UTC เพราะ appointment_date เป็นชนิด Date ล้วน */
const toDateKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

/** เที่ยงคืนของวันนี้ตามเวลาไทย แปลงกลับเป็น UTC เพื่อเทียบกับคอลัมน์ Date */
function startOfTodayBangkok(now: Date = new Date()): Date {
  const bangkok = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(bangkok.getUTCFullYear(), bangkok.getUTCMonth(), bangkok.getUTCDate()));
}

const timeLabel = (slot: string) => (slot === 'afternoon' ? '13:00 น.' : '10:00 น.');

/**
 * หานัดที่ยืนยันแล้วและกำลังจะถึงภายใน REMINDER_LOOKAHEAD_DAYS วัน
 *
 * นับเฉพาะสถานะ approved เท่านั้น — นัดที่ยังรอนายหน้ายืนยัน (pending) หรือรอลูกค้า
 * ตอบรับวันใหม่ (awaiting_customer) ยังไม่ใช่นัดที่ตกลงกันแล้ว เตือนไปก็ทำให้สับสน
 */
export async function findUpcomingAppointments(
  userId: string,
  isAgent: boolean,
  now: Date = new Date()
): Promise<UpcomingAppointment[]> {
  const today = startOfTodayBangkok(now);
  const until = new Date(today.getTime() + REMINDER_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
  const todayKey = toDateKey(today);

  const rows = await db.appointments.findMany({
    where: {
      ...(isAgent ? { agent_id: userId } : { customer_id: userId }),
      status: APPOINTMENT_STATUS.APPROVED,
      appointment_date: { gte: today, lte: until }
    },
    select: {
      id: true,
      appointment_date: true,
      time_slot: true,
      properties: { select: { title: true } },
      users_appointments_agent_idTousers: { select: { first_name: true, last_name: true } },
      users_appointments_customer_idTousers: { select: { first_name: true, last_name: true } }
    },
    orderBy: [{ appointment_date: 'asc' }, { time_slot: 'asc' }]
  });

  return rows.map((a) => {
    const other = isAgent ? a.users_appointments_customer_idTousers : a.users_appointments_agent_idTousers;
    const dateKey = toDateKey(a.appointment_date);
    return {
      appointmentId: a.id,
      date: dateKey,
      timeSlot: a.time_slot ?? 'morning',
      propertyTitle: a.properties?.title ?? 'อสังหาริมทรัพย์',
      counterpartName: `${other?.first_name ?? ''} ${other?.last_name ?? ''}`.trim() || (isAgent ? 'ลูกค้า' : 'นายหน้า'),
      isToday: dateKey === todayKey
    };
  });
}

/**
 * คืนรายชื่อ appointmentId ที่เพิ่งเตือนผู้ใช้คนนี้ไปแล้วภายใน REMINDER_COOLDOWN_HOURS
 *
 * ดูจาก link_url เหมือน findRecentlyAlertedPropertyIds เพราะตาราง notifications
 * ไม่มีคอลัมน์อ้างอิงนัดหมายโดยตรง (link_url เก็บ appointmentId ต่อท้ายไว้อยู่แล้ว)
 */
export async function findRecentlyRemindedAppointmentIds(
  userId: string,
  now: Date = new Date()
): Promise<Set<string>> {
  const cooldownSince = new Date(now.getTime() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000);

  const recent = await db.notifications.findMany({
    where: { user_id: userId, type: REMINDER_TYPE, created_at: { gte: cooldownSince } },
    select: { link_url: true }
  });

  return new Set(
    recent
      .map((n) => n.link_url?.split('#').pop())
      .filter((id): id is string => Boolean(id))
  );
}

/** ข้อความแจ้งเตือนของนัดหนึ่งใบ แยกออกมาเพื่อให้ทั้ง API และเทสใช้ชุดเดียวกัน */
export function buildReminderMessage(apt: UpcomingAppointment, isAgent: boolean) {
  const when = apt.isToday ? 'วันนี้' : 'พรุ่งนี้';
  return {
    title: apt.isToday ? 'วันนี้คุณมีนัดเข้าชมบ้าน' : 'พรุ่งนี้คุณมีนัดเข้าชมบ้าน',
    content: isAgent
      ? `${when} ${timeLabel(apt.timeSlot)} คุณมีนัดพาคุณ ${apt.counterpartName} ชม "${apt.propertyTitle}"`
      : `${when} ${timeLabel(apt.timeSlot)} คุณมีนัดชม "${apt.propertyTitle}" กับคุณ ${apt.counterpartName}`,
    linkUrl: `${isAgent ? '/agent/appointments' : '/appointments'}#${apt.appointmentId}`
  };
}
