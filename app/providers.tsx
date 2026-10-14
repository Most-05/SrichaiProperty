'use client';

/**
 * ==============================================================================
 * [SEARCH: ROOT_PROVIDERS] [LOGIC: รวม CONTEXT PROVIDERS และ GLOBAL OVERLAYS]
 * ผู้ให้บริการและคอมโพเนนต์ระดับ Global (Application Global Providers)
 * /app/providers.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. NextAuth SessionProvider: จัดการสภาวะการเข้าสู่ระบบ
 * 2. AppProvider: จัดการ State ประกาศและรายการโปรด
 * 3. Global Overlays:
 *    - NetworkStatusBanner: แจ้งเตือนเมื่อสัญญาณเน็ตหลุด/กลับมา
 *    - ToastContainer: กล่องข้อความแจ้งเตือน Toast ลอย
 *    - AdminTopBar: แถบสถานะโหมดแอดมิน
 *    - FloatingChatWidget: ปุ่มลอยเปิดกล่องแชทด่วน
 * ==============================================================================
 */

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { AppProvider } from '@/context/AppContext';

import FloatingChatWidget from '@/components/common/FloatingChatWidget';
import AdminTopBar from '@/components/layout/AdminTopBar';
import ToastContainer from '@/components/common/ToastContainer';
import NetworkStatusBanner from '@/components/common/NetworkStatusBanner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        <NetworkStatusBanner />
        <ToastContainer />
        <AdminTopBar />
        {children}
        <FloatingChatWidget />
      </AppProvider>
    </SessionProvider>
  );
}