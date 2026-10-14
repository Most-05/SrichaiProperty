/**
 * ==============================================================================
 * เซอร์วิสจัดการข้อมูลอสังหาริมทรัพย์ (Property Database Service)
 * /lib/services/propertyService.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - ฟังก์ชันเชื่อมต่อฐานข้อมูล Prisma สำหรับดึงข้อมูลอสังหาริมทรัพย์
 * - getAllProperties(): ดึงรายการทรัพย์ทั้งหมดพร้อมความสัมพันธ์ (รูปภาพ, ประเภท, นายหน้า)
 * - getPropertyById(): ดึงรายละเอียดทรัพย์รายชิ้นตาม UUID
 *
 * [SEARCH: PROPERTY_DATABASE_SERVICE]
 * [DATA: คิวรีข้อมูลอสังหาริมทรัพย์]
 * ==============================================================================
 */

import { db } from '@/lib/db';

/**
 * ดึงรายการอสังหาริมทรัพย์ทั้งหมดในระบบ
 * [SEARCH: GET_ALL_PROPERTIES_QUERY]
 */
export async function getAllProperties() {
  return await db.properties.findMany({
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          phone: true,
          email: true,
        }
      },
      property_types: true,
      property_images: {
        orderBy: { order_index: 'asc' }
      },
      property_amenities: {
        include: { amenities: true }
      },
      property_nearbies: {
        include: { nearby_places: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * ดึงรายละเอียดอสังหาริมทรัพย์ด้วย ID
 */
export async function getPropertyById(id: string) {
  return await db.properties.findUnique({
    where: { id },
    include: {
      users: true,
      property_types: true,
      property_images: true,
      property_amenities: { include: { amenities: true } },
      property_nearbies: { include: { nearby_places: true } }
    }
  });
}
