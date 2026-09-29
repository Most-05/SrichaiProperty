'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { AlertTriangle, Loader2 } from 'lucide-react';

type RangeType = 'day' | 'month' | 'year';

interface AppointmentBucket {
  timeframe: string;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  cancelled: number;
}

interface UserBucket {
  timeframe: string;
  customer: number;
  agent: number;
}

interface TopProperty {
  title: string;
  views: number;
}

interface AnalyticsData {
  appointmentsChart: AppointmentBucket[];
  usersChart: UserBucket[];
  topPropertiesChart: TopProperty[];
  summary: {
    /** ตัวเลขของช่วงที่เลือก (ขยับตามตัวกรอง) */
    appointmentsInRange: number;
    appointmentsChangePercent: number | null;
    viewsInRange: number;
    viewsChangePercent: number | null;
    newUsersInRange: number;
    newUsersChangePercent: number | null;
    /** ตัวเลขสะสมทั้งระบบ (ไม่ขยับตามตัวกรอง) */
    totalUsers: number;
    agentsCount: number;
    proAgentsCount: number;
  };
  /** อัตราสุขภาพของ core flow ในช่วงที่เลือก */
  appointmentHealth?: {
    total: number;
    completed: number; completedPercent: number;
    noShow: number; noShowPercent: number;
    rejected: number; rejectedPercent: number;
    cancelled: number; cancelledPercent: number;
  };
  /** สรุปผล SLA การตรวจประกาศย้อนหลัง (นับเฉพาะใบที่มีบันทึกเวลาตรวจ) */
  moderationSla?: {
    reviewedCount: number;
    averageLabel: string;
    withinSlaCount: number;
    withinSlaPercent: number;
  };
}

// สีและป้ายกำกับกราฟนัดหมาย แยกตามสถานะจริงในระบบ (pending/approved/completed/rejected/cancelled)
const appointmentsChartConfig = {
  pending: { label: 'รอดำเนินการ', color: '#f59e0b' },
  approved: { label: 'ยืนยันแล้ว', color: '#3b82f6' },
  completed: { label: 'เข้าชมสำเร็จ', color: '#10b981' },
  rejected: { label: 'ปฏิเสธ', color: '#ef4444' },
  cancelled: { label: 'ยกเลิก', color: '#94a3b8' },
} satisfies ChartConfig;

const usersChartConfig = {
  customer: { label: 'ลูกค้าใหม่', color: '#3b82f6' },
  agent: { label: 'นายหน้าใหม่', color: '#10b981' },
} satisfies ChartConfig;

const viewsChartConfig = {
  views: { label: 'ยอดเข้าชม', color: '#6366f1' },
} satisfies ChartConfig;

const RANGE_LABELS: { value: RangeType; label: string }[] = [
  { value: 'day', label: 'รายวัน (7 วัน)' },
  { value: 'month', label: 'รายเดือน (6 เดือน)' },
  { value: 'year', label: 'รายปี' },
];

/**
 * ป้ายเปรียบเทียบกับช่วงก่อนหน้าที่ยาวเท่ากัน
 * ตัวเลขเดี่ยวๆ ตีความไม่ได้ว่าดีหรือแย่ ต้องมีฐานเทียบ
 * null = ช่วงก่อนหน้าไม่มีข้อมูล จึงเทียบไม่ได้ (ไม่โชว์ +100% จากฐาน 0 ให้เข้าใจผิด)
 */
function ChangeBadge({ percent }: { percent: number | null | undefined }) {
  if (percent === null || percent === undefined) {
    return <span className="text-[11px] text-slate-400">ไม่มีข้อมูลช่วงก่อนหน้า</span>;
  }
  const up = percent > 0;
  const flat = percent === 0;
  return (
    <span className="text-[11px] text-slate-400">
      <span className={`font-medium tabular-nums ${flat ? 'text-slate-500' : up ? 'text-emerald-600' : 'text-rose-600'}`}>
        {flat ? 'เท่าเดิม' : `${up ? '+' : '−'}${Math.abs(percent)}%`}
      </span>
      <span className="ml-1.5">เทียบช่วงก่อนหน้า</span>
    </span>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<RangeType>('month');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadAnalytics = useCallback((selectedRange: RangeType) => {
    setLoading(true);
    fetch(`/api/admin/analytics?range=${selectedRange}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) {
          setFetchError(json.error);
        } else {
          setData(json);
          setFetchError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setFetchError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/admin/analytics?range=${range}`)
      .then(res => res.json())
      .then(json => {
        if (!ignore) {
          if (json.error) {
            setFetchError(json.error);
          } else {
            setData(json);
            setFetchError(null);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setFetchError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
          setLoading(false);
        }
      });
    return () => { ignore = true; };
  }, [range]);

  // คำอธิบายช่วงเวลาที่กำลังดู ใช้ต่อท้ายการ์ด KPI ให้รู้ว่าตัวเลขนับจากช่วงไหน
  const rangeText = range === 'day' ? '7 วันล่าสุด' : range === 'month' ? '6 เดือนล่าสุด' : '3 ปีล่าสุด';

  return (
    <>
      <header className="min-h-16 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 shrink-0 relative z-0">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">สถิติและรายงาน (Analytics)</h2>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">ภาพรวมนัดหมาย ยอดเข้าชมบ้าน และผู้ใช้งานในระบบ</p>
        </div>

        {/* ตัวสลับช่วงเวลา ใช้รูปแบบเดียวกับกราฟฝั่งนายหน้า */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          {RANGE_LABELS.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                range === r.value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto space-y-6">
        {fetchError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button onClick={() => loadAnalytics(range)} className="underline font-medium">ลองใหม่</button>
          </div>
        )}

        {loading && !data ? (
          <div className="py-24 text-center text-slate-400 font-bold text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>กำลังโหลดข้อมูลสถิติ...</span>
          </div>
        ) : (
          <>
            {/* 🔑 KEYWORD: แถบสรุปผล SLA การตรวจประกาศ
                ตอบคำถาม "ทีมตรวจทันกำหนดจริงไหม" ด้วยตัวเลขจากข้อมูลจริง
                ซ่อนไว้ถ้ายังไม่มีประกาศที่บันทึกเวลาตรวจ จะได้ไม่โชว์ 0% ให้เข้าใจผิด */}
            {data?.moderationSla && data.moderationSla.reviewedCount > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-baseline justify-between gap-4 mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">คุณภาพการตรวจประกาศ</h3>
                  <p className="text-xs text-slate-400">กรอบเวลาที่ตั้งไว้ 24 ชั่วโมง</p>
                </div>
                <div className="flex flex-wrap gap-x-12 gap-y-4">
                  <div>
                    <p className="text-xs text-slate-500">ตรวจแล้วทั้งหมด</p>
                    <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1 leading-none">
                      {data.moderationSla.reviewedCount}
                      <span className="text-sm font-normal text-slate-400 ml-1.5">ประกาศ</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">เวลาเฉลี่ยที่ใช้ตรวจ</p>
                    <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1 leading-none">{data.moderationSla.averageLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ตรวจทันกำหนด</p>
                    <p className={`text-2xl font-semibold tabular-nums mt-1 leading-none ${
                      data.moderationSla.withinSlaPercent >= 90 ? 'text-emerald-700'
                        : data.moderationSla.withinSlaPercent >= 70 ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                      {data.moderationSla.withinSlaPercent}%
                      <span className="text-sm font-normal text-slate-400 ml-1.5">
                        {data.moderationSla.withinSlaCount} จาก {data.moderationSla.reviewedCount}
                      </span>
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* แถวตัวเลขสรุป
                เดิมเป็นการ์ดแยก 4 ใบ แต่ละใบมีขีดสีซ้ายคนละสี + เงา ซึ่งเป็นหน้าตาเทมเพลตสำเร็จรูป
                และทำให้ทุกตัวเลขดูสำคัญเท่ากันหมด เปลี่ยนเป็นแผงเดียวคั่นด้วยเส้นบาง
                ให้ตัวเลขเป็นตัวนำสายตาแทนสีของกรอบ */}
            <section className="bg-white rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-slate-100 lg:divide-y-0 lg:divide-x">
                {[
                  { label: 'นัดหมายใหม่', value: data?.summary.appointmentsInRange ?? 0, change: data?.summary.appointmentsChangePercent, note: rangeText },
                  { label: 'ยอดเข้าชมบ้าน', value: data?.summary.viewsInRange ?? 0, change: data?.summary.viewsChangePercent, note: rangeText },
                  { label: 'สมาชิกใหม่', value: data?.summary.newUsersInRange ?? 0, change: data?.summary.newUsersChangePercent, note: rangeText },
                  { label: 'ผู้ใช้งานในระบบ', value: data?.summary.totalUsers ?? 0, change: undefined, note: `นายหน้า ${data?.summary.agentsCount ?? 0} คน · สะสมทั้งระบบ` },
                ].map(item => (
                  <div key={item.label} className="px-5 py-4">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-3xl font-semibold text-slate-900 tabular-nums mt-1.5 leading-none">
                      {item.value.toLocaleString()}
                    </p>
                    <div className="mt-2 min-h-[16px]">
                      {item.change !== undefined
                        ? <ChangeBadge percent={item.change} />
                        : <span className="text-[11px] text-slate-400">{item.note}</span>}
                    </div>
                    {item.change !== undefined && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 🔑 KEYWORD: อัตราสุขภาพของ core flow
                แถวบนตอบว่า "มีกิจกรรมเท่าไหร่" ส่วนนี้ตอบว่า "ผลลัพธ์เป็นยังไง"
                ซึ่งเป็นสิ่งที่ผู้ดูแลแพลตฟอร์มต้องเฝ้าจริง ใช้ข้อมูลจากระบบติดตามผลนัดหมาย
                ซ่อนไว้ถ้าช่วงนั้นไม่มีนัดเลย ไม่งั้นจะขึ้น 0% ทุกช่องให้เข้าใจผิด */}
            {data?.appointmentHealth && data.appointmentHealth.total > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-baseline justify-between gap-4 mb-5">
                  <h3 className="text-sm font-semibold text-slate-900">ผลลัพธ์ของนัดหมาย</h3>
                  <p className="text-xs text-slate-400">
                    จาก {data.appointmentHealth.total} นัดใน {rangeText}
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                  {[
                    { label: 'เข้าชมสำเร็จ', n: data.appointmentHealth.completed, p: data.appointmentHealth.completedPercent, bar: 'bg-emerald-500', text: 'text-emerald-700', note: 'ลูกค้าไปดูบ้านจริง' },
                    { label: 'ไม่มาตามนัด', n: data.appointmentHealth.noShow, p: data.appointmentHealth.noShowPercent, bar: 'bg-rose-500', text: 'text-rose-700', note: 'ยิ่งต่ำยิ่งดี' },
                    { label: 'ถูกปฏิเสธ', n: data.appointmentHealth.rejected, p: data.appointmentHealth.rejectedPercent, bar: 'bg-amber-500', text: 'text-amber-700', note: 'นายหน้าไม่รับนัด' },
                    { label: 'ถูกยกเลิก', n: data.appointmentHealth.cancelled, p: data.appointmentHealth.cancelledPercent, bar: 'bg-slate-400', text: 'text-slate-600', note: 'ยกเลิกก่อนถึงวันนัด' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-slate-500">{item.label}</span>
                        <span className="text-[11px] text-slate-400 tabular-nums">{item.n} นัด</span>
                      </div>
                      <p className={`text-2xl font-semibold tabular-nums mt-1 leading-none ${item.text}`}>{item.p}%</p>
                      {/* แถบสัดส่วนช่วยเทียบขนาดได้เร็วกว่าอ่านตัวเลขอย่างเดียว */}
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                        <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${item.p}%` }} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">{item.note}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* กราฟนัดหมาย แยกตามสถานะ */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-900">นัดหมายแยกตามสถานะ</h3>
                <p className="text-xs text-slate-400">{rangeText}</p>
              </div>

              {data && data.appointmentsChart.every(b => b.pending + b.approved + b.completed + b.rejected + b.cancelled === 0) ? (
                <p className="py-10 text-center text-slate-400 font-bold text-xs">ยังไม่มีข้อมูลนัดหมายในช่วงเวลานี้</p>
              ) : (
                <ChartContainer config={appointmentsChartConfig} className="h-64 w-full">
                  <BarChart data={data?.appointmentsChart ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={2} barCategoryGap="22%">
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="timeframe" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" fill="var(--color-approved)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" fill="var(--color-rejected)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancelled" fill="var(--color-cancelled)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* กราฟผู้ใช้/นายหน้าสมัครใหม่ */}
              <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-sm font-semibold text-slate-900">สมาชิกสมัครใหม่</h3>
                  <p className="text-xs text-slate-400">แยกลูกค้ากับนายหน้า</p>
                </div>

                {data && data.usersChart.every(b => b.customer + b.agent === 0) ? (
                  <p className="py-10 text-center text-slate-400 font-bold text-xs">ยังไม่มีผู้ใช้สมัครใหม่ในช่วงเวลานี้</p>
                ) : (
                  <ChartContainer config={usersChartConfig} className="h-56 w-full">
                    <BarChart data={data?.usersChart ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="timeframe" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="customer" fill="var(--color-customer)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="agent" fill="var(--color-agent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </section>

              {/* Top 5 บ้านที่มีคนเข้าชมมากที่สุด (views_count เป็นตัวเลขสะสม ไม่มี log รายวัน จึงไม่มี toggle ช่วงเวลา) */}
              <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-sm font-semibold text-slate-900">บ้านที่คนเปิดดูมากที่สุด</h3>
                  <p className="text-xs text-slate-400">5 อันดับแรกใน {rangeText}</p>
                </div>

                {!data || data.topPropertiesChart.length === 0 ? (
                  <p className="py-10 text-center text-slate-400 font-bold text-xs">ยังไม่มีประกาศในระบบ</p>
                ) : (
                  <ChartContainer config={viewsChartConfig} className="h-56 w-full">
                    <BarChart data={data.topPropertiesChart} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        dataKey="title"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={140}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent indicator="dashed" hideLabel />} />
                      <Bar dataKey="views" fill="var(--color-views)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
