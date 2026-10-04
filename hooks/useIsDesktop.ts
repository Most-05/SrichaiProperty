'use client';

import { useSyncExternalStore } from 'react';

// ตรงกับ breakpoint `lg` ของ Tailwind (1024px) ที่แถบเมนูใช้สลับเมนูจอใหญ่/มือถือ
const DESKTOP_QUERY = '(min-width: 1024px)';

function subscribe(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

/**
 * true = จอตั้งแต่ 1024px ขึ้นไป (เมนูแบบจอใหญ่), false = มือถือ/แท็บเล็ต
 *
 * ใช้ให้แถบเมนู render คอมโพเนนต์ที่ต้องมีแค่ชิ้นเดียวต่อหน้า (เช่น NotificationBell) เฉพาะในตำแหน่งที่มองเห็น
 * — ถ้าแค่ซ่อนด้วย CSS (`hidden lg:flex`) คอมโพเนนต์ทั้ง 2 ชิ้นยังทำงานอยู่จริง
 * ฝั่ง server ยังไม่รู้ขนาดจอ → ถือเป็น false ก่อน แล้วอัปเดตทันทีหลัง hydrate
 */
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}
