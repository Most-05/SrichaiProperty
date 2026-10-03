// ==============================================================================
// Verified PRO Membership helpers (ศูนย์กลางตรรกะแพ็กเกจ Verified PRO)
// ==============================================================================
// ใช้ร่วมกันทั้งฝั่ง API (checkout / admin) และฝั่ง UI (upgrade / dashboard / home)
// เพื่อไม่ให้ราคาและจำนวนวันกระจายอยู่หลายที่จนไม่ตรงกัน
// ==============================================================================

export interface ProPlan {
  /** รหัสแพ็กเกจในตาราง listing_packages (1 = รายเดือน, 2 = รายปี) */
  packageId: number;
  /** ยอดเงินที่ต้องชำระ (บาท) */
  amount: number;
  /** จำนวนวันสิทธิ์ที่ได้รับต่อการชำระ 1 ครั้ง */
  days: number;
  /** ป้ายกำกับรอบบิลแบบสั้น */
  shortLabel: string;
  /** ป้ายกำกับรอบบิลแบบเต็ม */
  label: string;
}

/** รอบรายเดือน: 299 บาท / 30 วัน */
export const PRO_MONTHLY: ProPlan = {
  packageId: 1,
  amount: 299,
  days: 30,
  shortLabel: 'รายเดือน',
  label: 'รายเดือน (30 วัน)',
};

/** รอบรายปี: 2,690 บาท / 365 วัน (ประหยัด 25%) */
export const PRO_YEARLY: ProPlan = {
  packageId: 2,
  amount: 2690,
  days: 365,
  shortLabel: 'รายปี',
  label: 'รายปี (365 วัน)',
};

export type ProBillingCycle = 'monthly' | 'yearly';

/** แปลงค่า billingCycle เป็นแผนแพ็กเกจ (ค่าไม่ถูกต้อง/ไม่ระบุ = รายเดือน) */
export function resolveProPlan(billingCycle?: string | null): ProPlan {
  return billingCycle === 'yearly' ? PRO_YEARLY : PRO_MONTHLY;
}

/** แปลงยอดเงินเป็นแผนแพ็กเกจสำรอง (ใช้เมื่อไม่มี package_id) */
export function resolveProPlanByAmount(amount?: number | string | null, packageId?: number | null): ProPlan {
  if (packageId === 2) return PRO_YEARLY;
  if (packageId === 1) return PRO_MONTHLY;
  return Number(amount) >= 2000 ? PRO_YEARLY : PRO_MONTHLY;
}

/** ตรวจว่าแพ็กเกจ PRO ยังใช้งานได้อยู่หรือไม่ (plan_type = 'pro' และไม่หมดอายุ) */
export function isProActive(planType?: string | null, planExpiredAt?: Date | string | null): boolean {
  if (planType !== 'pro') return false;
  if (!planExpiredAt) return true; // ไม่ระบุวันหมดอายุ = ใช้งานต่อเนื่อง
  return new Date(planExpiredAt).getTime() > Date.now();
}

/** จำนวนวันคงเหลือของสิทธิ์ PRO (ปัดขึ้น) — คืน null ถ้าไม่มีวันหมดอายุ */
export function proDaysRemaining(planExpiredAt?: Date | string | null): number | null {
  if (!planExpiredAt) return null;
  return Math.ceil((new Date(planExpiredAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** บวกจำนวนวันจากวันที่ฐาน (ไม่ตัดวันที่เหลือทิ้ง) */
export function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * คำนวณวันหมดอายุใหม่แบบทบวัน (Cumulative Extension)
 * ถ้ายังไม่หมดอายุ ให้นับต่อจากวันหมดอายุเดิม ถ้าหมดอายุแล้วให้เริ่มนับจากวันนี้
 */
export function computeExtendedExpiry(
  currentPlanType: string | null | undefined,
  currentExpiredAt: Date | string | null | undefined,
  addedDays: number
): Date {
  const now = new Date();
  const base =
    currentPlanType === 'pro' && currentExpiredAt && new Date(currentExpiredAt) > now
      ? new Date(currentExpiredAt)
      : now;
  return addDays(base, addedDays);
}
