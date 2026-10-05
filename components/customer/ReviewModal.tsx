'use client';

import React, { useState } from 'react';
import { toast } from '@/components/ui/toast';
import { Star, X, Check, Loader2 } from 'lucide-react';
import { REVIEW_COMMENT_MAX_LENGTH } from '@/lib/constants'; // ความยาวคอมเมนต์สูงสุด (ตรงกับที่ API ตรวจ)

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
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">รีวิวและให้คะแนนการบริการ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 shrink-0" />
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
                  <Star
                    className={`w-7 h-7 transition-colors shrink-0 ${
                      isFilled ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'fill-slate-100 text-slate-300'
                    }`}
                  />
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
            maxLength={REVIEW_COMMENT_MAX_LENGTH}
            placeholder="เขียนความประทับใจ การตรงต่อเวลา และการให้บริการของนายหน้า..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium transition-all"
          />
          {/* ตัวนับตัวอักษร — ให้รู้ก่อนว่าพิมพ์ได้อีกเท่าไร แทนที่จะโดน API ปฏิเสธตอนกดส่ง (BUG-41) */}
          <p className="text-[10px] text-slate-400 text-right">{reviewComment.length.toLocaleString()} / {REVIEW_COMMENT_MAX_LENGTH.toLocaleString()}</p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {submittingReview ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>บันทึกรีวิว</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
