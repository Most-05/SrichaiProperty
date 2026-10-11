/**
 * ==============================================================================
 * ไฟล์: lib/realtime/channels.ts
 * ==============================================================================
 * 
 * [หน้าที่ของไฟล์นี้]
 * เป็น Utility Module สำหรับจัดการข้อตกลงการตั้งชื่อ (Naming Conventions) ของ Pusher Channels
 * ทั้งระบบห้องแชท (Chat Channels) และระบบการแจ้งเตือนส่วนบุคคล (Notification Channels)
 * 
 * [ทำไมต้องขึ้นต้นด้วย 'private-']
 * ใน Pusher Protocol ช่องทางสื่อสาร (Channel) ที่ขึ้นต้นด้วยคำว่า `private-`
 * จะถูกกำหนดให้เป็น Private Channel ซึ่งผู้ใช้ไม่สามารถแอบต่อเองได้โดยพลการ
 * แต่ Pusher Client จะต้องส่งคำขอไปขอ Auth Signature จากเซิร์ฟเวอร์เราที่ `/api/pusher/auth` ก่อนเสมอ
 * เพื่อตรวจสอบว่าผู้ใช้คนนั้นมีสิทธิ์ในห้องแชท หรือเป็นเจ้าของ User ID นั้นจริงหรือไม่
 * ==============================================================================
 */

// คำนำหน้าสำหรับ Private Channel ของห้องแชท
const CHAT_CHANNEL_PREFIX = 'private-chat-';

// คำนำหน้าสำหรับ Private Channel ของการแจ้งเตือนผู้ใช้แต่ละราย
const NOTIFICATION_CHANNEL_PREFIX = 'private-user-';

// ==============================================================================
// 1. ฟังก์ชันสำหรับห้องสนทนา (Chat Channels)
// ==============================================================================

/**
 * สร้างชื่อ Pusher Channel สำหรับห้องสนทนา
 * @param sessionId รหัสประจำห้องแชท (UUID)
 * @returns ชื่อ Channel เช่น "private-chat-3fa85f64-5717-4562-b3fc-2c963f66afa6"
 */
export function chatChannelName(sessionId: string): string {
  return `${CHAT_CHANNEL_PREFIX}${sessionId}`;
}

/**
 * แยกสกัด (Parse) ดึงเอา sessionId ออกมาจากชื่อ Pusher Channel
 * ใช้ในฝั่งเซิร์ฟเวอร์ เช่น ตอนยืนยันสิทธิ์ใน /api/pusher/auth
 * @param channelName ชื่อ Channel ที่ส่งมา
 * @returns sessionId (UUID) หรือ null หากชื่อ Channel ไม่ตรงตามรูปแบบ
 */
export function parseChatSessionId(channelName: string): string | null {
  if (!channelName.startsWith(CHAT_CHANNEL_PREFIX)) return null;
  return channelName.slice(CHAT_CHANNEL_PREFIX.length);
}

// ==============================================================================
// 2. ฟังก์ชันสำหรับการแจ้งเตือนส่วนบุคคล (Notification Channels)
// ==============================================================================

/**
 * สร้างชื่อ Pusher Channel สำหรับระบบแจ้งเตือนกระดิ่งของผู้ใช้แต่ละคน
 * @param userId รหัสประจำตัวผู้ใช้งาน (UUID)
 * @returns ชื่อ Channel เช่น "private-user-3fa85f64-5717-4562-b3fc-2c963f66afa6"
 */
export function notificationChannelName(userId: string): string {
  return `${NOTIFICATION_CHANNEL_PREFIX}${userId}`;
}

/**
 * แยกสกัด (Parse) ดึงเอา userId ออกมาจากชื่อ Pusher Channel ของการแจ้งเตือน
 * @param channelName ชื่อ Channel ที่ส่งมา
 * @returns userId (UUID) หรือ null หากชื่อ Channel ไม่ตรงตามรูปแบบ
 */
export function parseNotificationUserId(channelName: string): string | null {
  if (!channelName.startsWith(NOTIFICATION_CHANNEL_PREFIX)) return null;
  return channelName.slice(NOTIFICATION_CHANNEL_PREFIX.length);
}
