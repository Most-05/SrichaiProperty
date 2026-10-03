'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusher-client';
import { notificationChannelName } from '@/lib/notificationChannel';
import { toast } from '@/components/ui/toast';
import {
  Bell,
  CheckCheck,
  X,
  Calendar,
  MessageSquare,
  Home,
  CreditCard,
  Info,
  ShieldCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import NotificationModal, { NotificationItem } from './NotificationModal';
import { formatNotification } from '@/lib/notifications';

interface NotificationBellProps {
  theme?: 'light' | 'dark' | 'auto';
  align?: 'left' | 'right';
  className?: string;
}

// คืนค่าไอคอนและสีตามประเภท
function getItemIcon(type: string) {
  if (type.includes('appointment')) return <Calendar className="w-4 h-4 text-blue-600" />;
  if (type === 'payment' || type === 'package') return <CreditCard className="w-4 h-4 text-purple-600" />;
  if (type.includes('property')) return <Home className="w-4 h-4 text-emerald-600" />;
  if (type === 'chat') return <MessageSquare className="w-4 h-4 text-amber-600" />;
  if (type === 'kyc') return <ShieldCheck className="w-4 h-4 text-teal-600" />;
  if (type === 'reject' || type === 'report') return <AlertCircle className="w-4 h-4 text-rose-600" />;
  return <Info className="w-4 h-4 text-slate-500" />;
}

// แปลงเวลาแบบง่าย
function formatRelativeTime(dateStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'เมื่อสักครู่';
    if (diff < 60) return `${diff} น.ที่แล้ว`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} ชม.ที่แล้ว`;
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function NotificationBell({
  theme = 'auto',
  align = 'right',
  className = ''
}: NotificationBellProps) {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  // โหลดข้อมูลการแจ้งเตือน
  const loadNotifications = useCallback(() => {
    if (status !== 'authenticated') return;
    fetch('/api/notifications?limit=30')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(err => console.error('Fetch notifications error:', err));
  }, [status]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // เชื่อมต่อ Pusher แบบ Real-time
  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(notificationChannelName(userId));

    channel.bind('new-notification', (item: NotificationItem) => {
      setNotifications(prev => [item, ...prev].slice(0, 30));
      setUnreadCount(prev => prev + 1);
      toast.info(item.content, { title: item.title, duration: 5000 });
    });

    channel.bind('notifications-changed', loadNotifications);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(notificationChannelName(userId));
    };
  }, [status, userId, loadNotifications]);

  // ปิดเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ทำเครื่องหมายอ่านแล้ว / ยังไม่อ่าน
  const markAsRead = (id?: string, isRead: boolean = true) => {
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { notificationId: id, isRead } : { markAll: true })
    }).then(() => {
      if (id) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead } : n))
        );
        setSelectedNotification(prev => (prev && prev.id === id ? { ...prev, isRead } : prev));
        setUnreadCount(v => (isRead ? Math.max(0, v - 1) : v + 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setSelectedNotification(prev => (prev ? { ...prev, isRead: true } : prev));
        setUnreadCount(0);
      }
    });
  };

  // ลบการแจ้งเตือน
  const deleteNotification = (id: string) => {
    const isUnread = notifications.find(n => n.id === id)?.isRead === false;
    fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id })
    }).then(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (isUnread) setUnreadCount(v => Math.max(0, v - 1));
    });
  };

  // กรองตามแท็บ
  const displayList = useMemo(() => {
    return tab === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  }, [notifications, tab]);

  if (status !== 'authenticated') return null;

  // คลาสสไตล์ปุ่มกระดิ่งตาม theme
  const buttonStyle =
    theme === 'dark'
      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
      : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100';

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* ปุ่มกระดิ่ง */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${buttonStyle}`}
        aria-label="การแจ้งเตือน"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-black items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* กล่องรายการแจ้งเตือน Popover */}
      {open && (
        <div
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden text-left animate-in fade-in-50 zoom-in-95 duration-100`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-xs">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-blue-600 px-1.5 py-0.2 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAsRead()}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
          </div>

          {/* แท็บตัวกรอง */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setTab('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                tab === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ทั้งหมด ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('unread')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                tab === 'unread' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>ยังไม่อ่าน</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* รายการแจ้งเตือน */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {displayList.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-medium">
                ไม่มีการแจ้งเตือน
              </div>
            ) : (
              displayList.map(n => {
                const formatted = formatNotification(n);
                const isUnread = !n.isRead;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id, true);
                      setSelectedNotification(n);
                      setOpen(false);
                    }}
                    className={`p-3.5 transition cursor-pointer flex items-start gap-3 relative group ${
                      isUnread
                        ? 'border-l-4 border-l-blue-600 bg-blue-50/60 hover:bg-blue-100/70'
                        : 'border-l-4 border-l-transparent bg-white hover:bg-slate-50 opacity-90'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs shrink-0 mt-0.5">
                      {getItemIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 animate-pulse" />
                          )}
                          <h4 className={`text-xs truncate ${isUnread ? 'font-black text-slate-950' : 'font-semibold text-slate-700'}`}>
                            {formatted.displayTitle}
                          </h4>
                        </div>
                        <span className={`text-[10px] shrink-0 ${isUnread ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>

                      <p className={`text-[11px] line-clamp-2 leading-relaxed ${isUnread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                        {formatted.displayContent}
                      </p>
                    </div>

                    {/* ปุ่มลบ */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                      title="ลบ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* ท้ายกล่อง: ลิงก์ไปยังหน้าจอใหญ่ */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex flex-col gap-1 text-center">
            <Link
              href={
                session?.user?.role === 'admin'
                  ? '/admin/notifications'
                  : session?.user?.role === 'agent'
                    ? '/agent/notifications'
                    : '/notifications'
              }
              onClick={() => setOpen(false)}
              className="w-full py-2 px-3 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200 text-xs flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <span>เปิดดูการแจ้งเตือนทั้งหมด (หน้าจอใหญ่)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* หน้าต่างป๊อปอัปจอใหญ่ แสดงเนื้อหาฉบับเต็ม */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        onDelete={deleteNotification}
        onToggleRead={(id, isRead) => markAsRead(id, isRead)}
      />
    </div>
  );
}
