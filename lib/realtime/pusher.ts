/**
 * ==============================================================================
 * อินสแตนซ์ Pusher ฝั่งเซิร์ฟเวอร์ (Server-Side Pusher Singleton)
 * /lib/realtime/pusher.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - สร้างและดูแล Pusher Server SDK Singleton สำหรับส่ง Event เข้า Channels
 * - ใช้ใน API Routes หรือ Services ที่ต้องการยิงแจ้งเตือนหรือข้อความแชทสด
 * - ตัวแปรแวดล้อมที่จำเป็น: PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER
 *
 * [SEARCH: SERVER_PUSHER_SINGLETON]
 * [LOGIC: การเริ่มต้นเซิร์ฟเวอร์ Pusher]
 * ==============================================================================
 */

import Pusher from 'pusher';

let instance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!instance) {
    instance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return instance;
}
