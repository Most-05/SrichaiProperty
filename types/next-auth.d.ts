// ประกาศ type เพิ่มเติมให้ next-auth รู้จักฟิลด์ที่โปรเจกต์นี้ใส่เข้าไปเอง
// (role, phone, status, id) — ของเดิม next-auth ไม่มีฟิลด์พวกนี้ ทำให้ทุกจุดที่เคยอ่าน
// session.user ต้อง `as {...}` เอาเอง กระจายอยู่หลายไฟล์ ไฟล์นี้รวมไว้ที่เดียว
// ดู lib/authOptions.ts ว่าฟิลด์พวกนี้ถูกใส่เข้า token/session ตอนไหนบ้าง

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
