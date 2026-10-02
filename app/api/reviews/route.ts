import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // ดึงเซสชันเพื่อระบุตัวลูกค้าที่รีวิว
import { authOptions } from "@/lib/authOptions"; // ค่าคอนฟิก NextAuth ส่งให้ getServerSession
import { db } from "@/lib/db"; // ไคลเอนต์ Prisma สำหรับบันทึก/ดึงรีวิวและคำนวณคะแนนเฉลี่ย
import { notifyUser } from "@/lib/notify"; // ส่งแจ้งเตือนไปยังนายหน้าเมื่อมีรีวิวใหม่

/**
 * ==============================================================================
 * API Endpoint สำหรับระบบรีวิวและให้คะแนนดาวนายหน้า (Agent Reviews API Route)
 * /app/api/reviews/route.ts
 * ==============================================================================
 * วัตถุประสงค์หลัก:
 * 1. GET: ดึงรายการรีวิวและคำนวณคะแนนเฉลี่ยดาว (Average Rating) ของนายหน้ารายนั้นๆ
 * 2. POST: บันทึก/อัปเดตรีวิวจากลูกค้า (Upsert) พร้อมส่งการแจ้งเตือนไปยังนายหน้า
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. GET: ดึงรีวิวและคะแนนเฉลี่ยดาวของนายหน้าตาม agentId
// ------------------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const propertyId = searchParams.get("propertyId");

    if (!agentId && !propertyId) {
      return NextResponse.json({ error: "กรุณาระบุ agentId หรือ propertyId" }, { status: 400 });
    }

    const appointmentFilter: { agent_id?: string; property_id?: string } = {};
    if (agentId) appointmentFilter.agent_id = agentId;
    if (propertyId) appointmentFilter.property_id = propertyId;

    // ดึงรายการรีวิวทั้งหมดใน Query เดียว โดยใช้ Prisma Relation Filter
    const reviewsList = await db.reviews.findMany({
      where: { appointments: appointmentFilter },
      include: {
        appointments: {
          include: {
            users_appointments_customer_idTousers: {
              select: { first_name: true, last_name: true, profile_image: true }
            },
            properties: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    // คำนวณคะแนนเฉลี่ยดาว
    const count = reviewsList.length;
    const totalRating = reviewsList.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = count > 0 ? (totalRating / count).toFixed(1) : "0.0";

    const formattedReviews = reviewsList.map(r => {
      const customer = r.appointments?.users_appointments_customer_idTousers;
      return {
        id: r.id,
        rating: r.rating || 5,
        comment: r.comment || "",
        createdAt: r.created_at,
        customerName: customer ? `${customer.first_name} ${customer.last_name}` : "ลูกค้าทั่วไป",
        customerImage: customer?.profile_image,
        propertyTitle: r.appointments?.properties?.title || "อสังหาริมทรัพย์"
      };
    });

    return NextResponse.json({
      success: true,
      averageRating: parseFloat(averageRating),
      totalReviews: count,
      reviews: formattedReviews
    });
  } catch (error) {
    console.error("GET Reviews Error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลรีวิวล้มเหลว: " + (error as Error).message }, { status: 500 });
  }
}

// ------------------------------------------------------------------------------
// 2. POST: บันทึกรีวิวใหม่ หรือ อัปเดตรีวิวเดิมจากลูกค้า
// ------------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
    }

    const user = await db.users.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ในระบบ" }, { status: 404 });
    }

    const { appointmentId, rating, comment } = await req.json();

    if (!appointmentId || !rating) {
      return NextResponse.json({ error: "กรุณาระบุรหัสนัดหมายและคะแนนดาว" }, { status: 400 });
    }

    // คะแนนต้องเป็นจำนวนเต็ม 1-5 เท่านั้น (เดิมรับค่าอะไรก็ได้ เช่น 999 หรือ -5 → คะแนนเฉลี่ยนายหน้าเพี้ยน)
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "คะแนนต้องเป็นตัวเลข 1 ถึง 5 ดาว" }, { status: 400 });
    }

    // รหัสนัดผิดรูปแบบ (ไม่ใช่ UUID) → ตอบ 400 แทนการปล่อยให้ Prisma error เป็น 500
    if (typeof appointmentId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId)) {
      return NextResponse.json({ error: "รหัสนัดหมายไม่ถูกต้อง" }, { status: 400 });
    }

    const appointment = await db.appointments.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการนัดหมายนี้" }, { status: 404 });
    }

    if (appointment.customer_id !== user.id) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์รีวิวการนัดหมายนี้" }, { status: 403 });
    }

    // รีวิวได้เฉพาะนัดที่นายหน้ายืนยันแล้วว่าเข้าชมจริง (completed) — ตรงกับหน้าเว็บที่โชว์ปุ่มรีวิวเฉพาะนัดที่เสร็จแล้ว
    // (เดิม API ไม่เช็ค ทำให้รีวิวนัดที่ยังไม่ได้ไปดูบ้าน / ถูกยกเลิก / ไม่มาตามนัด ได้)
    if (appointment.status !== "completed") {
      return NextResponse.json({ error: "รีวิวได้เฉพาะนัดหมายที่เข้าชมเสร็จแล้วเท่านั้น" }, { status: 400 });
    }

    // บันทึก หรือ อัปเดตรีวิวกรณีเคยรีวิวไปแล้ว (Upsert)
    const newReview = await db.reviews.upsert({
      where: { appointment_id: appointmentId },
      update: {
        rating: ratingNum,
        comment: comment || ""
      },
      create: {
        appointment_id: appointmentId,
        rating: ratingNum,
        comment: comment || ""
      }
    });

    // ส่งการแจ้งเตือนไปยังนายหน้าผู้ดูแลการนัดหมาย
    if (appointment.agent_id) {
      const customerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'ลูกค้า';
      await notifyUser({
        userId: appointment.agent_id,
        title: "การประเมินความพึงพอใจการให้บริการ",
        content: `คุณ ${customerName} ได้บันทึกการประเมินบริการระดับ ${rating} ดาว สำหรับการนำชมโครงการ${comment ? `: "${comment}"` : ''}`,
        type: "review",
        linkUrl: "/agent/appointments"
      }).catch(err => console.error("Notification trigger error:", err));
    }

    return NextResponse.json({ success: true, data: newReview });
  } catch (error) {
    console.error("POST Review Error:", error);
    return NextResponse.json({ error: "บันทึกรีวิวล้มเหลว: " + (error as Error).message }, { status: 500 });
  }
}
