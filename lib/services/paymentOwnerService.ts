import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

/**
 * ==============================================================================
 * เซอร์วิสระบุเจ้าของสลิปชำระเงิน Verified PRO (Payment Slip Owner Resolution Service)
 * /lib/services/paymentOwnerService.ts
 * ==============================================================================
 * หน้าที่หลัก:
 * 1. บันทึกและค้นหาว่ารายการชำระเงิน/สลิปโอนเงิน (payment_transactions) เป็นของนายหน้าท่านใด
 * 2. จัดเก็บข้อมูลลงในตาราง system_configs คีย์ `payment_agent_<transactionId>`
 * 3. ช่วยให้แอดมินสามารถอนุมัติสถานะ PRO ได้อย่างถูกต้อง แม่นยำ ข้อมูลไม่สูญหาย
 *
 * [SEARCH: PAYMENT_OWNER_SERVICE]
 * [LOGIC: การระบุเจ้าของสลิปชำระเงิน]
 * ==============================================================================
 */

const ownerKey = (transactionId: string) => `payment_agent_${transactionId}`;

export interface PaymentOwner {
  agentId: string;
  agentName: string;
  agentEmail: string;
}

/**
 * บันทึกว่าสลิปรายการนี้เป็นของนายหน้าคนไหน (เรียกตอนนายหน้าส่งสลิป)
 * ส่ง client ของ db.$transaction มาได้ เพื่อให้บันทึกพร้อมกับ order/transaction
 */
export async function savePaymentOwner(transactionId: string, agentId: string, client: Prisma.TransactionClient = db) {
  await client.system_configs.upsert({
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
