'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import PendingApprovalBanner from '@/components/agent/PendingApprovalBanner';
import { FREE_LISTING_QUOTA } from '@/lib/constants';

interface AppointmentData {
  id: string;
  status: 'completed' | 'pending';
  date: string;
  time: string;
  propertyTitle: string;
  customerName: string;
  customerPhone: string;
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function HomeGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export default function AgentHomePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentDate, setCurrentDate] = useState('');
  const [dbData, setDbData] = useState<{
    propertiesCount: number;
    pendingAptsCount: number;
    pendingApprovalCount?: number;
    isPro?: boolean;
    totalViews: number;
    pendingChatCount: number;
    appointments: AppointmentData[];
    lowSlotProperties?: { propertyId: string; title: string; remainingSlots: number; lastAvailableDate: string | null; nextAvailableDate?: string | null }[];
  } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const now = new Date();
    const formattedDate = `${days[now.getDay()]}ที่ ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.)`;

    const timer = setTimeout(() => {
      setCurrentDate(formattedDate);
    }, 0);

    if (status === 'authenticated') {
      fetch('/api/agent/portal?type=home')
        .then(res => res.json())
        .then(data => setDbData(data))
        .catch(err => {
          console.error('Error fetching home data:', err);
          setLoadError(true);
        })
        .finally(() => setIsLoadingData(false));
    }

    return () => clearTimeout(timer);
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // type ของ session.user.status ประกาศไว้ที่ types/next-auth.d.ts แล้ว ไม่ต้อง cast เอง
  if (session?.user?.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md space-y-4">
          <div className="flex items-center justify-center">
            <ClockIcon className="w-9 h-9" />
          </div>
          <h1 className="text-lg font-black">บัญชีอยู่ระหว่างการตรวจสอบ</h1>
          <p className="text-xs text-slate-500">ทีมงานกำลังตรวจสอบข้อมูลของคุณ เมื่อเรียบร้อยจะแจ้งให้ทราบทันที</p>
          <button onClick={() => signOut({ callbackUrl: '/login/agent' })} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl">ออกจากระบบ</button>
        </div>
      </div>
    );
  }

  const appointments = dbData?.appointments || [];
  const pendingAptsList = appointments.filter(a => a.status === 'pending');
  const completedAptsList = appointments.filter(a => a.status === 'completed');
  const filteredApts = (
    activeTab === 'pending' ? pendingAptsList :
    activeTab === 'completed' ? completedAptsList :
    appointments
  ).slice(0, 5);

  const pendingApprovalCount = dbData?.pendingApprovalCount || 0;
  const pendingChatCount = dbData?.pendingChatCount || 0;
  const lowSlotProperties = dbData?.lowSlotProperties || [];

  // "2026-11-01" -> "1 พ.ย. 2569" (หน้านี้ยังไม่มีตัวจัดรูปแบบวันที่ จึงเขียนไว้ตรงนี้)
  const MONTH_ABBR_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const formatDateTH = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    if (!y || !m || !d) return key;
    return `${d} ${MONTH_ABBR_TH[m - 1]} ${y + 543}`;
  };

  // อีกกี่วันจะถึงวันนั้น อ่านวันที่จากเวลาเครื่อง ไม่ใช้ toISOString() (จะได้วันตามโซน UTC)
  const daysFromToday = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  };

  return (
    <div className="pt-6 sm:pt-8 min-h-screen bg-slate-50/50 text-slate-800 text-xs md:text-sm font-sans antialiased">
      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 text-left">

        {/* Banner แจ้งเตือนรออนุมัติ */}
        <PendingApprovalBanner pendingCount={pendingApprovalCount} />

        {/* แถบเตือนวันว่างใกล้หมดหน้าแรก */}
        {lowSlotProperties.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-black text-amber-800 text-xs">
                วันว่างเข้าชมใกล้หมดแล้ว {lowSlotProperties.length} ประกาศ
              </h3>
            </div>
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              ลูกค้าจะจองเข้าชมไม่ได้ถ้าไม่มีรอบว่างเหลือ แนะนำให้เปิดวันว่างเพิ่ม
            </p>
            <ul className="space-y-1.5">
              {lowSlotProperties.map((p) => (
                <li key={p.propertyId} className="flex items-center justify-between gap-3 bg-white border border-amber-100 rounded-xl px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold text-slate-800 line-clamp-1">{p.title}</p>
                    <p className="text-[10px] font-bold text-amber-600">
                      {p.remainingSlots > 0
                        ? `เหลือ ${p.remainingSlots} รอบ (ถึง ${formatDateTH(p.lastAvailableDate!)})`
                        : p.nextAvailableDate
                          // มีรอบว่างอยู่ แต่ไกลเกินช่วงที่ลูกค้าจองกันจริง — ต้องบอกให้ชัด ไม่ใช่เหมาว่า "ไม่เหลือแล้ว"
                          ? `เดือนนี้ลูกค้าจองไม่ได้ — รอบถัดไป ${formatDateTH(p.nextAvailableDate)} (อีก ${daysFromToday(p.nextAvailableDate)} วัน)`
                          : 'ยังไม่มีรอบว่างให้จองเลย'}
                    </p>
                  </div>
                  <Link
                    href={`/agent/schedule?propertyId=${p.propertyId}`}
                    className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] transition shadow-xs"
                  >
                    เปิดวันว่างเพิ่ม
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Welcome Header */}
        <section className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-900/10 space-y-2">
          <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 inline-flex items-center gap-1.5 w-fit">
            <CalendarIcon className="w-3 h-3" /> {currentDate}
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">สวัสดีคุณ{session?.user?.name?.split(' ')[0] || 'นายหน้า'}</h2>
          <p className="text-white/80 text-xs leading-relaxed max-w-xl">
            ยินดีต้อนรับสู่ศูนย์บัญชาการนายหน้าศรีชัยพรอพเพอร์ตี้ ตรวจสอบรายการคิวนัดหมายและตอบแชทลูกค้าได้ทันที
          </p>
        </section>

        {/* 4 Cards สถิติตัวเลขหลัก */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link href="/agent/dashboard" className="bg-white hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-slate-300 shadow-2xs hover:shadow-md transition block">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ประกาศทั้งหมด</span>
            <strong className="text-xl font-black text-slate-900 block mt-1">{dbData?.propertiesCount || 0} รายการ</strong>
          </Link>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ยอดเข้าชมรวม</span>
            <strong className="text-xl font-black text-slate-900 block mt-1">{(dbData?.totalViews || 0).toLocaleString()} ครั้ง</strong>
          </div>
          <Link href="/agent/chat" className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-slate-100 hover:border-emerald-400 shadow-2xs hover:shadow-md transition block">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">แชทที่รอตอบ</span>
            <strong className={`text-xl font-black block mt-1 ${pendingChatCount > 0 ? 'text-red-500' : 'text-slate-900'}`}>{pendingChatCount} รายการ</strong>
          </Link>
          <Link href="/agent/upgrade" className="bg-white hover:bg-amber-50/50 rounded-2xl p-4 border border-slate-100 hover:border-amber-400 shadow-2xs hover:shadow-md transition block group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">โควต้าลงประกาศ</span>
              <span className="text-[10px] font-black text-amber-600 group-hover:underline flex items-center gap-1">
                อัปเกรด PRO
                <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
            <div className="text-xl font-black text-amber-600 block mt-1">
              {dbData?.isPro ? (
                <span className="inline-flex items-center gap-1.5">
                  <span>ไม่จำกัด</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold uppercase">PRO</span>
                </span>
              ) : (
                `${Math.max(0, FREE_LISTING_QUOTA - (dbData?.propertiesCount || 0))} / ${FREE_LISTING_QUOTA}`
              )}
            </div>
          </Link>
        </section>

        {/* ตารางนัดหมายพาลูกค้าชมบ้าน (Single Column Full Width Layout) */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" /> ตารางนัดหมายพาลูกค้าชมบ้าน
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">รายการคิวนัดหมายจากฐานข้อมูลเรียลไทม์</p>
            </div>
            <Link href="/agent/appointments" className="text-blue-600 font-bold text-xs hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>

          {/* สวิตช์แถบกรอง */}
          <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex gap-2">
            <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>ทั้งหมด ({appointments.length})</button>
            <button onClick={() => setActiveTab('pending')} className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>รอนัดพบ ({pendingAptsList.length})</button>
            <button onClick={() => setActiveTab('completed')} className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'completed' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>เสร็จสิ้นแล้ว ({completedAptsList.length})</button>
          </div>

          {/* รายการนัดหมาย */}
          <div className="p-5 space-y-3">
            {isLoadingData ? (
              <div className="space-y-3 animate-pulse">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
                ))}
              </div>
            ) : loadError ? (
              <p className="py-10 text-center text-red-400 font-bold">โหลดข้อมูลนัดหมายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
            ) : filteredApts.length === 0 ? (
              <p className="py-10 text-center text-slate-400 font-bold">ไม่มีรายการนัดหมายในขณะนี้</p>
            ) : (
              filteredApts.map(apt => (
                <div key={apt.id} className="p-4 bg-slate-50/70 border border-slate-100 hover:border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700">
                        <CalendarIcon className="w-3 h-3" /> {apt.date || 'ไม่ระบุวัน'} ({apt.time})
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {apt.status === 'completed' ? 'เสร็จสิ้นแล้ว' : 'รอนัดพบ'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <HomeGroupIcon className="w-3.5 h-3.5 text-slate-400" /> {apt.propertyTitle}
                    </h4>
                    <p className="text-slate-600 text-xs font-medium inline-flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" /> ลูกค้า: <strong>{apt.customerName}</strong>
                    </p>
                  </div>

                  {apt.customerPhone ? (
                    <a href={`tel:${apt.customerPhone}`} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs text-center transition shrink-0 shadow-2xs">
                      <PhoneIcon className="w-3.5 h-3.5" /> โทรหา ({apt.customerPhone})
                    </a>
                  ) : (
                    <span className="px-4 py-2 bg-slate-100 text-slate-400 font-black rounded-xl text-xs text-center shrink-0">ไม่มีเบอร์ติดต่อ</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}