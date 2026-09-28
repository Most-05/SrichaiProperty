'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  AlertTriangle,
  Loader2,
  Calendar,
  Eye,
  Users,
  Trophy,
  Download,
  Printer,
  CheckSquare,
  Square,
  Banknote,
  Filter
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

type RangeType = 'day' | 'this_month' | 'month' | 'quarter' | 'year' | 'custom';

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
    appointmentsInRange: number;
    appointmentsChangePercent: number | null;
    viewsInRange: number;
    viewsChangePercent: number | null;
    newUsersInRange: number;
    newUsersChangePercent: number | null;
    revenueInRange?: number;
    revenueChangePercent?: number | null;
    totalUsers: number;
    agentsCount: number;
    proAgentsCount: number;
  };
  appointmentHealth?: {
    total: number;
    completed: number; completedPercent: number;
    noShow: number; noShowPercent: number;
    rejected: number; rejectedPercent: number;
    cancelled: number; cancelledPercent: number;
  };
  moderationSla?: {
    reviewedCount: number;
    averageLabel: string;
    withinSlaCount: number;
    withinSlaPercent: number;
  };
}

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
  { value: 'day', label: '7 วันล่าสุด' },
  { value: 'this_month', label: 'เดือนนี้' },
  { value: 'month', label: '6 เดือนล่าสุด' },
  { value: 'quarter', label: 'ไตรมาสนี้' },
  { value: 'year', label: 'รายปี' },
  { value: 'custom', label: 'กำหนดเอง' },
];

function ChangeBadge({ percent }: { percent: number | null | undefined }) {
  if (percent === null || percent === undefined) {
    return <span className="text-[10px] font-bold text-slate-300">ไม่มีข้อมูลช่วงก่อนหน้า</span>;
  }
  const up = percent > 0;
  const flat = percent === 0;
  return (
    <span className={`text-[10px] font-black ${flat ? 'text-slate-400' : up ? 'text-emerald-600' : 'text-red-500'}`}>
      {flat ? 'เท่าเดิม' : `${up ? '▲' : '▼'} ${Math.abs(percent)}%`}
      <span className="text-slate-400 font-bold ml-1.5">เทียบช่วงก่อนหน้า</span>
    </span>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<RangeType>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Metric series toggles for appointment chart
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    completed: true,
    approved: true,
    pending: true,
    rejected: true,
    cancelled: true,
  });

  const toggleSeries = (key: string) => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRangeChange = (newRange: RangeType) => {
    if (newRange === range) return;
    setLoading(true);
    setRange(newRange);
  };

  const handleApplyCustomRange = async () => {
    if (!customStartDate || !customEndDate) {
      toast.error('กรุณาระบุทั้งวันที่เริ่มต้นและสิ้นสุด');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=custom&startDate=${customStartDate}&endDate=${customEndDate}&t=${Date.now()}`);
      const json = await res.json();
      if (json.error) {
        setFetchError(json.error);
      } else {
        setData(json);
        setFetchError(null);
      }
    } catch {
      setFetchError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    let url = `/api/admin/analytics?range=${range}&t=${Date.now()}`;
    if (range === 'custom' && customStartDate && customEndDate) {
      url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
    }
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) {
        setFetchError(json.error);
      } else {
        setData(json);
        setFetchError(null);
      }
    } catch {
      setFetchError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range === 'custom') return;
    let ignore = false;
    const url = `/api/admin/analytics?range=${range}&t=${Date.now()}`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (ignore) return;
        if (json.error) {
          setFetchError(json.error);
        } else {
          setData(json);
          setFetchError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setFetchError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [range]);

  const rangeText = useMemo(() => {
    if (range === 'day') return '7 วันล่าสุด';
    if (range === 'this_month') return 'เดือนปัจจุบัน';
    if (range === 'month') return '6 เดือนล่าสุด';
    if (range === 'quarter') return 'ไตรมาสปัจจุบัน';
    if (range === 'year') return 'รายปี';
    if (range === 'custom') return `${customStartDate} ถึง ${customEndDate}`;
    return '';
  }, [range, customStartDate, customEndDate]);

  // Export Executive CSV
  const handleExportCSV = () => {
    if (!data) return;

    const summaryRows = [
      ['ตัวชี้วัดสำคัญ (Executive KPI)', 'ค่าในช่วงเวลา', 'เทียบช่วงก่อนหน้า'],
      ['นัดหมายเข้าชมบ้านใหม่', data.summary.appointmentsInRange, data.summary.appointmentsChangePercent ? `${data.summary.appointmentsChangePercent}%` : '-'],
      ['ยอดเข้าชมบ้าน (Views)', data.summary.viewsInRange, data.summary.viewsChangePercent ? `${data.summary.viewsChangePercent}%` : '-'],
      ['ยอดรายได้ Verified PRO (บาท)', data.summary.revenueInRange ?? 0, data.summary.revenueChangePercent ? `${data.summary.revenueChangePercent}%` : '-'],
      ['สมาชิกใหม่', data.summary.newUsersInRange, data.summary.newUsersChangePercent ? `${data.summary.newUsersChangePercent}%` : '-'],
      ['ผู้ใช้งานสะสมทั้งระบบ', data.summary.totalUsers, '-'],
      ['นายหน้าสะสม', data.summary.agentsCount, '-'],
      ['นายหน้า Verified PRO', data.summary.proAgentsCount, '-'],
      [],
      ['สุขภาพนัดหมาย (Appointment Health)', 'จำนวนรายการ', 'สัดส่วน (%)'],
      ['เข้าชมสำเร็จ (Completed)', data.appointmentHealth?.completed ?? 0, `${data.appointmentHealth?.completedPercent ?? 0}%`],
      ['ไม่มาตามนัด (No-show)', data.appointmentHealth?.noShow ?? 0, `${data.appointmentHealth?.noShowPercent ?? 0}%`],
      ['ปฏิเสธคำขอ (Rejected)', data.appointmentHealth?.rejected ?? 0, `${data.appointmentHealth?.rejectedPercent ?? 0}%`],
      ['ยกเลิก (Cancelled)', data.appointmentHealth?.cancelled ?? 0, `${data.appointmentHealth?.cancelledPercent ?? 0}%`],
    ];

    const csvContent = '\uFEFF' + summaryRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `srichai_analytics_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('ดาวน์โหลดไฟล์ CSV สถิติเรียบร้อยแล้ว');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <header className="min-h-16 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 shrink-0 relative z-0 print:hidden">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">สถิติและรายงาน (Analytics)</h2>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">ภาพรวมนัดหมาย สุขภาพระบบ ยอดขายแพ็กเกจ และการเข้าชม</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Presets */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
            {RANGE_LABELS.map(r => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer shrink-0 ${
                  range === r.value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!data}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition border border-slate-200 shadow-sm cursor-pointer disabled:opacity-50"
            title="ส่งออก CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition border border-slate-200 shadow-sm cursor-pointer"
            title="พิมพ์รายงานสรุป"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>
        </div>
      </header>

      {/* Print-only Header for Executive Presentation */}
      <div className="hidden print:block p-6 border-b border-slate-300">
        <h1 className="text-xl font-black text-slate-900">Srichai Property — รายงานสรุปผลการดำเนินงานผู้บริหาร</h1>
        <p className="text-xs text-slate-500 mt-1">ช่วงเวลาที่วิเคราะห์: {rangeText} | วันที่ออกรายงาน: {new Date().toLocaleDateString('th-TH')}</p>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto space-y-6">
        {/* Custom Date Range Picker Strip */}
        {range === 'custom' && (
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-wrap items-center gap-3 print:hidden">
            <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>กำหนดช่วงวันที่วิเคราะห์:</span>
            </span>
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 font-bold">ถึง</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustomRange}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              คำนวณสถิติ
            </button>
          </div>
        )}

        {fetchError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button onClick={handleRetry} className="underline font-black">ลองใหม่</button>
          </div>
        )}

        {loading && !data ? (
          <div className="py-24 text-center text-slate-400 font-bold text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>กำลังโหลดข้อมูลสถิติ...</span>
          </div>
        ) : (
          <>
            {/* SLA Bar */}
            {data?.moderationSla && data.moderationSla.reviewedCount > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-wrap items-center gap-x-10 gap-y-3">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">คุณภาพการตรวจประกาศ</span>
                  <strong className="text-sm font-black text-slate-700 block mt-1">กรอบเวลาที่ตั้งไว้ 24 ชม.</strong>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ตรวจแล้วทั้งหมด</span>
                  <strong className="text-2xl font-black text-slate-900 block">{data.moderationSla.reviewedCount} ประกาศ</strong>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">เวลาเฉลี่ยที่ใช้ตรวจ</span>
                  <strong className="text-2xl font-black text-blue-600 block">{data.moderationSla.averageLabel}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ตรวจทันกำหนด</span>
                  <strong className={`text-2xl font-black block ${
                    data.moderationSla.withinSlaPercent >= 90 ? 'text-emerald-600'
                      : data.moderationSla.withinSlaPercent >= 70 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {data.moderationSla.withinSlaPercent}%
                    <span className="text-xs font-bold text-slate-400 ml-1.5">({data.moderationSla.withinSlaCount}/{data.moderationSla.reviewedCount})</span>
                  </strong>
                </div>
              </section>
            )}

            {/* KPI Cards: Appointments, Views, PRO Revenue, New Users, Total Users */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-4 border-l-4 border-blue-500 border-y border-r border-slate-200/80 shadow-sm space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">นัดหมายใหม่</span>
                <strong className="text-2xl font-black text-slate-900 block">{(data?.summary.appointmentsInRange ?? 0).toLocaleString()}</strong>
                <ChangeBadge percent={data?.summary.appointmentsChangePercent} />
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{rangeText}</span>
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border-l-4 border-indigo-500 border-y border-r border-slate-200/80 shadow-sm space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ยอดเข้าชมบ้าน</span>
                <strong className="text-2xl font-black text-slate-900 block">{(data?.summary.viewsInRange ?? 0).toLocaleString()}</strong>
                <ChangeBadge percent={data?.summary.viewsChangePercent} />
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>{rangeText}</span>
                </span>
              </div>

              {/* Financial Revenue Card */}
              <div className="bg-white rounded-2xl p-4 border-l-4 border-amber-500 border-y border-r border-slate-200/80 shadow-sm space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ยอดขาย Verified PRO</span>
                <strong className="text-2xl font-black text-amber-600 block">
                  ฿{(data?.summary.revenueInRange ?? 0).toLocaleString()}
                </strong>
                <ChangeBadge percent={data?.summary.revenueChangePercent} />
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-amber-500" />
                  <span>{rangeText}</span>
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border-l-4 border-violet-500 border-y border-r border-slate-200/80 shadow-sm space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">สมาชิกใหม่</span>
                <strong className="text-2xl font-black text-slate-900 block">{(data?.summary.newUsersInRange ?? 0).toLocaleString()}</strong>
                <ChangeBadge percent={data?.summary.newUsersChangePercent} />
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{rangeText}</span>
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border-l-4 border-slate-400 border-y border-r border-slate-200/80 shadow-sm space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ผู้ใช้งานในระบบ</span>
                <strong className="text-2xl font-black text-slate-900 block">{(data?.summary.totalUsers ?? 0).toLocaleString()}</strong>
                <span className="text-[10px] font-black text-slate-500">นายหน้า {data?.summary.agentsCount ?? 0} คน</span>
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>สะสมทั้งระบบ</span>
                </span>
              </div>
            </section>

            {/* Health of core flow */}
            {data?.appointmentHealth && data.appointmentHealth.total > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    ผลลัพธ์ของนัดหมาย (Appointment Health)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    จากนัดหมายทั้งหมด {data.appointmentHealth.total} รายการใน {rangeText}
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'เข้าชมสำเร็จ', n: data.appointmentHealth.completed, p: data.appointmentHealth.completedPercent, tone: 'text-emerald-600', note: 'ลูกค้าไปดูบ้านจริง' },
                    { label: 'ไม่มาตามนัด', n: data.appointmentHealth.noShow, p: data.appointmentHealth.noShowPercent, tone: 'text-red-600', note: 'ยิ่งต่ำยิ่งดี' },
                    { label: 'ถูกปฏิเสธ', n: data.appointmentHealth.rejected, p: data.appointmentHealth.rejectedPercent, tone: 'text-amber-600', note: 'นายหน้าไม่รับนัด' },
                    { label: 'ถูกยกเลิก', n: data.appointmentHealth.cancelled, p: data.appointmentHealth.cancelledPercent, tone: 'text-slate-500', note: 'ยกเลิกก่อนถึงวันนัด' },
                  ].map(item => (
                    <div key={item.label} className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                      <strong className={`text-2xl font-black block ${item.tone}`}>
                        {item.p}%
                        <span className="text-xs font-bold text-slate-400 ml-1.5">({item.n} รายการ)</span>
                      </strong>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.tone.replace('text-', 'bg-')}`} style={{ width: `${item.p}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold block">{item.note}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Appointment Chart with Metric Toggles */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>สถิตินัดหมาย (Appointments)</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">จำนวนนัดหมายแยกตามสถานะ ตามช่วงเวลาที่เลือก</p>
                </div>

                {/* Metric Series Toggles */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold print:hidden">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3" />
                    <span>ชุดข้อมูล:</span>
                  </span>
                  {[
                    { key: 'completed', label: 'สำเร็จ', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                    { key: 'approved', label: 'ยืนยัน', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                    { key: 'pending', label: 'รอดำเนินการ', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                    { key: 'rejected', label: 'ปฏิเสธ', color: 'text-red-700 bg-red-50 border-red-200' },
                    { key: 'cancelled', label: 'ยกเลิก', color: 'text-slate-700 bg-slate-100 border-slate-200' },
                  ].map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSeries(s.key)}
                      className={`px-2 py-1 rounded-md border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        visibleSeries[s.key]
                          ? s.color
                          : 'opacity-40 bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {visibleSeries[s.key] ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {data && data.appointmentsChart.every(b => b.pending + b.approved + b.completed + b.rejected + b.cancelled === 0) ? (
                <p className="py-10 text-center text-slate-400 font-bold text-xs">ยังไม่มีข้อมูลนัดหมายในช่วงเวลานี้</p>
              ) : (
                <ChartContainer config={appointmentsChartConfig} className="h-64 w-full">
                  <BarChart data={data?.appointmentsChart ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="timeframe" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {visibleSeries.pending && <Bar dataKey="pending" fill="var(--color-pending)" radius={[6, 6, 0, 0]} />}
                    {visibleSeries.approved && <Bar dataKey="approved" fill="var(--color-approved)" radius={[6, 6, 0, 0]} />}
                    {visibleSeries.completed && <Bar dataKey="completed" fill="var(--color-completed)" radius={[6, 6, 0, 0]} />}
                    {visibleSeries.rejected && <Bar dataKey="rejected" fill="var(--color-rejected)" radius={[6, 6, 0, 0]} />}
                    {visibleSeries.cancelled && <Bar dataKey="cancelled" fill="var(--color-cancelled)" radius={[6, 6, 0, 0]} />}
                  </BarChart>
                </ChartContainer>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users Chart */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span>ผู้ใช้งาน/นายหน้าสมัครใหม่</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">จำนวนสมาชิกสมัครใหม่ ตามช่วงเวลาที่เลือก</p>
                </div>

                {data && data.usersChart.every(b => b.customer + b.agent === 0) ? (
                  <p className="py-10 text-center text-slate-400 font-bold text-xs">ยังไม่มีผู้ใช้สมัครใหม่ในช่วงเวลานี้</p>
                ) : (
                  <ChartContainer config={usersChartConfig} className="h-56 w-full">
                    <BarChart data={data?.usersChart ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="timeframe" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="customer" fill="var(--color-customer)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="agent" fill="var(--color-agent)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </section>

              {/* Top 5 Properties */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Top 5 บ้านที่มีคนเข้าชมมากที่สุด</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">ประกาศที่มีคนเปิดดูมากที่สุดใน {rangeText}</p>
                </div>

                {!data || data.topPropertiesChart.length === 0 ? (
                  <p className="py-10 text-center text-slate-400 font-bold text-xs">ยังไม่มีประกาศในระบบ</p>
                ) : (
                  <ChartContainer config={viewsChartConfig} className="h-56 w-full">
                    <BarChart data={data.topPropertiesChart} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
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
                      <Bar dataKey="views" fill="var(--color-views)" radius={[0, 6, 6, 0]} />
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

