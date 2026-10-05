> **หมายเหตุ — โปรเจกต์จบการศึกษา พัฒนาร่วมกัน 2 คน**
> repo นี้เป็นสำเนาที่อัปโหลดโดย Most-05 จาก repo ต้นทาง `github.com/PHmeen/SrichaiProperty`
> ประวัติ commit ของทั้งสองคนยังอยู่ครบ ตรวจสอบส่วนงานของแต่ละคนได้ด้วย git log
>
> **ส่วนของผม (Most-05):** 282 commits บน master (ไม่นับ merge) และ merge commit อีก 72 ครั้ง
> ครอบคลุม 126 ไฟล์ รับผิดชอบระบบนัดหมายและวันว่างเข้าชมทั้งเส้น (จอง/ยืนยัน/ปฏิเสธ/ยกเลิก/
> นายหน้าขอเลื่อนวันแล้วลูกค้าเป็นคนตัดสินใจรับ/ติดตามผลว่ามาจริงหรือไม่มาตามนัด/คิวสำรองเมื่อรอบเต็ม/
> แจ้งเตือนก่อนถึงวันนัด/แจ้งเตือนบ้านที่บันทึกไว้เมื่อมีรอบใหม่), ความปลอดภัยฝั่ง API,
> หน้าสถิติและรายงานของแอดมิน, ระบบตรวจสอบประกาศพร้อมบันทึกผู้ตรวจและเวลาตรวจ (SLA),
> แผนที่ปักหมุดทำเลบ้าน, และ type-safety ของระบบ session
> รวมถึงทดสอบทั้งระบบแบบ end-to-end 2 รอบ (30 ก.ย. และ 4 ต.ค.) แล้วไล่ปิดบั๊กไป 32 รายการ — เช่น สมัครเป็นแอดมินเองได้,
> อัปโหลดไฟล์ .html เป็นสลิปแล้วสคริปต์ทำงาน, ถูกแบนแล้ว session เดิมยังใช้ได้, นายหน้าอนุมัติประกาศตัวเองได้,
> อนุมัติสลิป PRO แล้วไม่ได้เป็น PRO, ลบประกาศแล้วประวัตินัด/รีวิวหายหมด — ทุกตัวมีสคริปต์ทดสอบยืนยัน
>
> ไฟล์ที่ผมเป็นคนสร้างขึ้นใหม่ 16 ไฟล์: `types/next-auth.d.ts`, `hooks/useIsDesktop.ts`,
> `lib/realtime/activeChatSession.ts`, `lib/utils/avatar.ts`, `lib/utils/uuid.ts`, `components/auth/ForgotPasswordModal.tsx`, `components/property/PropertyLocationMap.tsx` และ 9 ไฟล์ใน `lib/services/`
> (`noShowService.ts`, `slaService.ts`, `slotAvailabilityService.ts`, `viewingSlotService.ts`,
> `appointmentReminderService.ts`, `waitlistService.ts`, `savedPropertyAlertService.ts`,
> `paymentOwnerService.ts`, `listingChangeService.ts`)
> — 10 ไฟล์ยังไม่มีใครแตะ, 4 ไฟล์ PHmeen แก้เล็กน้อย (คอมเมนต์/ไอคอน),
> และอีก 2 ไฟล์ PHmeen ต่อยอดตรรกะเพิ่ม (`appointmentReminderService.ts`, `noShowService.ts`)
>
> ตรวจสอบได้ด้วยคำสั่ง (ใช้ email แทนชื่อ เพราะบาง commit เคย merge ผ่านหน้าเว็บ GitHub
> ทำให้ชื่อผู้เขียนขึ้นเป็น "Sidtisak Hanthongchai" แทน "Most-05" — คนเดียวกัน คนละชื่อที่ระบบเก็บ):
> ```bash
> git log master --author=moszmgamez@gmail.com --no-merges --oneline    # commit ทั้งหมดของผม
> git log master --author=moszmgamez@gmail.com --merges --oneline       # การ merge ทั้งหมดของผม
> ```

---

> **Note — Capstone project, developed by a two-person team**
> This repo is a copy uploaded by Most-05, mirrored from the original repo at
> `github.com/PHmeen/SrichaiProperty`. Full commit history from both authors is preserved —
> you can verify each person's scope directly with `git log`.
>
> **My scope (Most-05):** 282 non-merge commits on master plus 72 merge commits, touching
> 126 files. I owned the appointment & viewing-slot booking system end to end (booking,
> confirmation, rejection, cancellation, agent-initiated rescheduling with the customer
> accepting the new date, visit outcome / no-show tracking, a waitlist for full slots,
> pre-appointment reminders, and new-slot alerts for saved properties), API-side security,
> the admin analytics & reporting page, listing moderation with reviewer/review-time
> tracking (SLA), the property location map, and the session type-safety layer.
> I also ran two full end-to-end tests of the system (30 Sep and 4 Oct) and fixed 32 bugs —
> e.g. self-registration as admin, stored XSS via an .html payment slip, banned users keeping
> their session, agents self-approving listings, PRO slips approved without upgrading the agent,
> and deleting a listing wiping its appointment/review history — each verified by a test script.
>
> I created these 16 files: `types/next-auth.d.ts`, `hooks/useIsDesktop.ts`,
> `lib/realtime/activeChatSession.ts`, `lib/utils/avatar.ts`, `lib/utils/uuid.ts`, `components/auth/ForgotPasswordModal.tsx`, `components/property/PropertyLocationMap.tsx`, and 9 files in
> `lib/services/` (`noShowService.ts`, `slaService.ts`, `slotAvailabilityService.ts`,
> `viewingSlotService.ts`, `appointmentReminderService.ts`, `waitlistService.ts`,
> `savedPropertyAlertService.ts`, `paymentOwnerService.ts`, `listingChangeService.ts`).
> Ten are untouched by anyone else, PHmeen made minor comment/icon edits to four, and
> PHmeen extended the logic in two (`appointmentReminderService.ts`, `noShowService.ts`).
>
> Verify with (matching by email, not name — some commits were merged via GitHub's web UI,
> which recorded the author as "Sidtisak Hanthongchai" instead of "Most-05", same person):
> ```bash
> git log master --author=moszmgamez@gmail.com --no-merges --oneline
> git log master --author=moszmgamez@gmail.com --merges --oneline
> ```

---

# 🏢 Srichai Property (Next.js + Prisma + PostgreSQL)

โปรเจกต์เว็บแอปพลิเคชันระบบจัดการอสังหาริมทรัพย์ Srichai Property พัฒนาด้วย Next.js (App Router), Prisma ORM และ PostgreSQL

---

## 🛠️ วิธีการติดตั้งโปรเจกต์สำหรับนักพัฒนาคนใหม่ (Setup Guide)

หากต้องการนำโปรเจกต์นี้ไปติดตั้งและรันบนเครื่องคอมพิวเตอร์เครื่องอื่น ให้ทำตามขั้นตอนดังต่อไปนี้:

### 1. ติดตั้งซอฟต์แวร์พื้นฐาน
- **Node.js**: เวอร์ชัน 18 ขึ้นไป (แนะนำเวอร์ชัน 20 LTS)
- **PostgreSQL**: ติดตั้งและสร้าง Database สำหรับโปรเจกต์ (เช่นชื่อ `srichai_db`)

### 2. ดาวน์โหลดโปรเจกต์และติดตั้ง Dependencies
เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรันคำสั่ง:
```bash
npm install --legacy-peer-deps
```
*(หมายเหตุ: ต้องใช้ `--legacy-peer-deps` เนื่องจากโปรเจกต์ใช้ Next.js เวอร์ชัน Canary เพื่อเข้ากันได้กับฟีเจอร์ล่าสุด)*

### 3. ตั้งค่าไฟล์ Environment Variables
1. คัดลอกไฟล์คัดลอกไฟล์เทมเพลตจาก `.env.example` ไปเป็น `.env`:
   - ระบบ Windows (PowerShell): `cp .env.example .env`
   - ระบบ macOS/Linux: `cp .env.example .env`
2. เปิดไฟล์ `.env` แล้วแก้ไขค่าการเชื่อมต่อฐานข้อมูลในบรรทัด `DATABASE_URL` ให้ตรงกับ PostgreSQL ในเครื่องคุณ:
   ```env
   DATABASE_URL="postgresql://postgres:รหัสผ่านฐานข้อมูล@localhost:5432/srichai_db?schema=public"
   ```

### 4. ซิงค์โครงสร้างฐานข้อมูล (Prisma Migration)
รันคำสั่งเพื่อให้ Prisma สร้างตารางทั้งหมดลงในฐานข้อมูล PostgreSQL ของคุณอัตโนมัติ:
```bash
npx prisma db push
```

หากต้องการรันตัว Seed ข้อมูลตัวอย่างสำหรับทดสอบระบบ (ถ้ามี):
```bash
npm run seed
```

### 5. เริ่มรันระบบสำหรับพัฒนา (Development Server)
```bash
npm run dev
```
ระบบจะเปิดใช้งานที่ [http://localhost:3000](http://localhost:3000)
