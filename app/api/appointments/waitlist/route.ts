import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { isCustomerBlockedByNoShow } from "@/lib/services/noShowService";
import {
  WAITLIST_MAX_PER_CUSTOMER,
  countActiveWaitlist,
  findCustomerWaitlistForProperty,
  purgeExpiredWaitlist
} from "@/lib/services/waitlistService";
import { NO_SHOW_LIMIT, timeSlotRange } from "@/lib/constants";
import { validateSlotInput } from "@/lib/services/viewingSlotService"; // ตรวจวันที่ + รอบ (ตัวเดียวกับตอนจองนัด)

// ==============================================================================
// API คิวรอรอบเข้าชม (Waitlist)
// ใช้ตอนลูกค้าเจอว่ารอบที่อยากได้ถูกจองไปแล้ว จะได้ลงชื่อรอไว้
// แล้วระบบแจ้งเตือนให้เองตอนรอบนั้นถูกปล่อยคืน (ดู lib/services/waitlistService.ts)
// ==============================================================================

/** ดึงเซสชันแล้วแปลงเป็นผู้ใช้จริงในฐานข้อมูล (ใช้ซ้ำทั้ง 3 เมธอด) */
async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  return db.users.findUnique({ where: { email }, select: { id: true, role_id: true } });
}

// ------------------------------------------------------------------------------
// GET: รอบที่ลูกค้าคนนี้ลงคิวรอไว้
// - ถ้าส่ง propertyId: ส่งคืน keys ของบ้านหลังนั้น (สำหรับหน้าจองนัดหมาย)
// - ถ้าไม่ส่ง propertyId: ส่งคืนรายการคิวรอทั้งหมดของลูกค้า (สำหรับหน้าประวัตินัดหมาย)
// ------------------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const propertyId = new URL(req.url).searchParams.get("propertyId");

    await purgeExpiredWaitlist(); // เก็บกวาดคิวที่เลยวันไปแล้ว (โปรเจกต์นี้ไม่มี cron)

    if (propertyId) {
      const keys = await findCustomerWaitlistForProperty(user.id, propertyId);
      return NextResponse.json({ success: true, waitlistKeys: keys });
    }

    // กรณีไม่ได้ส่ง propertyId: ดึงรายการคิวรอทั้งหมดของลูกค้ารายนี้พร้อมข้อมูลโครงการ
    const list = await db.appointment_waitlist.findMany({
      where: {
        customer_id: user.id
      },
      include: {
        properties: {
          select: {
            id: true,
            title: true,
            price: true,
            users: {
              select: {
                first_name: true,
                last_name: true,
                phone: true
              }
            },
            property_images: {
              orderBy: { order_index: 'asc' },
              take: 1,
              select: { image_url: true }
            }
          }
        }
      },
      orderBy: {
        available_date: 'asc'
      }
    });

    const items = list.map((item) => {
      const dateStr = item.available_date instanceof Date
        ? item.available_date.toISOString().split("T")[0]
        : String(item.available_date).split("T")[0];

      return {
        id: item.id,
        propertyId: item.property_id,
        propertyName: item.properties?.title || "ไม่พบชื่ออสังหาริมทรัพย์",
        propertyPrice: item.properties?.price ? `฿${Number(item.properties.price).toLocaleString()}` : "-",
        propertyImage: item.properties?.property_images?.[0]?.image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
        agentName: item.properties?.users ? `${item.properties.users.first_name} ${item.properties.users.last_name || ''}`.trim() : "นายหน้าประจำโครงการ",
        agentPhone: item.properties?.users?.phone || "-",
        date: dateStr,
        timeSlot: item.time_slot,
        timeSlotText: item.time_slot === "afternoon" ? `ช่วงบ่าย (${timeSlotRange("afternoon")})` : `ช่วงเช้า (${timeSlotRange("morning")})`,
        notifiedAt: item.notified_at ? item.notified_at.toISOString() : null,
        createdAt: item.created_at.toISOString()
      };
    });

    return NextResponse.json({ success: true, waitlist: items });
  } catch (error) {
    return NextResponse.json({ error: "ดึงคิวรอล้มเหลว: " + (error as Error).message }, { status: 500 });
  }
}

// ------------------------------------------------------------------------------
// POST: ลงชื่อรอรอบนี้
// ------------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    // ลงคิวรอได้เฉพาะลูกค้า (กฎเดียวกับการจองนัด BUG-11) — เดิมนายหน้า/แอดมินลงคิวได้ รวมถึงบ้านของตัวเอง (BUG-37)
    if (user.role_id !== "customer") {
      return NextResponse.json({ error: "ลงคิวรอได้เฉพาะบัญชีลูกค้าเท่านั้น" }, { status: 403 });
    }

    const { propertyId, date, timeSlot } = await req.json();
    if (!propertyId || !date || !timeSlot) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ ต้องมีบ้าน วันที่ และรอบเวลา" }, { status: 400 });
    }

    // วันที่ต้องเป็น YYYY-MM-DD ที่ยังไม่ผ่าน และรอบต้องเป็น morning/afternoon (BUG-37)
    // เดิมไม่ตรวจ → ลงคิววันที่ผ่านแล้ว (2020-01-01) หรือรอบที่ไม่มีจริง ("evening") ได้ คิวค้างไม่มีวันถูกแจ้ง
    const slotError = validateSlotInput(date, timeSlot);
    if (slotError) return NextResponse.json({ error: slotError }, { status: 400 });

    // ลูกค้าที่ถูกจำกัดการจองจากประวัติเบี้ยวนัด ก็ไม่ควรลงคิวรอได้เช่นกัน
    // (ไม่งั้นพอรอบว่างก็จองไม่ได้อยู่ดี กลายเป็นแจ้งเตือนหลอกให้เสียเวลา)
    if (await isCustomerBlockedByNoShow(user.id)) {
      return NextResponse.json(
        { error: `บัญชีของคุณมีประวัติไม่มาตามนัดครบ ${NO_SHOW_LIMIT} ครั้ง จึงยังลงคิวรอไม่ได้` },
        { status: 403 }
      );
    }

    // เพดานกันลงคิวรัวทุกรอบจนแจ้งเตือนท่วมกระดิ่งตัวเอง
    if ((await countActiveWaitlist(user.id)) >= WAITLIST_MAX_PER_CUSTOMER) {
      return NextResponse.json(
        { error: `ลงคิวรอค้างไว้ได้สูงสุด ${WAITLIST_MAX_PER_CUSTOMER} รอบ กรุณายกเลิกคิวเก่าก่อน` },
        { status: 400 }
      );
    }

    // ถ้ารอบนี้ว่างอยู่แล้วก็ไม่ต้องรอ ให้จองไปเลย
    const slot = await db.property_viewing_slots.findUnique({
      where: {
        property_id_available_date_time_slot: {
          property_id: propertyId,
          available_date: new Date(date),
          time_slot: timeSlot
        }
      },
      select: { is_booked: true }
    });
    if (slot && !slot.is_booked) {
      return NextResponse.json({ error: "รอบนี้ว่างอยู่แล้ว กดจองได้เลยไม่ต้องรอคิว" }, { status: 400 });
    }

    // upsert เพราะ unique constraint กันซ้ำอยู่แล้ว กดซ้ำจึงไม่ควรขึ้น error
    await db.appointment_waitlist.upsert({
      where: {
        customer_id_property_id_available_date_time_slot: {
          customer_id: user.id,
          property_id: propertyId,
          available_date: new Date(date),
          time_slot: timeSlot
        }
      },
      update: {},
      create: {
        customer_id: user.id,
        property_id: propertyId,
        available_date: new Date(date),
        time_slot: timeSlot
      }
    });

    return NextResponse.json({ success: true, message: "ลงคิวรอเรียบร้อย จะแจ้งเตือนทันทีที่รอบนี้ว่าง" });
  } catch (error) {
    return NextResponse.json({ error: "ลงคิวรอล้มเหลว: " + (error as Error).message }, { status: 500 });
  }
}

// ------------------------------------------------------------------------------
// DELETE: ยกเลิกคิวรอ
// ------------------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { propertyId, date, timeSlot, waitlistId } = body;

    // รองรับการส่ง waitlistId โดยตรงจากหน้ารายการคิวรอ
    if (waitlistId) {
      const res = await db.appointment_waitlist.deleteMany({
        where: {
          id: waitlistId,
          customer_id: user.id
        }
      });
      return NextResponse.json({ success: true, removed: res.count });
    }

    if (!propertyId || !date || !timeSlot) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ ต้องมีบ้าน วันที่ และรอบเวลา หรือ waitlistId" }, { status: 400 });
    }

    // ผูก customer_id ของคนที่ล็อกอินเสมอ ลบคิวของคนอื่นไม่ได้แม้จะรู้ข้อมูลครบ
    const res = await db.appointment_waitlist.deleteMany({
      where: {
        customer_id: user.id,
        property_id: propertyId,
        available_date: new Date(date),
        time_slot: timeSlot
      }
    });

    return NextResponse.json({ success: true, removed: res.count });
  } catch (error) {
    return NextResponse.json({ error: "ยกเลิกคิวรอล้มเหลว: " + (error as Error).message }, { status: 500 });
  }
}
