'use client';

/**
 * ==============================================================================
 * [SEARCH: PENDING_GATE_SWITCH] [AUTH: UNVERIFIED_AGENT_PAGE_SWITCH]
 * ตัวเลือกว่าจะแสดงอะไรให้นายหน้าที่ยังไม่ผ่าน KYC (pending / rejected)
 * /components/agent/PendingGateSwitch.tsx
 * ==============================================================================
 * - หน้าอ่านอย่างเดียว (PDPA / ข้อกำหนดนายหน้า) → แสดงเนื้อหาจริง ให้อ่านข้อตกลงได้ระหว่างรออนุมัติ
 * - หน้าอื่น → แสดง PendingAgentGate (ดูสถานะ KYC / ส่งเอกสารใหม่)
 * ==============================================================================
 */

import { usePathname } from 'next/navigation';
import PendingAgentGate from '@/components/agent/PendingAgentGate';

// ⚠ ต้องตรงกับ UNVERIFIED_AGENT_READABLE_PAGES ใน proxy.ts (proxy เป็นคนเปิดทางให้เข้าหน้าพวกนี้)
const UNVERIFIED_AGENT_READABLE_PAGES = ['/agent/privacy', '/agent/terms'];

export default function PendingGateSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (UNVERIFIED_AGENT_READABLE_PAGES.includes(pathname)) {
    return <>{children}</>;
  }
  return <PendingAgentGate />;
}
