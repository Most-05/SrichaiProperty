import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'รายการที่บันทึกไว้ | ศรีชัย พร็อพเพอร์ตี้',
  description: 'รายการอสังหาริมทรัพย์ที่คุณบันทึกไว้',
};

/**
 * หน้ารายการโปรดเดิม - ทำการ Redirect อัตโนมัติไปยัง /saved-properties
 * ซึ่งเป็นหน้าที่เชื่อมต่อกับฐานข้อมูลจริง (DB-backed)
 */
export default function FavoritesPage() {
  redirect('/saved-properties');
}
