'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusher-client';
import { notificationChannelName } from '@/lib/notificationChannel';
import { toast } from '@/components/ui/toast';
import {
  Bell,
  Search,
  CheckCheck,
  CheckCircle2,
  Trash2,
  Calendar,
  MessageSquare,
  Home,
  CreditCard,
  Info,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  ExternalLink,
  Mail
} from 'lucide-react';
import {
  NotificationItem,
  formatNotification,
  formatNotificationTime
} from '@/lib/notifications';
import NotificationModal from '@/components/common/NotificationModal';

interface NotificationCenterViewProps {
  roleTitle?: string;
  roleSubtitle?: string;
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

export default function NotificationCenterView({
  roleTitle = 'ศูนย์การแจ้งเตือน',
  roleSubtitle = 'ตรวจสอบและติดตามประวัติการแจ้งเตือนทั้งหมดของคุณ'
}: NotificationCenterViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search
  const [filter, setFilter] = useState<'all' | 'unread' | 'appointment' | 'payment' | 'property' | 'chat'>('all');
  const [search, setSearch] = useState('');

  // Selected Modal
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Delete Confirm ID
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | 'all' | null>(null);

  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  // ดึงรายการแจ้งเตือนจาก API ครั้งแรกเมื่อเปิดหน้า
  const fetchNotifications = useCallback(() => {
    fetch('/api/notifications?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(err => console.error('Fetch notifications error:', err))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // เชื่อมต่อ Pusher แบบ Real-time บนหน้าศูนย์แจ้งเตือนจอใหญ่
  useEffect(() => {
    if (!userId) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(notificationChannelName(userId));

    channel.bind('new-notification', (item: NotificationItem) => {
      setNotifications(prev => [item, ...prev.filter(n => n.id !== item.id)]);
      setUnreadCount(prev => prev + 1);
    });

    channel.bind('notifications-changed', fetchNotifications);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(notificationChannelName(userId));
    };
  }, [userId, fetchNotifications]);

  // รีเฟรชข้อมูลเมื่อผู้ใช้กดปุ่ม
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/notifications?limit=100');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        toast.success('อัปเดตข้อมูลการแจ้งเตือนล่าสุดแล้ว');
      }
    } catch (err) {
      console.error('Refresh error:', err);
      toast.error('ไม่สามารถรีเฟรชข้อมูลได้');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ทำเครื่องหมายอ่านแล้ว
  const markAsRead = async (id?: string, isRead = true) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { notificationId: id, isRead } : { markAll: true })
      });

      if (id) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead } : n))
        );
        setUnreadCount(v => (isRead ? Math.max(0, v - 1) : v + 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('ทำเครื่องหมายอ่านการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึกสถานะ');
    }
  };

  // ลบการแจ้งเตือน
  const deleteItem = async (id?: string, deleteAll = false) => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteAll ? { deleteAll: true } : { notificationId: id })
      });

      if (deleteAll) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('ลบการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว');
      } else if (id) {
        const isUnread = notifications.find(n => n.id === id)?.isRead === false;
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (isUnread) setUnreadCount(v => Math.max(0, v - 1));
        toast.success('ลบการแจ้งเตือนเรียบร้อยแล้ว');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // กรองรายการ
  const filteredList = useMemo(() => {
    return notifications.filter(item => {
      // 1. หมวดหมู่
      if (filter === 'unread' && item.isRead) return false;
      if (filter === 'appointment' && !item.type.includes('appointment') && !item.type.includes('viewing')) return false;
      if (filter === 'payment' && item.type !== 'payment' && item.type !== 'package') return false;
      if (filter === 'property' && !item.type.includes('property') && item.type !== 'approved') return false;
      if (filter === 'chat' && item.type !== 'chat') return false;

      // 2. ค้นหา
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, filter, search]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ========================================================================
       * 1. PAGE HEADER (หัวเรื่อง, สถิติ, ปุ่มอ่านทั้งหมด)
       * ======================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {roleTitle}
              </h1>
              {unreadCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-600 text-white text-xs font-black shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  ยังไม่อ่าน {unreadCount} รายการ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  อ่านครบแล้ว
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {roleSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAsRead()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-sm hover:shadow"
            >
              <CheckCheck className="w-4 h-4 shrink-0" />
              <span>อ่านทั้งหมด ({unreadCount})</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setDeleteConfirmId('all')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-200"
              title="ลบการแจ้งเตือนทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">ลบทั้งหมด</span>
            </button>
          )}
        </div>
      </div>

      {/* ยืนยันการลบทั้งหมด */}
      {deleteConfirmId === 'all' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <span className="font-bold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>คุณแน่ใจหรือไม่ว่าต้องการลบการแจ้งเตือนทั้งหมด ({notifications.length} รายการ)? การกระทำนี้ไม่สามารถย้อนกลับได้</span>
          </span>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => deleteItem(undefined, true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer"
            >
              ยืนยันลบทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
       * 2. SEARCH & FILTER TABS (ตัวกรองหมวดหมู่ และ ค้นหา)
       * ======================================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* ค้นหา */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
          <input
            type="text"
            placeholder="ค้นหาตามหัวข้อ หรือข้อความแจ้งเตือน..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              title="ล้างคำค้นหา"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* แท็บคัดกรอง */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ทั้งหมด ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-blue-600 text-white shadow-sm'
                : unreadCount > 0
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>ยังไม่อ่าน</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${filter === 'unread' ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'}`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilter('appointment')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'appointment'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>นัดหมาย</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('payment')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'payment'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>การเงิน</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('property')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'property'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>ประกาศ</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('chat')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>ข้อความ</span>
          </button>
        </div>
      </div>

      {/* ========================================================================
       * 3. NOTIFICATION CARDS LIST (รายการการแจ้งเตือนแบบอ่านเต็ม สบายตา)
       * ======================================================================== */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">กำลังโหลดข้อมูลการแจ้งเตือน...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          {filter === 'unread' ? (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 text-lg">อ่านครบหมดแล้ว!</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                ไม่มีการแจ้งเตือนที่ค้างอ่านอยู่ในขณะนี้ ทุกอย่างได้รับการอัปเดตเรียบร้อย
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ดูการแจ้งเตือนทั้งหมด
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">ไม่พบการแจ้งเตือนในหมวดนี้</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                {search ? 'ลองเปลี่ยนคำค้นหา หรือเลือกแท็บทั้งหมดเพื่อดูประวัติ' : 'เมื่อมีกิจกรรมใหม่ ระบบจะแจ้งเตือนให้คุณทราบที่นี่'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map(item => {
            const formatted = formatNotification(item);
            const time = formatNotificationTime(item.createdAt);
            const isUnread = !item.isRead;

            return (
              <div
                key={item.id}
                className={`rounded-2xl sm:rounded-3xl border transition shadow-xs hover:shadow-md p-5 sm:p-6 ${
                  isUnread
                    ? 'border-l-[6px] border-l-blue-600 border-blue-200 bg-gradient-to-r from-blue-50/60 via-indigo-50/20 to-white ring-1 ring-blue-500/10'
                    : 'border-l-4 border-l-slate-300 border-slate-200/90 bg-white hover:bg-slate-50/50'
                }`}
              >
                {/* แถวบนสุด: หมวดหมู่, ป้ายสถานะอ่าน/ยังไม่อ่าน, เวลา */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs ${formatted.category.badgeClass}`}>
                      {getIcon(formatted.category.key)}
                      <span>{formatted.category.label}</span>
                    </span>

                    {/* ป้ายแสดงสถานะ อ่านแล้ว vs ยังไม่ได้อ่าน แบบเด่นชัด ไม่สับสน */}
                    {isUnread ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow-xs tracking-wide">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        ยังไม่ได้อ่าน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>อ่านแล้ว</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{time.full}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md">{time.relative}</span>
                  </div>
                </div>

                {/* หัวข้อเรื่อง */}
                <div className="pt-3 pb-2">
                  <h2 className={`text-base sm:text-lg tracking-tight leading-snug ${isUnread ? 'font-black text-slate-950' : 'font-bold text-slate-700'}`}>
                    {formatted.displayTitle}
                  </h2>
                </div>

                {/* เนื้อหาข้อความแบบเต็ม อ่านง่าย ชัดเจน 100% */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text border transition ${
                    isUnread
                      ? 'bg-white border-blue-200/80 text-slate-900 font-medium shadow-2xs'
                      : 'bg-slate-50/80 border-slate-200/60 text-slate-600'
                  }`}
                >
                  {formatted.displayContent}
                </div>

                {/* รายละเอียดสรุป (ถ้ามี) เช่น สลิป ยอดเงิน วันที่ */}
                {formatted.details.length > 0 && (
                  <div className="mt-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl p-4 text-xs space-y-2">
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

                {/* แถบปุ่มดำเนินการด้านล่าง */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  {/* ฝั่งซ้าย: สลับสถานะอ่าน / ลบ */}
                  <div className="flex items-center gap-2">
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id, true)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckCheck className="w-4 h-4 shrink-0 text-blue-600" />
                        <span>ทำเครื่องหมายว่าอ่านแล้ว</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id, false)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span>เปลี่ยนเป็นยังไม่อ่าน</span>
                      </button>
                    )}

                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 animate-in fade-in">
                        <span className="text-[11px] font-bold text-rose-800">ลบรายการนี้?</span>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          ลบ
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1.5"
                        title="ลบการแจ้งเตือนนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>ลบ</span>
                      </button>
                    )}
                  </div>

                  {/* ฝั่งขวา: ป๊อปอัป / ไปยังหน้าที่เกี่ยวข้อง */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNotification(item)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>ขยายดูป๊อปอัป</span>
                    </button>

                    {item.linkUrl && (
                      <Link
                        href={item.linkUrl}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>ไปยังหน้าที่เกี่ยวข้อง</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* โมดอลป๊อปอัปจอใหญ่ (ถ้าผู้ใช้กดขยายดู) */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        onDelete={id => deleteItem(id)}
        onToggleRead={(id, isRead) => markAsRead(id, isRead)}
      />
    </div>
  );
}
