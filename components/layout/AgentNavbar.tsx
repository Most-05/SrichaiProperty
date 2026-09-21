'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import NotificationBell from '@/components/common/NotificationBell';

export default function AgentNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const userFullName = session?.user?.name || "สมชาย นายหน้าดี";
  const userImage = session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=1e40af&color=fff`;

  const navLinkClass = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    const base = "text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-150";

    if (isActive) {
      return `${base} bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20`;
    }
    return `${base} text-slate-300 hover:bg-amber-500/15 active:bg-amber-500/25`;
  };

  const navLinks = [
    {
      href: '/agent/home',
      label: 'หน้าหลักนายหน้า',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      )
    },
    {
      href: '/agent/dashboard',
      label: 'จัดการบ้านของฉัน',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="7" height="7" rx="1.5" />
          <rect x="14" y="4" width="7" height="7" rx="1.5" />
          <rect x="3" y="15" width="7" height="5" rx="1.5" />
          <rect x="14" y="15" width="7" height="5" rx="1.5" />
        </svg>
      )
    },
    {
      href: '/agent/appointments',
      label: 'จัดการคิวนัดหมาย',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )
    },
    {
      href: '/agent/schedule',
      label: 'ตารางวันว่าง',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
        </svg>
      )
    }
  ];

  return (
    <nav className="w-full shrink-0 bg-[#090D16] border-b border-slate-800 text-white shadow-lg relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo */}
        <Link href="/agent/home" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
            S
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            Srichai<span className="text-amber-500">Agent</span>
            <span className="ml-2 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-extrabold px-2 py-0.5 rounded uppercase hidden lg:inline-block">Agent Portal</span>
          </span>
        </Link>

        {/* Desktop Links (>= lg) */}
        <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`${navLinkClass(link.href)} inline-flex items-center gap-1.5`}>
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}

          {/* ปุ่มลงประกาศใหม่ (CTA หลัก) */}
          <Link
            href="/agent/add-property"
            className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition-all duration-150 shadow-md active:scale-95 ml-1 inline-flex items-center gap-1.5 ${
              pathname === '/agent/add-property'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300/50'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>ลงประกาศใหม่</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* Notifications, Profile & Logout */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link 
              href="/agent/profile" 
              title="จัดการโปรไฟล์ของฉัน"
              className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer group"
            >
              <Image
                src={userImage}
                alt="Profile"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-amber-500/40 object-cover group-hover:border-amber-400 transition"
                unoptimized
              />
              <div className="text-left hidden xl:block">
                <p className="text-xs font-bold text-white leading-none group-hover:text-amber-400 transition">{userFullName}</p>
                <p className="text-[9px] text-amber-400 font-bold uppercase mt-0.5">นายหน้าพรีเมียม</p>
              </div>
            </Link>

            <button
              onClick={() => {
                if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
                  signOut({ callbackUrl: '/login/agent' });
                }
              }}
              className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-white font-bold text-xs px-3 py-2 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer"
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>ออก</span>
            </button>
          </div>
        </div>

        {/* Mobile Header Actions (< lg) */}
        <div className="flex items-center gap-2 lg:hidden">
          <NotificationBell />

          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="เปิด/ปิดเมนูนายหน้า"
          >
            {isMobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileOpen && (
        <div className="lg:hidden bg-[#0c121e] border-t border-slate-800/80 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* User Card */}
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={userImage}
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border border-amber-500/50 object-cover"
                unoptimized
              />
              <div>
                <p className="text-xs font-bold text-white">{userFullName}</p>
                <p className="text-[10px] text-amber-400 font-bold uppercase mt-0.5">นายหน้าพรีเมียม</p>
              </div>
            </div>
            <Link
              href="/agent/profile"
              onClick={() => setIsMobileOpen(false)}
              className="text-[11px] bg-slate-800 text-amber-300 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-700 transition"
            >
              โปรไฟล์
            </Link>
          </div>

          {/* Quick CTA */}
          <Link
            href="/agent/add-property"
            onClick={() => setIsMobileOpen(false)}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>ลงประกาศอสังหาฯ ใหม่</span>
          </Link>

          {/* Navigation Items */}
          <div className="space-y-1 pt-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-800 pt-2">
            <button
              onClick={() => {
                setIsMobileOpen(false);
                if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
                  signOut({ callbackUrl: '/login/agent' });
                }
              }}
              className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}