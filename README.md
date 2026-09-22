> **หมายเหตุ — โปรเจกต์จบการศึกษา พัฒนาร่วมกัน 2 คน**
> repo นี้เป็นสำเนาที่อัปโหลดโดย Most-05 จาก repo ต้นทาง `github.com/PHmeen/SrichaiProperty`
> ประวัติ commit ของทั้งสองคนยังอยู่ครบ ตรวจสอบส่วนงานของแต่ละคนได้ด้วย git log
>
> **ส่วนของผม (Most-05):** 208 commits บน master (ไม่นับ merge) ผ่านการ merge เข้า master
> รวม 42 ครั้ง ครอบคลุม 96 ไฟล์ รับผิดชอบระบบนัดหมายและวันว่างเข้าชมทั้งเส้น (จอง/ยืนยัน/
> ปฏิเสธ/ยกเลิก/นายหน้าขอเลื่อนวันแล้วลูกค้าเป็นคนตัดสินใจรับ/ติดตามผลว่ามาจริงหรือไม่มาตามนัด),
> ความปลอดภัยฝั่ง API, แดชบอร์ดวิเคราะห์ของแอดมิน, ระบบตรวจสอบ/ตีกลับประกาศ,
> แผนที่ปักหมุดทำเลบ้าน, และ type-safety ของระบบ session
>
> เขียนขึ้นใหม่เองทั้งไฟล์ 9 ไฟล์: `types/next-auth.d.ts`,
> `components/property/PropertyLocationMap.tsx` และ `lib/services/` ทั้ง 5 ไฟล์
> (`noShowService.ts`, `slaService.ts`, `slotAvailabilityService.ts`, `viewingSlotService.ts`,
> `appointmentReminderService.ts`, `waitlistService.ts`, `savedPropertyAlertService.ts`)
> ในจำนวนนี้ 4 ไฟล์ยังไม่มีใครแตะเลย
> แม้แต่บรรทัดเดียว ส่วนอีก 5 ไฟล์
> PHmeen แก้ภายหลังเฉพาะงานปรับคอมเมนต์และไอคอน (ไฟล์ละ 1 บรรทัด ยกเว้นแผนที่ 8 บรรทัด)
> ตรรกะการทำงานทั้งหมดยังเป็นของผม
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
> **My scope (Most-05):** 208 non-merge commits on master, landed through 42 merges into
> master, touching 96 files. I owned the appointment & viewing-slot booking system end to end
> (booking, confirmation, rejection, cancellation, agent-initiated rescheduling with the
> customer accepting the new date, and visit outcome / no-show tracking), API-side security,
> the admin analytics dashboard, the listing moderation / rejection-reason flow, the property
> location map, and the session type-safety layer.
>
> I wrote all 9 of these files from scratch: `types/next-auth.d.ts`,
> `components/property/PropertyLocationMap.tsx`, and all 5 files in `lib/services/`
> (`noShowService.ts`, `slaService.ts`, `slotAvailabilityService.ts`, `viewingSlotService.ts`,
> `appointmentReminderService.ts`, `waitlistService.ts`, `savedPropertyAlertService.ts`).
> Four of them have never been touched by anyone else. On the other 5,
> PHmeen later made comment/icon-only edits (1 line each, 8 lines on the map component);
> all of the logic is still mine.
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
