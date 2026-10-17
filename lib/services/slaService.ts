/**
 * ==============================================================================
 * เซอร์วิสคำนวณเวลารอตรวจประกาศ (Moderation Waiting Time Service)
 * /lib/services/slaService.ts
 * ==============================================================================
 * คำนวณเวลาง่ายๆ ตรงไปตรงมา:
 * 1. ประกาศนี้ลงมาแล้วกี่ชั่วโมง กี่นาที (รอตรวจมานานเท่าไหร่)
 * 2. ระดับความด่วน:
 *    - รอ < 12 ชม.  = normal  (สีเทา/ปกติ)
 *    - รอ 12-24 ชม. = warning (สีส้ม/เริ่มนาน)
 *    - รอ > 24 ชม.  = urgent  (สีแดง/ค้างตรวจนานเกิน 24 ชม.)
 * ==============================================================================
 */

/** มาตรฐานเวลาตรวจประกาศ (ชั่วโมง) */
export const MODERATION_SLA_HOURS = 24;

export type SlaLevel = 'normal' | 'warning' | 'urgent' | 'overdue';

export interface SlaInfo {
  deadline: Date;
  minutesLeft: number;
  hoursLeft: number;
  label: string;
  level: SlaLevel;
  isOverdue: boolean;
}

/**
 * คำนวณว่าบ้านหลังนี้ลงประกาศมาแล้วกี่ชั่วโมง กี่นาที
 */
export function calculateModerationSla(
  createdAt: Date | string,
  now: number = Date.now()
): SlaInfo {
  const createdMs = new Date(createdAt).getTime(); // เวลาที่นายหน้าส่งประกาศ (แปลงเป็นตัวเลข)
  const diffMs = Math.max(0, now - createdMs); // คำนวณเวลาที่รอ = ตอนนี้ − เวลาส่ง (กันค่าติดลบ)

  const totalMinutes = Math.floor(diffMs / (60 * 1000)); // รอมาทั้งหมดกี่นาที
  const hoursPassed = Math.floor(totalMinutes / 60); // รอมากี่ชั่วโมงเต็ม
  const minutesPassed = totalMinutes % 60; // เศษนาทีที่เหลือ (0–59)

  // 1. ระดับความเร่งด่วน: เกิน 24 ชม. = ด่วนมาก (urgent), เกิน 12 ชม. = เริ่มนาน (warning)
  let level: SlaLevel = 'normal'; // เริ่มต้น = ปกติ (สีเขียว)
  if (hoursPassed >= MODERATION_SLA_HOURS) { // รอครบ 24 ชม. ขึ้นไป
    level = 'urgent'; // = ด่วน (สีแดง)
  } else if (hoursPassed >= 12) { // รอครบ 12 ชม. ขึ้นไป
    level = 'warning'; // = เตือน (สีเหลือง)
  }

  // 2. ข้อความภาษาไทยเข้าใจง่าย ตรงไปตรงมา
  let label = ''; // ข้อความที่จะไปโชว์บนป้าย
  if (hoursPassed === 0 && minutesPassed === 0) { // ยังไม่ถึง 1 นาที
    label = 'เพิ่งลงเมื่อสักครู่';
  } else if (hoursPassed === 0) { // ยังไม่ถึง 1 ชม. → บอกเป็นนาที
    label = `รอตรวจ ${minutesPassed} นาที`;
  } else if (hoursPassed < 24) { // 1–23 ชม. → บอกชั่วโมง (+ นาทีถ้ามี)
    label = minutesPassed > 0 
      ? `รอตรวจ ${hoursPassed} ชม. ${minutesPassed} นาที` 
      : `รอตรวจ ${hoursPassed} ชม.`;
  } else { // ตั้งแต่ 24 ชม. → บอกเป็นวัน + ชั่วโมง
    const days = Math.floor(hoursPassed / 24); // กี่วันเต็ม
    const remHours = hoursPassed % 24; // เศษชั่วโมงที่เหลือ
    label = remHours > 0 
      ? `ค้างตรวจนาน ${days} วัน ${remHours} ชม.` 
      : `ค้างตรวจนาน ${days} วัน`;
  }

  return {
    deadline: new Date(createdMs + MODERATION_SLA_HOURS * 60 * 60 * 1000),
    minutesLeft: (MODERATION_SLA_HOURS * 60) - totalMinutes,
    hoursLeft: MODERATION_SLA_HOURS - (totalMinutes / 60),
    label,
    level,
    isOverdue: hoursPassed >= MODERATION_SLA_HOURS
  };
}

// ------------------------------------------------------------------------------
// ส่วนประเมินผลเวลาที่แอดมินใช้ตรวจจริง (หลังอนุมัติหรือตีกลับแล้ว)
// ------------------------------------------------------------------------------

export interface ReviewDurationInfo {
  hoursUsed: number;
  label: string;
  withinSla: boolean;
}

/**
 * คำนวณเวลาที่แอดมินใช้ตรวจจริง (reviewed_at - created_at)
 */
export function calculateReviewDuration(
  createdAt: Date | string | null,
  reviewedAt: Date | string | null
): ReviewDurationInfo | null {
  if (!createdAt || !reviewedAt) return null;

  const ms = new Date(reviewedAt).getTime() - new Date(createdAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;

  const totalMinutes = Math.round(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let label = '';
  if (hours === 0) {
    label = `${totalMinutes} นาที`;
  } else if (hours < 24) {
    label = minutes > 0 ? `${hours} ชม. ${minutes} นาที` : `${hours} ชม.`;
  } else {
    const days = Math.floor(hours / 24);
    label = `${days} วัน ${hours % 24} ชม.`;
  }

  const hoursUsed = ms / (60 * 60 * 1000);
  return {
    hoursUsed,
    label,
    withinSla: hoursUsed <= MODERATION_SLA_HOURS
  };
}

export interface SlaSummary {
  reviewedCount: number;
  averageHours: number;
  averageLabel: string;
  withinSlaCount: number;
  withinSlaPercent: number;
}

/**
 * สรุปภาพรวมเวลาที่ใช้ตรวจของชุดประกาศ
 */
export function summarizeReviewSla(
  rows: { created_at: Date | string | null; reviewed_at: Date | string | null }[]
): SlaSummary {
  const durations = rows
    .map((r) => calculateReviewDuration(r.created_at, r.reviewed_at))
    .filter((d): d is ReviewDurationInfo => d !== null);

  if (durations.length === 0) {
    return {
      reviewedCount: 0,
      averageHours: 0,
      averageLabel: 'ยังไม่มีข้อมูล',
      withinSlaCount: 0,
      withinSlaPercent: 0
    };
  }

  const totalHours = durations.reduce((sum, d) => sum + d.hoursUsed, 0);
  const averageHours = totalHours / durations.length;
  const withinSlaCount = durations.filter((d) => d.withinSla).length;

  const avgMinutes = Math.round(averageHours * 60);
  const avgHrs = Math.floor(avgMinutes / 60);
  const avgMins = avgMinutes % 60;
  const averageLabel = avgHrs === 0 
    ? `${avgMinutes} นาที` 
    : avgMins > 0 ? `${avgHrs} ชม. ${avgMins} นาที` : `${avgHrs} ชม.`;

  return {
    reviewedCount: durations.length,
    averageHours,
    averageLabel,
    withinSlaCount,
    withinSlaPercent: Math.round((withinSlaCount / durations.length) * 100)
  };
}
