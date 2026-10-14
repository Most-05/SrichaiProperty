/**
 * ==============================================================================
 * ฟังก์ชันรวม ClassName ของ Tailwind CSS (Class Merging Utility)
 * /lib/utils/cn.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * - ผสานชื่อคลาส CSS แบบไดนามิกด้วย `clsx` และจัดการแก้ปัญหาคลาส Tailwind ตีกันด้วย `twMerge`
 * - ตัวอย่าง: cn("px-2 py-1", isPrimary && "bg-blue-600", className)
 * - ช่วยให้คลาสที่ส่งเข้ามาภายหลังสามารถ Override คลาสเดิมได้อย่างถูกต้องเสมอ
 *
 * [SEARCH: CN_UTILITY]
 * [STYLE: ฟังก์ชันรวมคลาส Tailwind]
 * ==============================================================================
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

