'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // ใช้แสดงรูปโปรไฟล์ผู้ใช้
import { signOut } from 'next-auth/react'; // ใช้ออกจากระบบเมื่อกดปุ่มออกจากระบบในแถบข้าง

interface ProfileSidebarProps {
  userDisplayName: string;
  email: string;
  avatarUrl: string;
  favoritesCount: number;
  appointmentsCount: number;
  isVerified?: boolean;
  isUploadingAvatar?: boolean;
  onAvatarChange?: (file: File) => void;
}

export default function ProfileSidebar({
  userDisplayName,
  email,
  avatarUrl,
  favoritesCount,
  appointmentsCount,
  isVerified = false,
  isUploadingAvatar = false,
  onAvatarChange,
}: ProfileSidebarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarChange) {
      onAvatarChange(file);
    }
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-6">
        {/* User Profile Summary */}
        <div className="text-center space-y-2.5">
          <div className="relative inline-block group">
            <Image 
              src={avatarUrl} 
              alt="Profile" 
              width={88} 
              height={88} 
              className="w-22 h-22 rounded-full object-cover border-2 border-slate-100 shadow-sm mx-auto" 
              unoptimized
            />
            {/* ปุ่มกดอัปโหลดรูปโปรไฟล์ใหม่ */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/jpeg,image/png,image/webp,image/gif" 
              className="hidden" 
            />
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-md border-2 border-white transition transform active:scale-95 cursor-pointer disabled:opacity-60"
              title="เปลี่ยนรูปโปรไฟล์"
            >
              {isUploadingAvatar ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>
          </div>

          <div>
            <h2 className="font-extrabold text-slate-900 text-sm">{userDisplayName}</h2>
            <p className="text-slate-400 text-[11px] font-mono mt-0.5">{email}</p>
          </div>

          {/* ป้ายสถานะการยืนยันตัวตน */}
          <div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> บัญชียืนยันแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> สมาชิกทั่วไป
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 text-xs">
          <Link 
            href="/profile" 
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl border border-blue-100/60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            ข้อมูลส่วนตัว
          </Link>

          <Link 
            href="/saved-properties" 
            className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              บ้านที่บันทึกไว้
            </div>
            {favoritesCount > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{favoritesCount}</span>
            )}
          </Link>

          <Link 
            href="/appointments" 
            className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              การนัดหมายเข้าชม
            </div>
            {appointmentsCount > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{appointmentsCount}</span>
            )}
          </Link>

          {/* ลิงก์ไปยังหน้ากล่องข้อความแชทกับนายหน้า */}
          <Link 
            href="/chat" 
            className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              กล่องข้อความ / แชท
            </div>
          </Link>

          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition text-left font-medium mt-4 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ออกจากระบบ
          </button>
        </nav>
      </div>
    </aside>
  );
}
