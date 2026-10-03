/**
 * Notification Helper: ศูนย์กลางการจัดรูปแบบข้อความและหมวดหมู่การแจ้งเตือน
 * แปลงข้อมูลการแจ้งเตือนให้อ่านง่าย เป็นภาษาไทยที่สุภาพ และเป็นมิตรต่อผู้ใช้งานจริง
 */

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  type: string;
  linkUrl: string | null;
  createdAt: string;
}

export interface FormattedNotification {
  displayTitle: string;
  displayContent: string;
  details: Array<{ label: string; value: string }>;
  category: {
    key: string;
    label: string;
    badgeClass: string;
    dotClass: string;
  };
}

/** คืนค่าหมวดหมู่ สี และป้ายกำกับตามประเภทการแจ้งเตือน */
export function getNotificationCategory(type: string = '') {
  const t = type.toLowerCase();

  if (t.includes('appointment') || t.includes('viewing') || t.includes('slot')) {
    return {
      key: 'appointment',
      label: 'นัดหมาย & วันว่าง',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-600'
    };
  }
  if (t === 'payment' || t === 'package') {
    return {
      key: 'payment',
      label: 'การเงิน & แพ็กเกจ',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      dotClass: 'bg-purple-600'
    };
  }
  if (t.includes('property') || t === 'approved') {
    return {
      key: 'property',
      label: 'ประกาศอสังหาฯ',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-600'
    };
  }
  if (t === 'chat') {
    return {
      key: 'chat',
      label: 'ข้อความแชท',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-600'
    };
  }
  if (t === 'kyc' || t === 'agent_register') {
    return {
      key: 'kyc',
      label: 'ยืนยันตัวตน KYC',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      dotClass: 'bg-teal-600'
    };
  }
  if (t === 'reject' || t === 'cancel' || t === 'report') {
    return {
      key: 'alert',
      label: 'แจ้งเตือน / ดำเนินการ',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-600'
    };
  }

  return {
    key: 'system',
    label: 'ระบบ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500'
  };
}

/** แปลงเนื้อหาการแจ้งเตือนให้อ่านเข้าใจง่าย เป็นภาษาคน ไม่ให้มีข้อความดิบหรือโค้ดหลุดออกมา */
export function formatNotification(item: NotificationItem): FormattedNotification {
  const category = getNotificationCategory(item.type);
  const details: Array<{ label: string; value: string }> = [];

  let displayContent = item.content || '';
  const displayTitle = item.title || 'การแจ้งเตือน';

  // กรณีเป็นข้อมูลแจ้งเตือนการชำระเงินของแอดมินที่มีคีย์ดิบ txId: agentId: name: email: billing: amount:
  if (displayContent.includes('txId:') && displayContent.includes('agentId:')) {
    const getVal = (key: string) => {
      const match = displayContent.match(new RegExp(`${key}:(.+?)(?=\\s+[A-Za-z]+:|$)`));
      return match ? match[1].trim() : '';
    };

    const agentName = getVal('name') || 'นายหน้าในระบบ';
    const email = getVal('email');
    const billing = getVal('billing') === 'yearly' ? 'รายปี (365 วัน)' : 'รายเดือน (30 วัน)';
    const amount = Number(getVal('amount') || 0).toLocaleString();
    const txId = getVal('txId');

    displayContent = `นายหน้าคุณ "${agentName}" ได้ส่งหลักฐานการชำระเงินค่าแพ็กเกจ Verified PRO (${billing}) ยอดเงิน ฿${amount} บาท เข้าสู่ระบบเรียบร้อยแล้ว กรุณาตรวจสอบสลิปการโอนและอนุมัติสิทธิ์`;

    if (agentName) details.push({ label: 'นายหน้า', value: email ? `${agentName} (${email})` : agentName });
    details.push({ label: 'แพ็กเกจ', value: `Verified PRO ${billing}` });
    details.push({ label: 'ยอดเงินโอน', value: `฿${amount} บาท` });
    if (txId) details.push({ label: 'รหัสธุรกรรม', value: txId });
  }

  return {
    displayTitle,
    displayContent,
    details,
    category
  };
}

/** ฟังก์ชันแปลงเวลาแบบอ่านง่าย สไตล์ภาษาไทย */
export function formatNotificationTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    let relative = '';
    if (diffMins < 1) relative = 'เมื่อสักครู่';
    else if (diffMins < 60) relative = `${diffMins} นาทีที่แล้ว`;
    else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) relative = `${diffHours} ชั่วโมงที่แล้ว`;
      else {
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) relative = `${diffDays} วันที่แล้ว`;
        else relative = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      }
    }

    const full = d.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    return { relative, full };
  } catch {
    return { relative: '', full: dateStr };
  }
}
