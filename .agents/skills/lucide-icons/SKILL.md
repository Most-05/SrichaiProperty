---
name: lucide-icons
description: Use this skill when writing, refactoring, or designing UI components, icons, badges, buttons, and real estate features to ensure proper Lucide React icon selection and prevent raw emoji usage.
---

# Lucide React Icons & UI Standards

แนวทางและมาตรฐานการใช้งานไอคอนสำหรับโปรเจกต์ Srichai Property เพื่อให้ UI ดูโมเดิร์น พรีเมียม และเป็นมืออาชีพ

---

## 1. กฎเหล็ก: ห้ามใช้อิโมจิดิบใน UI เด็ดขาด (Strict: No Raw Emojis)

❌ **ห้ามทำ (Bad):**
```tsx
// อย่านำ Emoji มาใช้เป็นไอคอนตกแต่งใน JSX
<span>🏠 3 ห้องนอน</span>
<button>📍 ดูบนแผนที่</button>
<span>💰 12,500,000 บาท</span>
```

✅ **ต้องทำ (Good):**
```tsx
import { Bed, MapPin, Banknote } from "lucide-react";

<div className="flex items-center gap-1.5 text-muted-foreground">
  <Bed className="w-4 h-4 shrink-0" />
  <span>3 ห้องนอน</span>
</div>

<Button variant="outline" size="sm" className="gap-2">
  <MapPin className="w-4 h-4" />
  ดูบนแผนที่
</Button>
```

---

## 2. แผนผังการจับคู่ไอคอน (Real Estate Icon Mapping)

ใช้ตารางนี้เป็นเกณฑ์ในการเลือกไอคอนจาก `lucide-react`:

### 🏡 ข้อมูลคุณสมบัติอสังหาฯ (Property Specifications)
| ความหมาย | Lucide Icon Component | ตัวอย่างการนำไปใช้ |
| :--- | :--- | :--- |
| ห้องนอน | `<Bed className="w-4 h-4" />` | 3 ห้องนอน |
| ห้องน้ำ | `<Bath className="w-4 h-4" />` | 2 ห้องน้ำ |
| พื้นที่ใช้สอย (ตร.ม.) | `<Maximize2 className="w-4 h-4" />` หรือ `<Square className="w-4 h-4" />` | 180 ตร.ม. |
| ขนาดที่ดิน (ตร.ว.) | `<LandPlot className="w-4 h-4" />` | 50 ตร.ว. |
| ที่จอดรถ | `<Car className="w-4 h-4" />` | 2 คัน |
| จำนวนชั้น | `<Layers className="w-4 h-4" />` | 2 ชั้น |
| ปีที่สร้างเสร็จ | `<Calendar className="w-4 h-4" />` | สร้างเสร็จปี 2024 |
| ทิศระเบียง/หน้าบ้าน | `<Compass className="w-4 h-4" />` | ทิศเหนือ |

### 🏢 ประเภทอสังหาฯ (Property Types)
| ประเภท | Lucide Icon Component |
| :--- | :--- |
| บ้านเดี่ยว / บ้านแฝด / ทาวน์โฮม | `<Home className="w-4 h-4" />` |
| คอนโดมิเนียม / อพาร์ทเมนท์ | `<Building2 className="w-4 h-4" />` หรือ `<Building className="w-4 h-4" />` |
| ที่ดินเปล่า | `<Trees className="w-4 h-4" />` หรือ `<LandPlot className="w-4 h-4" />` |
| อาคารพาณิชย์ / ร้านค้า | `<Store className="w-4 h-4" />` |
| สำนักงาน / ออฟฟิศ | `<Briefcase className="w-4 h-4" />` |
| คลังสินค้า / โรงงาน | `<Warehouse className="w-4 h-4" />` |

### 📍 สถานที่และทำเล (Location & Facilities)
| ความหมาย | Lucide Icon Component |
| :--- | :--- |
| หมุดตำแหน่ง / ที่ตั้ง | `<MapPin className="w-4 h-4" />` |
| การนำทาง / เส้นทาง | `<Navigation className="w-4 h-4" />` |
| รถไฟฟ้า (BTS/MRT) | `<Train className="w-4 h-4" />` หรือ `<TramFront className="w-4 h-4" />` |
| สระว่ายน้ำ | `<Waves className="w-4 h-4" />` |
| ฟิตเนส / ยิม | `<Dumbbell className="w-4 h-4" />` |
| ระบบรักษาความปลอดภัย / รปภ. | `<ShieldCheck className="w-4 h-4" />` |
| สวนส่วนกลาง / ธรรมชาติ | `<Trees className="w-4 h-4" />` |
| Wi-Fi / อินเทอร์เน็ต | `<Wifi className="w-4 h-4" />` |

### 💰 ราคาและการเงิน (Pricing & Deals)
| ความหมาย | Lucide Icon Component |
| :--- | :--- |
| ราคาขาย | `<Tag className="w-4 h-4" />` หรือ `<Coins className="w-4 h-4" />` |
| ค่าเช่า | `<Banknote className="w-4 h-4" />` |
| โปรโมชั่น / ส่วนลด | `<BadgePercent className="w-4 h-4" />` |
| ผลตอบแทนการลงทุน (Yield) | `<TrendingUp className="w-4 h-4" />` |

### 📞 การติดต่อและตัวแทน (Contact & Agent)
| ความหมาย | Lucide Icon Component |
| :--- | :--- |
| โทรศัพท์ | `<Phone className="w-4 h-4" />` |
| แชท / ข้อความ | `<MessageSquare className="w-4 h-4" />` หรือ `<MessageCircle className="w-4 h-4" />` |
| อีเมล | `<Mail className="w-4 h-4" />` |
| แชร์ลิงก์ | `<Share2 className="w-4 h-4" />` |
| กดถูกใจ / บันทึกรายการโปรด | `<Heart className="w-4 h-4" />` |
| ตัวแทนที่ได้รับการรับรอง (Verified) | `<BadgeCheck className="w-4 h-4 text-blue-500" />` |

---

## 3. ขนาดมาตรฐานและการจัดสไตล์ (Styling Standards)

1. **ขนาดไอคอน (Icon Sizes):**
   - **Inline กะทัดรัด (Meta text, badge):** `className="w-3.5 h-3.5 shrink-0"`
   - **ขนาดมาตรฐาน (ปุ่ม, ฟอร์ม, การ์ดทั่วไป):** `className="w-4 h-4 shrink-0"`
   - **ขนาดเด่น (Sidebar icon, Card title):** `className="w-5 h-5 shrink-0"`
   - **Hero / Empty state / Feature highlights:** `className="w-8 h-8 text-primary"` หรือ `className="w-12 h-12 text-muted-foreground/50"`

2. **การจัด Layout คู่กับตัวหนังสือ:**
   - ใช้ Flexbox เสมอ: `flex items-center gap-1.5` หรือ `gap-2`
   - ใส่ `shrink-0` ที่ไอคอนเสมอ เพื่อป้องกันไอคอนบี้หรือแบนเมื่อข้อความยาว

3. **Accessibility (a11y):**
   - หากเป็นไอคอนตกแต่งคู่กับข้อความ: ใส่ `aria-hidden="true"`
   - หากเป็นปุ่มที่มีเฉพาะไอคอน (Icon-only button): ใส่ `aria-label="รายละเอียด"` หรือมี `<span className="sr-only">ข้อความ</span>` ข้างใน
