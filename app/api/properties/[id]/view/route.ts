/**
 * ==============================================================================
 * API Endpoint สำหรับเพิ่มยอดเข้าชมอสังหาริมทรัพย์ (Property View Counter API)
 * /app/api/properties/[id]/view/route.ts
 * ==============================================================================
 * วัตถุประสงค์หลัก:
 * 1. นับจำนวนครั้งที่มีผู้เปิดเข้ามาดูหน้ารายละเอียดอสังหาริมทรัพย์ (views_count)
 * 2. ทำงานแบบสาธารณะ (Public Endpoint) ไม่จำเป็นต้องล็อกอินก่อนใช้งาน
 * 3. ใช้คำสั่ง Atomic Increment (`views_count: { increment: 1 }`) ของ Prisma เพื่อป้องกันปัญหา Race Condition
 * 4. หากเกิดข้อผิดพลาดในการนับยอดวิว จะคืนค่า `{ success: false }` แบบเงียบๆ (Silent Failure) 
 *    เพื่อไม่ให้กระทบกับการแสดงผลหลักของหน้ารายละเอียดบ้าน
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // ดึงเซสชันเพื่อดูว่าคนเปิดดูคือเจ้าของประกาศเองหรือไม่
import { authOptions } from "@/lib/authOptions"; // ค่าคอนฟิก NextAuth ส่งให้ getServerSession
import { db } from "@/lib/db"; // ไคลเอนต์ Prisma สำหรับเพิ่มจำนวนยอดเข้าชมแบบ atomic
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"; // กันนับยอดวิวซ้ำจากคนเดิมที่รีเฟรชรัวๆ

// 🔑 KEYWORD: กันปั่นยอดวิวบ้าน
// 1 IP นับได้ 1 วิวต่อบ้าน 1 หลัง ใน 30 นาที — รีเฟรชกี่รอบก็ไม่เพิ่ม
// เดิมยิงกี่ครั้งก็เพิ่มทุกครั้ง กด F5 ค้างไว้ยอดวิวพุ่งได้ไม่จำกัด
const VIEW_WINDOW_MS = 30 * 60 * 1000;

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. ดึง ID ของอสังหาริมทรัพย์จาก URL Dynamic Route (รองรับ Next.js 15 Async Params)
    const { id } = await context.params;

    // 1.1 ถ้า IP นี้เพิ่งดูบ้านหลังนี้ไปแล้วภายใน 30 นาที ให้จบเงียบๆ ไม่ต้องนับซ้ำ
    //     ตอบ success กลับไปตามปกติเพื่อไม่ให้หน้าเว็บแสดง error ให้ผู้ใช้เห็น (ไม่ใช่ความผิดเขา)
    if (!checkRateLimit(`view:${getClientIp(req)}:${id}`, 1, VIEW_WINDOW_MS)) {
      return NextResponse.json({ success: true, counted: false });
    }

    // 🔑 KEYWORD: ไม่นับวิวเมื่อเจ้าของบ้านเปิดดูเอง
    // 1.2 นายหน้าเปิดดูประกาศตัวเอง (เช่น เช็คว่าหน้าตาออกมาโอเคไหม) ไม่ควรถูกนับเป็นยอดวิว
    //     เพราะยอดวิวมีไว้วัดความสนใจจากผู้ซื้อจริง ถ้านับตัวเองด้วยสถิติจะเพี้ยน
    const session = await getServerSession(authOptions);
    const viewerId = (session?.user as { id?: string } | undefined)?.id;
    if (viewerId) {
      const property = await db.properties.findUnique({ where: { id }, select: { agent_id: true } });
      if (property?.agent_id === viewerId) {
        return NextResponse.json({ success: true, counted: false });
      }
    }

    // 2. อัปเดตเพิ่มยอดเข้าชมแบบ Atomic Increment (+1) ในตาราง properties
    //    และบันทึก Log การเข้าชมครั้งนี้ไว้ในตาราง property_views เพื่อใช้ทำกราฟเทรนด์รายวัน/เดือน/ปี
    await db.$transaction([
      db.properties.update({
        where: { id },
        data: { views_count: { increment: 1 } }
      }),
      db.property_views.create({
        data: { property_id: id }
      })
    ]);

    return NextResponse.json({ success: true, counted: true });
  } catch {
    // ป้องกันการขัดจังหวะการทำงานหลักของหน้าเว็บ หากเกิด Error จะไม่แสดง Alert ใดๆ
    return NextResponse.json({ success: false });
  }
}
