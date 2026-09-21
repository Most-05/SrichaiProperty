# Design System, Aesthetics & UI Guidelines

## 1. Aesthetic Standard: Luxury & Professional Real Estate
- ระบบ **Srichai Property** ต้องสื่อถึงความพรีเมียม น่าเชื่อถือ และใช้งานง่าย
- **หลีกเลี่ยง**: การใช้สีสดแป๊ด (Pure primary red/blue/green เช่น `#ff0000`)
- **การเลือกใช้สี**:
  - ใช้ชุดสี Semantic Tokens จาก CSS Variable (`globals.css`)
  - โทนสว่าง (Light): พื้นหลังขาวนวล สะอาดตา มีมิติเงาละมุน
  - โทนเข้ม (Dark): สีกรมท่า/ดำสุขุม (Slate/Zinc tone)
  - สี Accent: สีน้ำเงินเข้มหรือโทนแบรนด์หรูหรา ไม่แสบตา

## 2. Utility Classes เฉพาะของโปรเจกต์
ใน `app/globals.css` มีคลาสสำเร็จรูปที่ถูกจัดเตรียมไว้ ควรนำมาใช้งาน:
- `.container-responsive`: จัด Max Width และ Padding ซ้ายขวาตาม Breakpoints (sm, lg, 2xl) อย่างถูกต้อง
- `.glass-panel`: กระจกฝ้าโมเดิร์นพร้อม Blur effect (`backdrop-blur-md`) สำหรับ Card รายการอสังหาฯ หรือ Sidebar ลอย
- `.glass-panel-dark`: กระจกฝ้าสำหรับ Dark Mode
- `.btn-hover-glow`: ปุ่มมีเอฟเฟกต์ยกตัวเล็กน้อย (`translate-y-[-2px]`) พร้อมแสง Glow สีนวลเมื่อ Hover

## 3. UI Component Reuse & Library
- **Icon Set**: ใช้ไอคอนจาก `lucide-react` เท่านั้น
  - ระบุขนาดให้สม่ำเสมอ เช่น `className="w-4 h-4"` หรือ `className="w-5 h-5"`
  - จัดการการจัดวางคู่กับตัวหนังสือให้มี `items-center gap-2` เสมอ
- **Component Primitives**:
  - Reuse ชิ้นส่วนใน `components/ui/` (เช่น Button, Input, Dialog, Badge, DropdownMenu)
  - หลีกเลี่ยงการเขียน HTML ปุ่มดิบๆ ให้ใช้ `<Button variant="..." size="...">` เพื่อความสม่ำเสมอทั้งเว็บ
- **Class Merging**: ใช้ฟังก์ชัน `cn()` จาก `@/lib/utils` รวม Tailwind classes เสมอเมื่อรับ `className` มาจาก Props:
  ```typescript
  import { cn } from "@/lib/utils";

  export function CustomCard({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("rounded-2xl border bg-card p-6 shadow-sm", className)}>{children}</div>;
  }
  ```

## 4. Typography & Layout Formatting
- **ตัวเลขและราคา**:
  - แสดงตัวเลขราคาอสังหาฯ โดยมี Comma คั่นเสมอ เช่น `12,500,000 บาท`
  - สำหรับคอนโดปล่อยเช่า กำกับต่อเดือน เช่น `25,000 บาท/เดือน`
  - ตัวเลขสถิติหรือ Highlight ควรใช้ `font-semibold` หรือ `font-bold` คู่กับขนาด `text-xl` หรือ `text-2xl`
- **รูปภาพ (Next.js Image)**:
  - ใช้ `next/image` (`<Image />`) เสมอสำหรับรูปบ้านและโปรไฟล์ พร้อมกำหนด `alt` ที่สื่อความหมาย
  - ในจุดที่เป็น Dynamic Card ให้ใส่ `sizes` และ `placeholder="blur"` หรือ fallback container ป้องกัน Layout Shift (CLS)
