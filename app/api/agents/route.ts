import { NextResponse } from 'next/server';
import { fallbackAvatarUrl } from '@/lib/utils/avatar'; // รูปโปรไฟล์สำรองแบบ PNG (ชื่อไทยบางชื่อได้ SVG ที่ next/image ไม่รับ — BUG-32)
import { db } from '@/lib/db'; // ไคลเอนต์ Prisma สำหรับค้นหารายชื่อนายหน้าที่ได้รับการอนุมัติ
import { isProActive } from '@/lib/pro'; // ตรวจสิทธิ์ Verified PRO ที่ยังไม่หมดอายุ

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const [agents, allAmphures, allProvinces] = await Promise.all([
      db.users.findMany({
        where: {
          role_id: 'agent',
          status: 'approved',
          ...(search ? {
            OR: [
              { first_name: { contains: search, mode: 'insensitive' } },
              { last_name: { contains: search, mode: 'insensitive' } },
              { specialty_zone: { contains: search, mode: 'insensitive' } },
            ]
          } : {})
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          line_id: true,
          profile_image: true,
          experience: true,
          specialty_zone: true,
          specialty_type: true,
          is_verified: true,
          plan_type: true,
          plan_expired_at: true,
          created_at: true,
          properties: {
            select: { id: true }
          },
          appointments_appointments_agent_idTousers: {
            where: {
              reviews: { isNot: null }
            },
            select: {
              reviews: {
                select: { rating: true }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      db.amphures.findMany({
        select: {
          id: true,
          name_th: true,
          province_id: true,
          provinces: { select: { id: true, name_th: true } }
        }
      }),
      db.provinces.findMany({
        select: { id: true, name_th: true }
      })
    ]);

    const formattedAgents = agents.map(agent => {
      const validReviews = (agent.appointments_appointments_agent_idTousers || [])
        .map(a => a.reviews)
        .filter((r): r is { rating: number | null } => r !== null && typeof r.rating === 'number');

      const reviewCount = validReviews.length;
      const totalRating = validReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
      const ratingText = reviewCount > 0 ? `${averageRating.toFixed(1)} (${reviewCount} รีวิว)` : "ยังไม่มีรีวิว";

      // วิเคราะห์หาจังหวัดและอำเภอจากข้อความ specialty_zone โดยเทียบกับฐานข้อมูลจริง
      const zoneText = (agent.specialty_zone || "สงขลา / หาดใหญ่").trim();
      const matchedAmphure = allAmphures.find(a => zoneText.includes(a.name_th));
      const matchedProvince = allProvinces.find(p => zoneText.includes(p.name_th)) || (matchedAmphure ? matchedAmphure.provinces : null);

      const resolvedProvince = matchedProvince ? matchedProvince.name_th : "สงขลา";
      const resolvedAmphure = matchedAmphure 
        ? matchedAmphure.name_th 
        : (zoneText.split(/[/,]/)[0]?.trim() || "หาดใหญ่");

      return {
        id: agent.id,
        name: `${agent.first_name} ${agent.last_name}`,
        avatar: agent.profile_image || fallbackAvatarUrl(agent.first_name + ' ' + agent.last_name),
        role: agent.specialty_type ? `ตัวแทนจำหน่าย${agent.specialty_type}` : "นายหน้าอสังหาริมทรัพย์มืออาชีพ",
        propertiesCount: agent.properties.length || 0,
        rating: ratingText,
        averageRating,
        reviewCount,
        location: agent.specialty_zone || "สงขลา / หาดใหญ่",
        province: resolvedProvince,
        amphure: resolvedAmphure,
        specialtyType: agent.specialty_type || null,
        phone: agent.phone || "08X-XXX-XXXX",
        lineId: agent.line_id || null,
        email: agent.email,
        isVerified: agent.is_verified ?? true,
        isPro: isProActive(agent.plan_type, agent.plan_expired_at),
        experience: agent.experience && agent.experience !== 'none'
          ? (agent.experience === '1-3' ? '1 - 3 ปี' : agent.experience === '3-5' ? '3 - 5 ปี' : agent.experience === '5+' ? 'มากกว่า 5 ปี' : (/^\d+$/.test(agent.experience.trim()) ? `${agent.experience.trim()} ปี` : agent.experience.trim()))
          : null
      };
    });

    return NextResponse.json({ success: true, agents: formattedAgents });
  } catch (error) {
    console.error("Error fetching approved agents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
