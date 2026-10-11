'use client';

/**
 * ==============================================================================
 * ไฟล์: lib/realtime/activeChatSession.ts
 * ==============================================================================
 * 
 * [หน้าที่ของไฟล์นี้]
 * เป็น In-Memory State Module สำหรับติดตามว่าผู้ใช้งานกำลังเปิดดูห้องแชทห้องใดอยู่บนเบราว์เซอร์
 * 
 * [ปัญหาที่แก้ (Problem Solved & BUG-19)]
 * ในระบบแอปพลิเคชัน มีการแจ้งเตือน 2 ส่วนทำงานพร้อมกัน:
 * 1. หน้าห้องแชท (app/customer/chat หรือ app/agent/chat) กำลังแสดงข้อความใหม่แบบ Real-time
 * 2. ระบบกระดิ่งแจ้งเตือนส่วนกลาง (NotificationBell / ToastContainer) ที่คอยดักฟัง Event แจ้งเตือนของระบบ
 * 
 * หากไม่มีไฟล์นี้:
 * เมื่อลูกค้ากำลังนั่งแชทกับนายหน้าอยู่ แล้วนายหน้าตอบกลับมา
 * ตัวกระดิ่งส่วนกลางจะเด้ง Toast แจ้งเตือนซ้ำซ้อนว่า "มีข้อความใหม่จากนายหน้า..." ทั้งที่ผู้ใช้นั่งอ่านข้อความนั้นอยู่แล้ว!
 * 
 * [วิธีการทำงาน]
 * 1. เมื่อหน้าแชทเปิดห้องใดขึ้นมา จะเรียก `setActiveChatSession(sessionId)` เพื่อจำรหัสห้องไว้ในตัวแปร `activeSessionId`
 * 2. เมื่อมี Notification เข้ามาที่กระดิ่ง กระดิ่งจะเรียก `isNotificationForActiveChat(linkUrl)`
 *    ถ้า URL ชี้มาที่ห้องที่กำลังเปิดอยู่นี้ ระบบจะระงับการเด้ง Toast ทันที
 * 3. เมื่อผู้ใช้ออกจากหน้าแชท (Unmount) จะเรียก `setActiveChatSession(null)` เพื่อคืนค่า
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
