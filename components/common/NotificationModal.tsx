'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  X,
  Trash2,
  Calendar,
  MessageSquare,
  Home,
  CreditCard,
  Info,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import {
  NotificationItem,
  formatNotification,
  formatNotificationTime
} from '@/lib/notifications';

export type { NotificationItem };

interface NotificationModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onToggleRead?: (id: string, isRead?: boolean) => void;
}

function getIcon(categoryKey: string) {
  switch (categoryKey) {
    case 'appointment':
      return <Calendar className="w-4 h-4 text-blue-600 shrink-0" />;
    case 'payment':
      return <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />;
    case 'property':
      return <Home className="w-4 h-4 text-emerald-600 shrink-0" />;
    case 'chat':
      return <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'kyc':
      return <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />;
    case 'alert':
      return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
    default:
      return <Info className="w-4 h-4 text-slate-600 shrink-0" />;
  }
}

const emptySubscribe = () => () => {};

export default function NotificationModal({
  notification,
  isOpen,
  onClose,
  onDelete,
  onToggleRead
}: NotificationModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // ปิดด้วยปุ่ม Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !notification || !mounted) return null;

  const formatted = formatNotification(notification);
  const time = formatNotificationTime(notification.createdAt);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden text-left animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* หัวโมดอล */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/90">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${formatted.category.badgeClass}`}>
              {getIcon(formatted.category.key)}
              <span>{formatted.category.label}</span>
            </span>

            {/* ป้ายแสดงสถานะอ่าน/ยังไม่อ่าน */}
            {!notification.isRead ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                ยังไม่ได้อ่าน
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>อ่านแล้ว</span>
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium ml-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{time.full}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* เนื้อหาข้อความ */}
        <div className="p-6 overflow-y-auto space-y-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {formatted.displayTitle}
          </h3>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
            {formatted.displayContent}
          </div>

          {/* รายละเอียดเพิ่มเติม (กรณีเป็นธุรกรรมหรือข้อมูลเชิงสรุป) */}
          {formatted.details.length > 0 && (
            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 space-y-2 text-xs">
              <p className="font-extrabold text-purple-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>ข้อมูลสรุปเพิ่มเติม:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formatted.details.map((d, i) => (
                  <div key={i} className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-2xs">
                    <span className="text-slate-400 font-medium block text-[10px]">{d.label}</span>
                    <span className="font-bold text-slate-800 break-all">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {onToggleRead && !notification.isRead && (
              <button
                type="button"
                onClick={() => onToggleRead(notification.id, true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>ทำเครื่องหมายว่าอ่านแล้ว</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(notification.id);
                  onClose();
                }}
                className="text-xs text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1.5 transition cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              ปิดหน้าต่าง
            </button>

            {notification.linkUrl && (
              <Link
                href={notification.linkUrl}
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>ไปยังหน้าที่เกี่ยวข้อง</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
