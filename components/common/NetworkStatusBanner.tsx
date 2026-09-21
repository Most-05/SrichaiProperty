'use client';

import React, { useState, useEffect } from 'react';

/**
 * ==============================================================================
 * แบนเนอร์แจ้งเตือนสถานะเครือข่าย (Offline / Network Resilient UI)
 * /components/common/NetworkStatusBanner.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. ตรวจจับการหลุดของสัญญาณอินเทอร์เน็ต (เน็ตมือถือหรือ Wi-Fi ขาดชั่วคราว)
 * 2. แจ้งเตือนผู้ใช้อย่างนุ่มนวล ไม่ให้หน้าจอขาวหรือสับสนว่าระบบล่ม
 * 3. แจ้งเตือนเมื่อการเชื่อมต่อกลับมาเป็นปกติโดยอัตโนมัติ
 * ==============================================================================
 */

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export default function NetworkStatusBanner() {
  const isOnline = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showReconnected, setShowReconnected] = useState(false);
  const prevOnlineRef = React.useRef(isOnline);

  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      // เพิ่งกลับมาออนไลน์ ให้โชว์แถบเขียว 3.5 วินาที
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  const isOffline = !isOnline;

  if (!isOffline && !showReconnected) return null;

  return (
    <aside 
      aria-label="สถานะการเชื่อมต่ออินเทอร์เน็ต"
      className="fixed top-2 inset-x-0 z-[9998] flex justify-center px-4 pointer-events-none transition-all duration-300"
    >
      {isOffline ? (
        <div 
          role="status"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 border border-amber-400 animate-bounce"
        >
          <svg className="w-4 h-4 shrink-0 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>ขาดการเชื่อมต่ออินเทอร์เน็ต ระบบจะซิงค์ใหม่อัตโนมัติเมื่อสัญญาณกลับมา</span>
        </div>
      ) : (
        <div 
          role="status"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 border border-emerald-500 transition-all"
        >
          <svg className="w-4 h-4 shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>เชื่อมต่ออินเทอร์เน็ตเรียบร้อยแล้ว</span>
        </div>
      )}
    </aside>
  );
}
