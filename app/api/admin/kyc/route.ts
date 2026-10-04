import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // ไคลเอนต์ Prisma สำหรับดึงข้อมูลผู้ใช้ที่ยื่น KYC เป็นตัวแทน
import { getServerSession } from 'next-auth/next'; // ดึงเซสชันเพื่อยืนยันสิทธิ์ admin
import { authOptions } from '@/lib/authOptions'; // ค่าคอนฟิก NextAuth ส่งให้ getServerSession
import { notifyUser } from '@/lib/notify'; // ส่งการแจ้งเตือนผลการตรวจ KYC แก่นายหน้า

interface AdminSession {
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions) as AdminSession | null;
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending'; // pending, approved, rejected

    const statusFilter = status === 'rejected' ? { in: ['rejected', 'banned'] } : status;

    const users = await db.users.findMany({
      where: {
        role_id: 'agent',
        status: statusFilter,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        profile_image: true,
        kyc_doc: true,
        status: true,
        created_at: true,
        line_id: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(
      { success: true, users },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error("Error fetching kyc agents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions) as AdminSession | null;
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, status, reason, note } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ผลตรวจ KYC มีแค่ อนุมัติ / ปฏิเสธ / กลับไปรอตรวจ — ค่าอื่น 400 ไม่บันทึก (BUG-14)
    // หมายเหตุ: ใน DB จริงไม่มี check constraint ที่ status (เช็คแล้ว 4 ต.ค.) จึงต้องกันที่ API
    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "ผลตรวจ KYC ไม่ถูกต้อง (รับเฉพาะ approved / rejected / pending)" }, { status: 400 });
    }

    // แปลงสถานะ 'rejected' เป็น 'banned' (ระบบใช้ banned แทนการปฏิเสธ KYC — ดู BUG-29)
    const dbStatus = status === 'rejected' ? 'banned' : status;

    const updatedUser = await db.users.update({
      where: { id: userId },
      data: { status: dbStatus },
      // ส่งกลับเฉพาะฟิลด์ที่ปลอดภัย — ห้ามส่งทั้งแถว (มี password_hash) กลับไปที่ browser (BUG-15)
      select: { id: true, email: true, first_name: true, last_name: true, role_id: true, status: true }
    });

    // ส่ง In-app Notification แจ้งเตือนผลตรวจไปยังนายหน้า
    if (status === 'rejected') {
      const reasonDetail = reason ? ` (สาเหตุ: ${reason}${note ? ` - คำแนะนำเพิ่มเติม: ${note}` : ''})` : '';
      await notifyUser({
        userId,
        title: "แจ้งผลการตรวจสอบเอกสารยืนยันตัวตน (KYC)",
        content: `การยื่นเอกสารยืนยันตัวตนเป็นนายหน้าไม่ผ่านการอนุมัติ${reasonDetail} กรุณาตรวจสอบและอัปโหลดเอกสารใหม่ให้ถูกต้อง`,
        type: "kyc",
        linkUrl: "/agent/profile"
      }).catch(() => {});
    } else if (status === 'approved') {
      await notifyUser({
        userId,
        title: "ยินดีด้วย! บัญชีนายหน้าของคุณได้รับการอนุมัติแล้ว",
        content: "การยืนยันตัวตน KYC ของคุณผ่านการอนุมัติเรียบร้อยแล้ว ตอนนี้คุณสามารถลงประกาศและรับงานนำชมบ้านได้ทันที",
        type: "kyc",
        linkUrl: "/agent/dashboard"
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    const err = error as Error;
    console.error("Error updating user status:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions) as AdminSession | null;
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await db.users.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true, message: "ลบบัญชีสำเร็จ" });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
