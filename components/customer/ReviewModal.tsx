'use client';

import React, { useState } from 'react';
import { toast } from '@/components/ui/toast';

interface ReviewModalProps {
  isOpen: boolean;
  appointmentId: string;
  agentName: string;
  propertyName: string;
  initialRating?: number; // คะแนนเดิมที่เคยให้ไว้ (ถ้ามี)
  initialComment?: string; // ข้อความรีวิวเดิม (ถ้ามี)
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  appointmentId,
  agentName,
  propertyName,
  initialRating = 5,
  initialComment = '',
  onClose,
  onSuccess
}: ReviewModalProps) {
  // ตั้งค่าเริ่มต้นตามข้อมูลรีวิวเดิม (ถ้าเคยรีวิวแล้ว) หรือ 5 ดาว (ถ้ายังไม่เคย)
  const [ratingStars, setRatingStars] = useState(initialRating);
  const [reviewComment, setReviewComment] = useState(initialComment);
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!isOpen) return null;

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          rating: ratingStars,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('ขอบคุณสำหรับความคิดเห็นและการให้คะแนนบริการ!');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('บันทึกรีวิวล้มเหลว');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-left border border-slate-100">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-base text-slate-900">รีวิวและให้คะแนนการบริการ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          ให้คะแนนการบริการของ <strong className="text-slate-800">{agentName}</strong> สำหรับการเข้าชมโครงการ <strong className="text-slate-800">{propertyName}</strong>
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">ระดับความพึงพอใจ</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= ratingStars;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  title={`${star} ดาว`}
                >
                  <svg
                    className={`w-7 h-7 transition-colors ${
                      isFilled ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'fill-slate-100 text-slate-200 stroke-slate-300 stroke-[1.5]'
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              );
            })}
            <span className="text-xs font-black text-amber-600 ml-2 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
              {ratingStars} / 5 ดาว
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">ความคิดเห็นเพิ่มเติม</label>
          <textarea
            rows={3}
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            placeholder="เขียนความประทับใจ การตรงต่อเวลา และการให้บริการของนายหน้า..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium transition-all"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            {submittingReview ? (
              <span className="animate-pulse">กำลังบันทึก...</span>
            ) : (
              <>
                <span>บันทึกรีวิว</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
