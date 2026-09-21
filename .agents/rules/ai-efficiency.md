# AI Collaboration, Token Efficiency & Code Quality

## 1. Targeted Edits & Diff-First Approach (ประหยัด Token และเวลา)
- **ไม่ Rewrite ทั้งไฟล์**: ห้ามเขียนโค้ดทับทั้งไฟล์โดยไม่จำเป็น ให้ใช้การแก้ไขเฉพาะบรรทัด/ฟังก์ชันที่เกี่ยวข้องเท่านั้น
- **คงไว้ซึ่ง Comments และคำอธิบายภาษาไทย**: ห้ามลบคอมเมนต์ภาษาไทยเดิมในไฟล์ที่มีคำอธิบายความสัมพันธ์หรือโครงสร้างระบบ (เช่น ใน `prisma/schema.prisma` หรือ `lib/*.ts`)
- **ไม่สร้างไฟล์ซ้ำซ้อน**: ตรวจสอบโฟลเดอร์ `components/`, `lib/`, `hooks/` ก่อนสร้างไฟล์ใหม่ เพื่อ Reuse โค้ดที่มีอยู่เดิมเสมอ

## 2. Type-Safety & Self-Verification
- **TypeScript First**:
  - กำหนด Interface / Type ชัดเจนสำหรับ Props และ Function Return Types
  - หลีกเลี่ยงการใช้ `any` ทุกกรณี ให้ระบุ Type หรือใช้ Generic ที่สื่อความหมาย
- **อัตโนมัติในการแก้ไข Lint / Syntax Errors**:
  - เมื่อทำการแก้ไขโค้ดแล้วพบข้อผิดพลาด TypeScript หรือ Syntax Error ให้ดำเนินการแก้ไขให้ถูกต้องทันทีโดยไม่ต้องรอถามผู้ใช้ซ้ำ

## 3. Communication & Concise Reporting
- ตอบตรงประเด็น สรุปการเปลี่ยนแปลงเป็นข้อๆ ให้ผู้ใช้เข้าใจง่าย
- ใช้ Markdown Links เชื่อมโยงไปยังไฟล์หรือบรรทัดที่มีการเปลี่ยนแปลงเสมอ เช่น `[ProfileSidebar.tsx](file:///d:/SrichaiProperty/components/customer/ProfileSidebar.tsx)`
- ไม่ต้องเกริ่นนำยืดยาว ให้เน้น Actionable Insights และผลลัพธ์ของโค้ดที่พร้อมใช้งาน
