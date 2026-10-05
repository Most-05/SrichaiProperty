import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return null;
  return session;
}

// ค่าตั้งต้นมาตรฐานสำหรับ System Configs (รวมคีย์ที่มีจริงในฐานข้อมูล PostgreSQL)
const DEFAULT_CONFIGS: Record<string, { value: string; description: string }> = {
  site_name: {
    value: "Srichai Property",
    description: "ชื่อแพลตฟอร์มอสังหาริมทรัพย์"
  },
  contact_email: {
    value: "support@srichaiproperty.com",
    description: "อีเมลฝ่ายบริการลูกค้า"
  },
  contact_phone: {
    value: "074-123-4567",
    description: "เบอร์โทรศัพท์ติดต่อส่วนกลาง"
  },
  line_oa: {
    value: "@srichaiproperty",
    description: "Line Official Account"
  },
  default_commission_rate: {
    value: "3.0",
    description: "อัตราค่าคอมมิชชั่นขั้นพื้นฐานสำหรับการปิดการขาย (%)"
  },
  max_free_listings: {
    value: "3",
    description: "จำนวนการลงประกาศอสังหาฯ ฟรีต่อบัญชีนายหน้า"
  },
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

// ความยาวสูงสุดของค่าตั้งค่า = ขนาดคอลัมน์ system_configs.value (VarChar(255) ใน prisma/schema.prisma)
const CONFIG_VALUE_MAX_LENGTH = 255;

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

    // ส่งกลับเฉพาะคีย์ที่หน้าตั้งค่ามีจริง (DEFAULT_CONFIGS) — ตาราง system_configs ยังเก็บข้อมูลภายในอื่น
    // เช่น payment_agent_<txId> (เจ้าของสลิป PRO — BUG-02) เดิมคีย์พวกนี้ถูกส่งไปหน้าตั้งค่าด้วย
    // แล้วหน้าตั้งค่าก็ส่งกลับมาเขียนทับทุกครั้งที่กดบันทึก (BUG-41)

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

    // ตรวจค่าตั้งค่าทั้งหมด "ก่อน" เขียนอะไรลงฐานข้อมูล — ถ้าข้อไหนผิด จะไม่มีอะไรถูกบันทึกครึ่งๆ กลางๆ
    if (configs != null && (typeof configs !== "object" || Array.isArray(configs))) {
      return NextResponse.json({ error: "รูปแบบข้อมูลการตั้งค่าไม่ถูกต้อง" }, { status: 400 });
    }
    const configEntries: [string, unknown][] = configs ? Object.entries(configs) : [];
    // รับเฉพาะคีย์ที่หน้าตั้งค่ามีจริง — เดิมรับคีย์อะไรก็ได้ จึงเขียนทับข้อมูลภายในในตารางเดียวกันได้
    // เช่น payment_agent_<txId> (เจ้าของสลิป PRO — BUG-02) หรือสร้างคีย์ขยะเพิ่มได้ไม่จำกัด (BUG-41)
    const unknownKeys = configEntries.map(([key]) => key).filter((key) => !Object.hasOwn(DEFAULT_CONFIGS, key));
    if (unknownKeys.length > 0) {
      return NextResponse.json({ error: `ไม่รู้จักค่าตั้งค่า: ${unknownKeys.join(", ")}` }, { status: 400 });
    }
    // ค่าต้องเป็นข้อความ/ตัวเลข/true-false และยาวไม่เกินคอลัมน์ — เดิมยาวเกิน 255 → PostgreSQL error เป็น 500
    // และอ็อบเจกต์ถูกแปลงเป็น "[object Object]" บันทึกลงไปเงียบๆ (BUG-41)
    for (const [key, val] of configEntries) {
      const label = DEFAULT_CONFIGS[key].description;
      if (!["string", "number", "boolean"].includes(typeof val)) {
        return NextResponse.json({ error: `ค่า "${label}" ไม่ถูกต้อง` }, { status: 400 });
      }
      if (String(val).length > CONFIG_VALUE_MAX_LENGTH) {
        return NextResponse.json({ error: `ค่า "${label}" ยาวได้ไม่เกิน ${CONFIG_VALUE_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
      }
    }

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
    if (configEntries.length > 0) {
      for (const [key, val] of configEntries) {
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
