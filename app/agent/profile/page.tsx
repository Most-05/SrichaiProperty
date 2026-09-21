'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';

export default function AgentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', lineId: '',
    newPassword: '', confirmPassword: '', isPro: false, planExpiredAt: null as string | null
  });

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        const u = data?.user || {};
        setForm(prev => ({
          ...prev,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
          phone: u.phone || '',
          lineId: u.lineId || '',
          isPro: Boolean(u.isPro),
          planExpiredAt: u.planExpiredAt || null
        }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      return setMsg({ type: 'err', text: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' });
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName, phone: form.phone, lineId: form.lineId,
          ...(form.newPassword ? { newPassword: form.newPassword } : {})
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ type: 'ok', text: 'บันทึกข้อมูลสำเร็จเรียบร้อยแล้ว' });
        setForm(p => ({ ...p, newPassword: '', confirmPassword: '' }));
      } else {
        setMsg({ type: 'err', text: data.error || 'ไม่สามารถบันทึกข้อมูลได้' });
      }
    } catch {
      setMsg({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('ลบบัญชีถาวรเรียบร้อยแล้ว');
        signOut({ callbackUrl: '/login/agent' });
      } else {
        toast.error(data.error || 'ไม่สามารถลบบัญชีได้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบบัญชี');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            โปรไฟล์นายหน้าและการตั้งค่า
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">จัดการข้อมูลส่วนตัว เบอร์โทรศัพท์ LINE ID และบัญชีของคุณ</p>
        </div>
        <Link href="/agent/home" className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl text-slate-700 transition">
          ← หน้าแรก
        </Link>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'ok' ? (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Card Status & Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Profile Sidebar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center space-y-3">
          <div className="w-16 h-16 bg-amber-500 text-slate-950 font-black text-xl rounded-full flex items-center justify-center mx-auto shadow">
            {form.firstName ? form.firstName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">{form.firstName} {form.lastName}</h3>
            <p className="text-[11px] text-slate-400 font-medium">{form.email}</p>
          </div>
          <div className={`p-2.5 rounded-xl border text-xs font-bold ${form.isPro ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <p className="font-black text-xs flex items-center justify-center gap-1.5">
              {form.isPro && (
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              )}
              <span>{form.isPro ? 'VERIFIED PRO Member' : 'Basic Member'}</span>
            </p>
            <p className="text-[10px] opacity-75 mt-0.5">{form.isPro ? `หมดอายุ: ${form.planExpiredAt ? new Date(form.planExpiredAt).toLocaleDateString('th-TH') : 'ถาวร'}` : 'โควต้าสูงสุด 3 ประกาศ'}</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-xs border-b pb-2 uppercase text-slate-400">ข้อมูลส่วนตัวและช่องทางติดต่อ</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ</label>
              <input type="text" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">นามสกุล</label>
              <input type="text" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">LINE ID <span className="text-emerald-600">(สำหรับปุ่มคุย LINE)</span></label>
              <input type="text" placeholder="เช่น srichai_agent" value={form.lineId} onChange={e => setForm({ ...form, lineId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-none" />
            </div>
          </div>

          <h3 className="font-black text-slate-900 text-xs border-b pb-2 pt-2 uppercase text-slate-400">เปลี่ยนรหัสผ่าน (ถ้าต้องการ)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="password" placeholder="รหัสผ่านใหม่" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 outline-none" />
            <input type="password" placeholder="ยืนยันรหัสผ่านใหม่" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 outline-none" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-3 border-t">
            <button type="button" onClick={() => setShowConfirm(true)} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1.5 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              ลบบัญชีถาวร
            </button>
            <button type="submit" disabled={saving} className="w-full sm:w-auto px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs disabled:opacity-50 transition shadow flex items-center justify-center gap-2">
              {saving ? 'กำลังบันทึก...' : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* Delete Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-black text-slate-900 text-sm">ยืนยันการลบบัญชีถาวร?</h3>
            <p className="text-xs text-slate-500">ข้อมูลส่วนตัวและประกาศทั้งหมดจะถูกลบอย่างถาวร ไม่สามารถกู้คืนได้</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition">ยกเลิก</button>
              <button disabled={deleting} onClick={handleDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50 transition">
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
