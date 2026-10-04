import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isProActive } from '@/lib/pro';

/**
 * ==============================================================================
 * API Endpoint: /api/agents/[id]
 * ==============================================================================
 * ดึงข้อมูลโปรไฟล์นายหน้ารายบุคคลสำหรับลูกค้าเข้าชม:
 * 1. ข้อมูลส่วนตัว, ช่องทางติดต่อ, สถานะ Verified, ประสบการณ์ และความเชี่ยวชาญ
 * 2. สถิติภาพรวม (จำนวนประกาศ, คะแนนรีวิวเฉลี่ย, จำนวนการปิดการขาย)
 * 3. รายการอสังหาริมทรัพย์ที่นายหน้าดูแลอยู่จริง (Active Properties)
 * 4. รายการรีวิวและความคิดเห็นจากลูกค้าจริง (Verified Reviews)
 * ==============================================================================
 */

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสนายหน้า' }, { status: 400 });
    }

    const agent = await db.users.findUnique({
      where: {
        id,
        role_id: 'agent',
        status: 'approved'
      },
      include: {
        properties: {
          where: {
            status: { in: ['approved', 'active', 'sold'] }
          },
          include: {
            property_types: true,
            property_images: {
              orderBy: { order_index: 'asc' }
            },
            provinces: true,
            amphures: true,
            districts: true,
            listing_package_orders: {
              where: { status: 'active' }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        appointments_appointments_agent_idTousers: {
          where: {
            reviews: { isNot: null }
          },
          include: {
            reviews: true,
            users_appointments_customer_idTousers: {
              select: {
                first_name: true,
                last_name: true,
                profile_image: true
              }
            },
            properties: {
              select: {
                title: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        sale_transactions_sale_transactions_agent_idTousers: {
          select: { id: true }
        }
      }
    });

    if (!agent) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลนายหน้าท่านนี้ หรือยังไม่ได้รับการอนุมัติ' }, { status: 404 });
    }

    // ประมวลผลรีวิวจากลูกค้า
    const reviewsWithData = agent.appointments_appointments_agent_idTousers
      .filter(a => a.reviews && typeof a.reviews.rating === 'number')
      .map(a => {
        const rev = a.reviews!;
        const customer = a.users_appointments_customer_idTousers;
        const customerName = customer ? `${customer.first_name} ${customer.last_name}`.trim() : 'ลูกค้าทั่วไป';
        return {
          id: rev.id,
          rating: rev.rating || 5,
          comment: rev.comment || '',
          createdAt: rev.created_at,
          customerName,
          customerImage: customer?.profile_image,
          propertyTitle: a.properties?.title || 'อสังหาริมทรัพย์'
        };
      });

    const reviewCount = reviewsWithData.length;
    const totalRating = reviewsWithData.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

    // การกระจายคะแนนดาว (5, 4, 3, 2, 1 ดาว)
    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsWithData.forEach(r => {
      const star = Math.min(5, Math.max(1, r.rating));
      ratingBreakdown[star] = (ratingBreakdown[star] || 0) + 1;
    });

    // ตรวจสอบสถานะสมาชิก Verified PRO
    const isPro = isProActive(agent.plan_type, agent.plan_expired_at);

    // จัดฟอร์แมตรายการทรัพย์ให้ตรงกับ Component PropertyCard
    const activeProperties = agent.properties
      .filter(p => p.status === 'approved' || p.status === 'active')
      .map(p => {
        const isPremium = Boolean(p.listing_package_orders?.length || isPro);
        const mainImage = p.property_images[0]?.image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80';
        return {
          id: p.id,
          title: p.title,
          price: '฿' + Number(p.price).toLocaleString(),
          listingType: (p.listing_type === 'rent' ? 'rent' : 'sale') as 'rent' | 'sale',
          type: p.property_types?.name || 'อสังหาริมทรัพย์',
          type_id: p.type_id,
          tag: isPremium ? 'ทรัพย์พรีเมียม' : 'ทรัพย์ทั่วไป',
          tagBg: isPremium ? 'bg-amber-600' : 'bg-blue-600',
          location: p.location,
          bedrooms: p.bedrooms || 0,
          bathrooms: p.bathrooms || 0,
          area: Number(p.area_sqm) || 0,
          image: mainImage,
          images: p.property_images.map(img => img.image_url),
          agentName: `${agent.first_name} ${agent.last_name}`,
          agentImage: agent.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.first_name + ' ' + agent.last_name)}&background=1e40af&color=fff`,
          agentRating: averageRating,
          agentReviewCount: reviewCount,
          isPremium,
          isVerifiedPro: isPro,
          description: p.description || '',
          province_id: p.province_id,
          amphure_id: p.amphure_id,
          district_id: p.district_id,
          agent_id: agent.id,
          created_at: p.created_at
        };
      });

    const soldProperties = agent.properties.filter(p => p.status === 'sold');
    const soldCount = (agent.sale_transactions_sale_transactions_agent_idTousers?.length || 0) + soldProperties.length;

    const formattedAgent = {
      id: agent.id,
      name: `${agent.first_name} ${agent.last_name}`,
      email: agent.email,
      phone: agent.phone || '08X-XXX-XXXX',
      lineId: agent.line_id || null,
      avatar: agent.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.first_name + ' ' + agent.last_name)}&background=1e40af&color=fff`,
      role: agent.specialty_type ? `ตัวแทนจำหน่าย${agent.specialty_type}` : 'นายหน้าอสังหาริมทรัพย์มืออาชีพ',
      experience: agent.experience && agent.experience !== 'none'
        ? (agent.experience === '1-3' ? '1 - 3 ปี' : agent.experience === '3-5' ? '3 - 5 ปี' : agent.experience === '5+' ? 'มากกว่า 5 ปี' : (/^\d+$/.test(agent.experience.trim()) ? `${agent.experience.trim()} ปี` : agent.experience.trim()))
        : null,
      specialtyZone: agent.specialty_zone || 'สงขลา / หาดใหญ่',
      specialtyType: agent.specialty_type || 'บ้านเดี่ยวและคอนโดมิเนียม',
      isVerified: agent.is_verified ?? true,
      isPro,
      createdAt: agent.created_at,
      stats: {
        activeListingsCount: activeProperties.length,
        soldCount,
        reviewCount,
        averageRating,
        ratingBreakdown
      }
    };

    return NextResponse.json({
      success: true,
      agent: formattedAgent,
      properties: activeProperties,
      reviews: reviewsWithData
    });
  } catch (error) {
    console.error('Error fetching agent details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
