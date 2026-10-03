'use client';

// จำว่าตอนนี้ผู้ใช้เปิดห้องแชทห้องไหนอยู่ (ฝั่ง browser) — หน้าแชทเป็นคนตั้งค่า, กระดิ่งแจ้งเตือนเป็นคนอ่าน
// ใช้กันไม่ให้กระดิ่งเด้ง toast "ข้อความใหม่จาก…" ของห้องที่ผู้ใช้กำลังอ่านอยู่แล้ว (BUG-19)
let activeSessionId: string | null = null;

export function setActiveChatSession(sessionId: string | null) {
  activeSessionId = sessionId;
}

/** true = แจ้งเตือนนี้ลิงก์ไปห้องแชทที่เปิดอ่านอยู่ (linkUrl แบบ /chat?sessionId=… หรือ /agent/chat?sessionId=…) */
export function isNotificationForActiveChat(linkUrl: string | null | undefined) {
  if (!activeSessionId || !linkUrl) return false;
  const sessionId = new URL(linkUrl, 'http://localhost').searchParams.get('sessionId');
  return sessionId === activeSessionId;
}
