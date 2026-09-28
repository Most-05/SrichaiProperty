import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return null;
  return session;
}

// ค่าตั้งต้นมาตรฐานสำหรับ System Configs
const DEFAULT_CONFIGS: Record<string, { value: string; description: string }> = {
  sla_moderation_hours: {
    value: "24",
    description: "กรอบเวลา SLA สำหรับการตรวจสอบและอนุมัติประกาศอสังหาริมทรัพย์ (ชั่วโมง)"
  },
  noshow_penalty_threshold: {
    value: "3",
    description: "จำนวนครั้งที่ลูกค้าเบี้ยวนัด (No-show) สูงสุด ก่อนระบบจะขึ้นเตือนความเสี่ยงต่อนายหน้า"
  },
  max_upload_size_mb: {
    value: "10",
    description: "ขนาดไฟล์อัปโหลดรูปภาพและเอกสารสูงสุดต่อไฟล์ (MB)"
  },
  system_banner_enabled: {
    value: "false",
    description: "เปิด/ปิด การแสดงผลแถบประกาศพิเศษด้านบนสุดของเว็บไซต์"
  },
  system_banner_type: {
    value: "info",
    description: "ประเภทของแถบประกาศหน้าเว็บ: info (ฟ้า), warning (ส้ม), maintenance (แดง)"
  },
  system_banner_text: {
    value: "ระบบเปิดให้บริการตามปกติ ยินดีต้อนรับสู่ Srichai Property",
    description: "ข้อความที่จะแสดงในแถบประกาศหน้าเว็บ"
  },
  maintenance_mode: {
    value: "false",
    description: "เปิดใช้งานโหมดปิดปรับปรุงระบบชั่วคราวสำหรับผู้ใช้งานทั่วไป"
  },
  maintenance_message: {
    value: "ระบบกำลังปิดปรับปรุงชั่วคราวเพื่ออัปเกรดประสิทธิภาพ กรุณากลับมาใหม่อีกครั้งในภายหลัง",
    description: "ข้อความแจ้งเตือนเมื่อเปิดโหมดปิดปรับปรุงระบบ"
  }
};

// GET: ดึงรายการตั้งค่าระบบทั้งหมด
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [packages, rawConfigs] = await Promise.all([
      db.listing_packages.findMany({
        orderBy: { id: "asc" }
      }),
      db.system_configs.findMany()
    ]);

    // สร้าง Map จากค่าที่มีในตาราง
    const dbConfigMap = new Map(rawConfigs.map(c => [c.key, c.value]));

    // รวมค่าจาก DB กับค่าตั้งต้น
    const configs: Record<string, string> = {};
    for (const [key, meta] of Object.entries(DEFAULT_CONFIGS)) {
      configs[key] = dbConfigMap.get(key) ?? meta.value;
    }

    // รวมคีย์อื่นๆ นอกเหนือจาก Default ถ้ามี
    for (const c of rawConfigs) {
      if (!configs[c.key]) {
        configs[c.key] = c.value;
      }
    }

    return NextResponse.json({
      success: true,
      packages: packages.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        maxDurationDays: p.max_duration_days
      })),
      configs
    });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลการตั้งค่าได้" }, { status: 500 });
  }
}

// PATCH: บันทึกการตั้งค่าระบบและแพ็กเกจ
export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { packages, configs } = body;

    // 1. อัปเดตราคาและระยะเวลาแพ็กเกจ
    if (Array.isArray(packages)) {
      for (const p of packages) {
        if (p.id) {
          await db.listing_packages.update({
            where: { id: Number(p.id) },
            data: {
              price: Number(p.price),
              max_duration_days: Number(p.maxDurationDays)
            }
          });
        }
      }
    }

    // 2. อัปเดตค่า System Configs ในฐานข้อมูล
    if (configs && typeof configs === "object") {
      const entries = Object.entries(configs);
      for (const [key, val] of entries) {
        const desc = DEFAULT_CONFIGS[key]?.description || "System Setting";
        await db.system_configs.upsert({
          where: { key },
          create: {
            key,
            value: String(val),
            description: desc,
            updated_at: new Date()
          },
          update: {
            value: String(val),
            updated_at: new Date()
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกการตั้งค่าได้" }, { status: 500 });
  }
}
