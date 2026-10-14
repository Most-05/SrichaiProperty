/**
 * ==============================================================================
 * อินสแตนซ์ Pusher Client ฝั่งเบราว์เซอร์ (Browser Pusher Client Singleton)
 * /lib/realtime/client.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - สร้างและดูแล Pusher-js Client Singleton บนฝั่งเบราว์เซอร์
 * - กำหนด endpoint ยืนยันสิทธิ์ Private Channel ที่ '/api/pusher/auth'
 * - ใช้ใน useChatRealtime, NotificationBell และ SharedChatView
 *
 * [SEARCH: BROWSER_PUSHER_CLIENT]
 * [LOGIC: การเชื่อมต่อ WebSocket ฝั่งไคลเอนต์]
 * ==============================================================================
 */

'use client';

import PusherClient from 'pusher-js';

let client: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!client) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      throw new Error('Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER');
    }
    client = new PusherClient(key, {
      cluster,
      authEndpoint: '/api/pusher/auth',
    });
  }
  return client;
}
