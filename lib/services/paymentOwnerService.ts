import { db } from '@/lib/db';

/**
 * ==============================================================================
 * Service: หา "เจ้าของสลิป" (นายหน้าที่จ่ายค่า Verified PRO) ของแต่ละรายการชำระเงิน
 * ==============================================================================
 * ปัญหา: ตาราง listing_package_orders / payment_transactions ไม่มีคอลัมน์บอกว่าใครเป็นคนจ่าย
 * เดิมระบบฝังรหัสนายหน้าไว้ใน "ข้อความแจ้งเตือน" ที่ส่งหาแอดมิน แล้วแกะกลับตอนอนุมัติ → เปราะมาก (BUG-02)
 *   - เปลี่ยนข้อความแจ้งเตือนเมื่อไหร่ แกะไม่ออก → อนุมัติแล้วนายหน้าไม่ได้เป็น PRO
 *   - แอดมินกด "ลบทั้งหมด" ในกระดิ่ง → ข้อมูลเจ้าของสลิปหายไปด้วย
 *
 * วิธีใหม่ (ไม่แตะ schema): เก็บเจ้าของสลิปใน system_configs คีย์ `payment_agent_<transactionId>`
 * (แบบเดียวกับที่หน้าแอดมินเก็บโน้ต `payment_note_<transactionId>`) — ไม่หายเมื่อลบแจ้งเตือน
 *
 * ลำดับการหาเจ้าของสลิป (resolvePaymentOwners):
 *   1. system_configs `payment_agent_<txId>`               ← สลิปที่ส่งหลังแก้ BUG-02
 *   2. ข้อความแจ้งเตือนรูปแบบ `txId:… agentId:…`            ← สลิปช่วง 3–4 ต.ค. (ก่อนแก้)
 *   3. ชื่อไฟล์สลิป `slip_<รหัสนายหน้า 8 ตัวแรก>_<เวลา>.<นามสกุล>` ← สลิปเก่า (ข้อความแจ้งเตือนแกะไม่ได้แล้ว)
 *      ใช้ได้เฉพาะเมื่อรหัส 8 ตัวแรกตรงกับนายหน้าคนเดียวเท่านั้น (ถ้าซ้ำหลายคน = ไม่รู้ ไม่เดา)
 * ==============================================================================
 */

const ownerKey = (transactionId: string) => `payment_agent_${transactionId}`;

export interface PaymentOwner {
  agentId: string;
  agentName: string;
  agentEmail: string;
}

/** บันทึกว่าสลิปรายการนี้เป็นของนายหน้าคนไหน (เรียกตอนนายหน้าส่งสลิป) */
export async function savePaymentOwner(transactionId: string, agentId: string) {
  await db.system_configs.upsert({
    where: { key: ownerKey(transactionId) },
    create: { key: ownerKey(transactionId), value: agentId, description: 'เจ้าของสลิป Verified PRO (รหัสนายหน้าที่จ่าย)' },
    update: { value: agentId, updated_at: new Date() }
  });
}

/** แกะ agentId จากข้อความแจ้งเตือนรูปแบบเดิม `txId:… agentId:… name:…` (ใช้กับสลิปช่วงก่อนแก้เท่านั้น) */
function parseLegacyNotification(content: string) {
  const get = (key: string) => content.match(new RegExp(`${key}:(\\S+)`))?.[1] ?? '';
  return { txId: get('txId'), agentId: get('agentId') };
}

/** ดึงรหัสนายหน้า 8 ตัวแรกจาก URL สลิป เช่น /uploads/slip_fd2ec83f_1790.jpg → "fd2ec83f" */
function slipPrefix(slipUrl: string | null) {
  return slipUrl?.match(/\/slip_([0-9a-f]{8})_/i)?.[1]?.toLowerCase() ?? null;
}

/**
 * หาเจ้าของสลิปของหลายรายการพร้อมกัน → Map<transactionId, PaymentOwner>
 * รายการที่หาไม่เจอจะไม่อยู่ใน Map (ผู้เรียกต้องจัดการเอง เช่น แสดง "ไม่ระบุ" / ห้ามอนุมัติ)
 */
export async function resolvePaymentOwners(transactions: { id: string; slip_url: string | null }[]) {
  const ownerIds = new Map<string, string>(); // txId -> agentId
  if (transactions.length === 0) return new Map<string, PaymentOwner>();

  // 1. จาก system_configs
  const configs = await db.system_configs.findMany({
    where: { key: { in: transactions.map(t => ownerKey(t.id)) } },
    select: { key: true, value: true }
  });
  for (const c of configs) ownerIds.set(c.key.slice('payment_agent_'.length), c.value);

  // 2. จากข้อความแจ้งเตือนรูปแบบเดิม (เฉพาะรายการที่ยังหาไม่เจอ)
  const missing = () => transactions.filter(t => !ownerIds.has(t.id));
  if (missing().length > 0) {
    const notis = await db.notifications.findMany({
      where: { type: 'payment', content: { contains: 'txId:' } },
      select: { content: true }
    });
    const wanted = new Set(missing().map(t => t.id));
    for (const n of notis) {
      const p = parseLegacyNotification(n.content);
      if (p.agentId && wanted.has(p.txId)) ownerIds.set(p.txId, p.agentId);
    }
  }

  // 3. จากชื่อไฟล์สลิป (เฉพาะรายการที่ยังหาไม่เจอ)
  if (missing().length > 0) {
    const agents = await db.users.findMany({ where: { role_id: 'agent' }, select: { id: true } });
    for (const t of missing()) {
      const prefix = slipPrefix(t.slip_url);
      if (!prefix) continue;
      const matches = agents.filter(a => a.id.toLowerCase().startsWith(prefix));
      if (matches.length === 1) ownerIds.set(t.id, matches[0].id);
    }
  }

  // ชื่อ/อีเมลดึงจากตาราง users เสมอ (ข้อมูลจริงล่าสุด ไม่ใช่ข้อความที่ฝังไว้ตอนส่งสลิป)
  const users = await db.users.findMany({
    where: { id: { in: [...new Set(ownerIds.values())] } },
    select: { id: true, first_name: true, last_name: true, email: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const result = new Map<string, PaymentOwner>();
  for (const [txId, agentId] of ownerIds) {
    const u = userMap.get(agentId);
    if (!u) continue; // บัญชีถูกลบไปแล้ว = ไม่รู้เจ้าของ
    result.set(txId, {
      agentId: u.id,
      agentName: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
      agentEmail: u.email
    });
  }
  return result;
}
