<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# UI Icon & Design Standards (Srichai Property)
- **STRICT: NO RAW EMOJIS IN UI**: ห้ามใส่อิโมจิดิบ (เช่น 🏠, 📍, 📞, 💰, 🔍, 🛏️, 🚗, 🔑 ฯลฯ) ในโค้ด UI/JSX/TSX เด็ดขาด เพราะทำให้ดีไซน์ดูไม่เป็นมืออาชีพ
- **ALWAYS USE `lucide-react`**: ให้ Import และใช้ไอคอนจาก `lucide-react` เสมอ (เช่น `<Bed className="w-4 h-4" />`, `<MapPin className="w-4 h-4" />`, `<Phone className="w-4 h-4" />`)
- **Icon Sizing**: กำหนดขนาดไอคอนให้ชัดเจนสม่ำเสมอ เช่น `w-4 h-4` หรือ `w-5 h-5` พร้อม `shrink-0` และจัดวางด้วย `flex items-center gap-1.5`
- ดูรายการเทียบไอคอนทั้งหมดได้ที่สกิล [.agents/skills/lucide-icons/SKILL.md](file:///d:/SrichaiProperty/.agents/skills/lucide-icons/SKILL.md)
