import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // ดึงเซสชันเพื่อระบุตัวผู้ใช้ที่ทำการซื้อแพ็กเกจ
import { authOptions } from "@/lib/authOptions"; // ค่าคอนฟิก NextAuth ส่งให้ getServerSession
import { db } from "@/lib/db"; // ไคลเอนต์ Prisma สำหรับบันทึกสถานะแพ็กเกจและธุรกรรม
import { notifyUser, notifyUsers } from "@/lib/notify"; // ส่งแจ้งเตือนเกี่ยวกับการชำระเงิน/อนุมัติแพ็กเกจ
import { resolveProPlan } from "@/lib/pro"; // แปลงรอบบิล (monthly/yearly) เป็นราคา + จำนวนวัน
import { savePaymentOwner } from "@/lib/services/paymentOwnerService"; // บันทึกว่าสลิปนี้เป็นของนายหน้าคนไหน (BUG-02)
import fs from "fs"; // จัดการไฟล์สลิปการโอนเงินที่อัปโหลด
import path from "path"; // จัดการเส้นทางไฟล์สลิปที่บันทึกไว้บนเซิร์ฟเวอร์

// ประเภทรูปสลิปที่รับ → นามสกุลไฟล์ที่ระบบตั้งเอง (ห้ามใช้นามสกุลจากชื่อไฟล์ของผู้ใช้ กันอัปโหลด .html แล้วสคริปต์ทำงาน)
const SLIP_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function getUser(email: string) {
  return db.users.findUnique({ where: { email } });
}

// GET: ตรวจสอบสถานะแพ็กเกจ
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const isPro = Boolean(
    user.plan_type && 
    user.plan_type !== "basic" && 
    (!user.plan_expired_at || new Date(user.plan_expired_at) > new Date())
  );
  return NextResponse.json({ planType: user.plan_type ?? "basic", planExpiredAt: user.plan_expired_at, isPro });
}

// POST: รับไฟล์สลิป (multipart/form-data) แล้วบันทึกลง DB
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  if (user.role_id !== "agent") return NextResponse.json({ error: "เฉพาะนายหน้าเท่านั้น" }, { status: 403 });

  try {
    // รับไฟล์สลิปจาก FormData
    const formData = await req.formData();
    const slipFile = formData.get("slip") as File | null;
    if (!slipFile || typeof slipFile === "string") {
      return NextResponse.json({ error: "กรุณาแนบไฟล์รูปภาพสลิป" }, { status: 400 });
    }
    const slipExt = SLIP_EXTENSIONS[slipFile.type];
    if (!slipExt) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)" }, { status: 400 });
    }
    if (slipFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 5MB" }, { status: 400 });
    }

    // รอบบิล: monthly (299/30 วัน) หรือ yearly (2,690/365 วัน) — ค่าเริ่มต้นคือ monthly
    const billingCycle = String(formData.get("billingCycle") || "monthly");
    const plan = resolveProPlan(billingCycle);

    // บันทึกไฟล์ลง public/uploads/
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `slip_${user.id.substring(0, 8)}_${Date.now()}${slipExt}`;
    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(await slipFile.arrayBuffer()));
    const slipUrl = `/uploads/${filename}`;

    // สร้าง order + transaction ตามรอบบิลที่เลือก
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.days);

    // order + transaction + เจ้าของสลิป บันทึกพร้อมกัน (สำเร็จทั้งหมดหรือไม่บันทึกเลย)
    // ตาราง order/transaction ไม่มีคอลัมน์ผู้จ่าย → เก็บเจ้าของสลิปแยกไว้ด้วย savePaymentOwner (BUG-02)
    const { order, transaction } = await db.$transaction(async (txDb) => {
      const order = await txDb.listing_package_orders.create({
        data: { package_id: plan.packageId, start_date: startDate, end_date: endDate, status: "pending" }
      });
      const transaction = await txDb.payment_transactions.create({
        data: { order_id: order.id, amount: plan.amount, payment_method: "PromptPay", slip_url: slipUrl, status: "pending" }
      });
      await savePaymentOwner(transaction.id, user.id, txDb);
      return { order, transaction };
    });

    // แจ้งเตือน admin + agent
    // ข้อความเป็นภาษาไทยอ่านง่ายได้แล้ว — หน้า /admin/payments ไม่ได้แกะข้อมูลจากข้อความนี้อีก (ใช้ paymentOwnerService)
    const agentName = `${user.first_name} ${user.last_name}`.trim();
    const admins = await db.users.findMany({ where: { role_id: "admin" }, select: { id: true } });

    await Promise.allSettled([
      notifyUsers(admins.map(admin => admin.id), {
        title: "แจ้งชำระเงินค่าธรรมเนียมแพ็กเกจ Verified PRO",
        content: `นายหน้า ${agentName} (${user.email}) ส่งหลักฐานการชำระเงิน ${plan.amount.toLocaleString()} บาท (${plan.label}) รอการตรวจสอบสลิป`,
        type: "payment",
        linkUrl: "/admin/payments"
      }),
      notifyUser({
        userId: user.id,
        title: "บันทึกการส่งหลักฐานการชำระเงิน",
        content: `ระบบได้รับหลักฐานการชำระเงินค่าแพ็กเกจ Verified PRO (${plan.label}) เรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบภายใน 1 วันทำการ`,
        type: "payment",
        linkUrl: "/agent/upgrade"
      })
    ]);

    return NextResponse.json({ success: true, orderId: order.id, transactionId: transaction.id });
  } catch (error) {
    const err = error as Error;
    console.error("Checkout Error:", err.message);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + err.message }, { status: 500 });
  }
}
