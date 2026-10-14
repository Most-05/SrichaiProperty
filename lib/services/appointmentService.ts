/**
 * ==============================================================================
 * เซอร์วิสจัดการข้อมูลนัดหมายในฐานข้อมูล (Appointment Database Service)
 * /lib/services/appointmentService.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - ฟังก์ชันคิวรีตาราง appointments ในฐานข้อมูล PostgreSQL ผ่าน Prisma
 * - getAppointmentsByUserId(): ดึงรายการนัดหมายของผู้ใช้ (ทั้งในบทบาทลูกค้าหรือนายหน้า)
 *
 * [SEARCH: APPOINTMENT_DATABASE_SERVICE]
 * [DATA: คิวรีข้อมูลนัดหมายผู้ใช้]
 * ==============================================================================
 */

import { db } from '@/lib/db';

/**
 * ดึงรายการนัดหมายตาม ID ผู้ใช้งาน
 * [SEARCH: GET_APPOINTMENTS_BY_USER_ID]
 */
export async function getAppointmentsByUserId(userId: string) {
  return await db.appointments.findMany({
    where: {
      OR: [
        { customer_id: userId },
        { agent_id: userId }
      ]
    },
    include: {
      properties: {
        include: {
          property_images: { take: 1 }
        }
      },
      users_appointments_agent_idTousers: true,
      users_appointments_customer_idTousers: true
    },
    orderBy: { appointment_date: 'desc' }
  });
}
