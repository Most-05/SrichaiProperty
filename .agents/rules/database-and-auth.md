# Database, Prisma ORM & Security Rules

## 1. Database Singleton & Prisma Client
- โปรเจกต์ใช้ Prisma v7 กับ PostgreSQL ผ่าน `@prisma/adapter-pg`
- **การ Import Instance**:
  - ✅ **ถูกต้อง**: `import { db } from "@/lib/db";`
  - ❌ **ห้าม**: `import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient();` เพราะจะทำให้เกิด Connection Pool รั่วไหล (Connection Exhaustion)
- **Schema Reference**: ตรวจสอบโมเดลจาก `prisma/schema.prisma` หรือ `database_schema.md` เป็นหลัก

## 2. Security & User Credentials
- **Password Protection**:
  - เมื่อ query ข้อมูลจากตาราง `users` ห้าม select หรือ return `password_hash` กลับไปฝั่ง Client หรือใน API Response เด็ดขาด
  - ตัวอย่างการ query ปลอดภัย:
    ```typescript
    const user = await db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role_id: true,
        profile_image: true,
        // ห้าม select password_hash
      }
    });
    ```
- **Hashing**: การเปรียบเทียบรหัสผ่านใช้ `bcrypt.compare(password, user.password_hash)` และการเข้ารหัสใช้ `bcrypt.hash(password, 10)`

## 3. Handling Decimal Data Types
- คอลัมน์ที่เกี่ยวข้องกับเงินและขนาดพื้นที่ใน `schema.prisma` ถูกกำหนดเป็น `Decimal`:
  - `properties.price` (`Decimal(12, 2)`)
  - `properties.area_sqm` (`Decimal(8, 2)`)
  - `properties.common_fee` (`Decimal(10, 2)`)
  - `properties.latitude` / `properties.longitude` (`Decimal(10, 8)`, `Decimal(11, 8)`)
  - `listing_packages.price`, `sale_transactions.final_price`
- **ข้อควรระวัง**: Prisma ส่งค่า Decimal ออกมาเป็น Object ของ Prisma Decimal ไม่ใช่ JavaScript `number` ดั้งเดิม
  - ก่อนส่งไปแสดงผลใน React Component หรือ serialize เป็น JSON ต้องแปลงเป็นตัวเลขหรือฟอร์แมตสตริง:
    ```typescript
    // สำหรับคำนวณหรือส่ง JSON
    const numericPrice = Number(property.price);
    // สำหรับแสดงผล UI ภาษาไทย
    const displayPrice = Number(property.price).toLocaleString('th-TH');
    ```

## 4. Role-Based Access Control (RBAC)
- ระบบมี 3 บทบาทหลัก (`roles.id`):
  1. `customer`: ลูกค้าผู้ค้นหาอสังหาฯ, บันทึกรายการโปรด (`saved_properties`), นัดหมายชมบ้าน (`appointments`), และส่งข้อความแชท
  2. `agent`: นายหน้าผู้ลงประกาศ (`properties`), ระบุวันว่าง (`agent_availabilities`), จัดการนัดหมาย, ซื้อแพ็กเกจโปรโมต (`listing_packages`)
  3. `admin`: ผู้ดูแลระบบ ตรวจสอบและอนุมัติประกาศ (`status: 'approved' | 'rejected'`), ตรวจสอบสลิปโอนเงิน (`payment_transactions`), และรายงานการใช้งาน (`reports`)
- **การตรวจสอบสิทธิ์ใน API / Server Actions**:
  ```typescript
  import { getServerSession } from "next-auth/next";
  import { authOptions } from "@/lib/authOptions";

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  if (session.user.role !== "agent" && session.user.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
  }
  ```

## 5. API Response Format Standardization
ทุก API Route Handler ควรส่ง Response ในรูปแบบโครงสร้างเดียวกัน:
- สำเร็จ: `NextResponse.json({ success: true, data: result })`
- ข้อผิดพลาด: `NextResponse.json({ success: false, error: "ข้อความอธิบายความผิดพลาดภาษาไทย" }, { status: 400 | 401 | 403 | 404 | 500 })`
