'use client';

import React from 'react';
import { useToast, ToastMessage, ToastType } from '@/components/ui/toast';

/**
 * ==============================================================================
 * คอนเทนเนอร์แสดงผล Toast Notifications (Toast Container)
 * /components/common/ToastContainer.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. แสดงรายการ Toast ลอยมุมขวาบน (Desktop) หรือด้านบนกึ่งกลาง (Mobile)
 * 2. ดีไซน์ Modern Glassmorphism, โค้งมน, เงาละมุน, และแอนิเมชันลื่นไหล
 * 3. มีไอคอนและโทนสีแยกตามประเภท (เขียว = สำเร็จ, แดง = ข้อผิดพลาด, น้ำเงิน = ข้อมูล, เหลือง = เตือน)
 * ==============================================================================
 */

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (type === 'error') {
    return (
      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  if (type === 'warning') {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

function ToastItem({ item, onDismiss }: { item: ToastMessage; onDismiss: (id: string) => void }) {
  const borderAndBg = {
    success: 'border-emerald-200/80 bg-white/95 text-slate-800 shadow-emerald-500/10',
    error: 'border-rose-200/80 bg-white/95 text-slate-800 shadow-rose-500/10',
    warning: 'border-amber-200/80 bg-white/95 text-slate-800 shadow-amber-500/10',
    info: 'border-blue-200/80 bg-white/95 text-slate-800 shadow-blue-500/10',
  }[item.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 max-w-sm sm:max-w-md w-full ${borderAndBg}`}
    >
      <ToastIcon type={item.type} />
      <div className="flex-1 min-w-0 pt-0.5">
        {item.title && (
          <h4 className="text-xs font-bold text-slate-900 mb-0.5">{item.title}</h4>
        )}
        <p className="text-xs font-medium text-slate-750 leading-relaxed break-words">
          {item.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
        aria-label="ปิดการแจ้งเตือน"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <aside 
      aria-label="การแจ้งเตือนระบบ"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((toastItem) => (
        <ToastItem key={toastItem.id} item={toastItem} onDismiss={dismiss} />
      ))}
    </aside>
  );
}
