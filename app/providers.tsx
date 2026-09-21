'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { AppProvider } from '@/context/AppContext';

import FloatingChatWidget from '@/components/common/FloatingChatWidget';
import AdminTopBar from '@/components/common/AdminTopBar';
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