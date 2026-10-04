/**
 * ==============================================================================
 * Service: สรุปว่านายหน้าแก้ "ส่วนสำคัญ" อะไรของประกาศบ้าง (ใช้แจ้งแอดมินตรวจย้อนหลัง)
 * ==============================================================================
 * นโยบาย (Q-01 ทาง C): นายหน้าที่ผ่าน KYC แก้ประกาศที่อนุมัติแล้วได้ทันที ไม่ต้องรออนุมัติใหม่
 * แต่ถ้าแก้ส่วนที่มีผลต่อความถูกต้องของประกาศ → แจ้งแอดมินให้ตรวจย้อนหลัง (post-moderation)
 * ตัวนี้บอกว่าแก้ช่องไหน เพื่อให้ข้อความแจ้งเตือนบอกแอดมินได้ว่าต้องดูตรงไหน
 * กดบันทึกโดยไม่ได้เปลี่ยนค่าอะไร = ไม่มีรายการ (ไม่แจ้งแอดมิน)
 * ==============================================================================
 */

// ช่องที่ถือว่า "สำคัญ" → ชื่อภาษาไทยที่ใช้ในข้อความแจ้งเตือน
// (ไม่นับพิกัดแผนที่ / ห้องจอดรถ / จำนวนชั้น — แก้บ่อยและไม่ทำให้ประกาศกลายเป็นของปลอม)
const IMPORTANT_FIELDS: Record<string, string> = {
  title: 'หัวข้อประกาศ',
  price: 'ราคา',
  description: 'รายละเอียด',
  listing_type: 'ขาย/เช่า',
  type_id: 'ประเภทอสังหาฯ',
  location: 'ที่อยู่',
  province_id: 'จังหวัด',
  amphure_id: 'อำเภอ',
  district_id: 'ตำบล',
  bedrooms: 'ห้องนอน',
  bathrooms: 'ห้องน้ำ',
  area_sqm: 'พื้นที่',
  common_fee: 'ค่าส่วนกลาง',
  ownership_type: 'กรรมสิทธิ์',
};

/** เทียบค่าแบบไม่สนชนิดข้อมูล — ราคาใน DB เป็น Decimal ส่วนค่าที่ส่งมาเป็น number/string */
function sameValue(a: unknown, b: unknown) {
  const empty = (v: unknown) => v === null || v === undefined || v === '';
  if (empty(a) && empty(b)) return true;
  const na = Number(String(a)), nb = Number(String(b));
  if (!empty(a) && !empty(b) && !Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  return String(a ?? '').trim() === String(b ?? '').trim();
}

/**
 * @param before        แถวประกาศก่อนแก้ (จาก DB)
 * @param updateData    ค่าที่จะบันทึก (เฉพาะช่องที่นายหน้าส่งมา)
 * @param imagesBefore  URL รูปเดิมตามลำดับ (ส่งเมื่อมีการส่งชุดรูปใหม่มา)
 * @param imagesAfter   URL รูปชุดใหม่ (undefined = ไม่ได้แก้รูป)
 * @returns ชื่อช่องที่เปลี่ยน เช่น ["ราคา", "รูปภาพ"] — ว่าง = ไม่ได้แก้ส่วนสำคัญ
 */
export function describeListingChanges(
  before: Record<string, unknown>,
  updateData: Record<string, unknown>,
  imagesBefore?: string[],
  imagesAfter?: string[]
): string[] {
  const changed = Object.entries(IMPORTANT_FIELDS)
    .filter(([key]) => key in updateData && !sameValue(before[key], updateData[key]))
    .map(([, label]) => label);

  if (Array.isArray(imagesAfter) && JSON.stringify(imagesAfter) !== JSON.stringify(imagesBefore ?? [])) {
    changed.push('รูปภาพ');
  }
  return changed;
}
