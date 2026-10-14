'use client';

/**
 * ==============================================================================
 * การติดตามห้องแชทที่กำลังเปิดดูอยู่บนเบราว์เซอร์ (Active Chat Session Tracker)
 * /lib/realtime/activeChatSession.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - ติดตามว่าผู้ใช้งานกำลังเปิดดูห้องแชทห้องใดอยู่บนเบราว์เซอร์ ณ ปัจจุบัน
 * - ป้องกันปัญหาแจ้งเตือนซ้ำซ้อน (BUG-19): ระงับการเด้ง Toast แจ้งเตือนข้อความใหม่
 *   หากผู้ใช้งานกำลังนั่งอ่านและพิมพ์อยู่ในห้องสนทนานั้นอยู่แล้ว
 *
 * [SEARCH: ACTIVE_CHAT_SESSION_TRACKER]
 * [STATE: การติดตามห้องแชทที่กำลังเปิดดูอยู่]
 * ==============================================================================
 */

// ตัวแปรระดับโมดูล (Module-scoped variable) เก็บ ID ห้องแชทที่เปิดอยู่บนหน้าจอ ณ ปัจจุบัน
let activeSessionId: string | null = null;

/**
 * กำหนดรหัสห้องแชทที่กำลังเปิดใช้งานอยู่บนหน้าจอ
 * @param sessionId รหัสห้องแชท (UUID) หรือ null เมื่อปิดห้องแชท
 */
export function setActiveChatSession(sessionId: string | null) {
  activeSessionId = sessionId;
}

/**
 * ตรวจสอบว่า Notification ที่ส่งเข้ามา ชี้มายังห้องแชทที่กำลังเปิดอยู่บนหน้าจอหรือไม่
 * @param linkUrl ลิงก์ปลายทางของ Notification เช่น "/chat?sessionId=xxx" หรือ "/agent/chat?sessionId=xxx"
 * @returns true หากเป็นห้องเดียวกัน (เพื่อระงับการแสดง Toast ซ้ำซ้อน)
 */
export function isNotificationForActiveChat(linkUrl: string | null | undefined) {
  if (!activeSessionId || !linkUrl) return false;
  
  // ใช้ Web Standard URL API โดยใส่ Dummy Base URL เพื่อแยกอ่าน Query Parameter ได้อย่างปลอดภัย
  const sessionId = new URL(linkUrl, 'http://localhost').searchParams.get('sessionId');
  return sessionId === activeSessionId;
}
