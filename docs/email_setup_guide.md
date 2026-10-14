# 📧 คู่มือการตั้งค่าระบบส่งอีเมล (Gmail SMTP Setup Guide)
> สำหรับสมาชิกในทีม / เครื่องเพื่อนที่ต้องการเปิดใช้งานระบบส่งอีเมลแจ้งเตือนจริงในโปรเจกต์ **Srichai Property**

---

## 📌 สรุปภาพรวม
ระบบของโปรเจกต์รองรับการส่งอีเมลแจ้งเตือนอัตโนมัติ (เช่น นัดหมายดูบ้าน, ข้อความแชทใหม่, ผลการอนุมัติ KYC) โดยใช้ **Nodemailer** เชื่อมต่อกับ **Gmail SMTP** ผ่าน **Google App Password (รหัสผ่านสำหรับแอป 16 หลัก)**

---

## 🛠️ ขั้นตอนที่ 1: ตรวจสอบและติดตั้งไลบรารีส่งอีเมล
เปิด Terminal ในโฟลเดอร์โปรเจกต์ที่เครื่องคุณ แล้วรันคำสั่งเพื่อติดตั้ง Dependencies:

```bash
npm install nodemailer @types/nodemailer
```

---

## 🔑 ขั้นตอนที่ 2: ขอรหัสผ่านสำหรับแอป (Google App Password 16 หลัก)
> ⚠️ **คำเตือน:** ห้ามใช้รหัสผ่านล็อกอิน Gmail ปกติเด็ดขาด เพราะ Google จะบล็อกเพื่อความปลอดภัย ต้องใช้รหัสผ่านสำหรับแอปเท่านั้น

1. เข้าเบราว์เซอร์ ล็อกอินบัญชี Gmail ที่ต้องการใช้เป็นตัวส่ง
2. ตรวจสอบว่าเปิด **การยืนยันแบบ 2 ขั้นตอน (2-Step Verification)** แล้วหรือยังที่:  
   👉 [Google Account Security](https://myaccount.google.com/security)
3. เข้าไปสร้างรหัสผ่านแอปโดยตรงที่ลิงก์นี้:  
   👉 [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. ในช่อง **App name (ชื่อแอป)** ให้พิมพ์:
   ```text
   SrichaiProperty
   ```
5. กดปุ่ม **Create (สร้าง)**
6. ระบบจะแสดงรหัสผ่านภาษาอังกฤษ **16 ตัว** ขึ้นมาในกรอบสีเหลือง เช่น:
   ```text
   abcd efgh ijkl mnop
   ```
7. **คัดลอกรหัส 16 ตัวนี้เก็บไว้** (ไม่ต้องเว้นวรรคก็ได้)

---

## ⚙️ ขั้นตอนที่ 3: ตั้งค่าในไฟล์ `.env`
เปิดไฟล์ `.env` ในโฟลเดอร์หลักของโปรเจกต์ (หากยังไม่มีให้สร้างไฟล์ชื่อ `.env`) แล้วเพิ่มหรือแก้ไขบรรทัดเหล่านี้:

```env
# 📧 ตั้งค่าระบบส่งอีเมลแจ้งเตือนอัตโนมัติ (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="abcdefghijklmnop"
EMAIL_FROM="Srichai Property <your-email@gmail.com>"
```

### คำอธิบายแต่ละตัวแปร:
| ตัวแปร | ค่าที่ต้องใส่ | ตัวอย่าง |
| :--- | :--- | :--- |
| `SMTP_HOST` | ปล่อยไว้ตามเดิม | `"smtp.gmail.com"` |
| `SMTP_PORT` | ปล่อยไว้ตามเดิม | `"465"` |
| `SMTP_SECURE` | ปล่อยไว้ตามเดิม | `"true"` |
| `SMTP_USER` | อีเมล Gmail จริงของคุณ | `"somchai@gmail.com"` |
| `SMTP_PASS` | รหัสผ่าน 16 หลักจากขั้นตอนที่ 2 | `"rswybfxinvslrtxg"` |
| `EMAIL_FROM` | ชื่อผู้ส่งและอีเมลของคุณ | `"Srichai Property <somchai@gmail.com>"` |

> 💾 อย่าลืมกดบันทึกไฟล์ (`Ctrl + S`)

---

## 🧪 ขั้นตอนที่ 4: ทดสอบส่งอีเมลเข้า Inbox จริง
เพื่อยืนยันว่าการตั้งค่าถูกต้องและสามารถส่งออกอินเทอร์เน็ตได้จริง ให้รันสคริปต์ทดสอบ:

```bash
npx tsx scripts/send-real-test.ts
```

### ผลลัพธ์ที่ถูกต้องเมื่อสำเร็จ:
```text
Sending live test email to: your-email@gmail.com...
[EmailService] ส่งอีเมลสำเร็จถึง your-email@gmail.com (MessageId: <...>)
Result: {
  success: true,
  messageId: '<...>',
  mocked: false
}
```

👉 เปิดกล่องจดหมาย **Gmail Inbox** ของคุณ จะมีอีเมลยืนยันจาก **Srichai Property** เด้งเข้ามาทันที!

---

## 🚀 ขั้นตอนที่ 5: เริ่มต้นใช้งานระบบบนหน้าเว็บ
รันโปรเจกต์ตามปกติ:

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`  
ตอนนี้ทุกฟังก์ชันที่เกี่ยวกับการแจ้งเตือน (จองนัดหมายดูบ้าน, แชท, อนุมัติเอกสาร) จะส่งอีเมลหาผู้รับจริงในระบบโดยอัตโนมัติเรียบร้อยแล้วครับ 🎉
