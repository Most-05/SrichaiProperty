import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // ไคลเอนต์ Prisma สำหรับค้นหารายชื่อนายหน้าที่ได้รับการอนุมัติ

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const agents = await db.users.findMany({
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
        profile_image: true,
        experience: true,
        specialty_zone: true,
        specialty_type: true,
        is_verified: true,
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
    });

    const formattedAgents = agents.map(agent => {
      const validReviews = (agent.appointments_appointments_agent_idTousers || [])
        .map(a => a.reviews)
        .filter((r): r is { rating: number | null } => r !== null && typeof r.rating === 'number');

      const reviewCount = validReviews.length;
      const totalRating = validReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
      const ratingText = reviewCount > 0 ? `${averageRating.toFixed(1)} (${reviewCount} รีวิว)` : "ยังไม่มีรีวิว";

      return {
        id: agent.id,
        name: `${agent.first_name} ${agent.last_name}`,
        avatar: agent.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.first_name + ' ' + agent.last_name)}&background=1e40af&color=fff`,
        role: agent.specialty_type ? `ตัวแทนจำหน่าย${agent.specialty_type}` : "นายหน้าอสังหาริมทรัพย์มืออาชีพ",
        propertiesCount: agent.properties.length || 0,
        rating: ratingText,
        averageRating,
        reviewCount,
        location: agent.specialty_zone || "สงขลา / หาดใหญ่",
        phone: agent.phone || "08X-XXX-XXXX",
        email: agent.email,
        isVerified: agent.is_verified ?? true
      };
    });

    return NextResponse.json({ success: true, agents: formattedAgents });
  } catch (error) {
    console.error("Error fetching approved agents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
