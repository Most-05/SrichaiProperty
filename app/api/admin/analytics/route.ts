
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // ดึงเซสชันปัจจุบันเพื่อตรวจสิทธิ์ admin
import { authOptions } from '@/lib/authOptions'; // ค่าคอนฟิก NextAuth ส่งให้ getServerSession
import { db } from '@/lib/db'; // ไคลเอนต์ Prisma สำหรับดึงข้อมูลวิเคราะห์ (analytics)
import { summarizeReviewSla } from '@/lib/services/slaService'; // สรุปผล SLA การตรวจประกาศย้อนหลัง

interface AdminSession {
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
}

type RangeType = 'day' | 'month' | 'year' | 'quarter' | 'this_month' | 'custom';

interface Bucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

// สร้างช่วงเวลา (bucket) สำหรับกราฟ
function getBuckets(range: RangeType, customStart?: string | null, customEnd?: string | null): Bucket[] {
  const buckets: Bucket[] = [];
  const now = new Date();

  if (range === 'custom' && customStart && customEnd) {
    const startD = new Date(customStart);
    const endD = new Date(customEnd);
    endD.setHours(23, 59, 59, 999);
    const diffDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));

    if (diffDays <= 14) {
      // รายวัน
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(startD);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        buckets.push({
          key,
          label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
          start: new Date(`${key}T00:00:00.000Z`),
          end: new Date(`${key}T23:59:59.999Z`),
        });
      }
    } else {
      // รายสัปดาห์ / สรุป
      const steps = 6;
      const stepMs = (endD.getTime() - startD.getTime()) / steps;
      for (let i = 0; i < steps; i++) {
        const bStart = new Date(startD.getTime() + i * stepMs);
        const bEnd = new Date(startD.getTime() + (i + 1) * stepMs - 1);
        buckets.push({
          key: `step-${i}`,
          label: `${bStart.getDate()}/${bStart.getMonth() + 1}`,
          start: bStart,
          end: bEnd,
        });
      }
    }
  } else if (range === 'day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      buckets.push({
        key,
        label: d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }),
        start: new Date(`${key}T00:00:00.000Z`),
        end: new Date(`${key}T23:59:59.999Z`),
      });
    }
  } else if (range === 'this_month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const intervals = 4;
    const intervalDays = Math.ceil(daysInMonth / intervals);
    for (let i = 0; i < intervals; i++) {
      const s = 1 + i * intervalDays;
      const e = Math.min(daysInMonth, (i + 1) * intervalDays);
      buckets.push({
        key: `w-${i}`,
        label: `${s}-${e} ${now.toLocaleDateString('th-TH', { month: 'short' })}`,
        start: new Date(now.getFullYear(), now.getMonth(), s, 0, 0, 0),
        end: new Date(now.getFullYear(), now.getMonth(), e, 23, 59, 59, 999),
      });
    }
  } else if (range === 'quarter') {
    const currentQ = Math.floor(now.getMonth() / 3);
    for (let i = 0; i < 3; i++) {
      const m = currentQ * 3 + i;
      const d = new Date(now.getFullYear(), m, 1);
      buckets.push({
        key: `${now.getFullYear()}-${m}`,
        label: d.toLocaleDateString('th-TH', { month: 'short' }),
        start: new Date(now.getFullYear(), m, 1),
        end: new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999),
      });
    }
  } else if (range === 'month') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('th-TH', { month: 'short' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }
  } else {
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      buckets.push({
        key: String(year),
        label: String(year + 543),
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31, 23, 59, 59, 999),
      });
    }
  }

  return buckets.length > 0 ? buckets : [
    { key: 'now', label: 'ปัจจุบัน', start: new Date(Date.now() - 7 * 86400000), end: new Date() }
  ];
}

const APPOINTMENT_STATUSES = ['pending', 'approved', 'completed', 'rejected', 'cancelled'] as const;

// GET: สถิติภาพรวมสำหรับหน้า /admin/analytics (นัดหมาย, ยอดเข้าชมบ้าน, ผู้ใช้, การเงิน)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as AdminSession | null;
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let range: RangeType = 'month';
    if (rangeParam === 'day' || rangeParam === 'year' || rangeParam === 'quarter' || rangeParam === 'this_month') {
      range = rangeParam;
    } else if (startDateParam && endDateParam) {
      range = 'custom';
    }

    const buckets = getBuckets(range, startDateParam, endDateParam);
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;
    const rangeMs = Math.max(86400000, rangeEnd.getTime() - rangeStart.getTime());
    const prevStart = new Date(rangeStart.getTime() - rangeMs);
    const prevEnd = new Date(rangeStart.getTime() - 1);

    const [
      appointmentsRaw,
      usersRaw,
      viewsInRange,
      paymentsApproved,
      prevPaymentsApproved,
      prevAppointmentsCount,
      prevUsersCount,
      prevViewsCount,
      totalUsers,
      agentsCount,
      proAgentsCount,
    ] = await Promise.all([
      db.appointments.findMany({
        where: { created_at: { gte: rangeStart, lte: rangeEnd } },
        select: { created_at: true, status: true },
      }),
      db.users.findMany({
        where: { created_at: { gte: rangeStart, lte: rangeEnd } },
        select: { created_at: true, role_id: true },
      }),
      db.property_views.findMany({
        where: { viewed_at: { gte: rangeStart, lte: rangeEnd } },
        select: { property_id: true, properties: { select: { title: true } } },
      }),
      db.payment_transactions.findMany({
        where: { status: 'approved', created_at: { gte: rangeStart, lte: rangeEnd } },
        select: { amount: true, created_at: true }
      }),
      db.payment_transactions.findMany({
        where: { status: 'approved', created_at: { gte: prevStart, lte: prevEnd } },
        select: { amount: true }
      }),
      db.appointments.count({ where: { created_at: { gte: prevStart, lte: prevEnd } } }),
      db.users.count({ where: { created_at: { gte: prevStart, lte: prevEnd } } }),
      db.property_views.count({ where: { viewed_at: { gte: prevStart, lte: prevEnd } } }),
      db.users.count(),
      db.users.count({ where: { role_id: 'agent' } }),
      db.users.count({ where: { role_id: 'agent', plan_type: 'pro' } }),
    ]);

    const revenueInRange = paymentsApproved.reduce((sum, p) => sum + Number(p.amount), 0);
    const prevRevenue = prevPaymentsApproved.reduce((sum, p) => sum + Number(p.amount), 0);

    // นับจำนวนนัดหมายแยกตามสถานะในแต่ละช่วงเวลา
    const appointmentsChart = buckets.map(b => {
      const inBucket = appointmentsRaw.filter(a => a.created_at >= b.start && a.created_at <= b.end);
      const row: Record<string, string | number> = { timeframe: b.label };
      APPOINTMENT_STATUSES.forEach(s => {
        row[s] = inBucket.filter(a => (a.status || 'pending') === s).length;
      });
      return row;
    });

    // นับจำนวนผู้ใช้สมัครใหม่แยกตาม role ในแต่ละช่วงเวลา
    const usersChart = buckets.map(b => {
      const inBucket = usersRaw.filter(u => u.created_at >= b.start && u.created_at <= b.end);
      return {
        timeframe: b.label,
        customer: inBucket.filter(u => (u.role_id || 'customer') === 'customer').length,
        agent: inBucket.filter(u => u.role_id === 'agent').length,
      };
    });

    // แสดงข้อมูลทุกช่วงเวลาตามที่ผู้ใช้เลือก (ไม่ตัดทิ้ง) เพื่อให้เห็นเส้นแนวโน้มที่แท้จริง
    const appointmentsChartTrimmed = appointmentsChart;
    const usersChartTrimmed = usersChart;

    // Top 5 ประกาศที่มีคนเข้าชมมากที่สุดจากข้อมูลจริง
    const viewsByProperty = new Map<string, { title: string; views: number }>();
    for (const v of viewsInRange) {
      const cur = viewsByProperty.get(v.property_id);
      if (cur) cur.views += 1;
      else viewsByProperty.set(v.property_id, { title: v.properties?.title ?? 'ไม่ระบุชื่อ', views: 1 });
    }
    let topPropertiesChart = [...viewsByProperty.values()]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(p => ({
        title: p.title.length > 24 ? `${p.title.slice(0, 24)}…` : p.title,
        views: p.views,
      }));

    // หากในช่วงเวลานี้ยังไม่มีการบันทึก View ให้ดึง Top 5 จากยอดเข้าชมสะสมจริง (views_count) ในตาราง properties
    if (topPropertiesChart.length === 0) {
      const allTopProps = await db.properties.findMany({
        where: { status: 'approved' },
        orderBy: { views_count: 'desc' },
        take: 5,
        select: { title: true, views_count: true }
      });
      topPropertiesChart = allTopProps.map(p => ({
        title: p.title.length > 24 ? `${p.title.slice(0, 24)}…` : p.title,
        views: p.views_count,
      }));
    }

    // ตัวชี้วัดสุขภาพของ core flow — ตอบว่า "ระบบทำงานดีไหม" ไม่ใช่แค่ "มีกิจกรรมเท่าไหร่"
    // ใช้ข้อมูลจากระบบติดตามผลนัดหมาย (No-show) ที่เก็บไว้อยู่แล้ว
    const totalInRange = appointmentsRaw.length;
    const countBy = (st: string) => appointmentsRaw.filter(a => (a.status || 'pending') === st).length;
    const pct = (n: number) => (totalInRange > 0 ? Math.round((n / totalInRange) * 100) : 0);
    const appointmentHealth = {
      total: totalInRange,
      completed: countBy('completed'),
      completedPercent: pct(countBy('completed')),
      noShow: countBy('no_show'),
      noShowPercent: pct(countBy('no_show')),
      rejected: countBy('rejected'),
      rejectedPercent: pct(countBy('rejected')),
      cancelled: countBy('cancelled'),
      cancelledPercent: pct(countBy('cancelled')),
    };

    // เปอร์เซ็นต์เปลี่ยนแปลงเทียบช่วงก่อนหน้า — null เมื่อช่วงก่อนหน้าเป็นศูนย์
    // (หารด้วยศูนย์ไม่ได้ และการโชว์ "+100%" จากฐาน 0 ทำให้เข้าใจผิด)
    const changePercent = (now: number, prev: number): number | null =>
      prev === 0 ? null : Math.round(((now - prev) / prev) * 100);

    const viewsInRangeCount = viewsInRange.length;
    const newUsersInRange = usersRaw.length;

    // KEYWORD: สรุปผล SLA การตรวจประกาศ
    // ตอบว่าทีมแอดมินตรวจทันกำหนดจริงไหม ด้วยตัวเลขจากข้อมูลจริง
    // นับเฉพาะใบที่มี reviewed_at (ประกาศเก่าก่อนเริ่มเก็บข้อมูลจะถูกข้าม)
    const reviewedRows = await db.properties.findMany({
      where: { reviewed_at: { not: null } },
      select: { created_at: true, reviewed_at: true }
    });
    const moderationSla = summarizeReviewSla(reviewedRows);

    return NextResponse.json({
      range,
      appointmentsChart: appointmentsChartTrimmed,
      usersChart: usersChartTrimmed,
      topPropertiesChart,
      summary: {
        // ตัวเลขของ "ช่วงที่เลือก" พร้อมค่าเทียบช่วงก่อนหน้า
        appointmentsInRange: totalInRange,
        appointmentsChangePercent: changePercent(totalInRange, prevAppointmentsCount),
        viewsInRange: viewsInRangeCount,
        viewsChangePercent: changePercent(viewsInRangeCount, prevViewsCount),
        newUsersInRange,
        newUsersChangePercent: changePercent(newUsersInRange, prevUsersCount),
        revenueInRange,
        revenueChangePercent: changePercent(revenueInRange, prevRevenue),
        // ตัวเลขสะสมทั้งระบบ แยกกลุ่มให้ชัดว่าไม่ได้ขยับตามตัวกรอง
        totalUsers,
        agentsCount,
        proAgentsCount,
      },
      appointmentHealth,
      moderationSla,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: 'โหลดข้อมูลสถิติล้มเหลว: ' + err.message }, { status: 500 });
  }
}
