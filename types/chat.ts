/**
 * ==============================================================================
 * นิยามโครงสร้างข้อมูลห้องแชทและข้อความ (Chat Data Contracts)
 * /types/chat.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - กำหนดรูปแบบข้อมูลข้อความแชท (ChatMessage, AgentChatMessage)
 * - กำหนดรูปแบบข้อมูลห้องสนทนา (ChatSession, AgentContact)
 * - ใช้งานใน SharedChatView, FloatingChatWidget, ChatList และ Pusher Realtime
 *
 * [SEARCH: CHAT_TYPES]
 * [DATA: โครงสร้างข้อมูลระบบแชท]
 * ==============================================================================
 */

/**
 * โครงสร้างข้อความแชทเดี่ยว (ฝั่งลูกค้า / SharedChatView)
 * [SEARCH: CHAT_MESSAGE_INTERFACE]
 */
export interface ChatMessage {
  /** รหัสข้อความ */
  id: number;
  /** ผู้ส่ง: 'user' (ผู้ใช้งาน/ลูกค้า) หรือ 'agent' (นายหน้า) */
  sender: 'user' | 'agent';
  /** เนื้อหาข้อความ */
  text: string;
  /** เวลาที่ส่ง (เช่น "10:30 น." หรือ ISO String) */
  time: string;
}

/**
 * โครงสร้างข้อมูลห้องสนทนา (ฝั่งลูกค้า)
 * [SEARCH: CHAT_SESSION_INTERFACE]
 */
export interface ChatSession {
  /** รหัสห้องสนทนา */
  id: number;
  /** ชื่อคู่สนทนา (เช่น ชื่อนายหน้า) */
  name: string;
  /** URL รูปภาพโปรไฟล์ของคู่สนทนา */
  avatar: string;
  /** สถานะการเปิดห้องแชทใช้งานอยู่หรือไม่ */
  isActive: boolean;
  /** ตัวอย่างข้อความล่าสุดเพื่อแสดงในรายการห้อง */
  lastMessage: string;
  /** เวลาของข้อความล่าสุด */
  time: string;
  /** รายการข้อความทั้งหมดในห้องนี้ */
  messages: ChatMessage[];
}

/**
 * โครงสร้างข้อความแชทสำหรับฝั่งแดชบอร์ดนายหน้า
 * [SEARCH: AGENT_CHAT_MESSAGE_INTERFACE]
 */
export interface AgentChatMessage {
  /** รหัสข้อความแบบ String/UUID */
  id: string;
  /** ผู้ส่ง: 'client' (ลูกค้า) หรือ 'agent' (นายหน้า) */
  sender: 'client' | 'agent';
  /** เนื้อหาข้อความ */
  content: string;
  /** เวลาที่ส่งข้อความ */
  time: string;
}

/**
 * โครงสร้างผู้ติดต่อ/ลูกค้าในมุมมองของนายหน้า
 * [SEARCH: AGENT_CONTACT_INTERFACE]
 */
export interface AgentContact {
  /** รหัสลูกค้าหรือรหัสเซสชัน */
  id: string;
  /** ชื่อลูกค้า */
  name: string;
  /** ตัวอักษรย่อสำหรับทำ Avatar กรณีไม่มีรูป */
  avatarLetter: string;
  /** รหัสอสังหาฯ ที่ลูกค้าสนใจสอบถาม (เช่น PROP-101) */
  propertyCode: string;
  /** ชื่ออสังหาริมทรัพย์ */
  propertyName: string;
  /** ราคาอสังหาริมทรัพย์ */
  propertyPrice: string;
  /** ข้อความล่าสุดที่คุยกัน */
  lastMessageSnippet: string;
  /** เวลาของข้อความล่าสุด */
  lastMessageTime: string;
  /** ประวัติข้อความแชท */
  messages: AgentChatMessage[];
}

