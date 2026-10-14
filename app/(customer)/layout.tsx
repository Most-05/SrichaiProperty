/**
 * ==============================================================================
 * [SEARCH: CUSTOMER_ROUTE_GROUP_LAYOUT] [UI: โครงร่างหน้าจอกลุ่มลูกค้า] [STYLE: CUSTOMER_LAYOUT_WRAPPER]
 * โครงร่างหน้าจอสำหรับกลุ่มเส้นทางลูกค้า (Customer Route Group Layout)
 * /app/(customer)/layout.tsx
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. ครอบคลุมหน้าเว็บฝั่งลูกค้าทั้งหมด เช่น /home, /property/[id], /search, /appointments
 * 2. จัดวาง Navbar ลอยบนสุด และ sticky Footer ท้ายเว็บ
 * ==============================================================================
 */

import Navbar from "@/components/layout/Navbar";
// นำเข้า component แถบเมนูด้านบน (Navbar) ที่ใช้ร่วมกันทุกหน้าในกลุ่มลูกค้า
import Footer from "@/components/layout/Footer";
// นำเข้า Footer เต็มรูปแบบ (เมนู, ติดต่อ, ลิงก์ PDPA/Terms) ตัวเดียวกับที่ใช้ในหน้า Landing

// CustomerLayout เป็น Server Component โดยดีฟอลต์ (ไม่มี "use client")
// รับ props ชื่อ children ซึ่งก็คือเนื้อหาของหน้า (page.tsx) ที่ถูก render อยู่ภายในนี้
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode; // children คือ React node ใดๆ ก็ได้ (เนื้อหาของแต่ละหน้า)
}) {
  return (
    // div ครอบนอกสุด: ใช้ flex column และบังคับให้สูงอย่างน้อยเท่าจอ (min-h-screen)
    // เพื่อดัน footer ให้อยู่ล่างสุดของหน้าจอเสมอ แม้เนื้อหาจะสั้น (sticky footer pattern)
    <div className="flex flex-col min-h-screen">
      {/* แถบเมนูด้านบน แสดงอยู่ทุกหน้าในกลุ่ม (customer) */}
      <Navbar />

      {/* ส่วนเนื้อหาหลักของแต่ละหน้า
          - flex-grow: ขยายเต็มพื้นที่ที่เหลือ เพื่อดัน footer ลงล่างสุด
          - pt-16: เว้นระยะขอบบน (padding-top) เพื่อไม่ให้เนื้อหาโดน Navbar (ที่ลอยแบบ fixed) บัง */}
      <main className="flex-grow pt-16">
        {children}
        {/* ตรงนี้คือจุดที่ Next.js จะแทรกเนื้อหาของหน้าปัจจุบัน เช่น หน้าแรก, หน้ารายละเอียดทรัพย์สิน ฯลฯ */}
      </main>

      {/* Footer ท้ายเว็บไซต์ แสดงอยู่ทุกหน้าเช่นกัน (ใช้ตัวเต็มร่วมกับหน้า Landing
          เพื่อให้ลูกค้าที่ล็อกอินแล้วยังเห็นลิงก์ PDPA/Terms/ติดต่อเราด้วย) */}
      <Footer />
    </div>
  );
}
