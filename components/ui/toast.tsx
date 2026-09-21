'use client';

import { useEffect, useState } from 'react';

/**
 * ==============================================================================
 * ระบบ Toast Notification แบบ Event-Driven (Custom Lightweight Toast)
 * /components/ui/toast.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. ยกระดับ UX แทนที่ alert() ของเบราว์เซอร์ที่ไม่สวยงามและบล็อกหน้าจอ
 * 2. รองรับการเรียกใช้งานตรงๆ เช่น toast.success('ข้อความ') หรือผ่าน Hook useToast()
 * 3. Zero-dependency 100% ปลอดภัยกับ React 19 และ Next.js 16
 * ==============================================================================
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    listener(this.toasts);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  add(type: ToastType, message: string, options?: { title?: string; duration?: number }) {
    const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const duration = options?.duration ?? (type === 'error' ? 4500 : 3500);

    const newToast: ToastMessage = {
      id,
      type,
      message,
      title: options?.title,
      duration,
    };

    // แสดงพร้อมกันได้ไม่เกิน 4 อัน
    this.toasts = [newToast, ...this.toasts.slice(0, 3)];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

/**
 * ฟังก์ชันหลักสำหรับเรียกใช้ Toast ได้จากทุกที่โดยไม่ต้องพึ่งพา Hook
 */
export const toast = {
  success: (message: string, options?: { title?: string; duration?: number }) =>
    toastManager.add('success', message, options),
  error: (message: string, options?: { title?: string; duration?: number }) =>
    toastManager.add('error', message, options),
  info: (message: string, options?: { title?: string; duration?: number }) =>
    toastManager.add('info', message, options),
  warning: (message: string, options?: { title?: string; duration?: number }) =>
    toastManager.add('warning', message, options),
  dismiss: (id: string) => toastManager.remove(id),
  clear: () => toastManager.clear(),
};

/**
 * Hook สำหรับใช้งาน Toast ภายใน React Component
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastManager.subscribe((currentToasts) => {
      setToasts(currentToasts);
    });
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => toastManager.remove(id),
  };
}
