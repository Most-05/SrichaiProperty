'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // ใช้เช็คหน้าปัจจุบันเพื่อไฮไลต์เมนูที่กำลังเปิดอยู่
import { signOut } from 'next-auth/react'; // ใช้ออกจากระบบเมื่อกดปุ่มออกจากระบบในแถบเมนู

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [counts, setCounts] = useState({
    pending: 0,
    kyc: 0,
    reports: 0,
    payments: 0
  });

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCounts({
            pending: data.pendingCount || 0,
            kyc: data.kycCount || 0,
            reports: data.reportsCount || 0,
            payments: data.paymentsCount || 0
          });
        }
      })
      .catch(err => console.error("Error loading sidebar counts:", err));
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Top Header Bar (< lg) */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-[#0f172a] text-white border-b border-slate-800 px-4 flex items-center justify-between z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/30">
            S
          </div>
          <div>
            <h1 className="text-white font-extrabold text-sm tracking-tight leading-none">
              SrichaiAdmin
            </h1>
            <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-wider mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              System Online
            </span>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          aria-label="สลับเมนูแอดมิน"
        >
          {isMobileOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[90]"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between shrink-0 shadow-xl fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-[95] transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-5 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Logo Header & Mobile Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/20">
                S
              </div>
              <div>
                <h1 className="text-white font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  SrichaiAdmin
                </h1>
                <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  System Online
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="ปิดเมนู"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <Link 
            href="/" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-blue-500/20 active:scale-[0.98] text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>เปิดหน้าเว็บไซต์หลัก</span>
          </Link>

          <nav className="space-y-6 pt-3 text-xs">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2.5">ภาพรวม</span>
              <Link
                href="/admin/dashboard"
                onClick={() => setIsMobileOpen(false)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-bold transition-all text-left ${
                  isActive('/admin/dashboard') ? 'bg-slate-800 text-white shadow-inner' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>แดชบอร์ดหลัก</span>
              </Link>

              <Link
                href="/admin/analytics"
                onClick={() => setIsMobileOpen(false)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-bold transition-all text-left ${
                  isActive('/admin/analytics') ? 'bg-slate-800 text-white shadow-inner' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
                <span>สถิติและรายงาน</span>
              </Link>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2.5">การตรวจสอบ (Moderation)</span>
              
              <Link 
                href="/admin/moderation" 
                onClick={() => setIsMobileOpen(false)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left font-semibold ${
                  isActive('/admin/moderation') ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>ประกาศอสังหาฯ</span>
                </span>
                {counts.pending > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">
                    {counts.pending}
                  </span>
                )}
              </Link>

              <Link 
                href="/admin/kyc" 
                onClick={() => setIsMobileOpen(false)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left font-semibold ${
                  isActive('/admin/kyc') ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>ยืนยันตัวตนนายหน้า (KYC)</span>
                </span>
                {counts.kyc > 0 && (
                  <span className="bg-amber-500 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">
                    {counts.kyc}
                  </span>
                )}
              </Link>

              <Link 
                href="/admin/reports" 
                onClick={() => setIsMobileOpen(false)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left font-semibold ${
                  isActive('/admin/reports') ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>รายงานปัญหา (Reports)</span>
                </span>
                {counts.reports > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">
                    {counts.reports}
                  </span>
                )}
              </Link>

              <Link 
                href="/admin/payments" 
                onClick={() => setIsMobileOpen(false)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left font-semibold ${
                  isActive('/admin/payments') ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <span>รายการชำระเงิน (PRO)</span>
                </span>
                {counts.payments > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">
                    {counts.payments}
                  </span>
                )}
              </Link>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2.5">การจัดการผู้ใช้งาน</span>
              <Link 
                href="/admin/users" 
                onClick={() => setIsMobileOpen(false)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left font-semibold ${
                  isActive('/admin/users') ? 'bg-slate-800 text-white font-bold shadow-inner' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>จัดการผู้ใช้งาน</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center shadow-inner">
              A
            </div>
            <div>
              <p className="text-white font-black text-xs">Admin Root</p>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Super Administrator</p>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer flex items-center gap-1" 
            title="ออกจากระบบ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
