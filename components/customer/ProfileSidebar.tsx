'use client';

/**
 * ==============================================================================
 * [SEARCH: CUSTOMER_PROFILE_SIDEBAR] [UI: แถบโปรไฟล์และสถิติลูกค้า] [STYLE: PROFILE_SIDEBAR_CARD]
 * แถบโปรไฟล์และสถิติผู้ใช้งานฝั่งลูกค้า (Customer Profile Sidebar Component)
 * /components/customer/ProfileSidebar.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. แสดงรูปประจำตัวพร้อมปุ่มอัปโหลดรูปใหม่, ชื่อ-นามสกุล, อีเมล, ป้ายยืนยันตัวตน
 * 2. แสดงตัวเลขสรุป รายการโปรด (Favorites) และประวัตินัดหมาย (Appointments)
 * 3. ปุ่มเมนูนำทางด่วนและปุ่มออกจากระบบ (Sign Out)
 * ==============================================================================
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // ใช้แสดงรูปโปรไฟล์ผู้ใช้
import { signOut } from 'next-auth/react'; // ใช้ออกจากระบบเมื่อกดปุ่มออกจากระบบในแถบข้าง
import { Camera, User, Heart, Calendar, MessageSquare, LogOut } from 'lucide-react';

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
                <Camera className="w-3.5 h-3.5" />
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
            <User className="w-4 h-4 shrink-0" />
            ข้อมูลส่วนตัว
          </Link>

          <Link 
            href="/saved-properties" 
            className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-slate-400 shrink-0" />
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
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
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
              <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
              กล่องข้อความ / แชท
            </div>
          </Link>

          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition text-left font-medium mt-4 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            ออกจากระบบ
          </button>
        </nav>
      </div>
    </aside>
  );
}
