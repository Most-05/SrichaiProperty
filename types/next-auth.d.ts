/**
 * ==============================================================================
 * การขยายประเภทข้อมูลระบบยืนยันตัวตน NextAuth (NextAuth Type Augmentation)
 * /types/next-auth.d.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - ประกาศ Type เพิ่มเติมให้ NextAuth รู้จักฟิลด์เฉพาะของโปรเจกต์ Srichai Property
 *   (role, phone, status, id)
 * - ป้องกันไม่ให้โค้ดส่วนอื่นต้องพิมพ์ type assertion `as {...}` เองซ้ำๆ
 * - เชื่อมโยงกับการสร้าง Token ใน lib/authOptions.ts และการดักสิทธิ์ใน proxy.ts
 *
 * [SEARCH: NEXTAUTH_TYPE_AUGMENTATION]
 * [AUTH: นิยามประเภทข้อมูลความปลอดภัย]
 * ==============================================================================
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      phone?: string | null;
      status?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    // role เป็น optional เพราะตอน login ผ่าน Google/Facebook (profile() ของแต่ละ provider)
    // ระบบยังไม่รู้ role จริง — ค่าจริงถูกกำหนดทีหลังใน jwt callback (query DB) เท่านั้น
    role?: string;
    phone?: string | null;
    status?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    phone?: string | null;
    status?: string | null;
  }
}
