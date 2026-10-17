/**
 * ==============================================================================
 * [SEARCH: AGENT_PORTAL_LAYOUT] [AUTH: SERVER_AGENT_SESSION_CHECK] [UI: โครงร่างหน้าจอพอร์ทัลนายหน้า]
 * โครงร่างหน้าจอสำหรับพอร์ทัลนายหน้า (Agent Portal Layout)
 * /app/agent/layout.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. ตรวจสอบสิทธิ์ Agent Session ฝั่ง Server หากไม่มีสิทธิ์ให้ redirect ไป /login/agent ทันที
 * 2. หากนายหน้ายังไม่ผ่านการอนุมัติ KYC (isPending) จะแสดงหน้า PendingAgentGate
 * 3. จัดวาง AgentNavbar ด้านบน และ AgentFooter ด้านล่างสุด
 * ==============================================================================
 */

// ฟังก์ชันดึงข้อมูล session ของผู้ใช้ที่ login อยู่ (ฝั่ง server)
import { getServerSession } from 'next-auth/next';
// ใช้สำหรับสั่งเปลี่ยนหน้า (redirect) จากฝั่ง server
import { redirect } from 'next/navigation';
// ค่า config ของ next-auth (กำหนดวิธี login, provider ต่างๆ)
import { authOptions } from '@/lib/authOptions';
// แถบเมนูด้านบนของหน้า agent
import AgentNavbar from '@/components/layout/AgentNavbar';
// ส่วนท้ายหน้า (footer) ของหน้า agent
import AgentFooter from '@/components/layout/AgentFooter';
// เลือกว่า agent ที่ยังไม่ได้รับการอนุมัติจะเห็นอะไร (PendingAgentGate หรือหน้า PDPA/ข้อกำหนด)
import PendingGateSwitch from '@/components/agent/PendingGateSwitch';

// Layout นี้จะครอบทุกหน้าที่อยู่ใน route group /agent
// เป็น Server Component (async function) เพราะต้องเช็ค session ก่อน render
export default async function AgentLayout({
  children, // เนื้อหาของแต่ละหน้าย่อยที่อยู่ภายใต้ /agent
}: {
  children: React.ReactNode;
}) {
  // ดึงข้อมูล session ปัจจุบันจากฝั่ง server (ไม่ต้องใช้ useSession ฝั่ง client)
  const session = await getServerSession(authOptions);
  // type ของ session.user.role/status ประกาศไว้ที่ types/next-auth.d.ts แล้ว ไม่ต้อง cast เอง

  // ถ้ายังไม่ login หรือ role ไม่ใช่ 'agent' -> เตะกลับไปหน้า login สำหรับ agent ทันที
  if (!session || session.user?.role !== 'agent') {
    redirect('/login/agent');
  }

  // เช็คสถานะของ agent ว่ายัง 'pending' (รออนุมัติ) หรือ 'rejected' (เอกสารไม่ผ่าน) หรือไม่
  // หากยังไม่ได้รับอนุมัติ ให้แสดงหน้าจอ PendingAgentGate เพื่อดูสถานะ/เหตุผลและอัปโหลดเอกสารใหม่
  const isPending = ['pending', 'rejected'].includes(session.user?.status || 'pending');

  return (
    // โครงหน้าหลัก: สูงอย่างน้อยเต็มจอ, จัดเรียงแนวตั้ง (navbar บน, เนื้อหากลาง, footer ล่างสุดของหน้า)
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">

      {/* แถบเมนูด้านบน แสดงตลอดทุกหน้า */}
      <AgentNavbar />

      {/* ส่วนเนื้อหาหลัก ยืดเต็มพื้นที่ที่เหลือ */}
      <main className="flex-1">
        {/* ถ้า agent ยังรออนุมัติ -> โชว์หน้า PendingAgentGate แทนเนื้อหาจริง (ยกเว้นหน้า PDPA/ข้อกำหนด อ่านได้)
            ถ้าอนุมัติแล้ว -> โชว์เนื้อหาของหน้านั้นๆ ตามปกติ (children) */}
        {isPending ? <PendingGateSwitch>{children}</PendingGateSwitch> : children}
      </main>

      {/* ส่วนท้ายหน้า อยู่ท้ายสุดของเนื้อหาเสมอ (ยังไม่ผ่าน KYC → ซ่อนลิงก์หน้าที่ยังเข้าไม่ได้) */}
      <AgentFooter isUnverifiedAgent={isPending} />

    </div>
  );
}
