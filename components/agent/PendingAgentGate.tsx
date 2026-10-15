'use client';

/**
 * ==============================================================================
 * [SEARCH: PENDING_AGENT_GATE] [UI: หน้าจอนายหน้ารออนุมัติ/ตีกลับ KYC]
 * หน้าจอปิดกั้นนายหน้าที่รออนุมัติ KYC หรือถูกตีกลับเอกสาร
 * /components/agent/PendingAgentGate.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. ป้องกันไม่ให้นายหน้าที่ยังไม่ผ่าน KYC ใช้งานฟังก์ชันภายใน
 * 2. แสดงสถานะจริง (รอตรวจสอบ / ถูกปฏิเสธ / อนุมัติแล้ว) แบบไดนามิก
 * 3. หากเอกสารไม่ผ่าน (Rejected) แสดงเหตุผลชัดเจน และมีช่องให้อัปโหลดเอกสารใหม่ได้ทันที
 * 4. หากกำลังรอ (Pending) มีปุ่มตรวจสอบสถานะล่าสุด และสามารถเปลี่ยนเอกสารได้
 * 5. ปฏิบัติตามกฎเหล็ก: ใช้ Lucide React ทั้งหมด ไม่ใช้อิโมจิดิบ หรือ raw SVG
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  RefreshCw, 
  LogOut, 
  FileText, 
  ArrowRight,
  Loader2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface UserProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  kycDoc: string | null;
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at?: string;
}

export default function PendingAgentGate() {
  const { update: updateSession } = useSession();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  // การอัปโหลดเอกสารใหม่
  const [uploading, setUploading] = useState(false);
  const [showReupload, setShowReupload] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // โหลดสถานะตอนเริ่มต้น
  useEffect(() => {
    let ignore = false;

    async function loadStatus() {
      try {
        const [profileRes, notifRes] = await Promise.all([
          fetch('/api/user/profile', { cache: 'no-store' }),
          fetch('/api/notifications?limit=10', { cache: 'no-store' })
        ]);

        if (!ignore && profileRes.ok) {
          const data = await profileRes.json();
          if (data.user) {
            setProfile(data.user);
            if (data.user.status === 'approved') {
              await updateSession();
              window.location.href = '/agent/dashboard';
              return;
            }
          }
        }

        if (!ignore && notifRes.ok) {
          const data = await notifRes.json();
          const notifs: NotificationItem[] = data.notifications || [];
          const kycRejectNotif = notifs.find(n => 
            n.type === 'kyc' && (n.content?.includes('ไม่ผ่าน') || n.title?.includes('ไม่ผ่าน'))
          );
          if (kycRejectNotif) {
            setRejectReason(kycRejectNotif.content);
          }
        }
      } catch (err) {
        console.error('Error fetching KYC status:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadStatus();
    return () => {
      ignore = true;
    };
  }, [updateSession]);

  // ฟังก์ชันรีเฟรชข้อมูลด้วยตนเอง (Manual Refresh)
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const [profileRes, notifRes] = await Promise.all([
        fetch('/api/user/profile', { cache: 'no-store' }),
        fetch('/api/notifications?limit=10', { cache: 'no-store' })
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.user) {
          setProfile(data.user);
          if (data.user.status === 'approved') {
            await updateSession();
            toast.success('บัญชีของคุณได้รับการอนุมัติแล้ว!');
            window.location.href = '/agent/dashboard';
            return;
          }
        }
      }

      if (notifRes.ok) {
        const data = await notifRes.json();
        const notifs: NotificationItem[] = data.notifications || [];
        const kycRejectNotif = notifs.find(n => 
          n.type === 'kyc' && (n.content?.includes('ไม่ผ่าน') || n.title?.includes('ไม่ผ่าน'))
        );
        if (kycRejectNotif) {
          setRejectReason(kycRejectNotif.content);
        }
      }

      toast.success('อัปเดตสถานะล่าสุดแล้ว');
    } catch (err) {
      console.error('Error refreshing KYC status:', err);
      toast.error('ตรวจสอบสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setRefreshing(false);
    }
  };

  // จัดการอัปโหลดเอกสาร KYC ใหม่
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) หรือไฟล์ PDF');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // 1. ส่งไฟล์ไปยัง /api/upload
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'อัปโหลดไฟล์ไม่สำเร็จ');
      }

      // 2. ส่ง URL เอกสารไปอัปเดตที่ /api/user/profile (ซึ่งจะปรับสถานะกลับเป็น pending อัตโนมัติ)
      const updateRes = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycDoc: uploadData.url })
      });
      const updateResult = await updateRes.json();

      if (!updateRes.ok) {
        throw new Error(updateResult.error || 'บันทึกเอกสารไม่สำเร็จ');
      }

      toast.success('ส่งเอกสาร KYC ใหม่เรียบร้อยแล้ว! ทีมงานจะตรวจสอบใหม่อีกครั้ง');
      setShowReupload(false);
      setRejectReason(null);
      // โหลดสถานะใหม่
      await handleManualRefresh();
      await updateSession();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'เกิดข้อผิดพลาดในการส่งเอกสาร');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const isRejected = profile?.status === 'rejected';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-xs font-bold text-slate-500">กำลังตรวจสอบสถานะบัญชีของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6 text-center">
        
        {/* ไอคอนหลักแสดงสถานะ */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
          isRejected 
            ? 'bg-rose-100 text-rose-600 shadow-rose-200' 
            : 'bg-amber-100 text-amber-600 shadow-amber-200'
        }`}>
          {isRejected ? (
            <AlertTriangle className="w-8 h-8 stroke-[2.25]" />
          ) : (
            <Clock className="w-8 h-8 stroke-[2.25]" />
          )}
        </div>

        {/* หัวข้อและคำอธิบาย */}
        <div className="space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            isRejected 
              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isRejected ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>เอกสารไม่ผ่านการอนุมัติ</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>อยู่ระหว่างการตรวจสอบ KYC</span>
              </>
            )}
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {isRejected ? 'เอกสารยืนยันตัวตนจำเป็นต้องแก้ไข' : 'บัญชีนายหน้าอยู่ระหว่างการตรวจสอบ'}
          </h1>

          <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
            {isRejected 
              ? 'ทีมงานได้ตรวจสอบเอกสารยืนยันตัวตนของคุณแล้ว พบข้อบกพร่องตามรายละเอียดด้านล่าง กรุณาอัปโหลดเอกสารใหม่เพื่อส่งเข้าคิวตรวจอีกครั้ง'
              : 'ทีมงานจะใช้เวลาตรวจสอบเอกสาร KYC ประมาณ 1-2 วันทำการ เพื่อความปลอดภัยและมาตรฐานของระบบ ฟังก์ชันจัดการประกาศจะเปิดใช้งานทันทีเมื่อผ่านการอนุมัติ'}
          </p>
        </div>

        {/* กล่องแสดงเหตุผลการปฏิเสธ (กรณี Rejected) */}
        {isRejected && (
          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>เหตุผลที่เอกสารไม่ผ่าน:</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed font-medium">
              {rejectReason || 'ภาพถ่ายเอกสารไม่ชัดเจน ข้อมูลไม่ครบถ้วน หรือข้อมูลไม่ตรงกับบัตรประจำตัวประชาชน'}
            </p>
            <p className="text-[11px] text-rose-600 font-bold pt-1 border-t border-rose-200/60">
              คำแนะนำ: ควรถ่ายภาพบัตรประชาชนหรือใบอนุญาตนายหน้าให้เห็นตัวอักษรและรูปถ่ายชัดเจน ไม่เบลอ และไม่สะท้อนแสง
            </p>
          </div>
        )}

        {/* ข้อมูลเอกสารปัจจุบัน & กล่องอัปโหลดใหม่ */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">เอกสารยืนยันตัวตน (KYC):</span>
            {profile?.kycDoc ? (
              <a 
                href={profile.kycDoc} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ดูเอกสารที่ยื่นไว้</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-400 font-medium">ยังไม่ได้อัปโหลด</span>
            )}
          </div>

          {/* ปุ่มหรือฟอร์มอัปโหลดใหม่ */}
          {(!profile?.kycDoc || isRejected || showReupload) ? (
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <label className="block text-xs font-extrabold text-slate-800">
                {isRejected ? 'อัปโหลดเอกสารฉบับแก้ไขใหม่:' : 'เลือกไฟล์เอกสารใหม่:'}
              </label>

              <input
                type="file"
                id="reupload-kyc-input"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => document.getElementById('reupload-kyc-input')?.click()}
                disabled={uploading}
                className="w-full py-3 px-4 bg-white border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:bg-amber-50/50 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    <span>กำลังอัปโหลดเอกสารและบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>คลิกเพื่อเลือกไฟล์เอกสาร (JPG, PNG หรือ PDF ไม่เกิน 5MB)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">ต้องการส่งเอกสารใหม่แทนฉบับเดิม?</span>
              <button
                type="button"
                onClick={() => setShowReupload(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                เปลี่ยนเอกสาร
              </button>
            </div>
          )}
        </div>

        {/* ขั้นตอนการดำเนินงาน (Timeline) */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="font-black text-emerald-800">1. ส่งข้อมูลสมัคร</p>
            <p className="text-[10px] text-emerald-600">สำเร็จแล้ว</p>
          </div>
          <div className={`border rounded-xl p-2.5 text-center ${
            isRejected 
              ? 'bg-rose-50 border-rose-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            {isRejected ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 mx-auto mb-1" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1 animate-pulse" />
            )}
            <p className={`font-black ${isRejected ? 'text-rose-800' : 'text-amber-800'}`}>
              2. ตรวจสอบ KYC
            </p>
            <p className={`text-[10px] ${isRejected ? 'text-rose-600' : 'text-amber-600'}`}>
              {isRejected ? 'ต้องส่งใหม่' : 'กำลังดำเนินการ'}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center opacity-60">
            <ArrowRight className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <p className="font-black text-slate-700">3. เริ่มงานนายหน้า</p>
            <p className="text-[10px] text-slate-500">รออนุมัติ</p>
          </div>
        </div>

        {/* ปุ่มการจัดการด้านล่าง */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'กำลังตรวจสอบสถานะ...' : 'รีเฟรชตรวจสอบสถานะล่าสุด'}</span>
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login/agent' })}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>ออกจากระบบ</span>
          </button>
        </div>

        {/* ติดต่อเจ้าหน้าที่ */}
        <p className="text-[11px] text-slate-400 font-medium">
          หากมีข้อสงสัยหรือต้องการความช่วยเหลือเร่งด่วน ติดต่อฝ่ายสนับสนุน LINE: @srichai
        </p>

      </div>
    </div>
  );
}
