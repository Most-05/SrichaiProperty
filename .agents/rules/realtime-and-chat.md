# Realtime Messaging (Pusher) & Live Events Rules

## 1. Channel Naming & Helpers
ห้าม hardcode ชื่อ Channel ของ Pusher เอง ให้ใช้ Helper Functions กลางจาก `@/lib/chatChannel` และ `@/lib/notificationChannel` เสมอ เพื่อความสม่ำเสมอและป้องกันสิทธิ์ไม่ตรงกัน:
- แชทส่วนตัว: `chatChannelName(sessionId)` (ได้สตริง `private-chat-{sessionId}`)
- แจ้งเตือนส่วนตัว: `notificationChannelName(userId)` (ได้สตริง `private-user-{userId}`)

## 2. Server vs Client SDK Separation
- **Server-side**:
  - ใช้ `import { pusherServer } from "@/lib/pusher";`
  - ใช้สำหรับ `.trigger(channel, eventName, data)`
  - ตัวอย่าง Event Names มาตรฐาน:
    - ข้อความใหม่: `'new-message'`
    - มีคนกำลังพิมพ์: `'typing-status'`
    - การแจ้งเตือนใหม่: `'new-notification'`
- **Client-side**:
  - ใช้ `import { pusherClient } from "@/lib/pusher-client";`
  - ใช้สำหรับการ `subscribe()` ใน React Component ฝั่ง Client

## 3. Mandatory Lifecycle Cleanup (ป้องกัน Memory Leak และ Quota เต็ม)
ทุกครั้งที่มีการ subscribe ช่องสัญญาณ Pusher ใน React Hook (`useEffect`), **ต้องมี Cleanup Function คืนทรัพยากรเสมอ**:
```typescript
'use client';

import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusher-client';
import { chatChannelName } from '@/lib/chatChannel';

export function useChatRoom(sessionId: string) {
  useEffect(() => {
    if (!sessionId) return;

    const channelName = chatChannelName(sessionId);
    const channel = pusherClient.subscribe(channelName);

    channel.bind('new-message', (data: any) => {
      // จัดการข้อความที่ได้รับ
    });

    // สำคัญที่สุด: cleanup เมื่อเปลี่ยนห้องหรือ unmount
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId]);
}
```

## 4. Pusher Quota & Bandwidth Optimization
- **Rate Limit & Debounce**: สำหรับ Event ถี่ๆ เช่น Typing status หรือ Location tracker ต้องใช้ Debounce (เช่น รอ 300-500ms หลังพิมพ์หยุด) ห้ามยิง Event ทุกการเคาะแป้นพิมพ์
- ส่งเฉพาะ Payload ข้อมูลที่จำเป็น ห้ามส่ง Object ขนาดใหญ่เกินความจำเป็นข้าม Realtime Channel
