/**
 * ==============================================================================
 * นิยามโครงสร้างข้อมูลอสังหาริมทรัพย์และสถานที่ใกล้เคียง (Property Data Contracts)
 * /types/property.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - กำหนดพิมพ์เขียวโครงสร้างข้อมูลประกาศบ้าน/คอนโด/ที่ดิน (Property Interface)
 * - กำหนดโครงสร้างข้อมูลสถานที่สำคัญใกล้เคียง (PropertyNearbyItem Interface)
 * - ใช้ร่วมกันทั้งระบบ เช่น PropertyCard, HeroSection, SearchSidebar, property/[id]
 *
 * [SEARCH: PROPERTY_TYPE]
 * [DATA: โครงสร้างข้อมูลอสังหาริมทรัพย์]
 * ==============================================================================
 */

/**
 * โครงสร้างข้อมูลสถานที่สำคัญใกล้เคียง (โรงพยาบาล, โรงเรียน, ขนส่ง ฯลฯ)
 * [SEARCH: NEARBY_ITEM_TYPE]
 */
export interface PropertyNearbyItem {
  /** รหัสสถานที่ */
  id?: number | string;
  /** ชื่อสถานที่ เช่น "เซ็นทรัลเฟสติวัล หาดใหญ่", "รพ.สงขลานครินทร์" */
  name: string;
  /** ชนิดย่อยของสถานที่ */
  type?: string | null;
  /** หมวดหมู่สถานที่: 'shopping' | 'education' | 'hospital' | 'transport' */
  category?: 'shopping' | 'education' | 'hospital' | 'transport' | string;
  /** ประเภทการขนส่ง (กรณีเป็นสถานี): 'bus' | 'train' | 'ferry' | 'flight' */
  transitType?: 'bus' | 'train' | 'ferry' | 'flight' | string;
  /** ระยะห่าง (เมตร หรือ กิโลเมตร) */
  distance?: number | null;
  /** ระยะห่างเป็นกิโลเมตร */
  distanceKm?: number | null;
  /** ข้อความระยะทางสำหรับแสดงผล เช่น "1.2 กม." */
  distanceText?: string | null;
  /** พิกัดละติจูด */
  latitude?: number;
  /** พิกัดลองจิจูด */
  longitude?: number;
}

/**
 * โครงสร้างข้อมูลหลักของอสังหาริมทรัพย์ทั้งหลัง
 * [SEARCH: PROPERTY_INTERFACE]
 */
export interface Property {
  /** รหัสประจำทรัพย์ (UUID หรือตัวเลข ID จากฐานข้อมูล) */
  id: string | number;
  /** หัวข้อประกาศ เช่น "บ้านเดี่ยว 2 ชั้น สไตล์โมเดิร์น ทำเลหาดใหญ่" */
  title: string;
  /** ราคาจัดแสดงผล เช่น "฿4,500,000" หรือ "฿18,000 / เดือน" */
  price: string;
  /** รูปแบบการลงประกาศ: 'sale' (ขาย) หรือ 'rent' (ให้เช่า) */
  listingType: 'sale' | 'rent';
  /** ประเภทอสังหาฯ เช่น "บ้านเดี่ยว", "คอนโด", "ทาวน์โฮม", "ที่ดิน" */
  type: string;
  /** รหัสประเภททรัพย์จากตาราง property_types */
  type_id?: number | null;
  /** ข้อความป้ายกำกับ เช่น "แนะนำ", "ลดพิเศษ", "มาใหม่" */
  tag: string;
  /** สีพื้นหลังป้ายกำกับ เช่น "bg-blue-600" */
  tagBg: string;
  /** ข้อความทำเลที่ตั้งโดยย่อ เช่น "หาดใหญ่, สงขลา" */
  location: string;
  /** จำนวนห้องนอน */
  bedrooms: number;
  /** จำนวนห้องน้ำ */
  bathrooms: number;
  /** ขนาดพื้นที่ (ตารางเมตร หรือ ตารางวา ตามที่ระบุ) */
  area: number;
  /** URL รูปภาพหลัก (Cover Image) */
  image: string;
  /** อาร์เรย์ URL รูปภาพทั้งหมดของทรัพย์สิน */
  images?: string[];
  /** ชื่อ-นามสกุลของนายหน้าผู้ดูแล */
  agentName: string;
  /** URL รูปโปรไฟล์ของนายหน้า */
  agentImage: string;
  /** เป็นทรัพย์พรีเมียมหรือไม่ (true = ได้รับการไฮไลต์พิเศษ) */
  isPremium?: boolean;
  /** นายหน้าผ่านการยืนยันตัวตนระดับ PRO หรือไม่ */
  isVerifiedPro?: boolean;
  /** คำบรรยายรายละเอียดทรัพย์แบบเต็ม */
  description?: string;
  /** พิกัดละติจูดสำหรับปักหมุดบนแผนที่ */
  latitude?: number;
  /** พิกัดลองจิจูดสำหรับปักหมุดบนแผนที่ */
  longitude?: number;
  /** รหัสจังหวัด */
  province_id?: number | null;
  /** รหัสอำเภอ */
  amphure_id?: number | null;
  /** รหัสตำบล */
  district_id?: number | null;
  /** รหัสนายหน้าเจ้าของประกาศ (users.id) */
  agent_id?: string | null;
  /** คะแนนเฉลี่ยรีวิวของนายหน้า (1-5 ดาว) */
  agentRating?: number;
  /** จำนวนรีวิวที่นายหน้าได้รับ */
  agentReviewCount?: number;
  /** ชื่อจังหวัดภาษาไทย */
  provinceName?: string;
  /** ชื่ออำเภอภาษาไทย */
  amphureName?: string;
  /** ชื่อตำบลภาษาไทย */
  districtName?: string;
  
  /** ค่าส่วนกลางรายเดือน/รายปี (บาท) */
  commonFee?: number | null;
  /** จำนวนที่จอดรถ (คัน) */
  parking?: number | null;
  /** จำนวนชั้น */
  floors?: number | null;
  /** รูปแบบการถือครองกรรมสิทธิ์ เช่น "โฉนด ครุฑแดง", "สัญญาเช่าระยะยาว" */
  ownership?: string | null;
  /** สิ่งอำนวยความสะดวก เช่น ["สระว่ายน้ำ", "ฟิตเนส", "รปภ. 24 ชม."] */
  amenities?: string[];
  /** รายการสถานที่ใกล้เคียง */
  nearbies?: PropertyNearbyItem[];
  /** ระยะทางคำนวณห่างจากจุดค้นหา (กิโลเมตร) */
  distanceKm?: number;
  /** ข้อความระยะทางห่างจากจุดค้นหา เช่น "ห่างจากคุณ 2.5 กม." */
  distanceText?: string;
}

