'use client';

/**
 * ==============================================================================
 * ไฟล์: hooks/useChatRealtime.ts
 * ==============================================================================
 * 
 * [หน้าที่ของไฟล์นี้]
 * เป็น Custom React Hook สำหรับจัดการระบบ Real-Time WebSockets ผ่าน Pusher Client
 * ถูกแชร์ใช้งานร่วมกันระหว่าง Container Pages ทั้ง 2 บทบาท:
 * 1. ฝั่งลูกค้า: app/(customer)/chat/page.tsx
 * 2. ฝั่งนายหน้า: app/agent/chat/page.tsx
 * 
 * [ฟังก์ชันการทำงานหลัก (Core Responsibilities)]
 * 1. Channel Lifecycle Management:
 *    - Subscribe ไปยัง Private Channel ตาม sessionId ของห้องที่กำลังเปิดใช้งาน
 *    - Unsubscribe และ Unbind Events ทั้งหมดโดยอัตโนมัติเมื่อเปลี่ยนห้องหรือปิดหน้าจอ (Cleanup)
 * 2. Event Binding:
 *    - 'new-message': ดักฟังเมื่อมีข้อความใหม่ถูกส่งเข้ามา แล้วกระตุ้น onNewMessage()
 *    - 'messages-read': ดักฟังเมื่ออีกฝ่ายเปิดอ่านข้อความ แล้วกระตุ้น onMessagesRead()
 *    - 'client-typing': ตรวจสอบสัญญาณว่าอีกฝ่ายกำลังพิมพ์ข้อความอยู่หรือไม่ (กรอง userId ของตัวเองออก)
 * 3. Connection Health Monitoring:
 *    - ตรวจจับข้อผิดพลาดการเชื่อมต่อ ('pusher:subscription_error') เพื่อคืนค่า connectionError ให้ UI แสดงแบนเนอร์เตือน
 * 4. Typing Dispatcher:
 *    - ให้ฟังก์ชัน sendTyping(boolean) สำหรับยิง HTTP POST /api/chat/typing ไปยังเซิร์ฟเวอร์
 * ==============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { chatChannelName } from '@/lib/chatChannel';

/**
 * พารามิเตอร์ Options ที่ส่งเข้ามาใน Hook useChatRealtime
 */
interface UseChatRealtimeOptions {
  /** ควบคุมการเปิด/ปิดการทำงานของ Hook (เช่น ทำงานเฉพาะเมื่อ status === 'authenticated') */
  enabled: boolean;
  /** รหัสประจำห้องแชทที่กำลังเลือกเปิดอยู่ (UUID) หากเป็น null จะยังไม่ Subscribe */
  sessionId: string | null;
  /** รหัสผู้ใช้งานปัจจุบัน (User ID) เพื่อใช้กรองไม่ให้แจ้งสถานะกำลังพิมพ์ของตัวเอง */
  currentUserId?: string;
  /** Callback ฟังก์ชันที่จะถูกเรียกเมื่อมีข้อความใหม่ส่งเข้ามาในห้องนี้ */
  onNewMessage: () => void;
  /** Callback ฟังก์ชันที่จะถูกเรียกเมื่ออีกฝ่ายเปิดอ่านข้อความของเราแล้ว (Optional) */
  onMessagesRead?: () => void;
}

/**
 * Custom Hook: useChatRealtime
 * คืนค่า State และ Handler สำหรับการสื่อสารแบบ Real-time ของห้องแชท
 */
export function useChatRealtime({ 
  enabled,          // เปิด/ปิดการทำงานของ Hook
  sessionId,        // รหัสห้องแชท ใช้ระบุชื่อ Channel
  currentUserId,    // รหัสผู้ใช้ปัจจุบัน ใช้กรอง Event ตัวเอง
  onNewMessage,     // Callback เมื่อมีข้อความใหม่
  onMessagesRead    // Callback เมื่อข้อความถูกเปิดอ่าน
}: UseChatRealtimeOptions) {

  // ----------------------------------------------------------------------------
  // 1. States ภายใน Hook
  // ----------------------------------------------------------------------------
  // สถานะว่าคู่สนทนาในห้องนี้กำลังพิมพ์ข้อความอยู่หรือไม่ (true/false)
  const [isTyping, setIsTyping] = useState(false);
  
  // สถานะแจ้งเตือนว่าการเชื่อมต่อ WebSocket มีปัญหาหรือไม่ (เช่น Token หมดอายุ หรืออินเทอร์เน็ตหลุด)
  const [connectionError, setConnectionError] = useState(false);

  // ----------------------------------------------------------------------------
  // 2. Effect: จัดการ Subscription และ Event Listeners ของ Pusher Channel
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // หากปิดการทำงาน (enabled === false) หรือยังไม่ได้เลือกห้องแชท (sessionId === null) -> ไม่ต้องทำอะไร
    if (!enabled || !sessionId) return;

    // ดึง Instance ของ Pusher Client (แบบ Singleton เพื่อใช้ Socket Connection เดียวกันทั้งแอป)
    const pusher = getPusherClient();

    // สร้างชื่อ Private Channel สำหรับห้องนี้ เช่น "private-chat-session-3fa85f64-5717-4562-b3fc-2c963f66afa6"
    const channelName = chatChannelName(sessionId);

    // สมัครรับข้อมูล (Subscribe) เข้า Channel ของห้องแชทนี้
    const channel = pusher.subscribe(channelName);

    // [Event 1: ข้อความใหม่] เมื่อเซิร์ฟเวอร์ยิง Event 'new-message' มา
    // ให้สั่งเรียก Callback onNewMessage เพื่อให้ Parent Component ไปดึงข้อมูลหรืออัปเดต State
    channel.bind('new-message', () => onNewMessage());

    // [Event 2: อ่านข้อความแล้ว] เมื่อเซิร์ฟเวอร์ยิง Event 'messages-read' มา
    // แสดงว่าอีกฝ่ายเปิดอ่านข้อความแล้ว ให้เรียก onMessagesRead เพื่ออัปเดตไอคอนเป็น "อ่านแล้ว" (CheckCheck)
    channel.bind('messages-read', () => onMessagesRead?.());

    // [Event 3: สถานะกำลังพิมพ์] เมื่อเซิร์ฟเวอร์กระจายสัญญาณการพิมพ์
    channel.bind('client-typing', (data: { isTyping: boolean; userId?: string }) => {
      // ป้องกันการแจ้งเตือนตัวเอง: ถ้าคนที่พิมพ์คือ User ID ของเราเอง ให้ข้ามไป
      if (data.userId === currentUserId) return;

      // อัปเดต State ว่าคู่สนทนากำลังพิมพ์อยู่หรือไม่
      setIsTyping(data.isTyping);
    });

    // [Event 4: ตรวจสอบข้อผิดพลาด] หากยืนยันตัวตนสิทธิ์เข้า Channel ล้มเหลว (เช่น ไม่ใช่คู่สนทนาในห้อง)
    channel.bind('pusher:subscription_error', () => setConnectionError(true));

    // [Event 5: เชื่อมต่อสำเร็จ] หากเชื่อมต่อและยืนยันสิทธิ์สำเร็จ ให้เคลียร์สถานะ Error
    channel.bind('pusher:subscription_succeeded', () => setConnectionError(false));

    // --------------------------------------------------------------------------
    // 3. Cleanup Function (การยกเลิกการเชื่อมต่อเมื่อเปลี่ยนห้องหรือปิดหน้าจอ)
    // --------------------------------------------------------------------------
    // ทำงานอัตโนมัติเมื่อ:
    // 1) ผู้ใช้เปลี่ยนห้องแชท (sessionId เปลี่ยน)
    // 2) ผู้ใช้ปิดหน้าจอแชท (Component Unmount)
    return () => {
      channel.unbind_all();            // ยกเลิก Listener ทุกตัวของ Channel นี้เพื่อกัน Memory Leak
      pusher.unsubscribe(channelName); // ยกเลิกการ Subscribe เพื่อหยุดรับข้อมูล
      setIsTyping(false);               // รีเซ็ตสถานะการพิมพ์กลับเป็น false
    };

  }, [enabled, sessionId, currentUserId, onNewMessage, onMessagesRead]);

  // ----------------------------------------------------------------------------
  // 4. ฟังก์ชันส่งสัญญาณ "กำลังพิมพ์" ของตัวเองไปยังเซิร์ฟเวอร์ (sendTyping)
  // ----------------------------------------------------------------------------
  // ใช้ useCallback เพื่อรักษา Function Reference ไม่ให้เปลี่ยนทุกครั้งที่ Component Re-render
  const sendTyping = useCallback((typing: boolean) => {
    if (!sessionId) return; // หากไม่มีห้องแชท ไม่ต้องทำอะไร

    // ส่งคำขอแบบ Asynchronous (Fire-and-forget) ไปยัง API Route /api/chat/typing
    // เซิร์ฟเวอร์จะตรวจสอบความปลอดภัย และยิง Pusher Event 'client-typing' ไปยัง Channel ของห้องนี้
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, isTyping: typing })
    });
  }, [sessionId]);

  // ----------------------------------------------------------------------------
  // 5. ส่งค่าออกไปให้ Component ภายนอกนำไปใช้งาน
  // ----------------------------------------------------------------------------
  return { 
    isTyping,        // Boolean: คู่สนทนากำลังพิมพ์อยู่หรือไม่
    connectionError, // Boolean: การเชื่อมต่อ WebSocket มีปัญหาหรือไม่
    sendTyping       // Function: ฟังก์ชันสำหรับแจ้งเซิร์ฟเวอร์ว่าเรากำลังพิมพ์/หยุดพิมพ์
  };
}