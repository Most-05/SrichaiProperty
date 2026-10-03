import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // ดึงเซสชันเพื่อยืนยันว่าเป็นนายหน้าเจ้าของประกาศ
import { authOptions } from "@/lib/authOptions"; // ค่าคอนฟิก NextAuth ส่งให้ getServerSession
import { db } from "@/lib/db"; // ไคลเอนต์ Prisma สำหรับดึง/แก้ไข/ลบข้อมูลอสังหาริมทรัพย์
import { notifyUser, notifyUsers } from "@/lib/notify"; // ส่งแจ้งเตือนผู้ใช้ในระบบ
import { validateSlotInput, ACTIVE_APPOINTMENT_STATUSES } from "@/lib/services/viewingSlotService"; // ตรวจวัน+รอบของรอบว่างที่เพิ่มใหม่ (ห้ามย้อนหลัง) + สถานะนัดที่ยังค้างอยู่
import { PROPERTY_STATUS_CLOSED } from "@/lib/constants"; // สถานะประกาศที่นายหน้าปิดแล้ว (แทนการลบจริง)
import { findUsersToAlertForNewSlots, buildSavedPropertyAlert } from "@/lib/services/savedPropertyAlertService"; // แจ้งลูกค้าที่บันทึกบ้านไว้เมื่อมีรอบเข้าชมเพิ่ม

/**
 * ==============================================================================
 * API Route: /api/properties/[id] (จัดการอสังหาริมทรัพย์รายหลัง)
 * ==============================================================================
 * วัตถุประสงค์หลัก:
 * 1. GET    - ดึงข้อมูลบ้าน 1 หลัง พร้อมรูปภาพและรอบเวลานัดหมาย (สำหรับโหลดใส่ฟอร์มหน้าแก้ไข)
 * 2. PATCH  - อัปเดตรายละเอียดบ้าน รูปภาพชุดใหม่ และเพิ่ม/ลบรอบเวลานัดหมายเข้าชม
 * 3. DELETE - ปิดประกาศ (เปลี่ยนสถานะเป็น closed ไม่ลบจริง เพื่อเก็บนัด/รีวิว/ประวัติไม่มาตามนัด/แชทไว้)
 * *หมายเหตุ: ทุกวิธี (GET, PATCH, DELETE) ต้องผ่านการยืนยันสิทธิ์ว่าเป็นนายหน้าเจ้าของบ้านจริงเท่านั้น
 * ==============================================================================
 */

// Helper 1: ฟังก์ชันแปลงวัตถุ Date ให้เป็นข้อความวันที่รูปแบบ "YYYY-MM-DD"
const toDateKey = (d: Date) => d.toISOString().split("T")[0];

// Helper 2: ฟังก์ชันตรวจสอบสิทธิ์นายหน้าและยืนยันว่าเป็นเจ้าของประกาศหลังนี้จริง
async function requireOwnerAgent(propertyId: string) {
  // 1. ตรวจสอบการเข้าสู่ระบบและสิทธิ์การใช้งาน (ต้องเป็นบทบาท 'agent')
  const session = await getServerSession(authOptions) as { user?: { id?: string; name?: string; role?: string; email?: string } } | null;
  if (!session?.user?.id || session.user.role !== "agent") {
    return { error: NextResponse.json({ error: "อนุญาตเฉพาะบัญชีนายหน้าเท่านั้น" }, { status: 401 }) };
  }

  // 2. ตรวจสอบว่ามีประกาศรหัสนี้ในฐานข้อมูลหรือไม่
  const property = await db.properties.findUnique({ where: { id: propertyId } });
  // ประกาศที่ปิดแล้วถือว่าไม่มีให้แก้ไข/ปิดซ้ำ
  if (!property || property.status === PROPERTY_STATUS_CLOSED) {
    return { error: NextResponse.json({ error: "ไม่พบประกาศอสังหาริมทรัพย์หลังนี้" }, { status: 404 }) };
  }

  // 3. ตรวจสอบความเป็นเจ้าของ: รหัสนายหน้าในประกาศ (agent_id) ต้องตรงกับผู้ใช้งานปัจจุบัน (session.user.id)
  if (property.agent_id !== session.user.id) {
    return { error: NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขประกาศหลังนี้" }, { status: 403 }) };
  }

  return { property, user: session.user, error: null };
}

// ==============================================================================
// 1. GET: ดึงข้อมูลบ้าน 1 หลัง พร้อมรูปภาพและรอบเวลานัดหมาย (สำหรับหน้าแก้ไขนายหน้า)
// ==============================================================================
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    // ตรวจสอบสิทธิ์ความเป็นเจ้าของก่อนดึงข้อมูล
    const { error } = await requireOwnerAgent(id);
    if (error) return error;

    // ดึงข้อมูลเชิงลึกเพิ่มเติม รวมตารางรูปภาพ (property_images) และรอบเวลานัดหมาย (property_viewing_slots)
    const fullProp = await db.properties.findUnique({
      where: { id },
      include: {
        users: { select: { first_name: true, last_name: true, phone: true, line_id: true } },
        property_images: { orderBy: { order_index: "asc" } },
        property_viewing_slots: { orderBy: [{ available_date: "asc" }, { time_slot: "asc" }] }
      }
    });

    if (!fullProp) {
      return NextResponse.json({ error: "ไม่พบประกาศอสังหาริมทรัพย์หลังนี้" }, { status: 404 });
    }

    // จัดฟอร์แมตข้อมูลส่งกลับไปให้ฟอร์มหน้าบ้านใช้งาน
    const formatted = {
      id: fullProp.id,
      title: fullProp.title,
      type_id: fullProp.type_id,
      listing_type: fullProp.listing_type === "rent" ? "rent" : "sale",
      price: Number(fullProp.price),
      description: fullProp.description || "",
      bedrooms: fullProp.bedrooms || 0,
      bathrooms: fullProp.bathrooms || 0,
      area_sqm: fullProp.area_sqm ? Number(fullProp.area_sqm) : 0,
      location: fullProp.location,
      province_id: fullProp.province_id,
      amphure_id: fullProp.amphure_id,
      district_id: fullProp.district_id,
      
      latitude: fullProp.latitude ? Number(fullProp.latitude) : null,
      longitude: fullProp.longitude ? Number(fullProp.longitude) : null,
      
      commonFee: fullProp.common_fee ? Number(fullProp.common_fee) : null,
      parking: fullProp.parking_spaces ?? null,
      floors: fullProp.floors ?? null,
      ownership: fullProp.ownership_type || null,
      status: fullProp.status,
      rejectReason: fullProp.reject_reason || null,
      agentName: fullProp.users ? `${fullProp.users.first_name} ${fullProp.users.last_name}` : "ไม่ระบุตัวแทน",
      agentPhone: fullProp.users?.phone || "081-234-5678",
      lineId: fullProp.users?.line_id || null,
      images: fullProp.property_images.map((img) => img.image_url)
    };

    // จัดฟอร์แมตรายการรอบเวลานัดหมาย
    const slots = fullProp.property_viewing_slots.map((s) => ({
      id: s.id,
      date: toDateKey(s.available_date),
      timeSlot: s.time_slot,
      isBooked: Boolean(s.is_booked)
    }));

    return NextResponse.json({ success: true, property: formatted, slots });
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลประกาศล้มเหลว: " + (error as Error).message }, { status: 500 });
  }
}

// ==============================================================================
// 2. PATCH: บันทึกการแก้ไขข้อมูลบ้าน, รูปภาพ และรอบเวลานัดหมาย
// ==============================================================================
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    const { property, user, error } = await requireOwnerAgent(id);
    if (error) return error;
    if (!property || !user?.id) {
      return NextResponse.json({ error: "ไม่พบข้อมูลหรือไม่มีสิทธิ์" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title, type_id, price, description, listing_type, listingType,
      bedrooms, bathrooms, area_sqm, location,
      province_id, amphure_id, district_id, latitude, longitude, images, viewingSlots, status: newStatus,
      commonFee, parking, floors, ownership 
    } = body;

    // ตรวจสอบความถูกต้องของข้อมูล (Validation)
    if (!title || !price || !location) {
      return NextResponse.json({ error: "กรุณากรอกหัวข้อประกาศ ราคา และที่อยู่ให้ครบถ้วน" }, { status: 400 });
    }

    if (Number(price) <= 0) {
      return NextResponse.json({ error: "ราคาต้องเป็นตัวเลขมากกว่า 0" }, { status: 400 });
    }

    // รอบว่างที่ "เพิ่มใหม่" ห้ามเป็นวันที่ผ่านแล้ว / รอบหรือวันที่ผิดรูปแบบ (BUG-12)
    // ฟอร์มแก้ไขส่งรอบทั้งหมดกลับมา รวมรอบเก่าที่ผ่านวันไปแล้ว → รอบที่มีอยู่แล้วใน DB ข้ามการเช็ค ไม่งั้นบันทึกประกาศไม่ได้
    if (Array.isArray(viewingSlots)) {
      const existingSlots = await db.property_viewing_slots.findMany({
        where: { property_id: id },
        select: { available_date: true, time_slot: true }
      });
      const existingSlotKeys = new Set(existingSlots.map((s) => `${toDateKey(s.available_date)}|${s.time_slot}`));
      for (const slot of viewingSlots) {
        if (existingSlotKeys.has(`${slot?.date}|${slot?.timeSlot}`)) continue;
        const slotError = validateSlotInput(slot?.date, slot?.timeSlot);
        if (slotError) {
          return NextResponse.json({ error: `รอบวันว่าง ${slot?.date ?? ""}: ${slotError}` }, { status: 400 });
        }
      }
    }

    if (area_sqm !== undefined && area_sqm !== null && area_sqm !== "" && Number(area_sqm) < 0) {
      return NextResponse.json({ error: "พื้นที่ต้องไม่ติดลบ" }, { status: 400 });
    }

    if ((bedrooms !== undefined && Number(bedrooms) < 0) || (bathrooms !== undefined && Number(bathrooms) < 0)) {
      return NextResponse.json({ error: "จำนวนห้องต้องไม่ติดลบ" }, { status: 400 });
    }

    if ((parking !== undefined && parking !== null && parking !== "" && Number(parking) < 0) ||
        (floors !== undefined && floors !== null && floors !== "" && Number(floors) < 0)) {
      return NextResponse.json({ error: "จำนวนที่จอดรถ/ชั้น ต้องไม่ติดลบ" }, { status: 400 });
    }
    if (commonFee !== undefined && commonFee !== null && commonFee !== "" && Number(commonFee) < 0) {
      return NextResponse.json({ error: "ค่าส่วนกลางต้องไม่ติดลบ" }, { status: 400 });
    }

    const resolvedListingType = listing_type ?? listingType;

    // 2.1 เตรียมข้อมูลที่จะอัปเดตลงในตาราง properties
    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (type_id) updateData.type_id = parseInt(String(type_id));
    if (resolvedListingType) updateData.listing_type = resolvedListingType === "rent" ? "rent" : "sale";
    if (price) updateData.price = parseFloat(String(price));
    if (description !== undefined) updateData.description = description;
    if (bedrooms !== undefined && bedrooms !== null && bedrooms !== "") updateData.bedrooms = parseInt(String(bedrooms));
    if (bathrooms !== undefined && bathrooms !== null && bathrooms !== "") updateData.bathrooms = parseInt(String(bathrooms));
    if (area_sqm !== undefined && area_sqm !== null && area_sqm !== "") updateData.area_sqm = parseFloat(String(area_sqm));
    if (location) updateData.location = location;
    if (province_id) updateData.province_id = parseInt(String(province_id));
    if (amphure_id) updateData.amphure_id = parseInt(String(amphure_id));
    if (district_id) updateData.district_id = parseInt(String(district_id));
    
    // เช็ค !== undefined/null (ไม่ใช่ if (latitude) เฉยๆ) เพราะ 0 เป็นพิกัดที่ถูกต้องได้ (แม้ไม่น่าเกิดกับบ้านในไทย)
    if (latitude !== undefined && latitude !== null) updateData.latitude = parseFloat(String(latitude));
    if (longitude !== undefined && longitude !== null) updateData.longitude = parseFloat(String(longitude));
    
    if (commonFee !== undefined && commonFee !== null && commonFee !== "") updateData.common_fee = parseFloat(String(commonFee));
    if (parking !== undefined && parking !== null && parking !== "") updateData.parking_spaces = parseInt(String(parking));
    if (floors !== undefined && floors !== null && floors !== "") updateData.floors = parseInt(String(floors));
    if (ownership !== undefined && ownership !== null && ownership !== "") updateData.ownership_type = ownership;
    if (newStatus) updateData.status = newStatus;
    const wasRejected = property.status === "rejected";
    const wasPending = property.status === "pending";

    // กฎพิเศษ: กรณีประกาศเคยถูกตีกลับ (rejected) เมื่อนายหน้าแก้ไขและกดบันทึก ให้เปลี่ยนเป็น 'pending' เพื่อส่งกลับเข้าคิวอนุมัติใหม่อัตโนมัติ
    if (wasRejected) {
      updateData.status = "pending";
      updateData.reject_reason = null; // ล้างเหตุผลการตีกลับเดิมออก
    }

    const updated = await db.properties.update({
      where: { id },
      data: updateData
    });

    // 🔔 ส่งแจ้งเตือนเมื่อมีการแก้ไขและส่งประกาศให้ตรวจสอบใหม่
    const admins = await db.users.findMany({ where: { role_id: "admin" }, select: { id: true } });
    const agentName = user.name || (user.email ? user.email.split("@")[0] : "นายหน้า");

    if (wasRejected && admins.length > 0) {
      notifyUsers(admins.map((a) => a.id), {
        title: "นายหน้าแก้ไขประกาศและส่งตรวจใหม่",
        content: `นายหน้า ${agentName} ได้แก้ไขประกาศ "${updated.title}" ตามข้อแนะนำและส่งให้ตรวจสอบใหม่อีกครั้ง`,
        type: "property",
        linkUrl: "/admin/moderation"
      }).catch((e) => console.error("แจ้งเตือนแอดมินหลังแก้ไขประกาศไม่สำเร็จ:", e));

      notifyUser({
        userId: user.id,
        title: "ส่งประกาศที่แก้ไขเรียบร้อยแล้ว",
        content: `ประกาศ "${updated.title}" ได้รับการแก้ไขและส่งเข้าคิวรอผู้ดูแลระบบตรวจสอบใหม่อีกครั้งแล้ว`,
        type: "property",
        linkUrl: "/agent/dashboard"
      }).catch((e) => console.error("แจ้งเตือนนายหน้าหลังแก้ไขประกาศไม่สำเร็จ:", e));
    } else if (wasPending && admins.length > 0) {
      notifyUsers(admins.map((a) => a.id), {
        title: "นายหน้าอัปเดตข้อมูลประกาศ",
        content: `นายหน้า ${agentName} ได้ปรับปรุงข้อมูลประกาศ "${updated.title}" (สถานะ: รอการตรวจสอบ)`,
        type: "property",
        linkUrl: "/admin/moderation"
      }).catch((e) => console.error("แจ้งเตือนแอดมินหลังอัปเดตประกาศไม่สำเร็จ:", e));
    }

    // 2.2 อัปเดตรูปภาพ: ลบรูปเดิมทั้งหมดของประกาศนี้ออก แล้วบันทึกชุดรูปภาพใหม่ตามลำดับ
    if (Array.isArray(images)) {
      await db.property_images.deleteMany({ where: { property_id: id } });
      if (images.length > 0) {
        await db.property_images.createMany({
          data: images.map((url: string, index: number) => ({
            property_id: id,
            image_url: url,
            order_index: index
          }))
        });
      }
    }

    // 2.3 อัปเดตรอบเวลานัดหมาย (Syncing Viewing Slots)
    if (Array.isArray(viewingSlots)) {
      const existing = await db.property_viewing_slots.findMany({ where: { property_id: id } });
      const incomingKeys = new Set(viewingSlots.map((s: { date: string; timeSlot: string }) => `${s.date}|${s.timeSlot}`));
      const existingKeys = new Set(existing.map((s) => `${toDateKey(s.available_date)}|${s.time_slot}`));

      // ลบรอบที่นายหน้าเอาออก (เฉพาะรอบที่ยังไม่มีลูกค้าจองเท่านั้น เพื่อไม่ให้กระทบคิวนัดหมายของลูกค้า)
      const toDelete = existing.filter((s) => !s.is_booked && !incomingKeys.has(`${toDateKey(s.available_date)}|${s.time_slot}`));
      if (toDelete.length > 0) {
        await db.property_viewing_slots.deleteMany({
          where: { id: { in: toDelete.map((s) => s.id) } }
        });
      }

      // เพิ่มรอบใหม่ที่เพิ่งถูกเลือกเข้ามา — ไม่กันชนกับบ้านหลังอื่นตรงนี้แล้ว
      // จุดกันชนจริงย้ายไปเช็คตอนลูกค้ากดจอง (ดู hasAgentBookingConflict ใน api/appointments)
      const toCreate = viewingSlots.filter((s: { date: string; timeSlot: string }) => !existingKeys.has(`${s.date}|${s.timeSlot}`));
      if (toCreate.length > 0) {
        await db.property_viewing_slots.createMany({
          data: toCreate.map((s: { date: string; timeSlot: string }) => ({
            property_id: id,
            available_date: new Date(s.date),
            time_slot: s.timeSlot,
            is_booked: false
          })),
          skipDuplicates: true
        });

        // 🔑 KEYWORD: แจ้งลูกค้าที่บันทึกบ้านหลังนี้ไว้ว่ามีรอบเข้าชมเพิ่มแล้ว
        // ยิงแล้วปล่อย ไม่ await เพื่อไม่ให้การแจ้งเตือนถ่วงการบันทึกประกาศ
        findUsersToAlertForNewSlots(id)
          .then((userIds) => {
            if (userIds.length === 0) return;
            const msg = buildSavedPropertyAlert(id, updated.title, toCreate.length);
            return notifyUsers(userIds, { title: msg.title, content: msg.content, type: msg.type, linkUrl: msg.linkUrl });
          })
          .catch((e) => console.error('แจ้งเตือนลูกค้าที่บันทึกบ้านไว้ไม่สำเร็จ:', e));
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: "บันทึกการแก้ไขประกาศล้มเหลว: " + (error as Error).message }, { status: 500 });
  }
}

// ==============================================================================
// 3. DELETE: ปิดประกาศ (ไม่ลบจริง เก็บประวัติไว้)
// ==============================================================================
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    // ตรวจสอบสิทธิ์ความเป็นเจ้าของก่อนอนุญาตให้ลบ
    const { error } = await requireOwnerAgent(id);
    if (error) return error;

    // ยังมีนัดค้าง (รอยืนยัน/ยืนยันแล้ว/รอลูกค้ารับวันใหม่) → ห้ามปิด ให้นายหน้าจัดการนัดก่อน
    const activeCount = await db.appointments.count({
      where: { property_id: id, status: { in: ACTIVE_APPOINTMENT_STATUSES } }
    });
    if (activeCount > 0) {
      return NextResponse.json(
        { error: `ยังมีนัดหมายที่ค้างอยู่ ${activeCount} รายการ กรุณายกเลิกหรือปิดนัดเหล่านั้นก่อนลบประกาศ` },
        { status: 409 }
      );
    }

    // ไม่ลบจริง (ถ้าลบ ฐานข้อมูลจะลบนัด/รีวิว/ประวัติไม่มาตามนัด/แชทตามไปด้วย — BUG-05)
    // เปลี่ยนเป็น closed แทน → หายจากหน้าลูกค้าและรายการของนายหน้า แต่ประวัติยังอยู่ครบ
    await db.properties.update({ where: { id }, data: { status: PROPERTY_STATUS_CLOSED } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "ลบประกาศล้มเหลว: " + (error as Error).message }, { status: 500 });
  }
}