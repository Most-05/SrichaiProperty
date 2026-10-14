/**
 * ==============================================================================
 * คลังเทมเพลตอีเมลแจ้งเตือนระดับพรีเมียม (Responsive Luxury Email Templates)
 * /lib/templates/emailTemplates.ts
 * ==============================================================================
 * ออกแบบด้วย HTML/CSS สไตล์ Responsive ระดับ Luxury Real Estate
 * รองรับการเปิดบนมือถือ (iOS Mail, Android, Gmail App) และโปรแกรมเปิดอีเมลทุกค่าย
 * (Gmail, Outlook, Apple Mail, Yahoo Mail)
 * ธีมสีหลัก: Deep Navy (#0b1329 / #0f172a) ขลิบทอง Golden Amber (#d97706 / #f59e0b)
 * ไร้ Raw Emoji ในส่วน UI/Subject เพื่อความน่าเชื่อถือ ป้องกันการตก Junk/Spam
 *
 * [SEARCH: EMAIL_TEMPLATES]
 * [LOGIC: เทมเพลตอีเมลแจ้งเตือนระบบ]
 * [STYLE: สไตล์อีเมล Responsive สไตล์ Luxury]
 * ==============================================================================
 */

// Helper: ปรับชื่อผู้รับให้สุภาพขึ้นเสมอ
export function formatPoliteName(name?: string | null): string {
  if (!name || !name.trim()) return 'ท่านสมาชิก';
  const clean = name.trim();
  if (
    clean.startsWith('คุณ') ||
    clean.startsWith('ท่าน') ||
    clean.startsWith('ดร.') ||
    clean.startsWith('นพ.') ||
    clean.startsWith('พญ.')
  ) {
    return clean;
  }
  return `คุณ${clean}`;
}

// Helper: จัดรูปแบบวันที่ภาษาไทยแบบเต็ม เป็นทางการ
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export function formatThaiDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'ตามกำหนดการในระบบ';
  if (typeof dateStr === 'string' && (dateStr.includes('มกราคม') || dateStr.includes('ตุลาคม') || dateStr.includes('ต.ค.'))) {
    return dateStr;
  }
  let d: Date;
  if (dateStr instanceof Date) {
    d = dateStr;
  } else if (typeof dateStr === 'string') {
    const clean = dateStr.split('T')[0];
    d = new Date(clean + 'T00:00:00');
  } else {
    return 'ตามกำหนดการในระบบ';
  }
  if (isNaN(d.getTime())) return String(dateStr);
  return `วัน${THAI_DAYS[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// Helper: จัดรูปแบบราคาเงินบาท
export function formatPriceTH(amount?: number | string | null): string {
  if (amount === undefined || amount === null || amount === '') return '';
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num) || num <= 0) return '';
  return `฿${num.toLocaleString('th-TH')}`;
}


export interface BaseEmailOptions {
  title: string;
  badge?: string;
  badgeColor?: string;
  recipientName: string;
  leadText: string;
  details?: { label: string; value: string }[];
  contentHtml?: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

/**
 * โครงสร้างพื้นฐานของอีเมล (Master Layout)
 */
export function renderMasterEmailTemplate({
  title,
  badge = 'Srichai Property Alert',
  badgeColor = '#2563eb',
  recipientName,
  leadText,
  details = [],
  contentHtml = '',
  ctaText,
  ctaUrl,
  footerNote = 'อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติของ Srichai Property'
}: BaseEmailOptions): string {
  const detailsHtml = details.length > 0
    ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${details.map(d => `
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500; width: 38%; vertical-align: top;">${d.label}:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; vertical-align: top;">${d.value}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
    : '';

  const ctaButtonHtml = ctaText && ctaUrl
    ? `
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28); letter-spacing: 0.2px;">
          ${ctaText} &rarr;
        </a>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', Helvetica, Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased; line-height: 1.6;">
  <div style="max-width: 620px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0b1329 0%, #1e3a8a 100%); padding: 28px 28px 24px 28px; text-align: left; border-bottom: 3px solid #f59e0b;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="font-size: 21px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
              SRICHAI <span style="color: #fbbf24; font-weight: 400;">PROPERTY</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 3px; letter-spacing: 0.5px; font-weight: 500;">
              ศูนย์รวมอสังหาริมทรัพย์หาดใหญ่ สงขลา
            </div>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 9999px; letter-spacing: 0.3px;">
              ${badge}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content Area -->
    <div style="padding: 32px 28px 24px 28px;">
      <h1 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.35; letter-spacing: -0.3px;">
        ${title}
      </h1>
      
      <p style="margin: 0 0 14px 0; font-size: 15px; color: #334155; line-height: 1.6;">
        เรียน <strong>${formatPoliteName(recipientName)}</strong>,
      </p>

      <p style="margin: 0 0 18px 0; font-size: 15px; color: #475569; line-height: 1.6;">
        ${leadText}
      </p>

      ${detailsHtml}
      ${contentHtml}
      ${ctaButtonHtml}

      <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 12px; color: #64748b; line-height: 1.6;">
        หากมีข้อสงสัยหรือต้องการความช่วยเหลือเพิ่มเติม สามารถติดต่อทีมงานได้ทางเว็บไซต์ หรือติดต่อผ่านศูนย์ดูแลลูกค้า Srichai Property หาดใหญ่ สงขลา
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
      <p style="margin: 0 0 6px 0; font-weight: 500;">${footerNote}</p>
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Srichai Property. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

export interface AppointmentEmailParams {
  role: 'agent' | 'customer';
  eventType: 'new' | 'confirmed' | 'cancelled' | 'rescheduled' | 'reminder';
  recipientName: string;
  propertyTitle: string;
  propertyLocation?: string;
  propertyPrice?: number | string;
  propertyUrl?: string;
  date: string;
  timeSlot: string;
  otherPartyName: string;
  otherPartyPhone?: string;
  otherPartyEmail?: string;
  notes?: string;
  oldDate?: string;
  oldTimeSlot?: string;
  appointmentId?: string;
  actionUrl: string;
}

/**
 * 1. เทมเพลต: นัดหมายชมบ้าน (Viewing Appointment)
 */
export function getAppointmentEmailTemplate(params: AppointmentEmailParams): { subject: string; html: string; text: string } {
  const isAgent = params.role === 'agent';
  let subject = '';
  let title = '';
  let badge = 'นัดหมายชมโครงการ';
  let badgeColor = '#2563eb';
  let leadText = '';
  let bannerHeading = '';
  let bannerDesc = '';
  let bannerBg = '#eff6ff';
  let bannerBorder = '#bfdbfe';
  let bannerText = '#1e40af';
  let guideText = '';

  switch (params.eventType) {
    case 'new':
      if (isAgent) {
        subject = `[Srichai Property] คำขอนัดหมายเข้าชมโครงการใหม่: ${params.propertyTitle}`;
        title = 'คำขอนัดหมายเข้าชมโครงการใหม่';
        badge = 'คำขอนัดใหม่';
        badgeColor = '#ea580c';
        leadText = 'มีลูกค้าสนใจเข้าชมทรัพย์สินของคุณ กรุณาตรวจสอบวันเวลาและกดตอบรับหรือเสนอวันใหม่ในระบบ';
        bannerHeading = 'รอนายหน้าตรวจสอบและตอบรับนัดหมาย';
        bannerDesc = 'ลูกค้าได้ยื่นวันและรอบเวลาที่สะดวกเข้าชม กรุณาตรวจสอบและดำเนินการตอบรับคิวล่วงหน้า';
        bannerBg = '#fff7ed';
        bannerBorder = '#fed7aa';
        bannerText = '#9a3412';
        guideText = 'คำแนะนำสำหรับนายหน้า: กรุณาตอบรับนัดหมายโดยเร็วเพื่อสร้างความประทับใจแก่ลูกค้า หากติดภารกิจสามารถกด "ขอเลื่อนวัน" เพื่อเสนอเวลาที่สะดวกได้ทันที';
      } else {
        subject = `[Srichai Property] ส่งคำขอนัดหมายเข้าชมโครงการเรียบร้อยแล้ว: ${params.propertyTitle}`;
        title = 'ระบบได้รับคำขอนัดหมายของคุณเรียบร้อยแล้ว';
        badge = 'รอนายหน้ายืนยัน';
        badgeColor = '#0284c7';
        leadText = 'เราได้ส่งคำขอนัดหมายชมโครงการไปยังนายหน้าผู้ดูแลทรัพย์เรียบร้อยแล้ว กรุณารอการตอบรับ';
        bannerHeading = 'คำขอนัดหมายอยู่ระหว่างรอนายหน้ายืนยัน';
        bannerDesc = 'เมื่อนายหน้าผู้ดูแลกดยืนยันนัดหมายหรือเสนอวันใหม่ ระบบจะส่งอีเมลแจ้งเตือนคุณทันที';
        bannerBg = '#f0f9ff';
        bannerBorder = '#bae6fd';
        bannerText = '#075985';
        guideText = 'คำแนะนำสำหรับผู้เข้าชม: คุณสามารถติดตามสถานะการนัดหมาย หรือแชทสอบถามข้อมูลเพิ่มเติมกับนายหน้าได้ตลอดเวลา';
      }
      break;

    case 'confirmed':
      subject = `[Srichai Property] ยืนยันเวลานัดหมายเข้าชมโครงการแล้ว: ${params.propertyTitle}`;
      title = 'เวลานัดหมายได้รับการยืนยันเรียบร้อยแล้ว!';
      badge = 'นัดหมายสำเร็จ';
      badgeColor = '#16a34a';
      leadText = isAgent
        ? 'นัดหมายเข้าชมทรัพย์สินนี้ได้รับการยืนยันเรียบร้อยแล้ว กรุณาเตรียมความพร้อมตามวันเวลาที่กำหนด'
        : 'นายหน้าได้ยืนยันเวลานัดหมายเข้าชมโครงการเรียบร้อยแล้ว กรุณาไปถึงสถานที่ตามวันและเวลาที่นัดหมาย';
      bannerHeading = 'เวลานัดหมายได้รับการยืนยันแล้ว';
      bannerDesc = 'คิวเข้าชมโครงการได้รับการบันทึกเรียบร้อย กรุณาไปถึงสถานที่ก่อนเวลานัดหมาย 10-15 นาที';
      bannerBg = '#f0fdf4';
      bannerBorder = '#bbf7d0';
      bannerText = '#166534';
      guideText = isAgent
        ? 'คำแนะนำสำหรับนายหน้า: กรุณาเตรียมกุญแจ ตรวจสอบสภาพสถานที่ และจัดเตรียมเอกสารข้อมูลโครงการล่วงหน้า'
        : 'คำแนะนำสำหรับผู้เข้าชม: กรุณาเดินทางไปถึงก่อนเวลา 10-15 นาที หากติดธุระด่วนสามารถโทรแจ้งนายหน้าหรือเลื่อนนัดหมายล่วงหน้าในระบบ';
      break;

    case 'cancelled':
      subject = `[Srichai Property] รายการนัดหมายเข้าชมโครงการถูกยกเลิก: ${params.propertyTitle}`;
      title = 'การนัดหมายเข้าชมโครงการถูกยกเลิก';
      badge = 'ยกเลิกนัดหมาย';
      badgeColor = '#dc2626';
      leadText = `รายการนัดหมายเข้าชมทรัพย์สินนี้ถูกยกเลิกแล้ว ${params.notes ? `(เหตุผล: ${params.notes})` : ''}`;
      bannerHeading = 'รายการนัดหมายนี้ถูกยกเลิกแล้ว';
      bannerDesc = params.notes ? `เหตุผลการยกเลิก: ${params.notes}` : 'รอบเวลาเข้าชมนี้ได้ถูกปล่อยคืนสู่ระบบแล้ว';
      bannerBg = '#fef2f2';
      bannerBorder = '#fecaca';
      bannerText = '#991b1b';
      guideText = isAgent
        ? 'ระบบได้ทำการปลดล็อกรอบเวลาดังกล่าวเพื่อให้ผู้สนใจท่านอื่นสามารถจองคิวเข้าชมได้ต่อไป'
        : 'หากท่านประสงค์จะนัดหมายเข้าชมในวันอื่น สามารถเลือกจองรอบเวลาว่างใหม่บนเว็บไซต์ได้ตลอดเวลา';
      break;

    case 'rescheduled':
      subject = `[Srichai Property] มีการขอเลื่อนเวลานัดหมายเข้าชม: ${params.propertyTitle}`;
      title = 'มีการขอเปลี่ยนแปลงวันและเวลานัดหมาย';
      badge = 'ขอเลื่อนเวลา';
      badgeColor = '#d97706';
      leadText = isAgent
        ? 'ลูกค้าได้ขอเสนอเปลี่ยนแปลงวันหรือเวลานัดหมายใหม่ กรุณาตรวจสอบและยืนยันรอบเวลา'
        : 'นายหน้าผู้ดูแลได้ขอเสนอวันและเวลานัดหมายใหม่ กรุณาตรวจสอบและกดยืนยันวันใหม่ในระบบ';
      bannerHeading = 'มีข้อเสนอเปลี่ยนแปลงวันเวลานัดหมาย';
      bannerDesc = 'กรุณาตรวจสอบว่าสะดวกตามรอบเวลาใหม่หรือไม่ และกดดำเนินการในระบบ';
      bannerBg = '#fffbeb';
      bannerBorder = '#fde68a';
      bannerText = '#92400e';
      guideText = 'หากท่านสะดวกตามรอบเวลาใหม่ กรุณากดยืนยันในระบบ หรือหากไม่สะดวกสามารถกดยกเลิกหรือนัดหมายวันอื่นได้ตามสะดวก';
      break;

    case 'reminder':
      subject = `[Srichai Property] แจ้งเตือน: พรุ่งนี้คุณมีนัดหมายเข้าชมโครงการ: ${params.propertyTitle}`;
      title = 'แจ้งเตือนนัดหมายเข้าชมโครงการล่วงหน้า';
      badge = 'เตือนล่วงหน้า';
      badgeColor = '#2563eb';
      leadText = isAgent
        ? 'เตือนความจำ คุณมีคิวพาลูกค้าเข้าชมทรัพย์สินในวันพรุ่งนี้ กรุณาเตรียมตัวและตรวจสอบความพร้อม'
        : 'เตือนความจำ คุณมีนัดหมายเข้าชมทรัพย์สินในวันพรุ่งนี้ กรุณาเตรียมตัวและตรวจสอบการเดินทาง';
      bannerHeading = 'คุณมีนัดหมายเข้าชมโครงการในวันพรุ่งนี้';
      bannerDesc = 'กรุณาตรวจสอบเส้นทางการเดินทางและการเตรียมตัวล่วงหน้า';
      bannerBg = '#eff6ff';
      bannerBorder = '#bfdbfe';
      bannerText = '#1e40af';
      guideText = isAgent
        ? 'แนะนำให้นายหน้าโทรคอนเฟิร์มกับลูกค้าล่วงหน้า หรือเตรียมเอกสารสัญญาเบื้องต้น'
        : 'แนะนำให้เผื่อเวลาการเดินทาง และบันทึกเบอร์โทรของนายหน้าไว้ติดต่อเมื่อไปถึงสถานที่';
      break;
  }

  const priceText = formatPriceTH(params.propertyPrice);
  const formattedDate = formatThaiDate(params.date);
  const cleanPhone = params.otherPartyPhone ? params.otherPartyPhone.replace(/[^\d+]/g, '') : '';



  const rescheduleNotice = params.oldDate
    ? `
      <div style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
        (กำหนดการเดิม: <span style="text-decoration: line-through;">${formatThaiDate(params.oldDate)} ${params.oldTimeSlot || ''}</span>)
      </div>
    `
    : '';

  const appointmentContentHtml = `
    <!-- Status Callout Banner -->
    <div style="background-color: ${bannerBg}; border: 1px solid ${bannerBorder}; border-left: 4px solid ${badgeColor}; border-radius: 8px; padding: 14px 18px; margin: 18px 0 22px 0;">
      <div style="font-size: 14px; font-weight: 700; color: ${bannerText}; margin-bottom: 3px;">
        ${bannerHeading}
      </div>
      <div style="font-size: 13px; color: #475569; line-height: 1.5;">
        ${bannerDesc}
      </div>
    </div>

    <!-- Appointment Summary Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
        ข้อมูลการนัดหมายเข้าชมโครงการ (Appointment Summary)
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 9px 0; color: #64748b; font-weight: 500; width: 34%; vertical-align: top;">
            ทรัพย์สินที่เข้าชม:
          </td>
          <td style="padding: 9px 0; color: #0f172a; font-weight: 700; vertical-align: top;">
            <span style="font-size: 15px; color: #0f172a;">${params.propertyTitle}</span>
            ${priceText ? `<span style="display: inline-block; margin-left: 8px; font-size: 12px; font-weight: 700; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 6px;">${priceText}</span>` : ''}
          </td>
        </tr>

        ${params.propertyLocation ? `
        <tr>
          <td style="padding: 9px 0; color: #64748b; font-weight: 500; vertical-align: top;">ทำเล / ที่ตั้ง:</td>
          <td style="padding: 9px 0; color: #334155; font-weight: 600; vertical-align: top;">
            ${params.propertyLocation}
          </td>
        </tr>
        ` : ''}

        <tr>
          <td style="padding: 9px 0; color: #64748b; font-weight: 500; vertical-align: top;">วันและเวลานัดหมาย:</td>
          <td style="padding: 9px 0; vertical-align: top;">
            <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px;">
              <div style="font-size: 15px; font-weight: 800; color: #1e3a8a;">
                ${formattedDate}
              </div>
              <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">
                ${params.timeSlot}
              </div>
              ${rescheduleNotice}
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding: 9px 0; color: #64748b; font-weight: 500; vertical-align: top;">
            ${isAgent ? 'ลูกค้าผู้ขอนัดหมาย' : 'นายหน้าผู้ดูแลทรัพย์'}:
          </td>
          <td style="padding: 9px 0; color: #0f172a; font-weight: 600; vertical-align: top;">
            <div>${formatPoliteName(params.otherPartyName)}</div>
            ${params.otherPartyPhone ? `
              <div style="font-size: 13px; margin-top: 4px;">
                เบอร์ติดต่อ: <a href="tel:${cleanPhone}" style="color: #2563eb; text-decoration: underline; font-weight: 700;">${params.otherPartyPhone}</a>
              </div>
            ` : ''}
            ${params.otherPartyEmail ? `
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                อีเมล: <a href="mailto:${params.otherPartyEmail}" style="color: #64748b; text-decoration: underline;">${params.otherPartyEmail}</a>
              </div>
            ` : ''}
          </td>
        </tr>

        ${params.notes ? `
        <tr>
          <td style="padding: 9px 0; color: #64748b; font-weight: 500; vertical-align: top;">หมายเหตุ / รายละเอียด:</td>
          <td style="padding: 9px 0; color: #475569; font-style: italic; vertical-align: top;">
            <div style="background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
              "${params.notes}"
            </div>
          </td>
        </tr>
        ` : ''}

        ${params.appointmentId ? `
        <tr>
          <td style="padding: 9px 0; color: #94a3b8; font-size: 12px; vertical-align: top;">รหัสอ้างอิงนัดหมาย:</td>
          <td style="padding: 9px 0; color: #64748b; font-size: 12px; font-family: monospace; vertical-align: top;">
            #APT-${params.appointmentId.slice(0, 8).toUpperCase()}
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- Preparation & Tips -->
    <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 14px 18px; margin: 24px 0 16px 0; font-size: 13px; color: #475569; line-height: 1.6;">
      <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">
        ข้อแนะนำสำหรับการเข้าชม
      </div>
      ${guideText}
    </div>
  `;

  const html = renderMasterEmailTemplate({
    title,
    badge,
    badgeColor,
    recipientName: params.recipientName,
    leadText,
    contentHtml: appointmentContentHtml,
    ctaText: isAgent ? 'ดูรายละเอียดและจัดการนัดหมาย' : 'ดูรายละเอียดการนัดหมาย',
    ctaUrl: params.actionUrl,
    footerNote: 'เพื่อความปลอดภัย กรุณาจัดการและตรวจสอบนัดหมายผ่านเว็บไซต์ทางการของ Srichai Property'
  });

  const text = `
SRICHAI PROPERTY - ${title}
--------------------------------------------------
เรียน ${formatPoliteName(params.recipientName)},

${leadText}

ข้อมูลการนัดหมายเข้าชมโครงการ:
• ทรัพย์สิน: ${params.propertyTitle} ${priceText ? `(${priceText})` : ''}
${params.propertyLocation ? `• ทำเล: ${params.propertyLocation}\n` : ''}• วันที่นัดหมาย: ${formattedDate}
• ช่วงเวลา: ${params.timeSlot}
• ${isAgent ? 'ลูกค้าผู้ขอนัดหมาย' : 'นายหน้าผู้ดูแล'}: ${formatPoliteName(params.otherPartyName)} ${params.otherPartyPhone ? `(โทร: ${params.otherPartyPhone})` : ''}
${params.notes ? `• หมายเหตุ: ${params.notes}\n` : ''}
ดูรายละเอียดและจัดการนัดหมาย: ${params.actionUrl}
--------------------------------------------------
`.trim();

  return { subject, html, text };
}

/**
 * 2. เทมเพลต: ข้อความแชทใหม่ (New Chat Message Notification)
 */
export function getChatNotificationEmailTemplate(params: {
  recipientName: string;
  senderName: string;
  senderRoleText: string;
  messagePreview: string;
  propertyTitle?: string;
  actionUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `[Srichai Property] ข้อความใหม่จาก ${params.senderName}`;
  const title = `คุณมีข้อความใหม่จาก ${params.senderName}`;

  const details = [
    { label: 'ผู้ส่งข้อความ', value: `${formatPoliteName(params.senderName)} (${params.senderRoleText})` },
    ...(params.propertyTitle ? [{ label: 'เกี่ยวกับทรัพย์สิน', value: params.propertyTitle }] : []),
    { label: 'ข้อความล่าสุด', value: `"${params.messagePreview}"` },
  ];

  const html = renderMasterEmailTemplate({
    title,
    badge: 'ข้อความใหม่',
    badgeColor: '#0284c7',
    recipientName: params.recipientName,
    leadText: `มีข้อความใหม่ส่งถึงคุณในระบบ Srichai Property คุณสามารถกดลิงก์ด้านล่างเพื่อเปิดห้องแชทและสนทนาได้ทันที`,
    details,
    ctaText: 'เปิดดูห้องแชทและตอบกลับ',
    ctaUrl: params.actionUrl,
    footerNote: 'เพื่อความเป็นส่วนตัวและความปลอดภัย กรุณาตอบกลับผ่านระบบแชทในเว็บไซต์ Srichai Property'
  });

  const text = `${title}\nเรียน ${formatPoliteName(params.recipientName)}\nมีข้อความใหม่จาก: ${params.senderName}\nข้อความ: "${params.messagePreview}"\nเปิดดูแชทได้ที่: ${params.actionUrl}`;

  return { subject, html, text };
}

/**
 * 3. เทมเพลต: ผลการอนุมัติประกาศทรัพย์ (Property Approval / Rejection)
 */
export function getPropertyApprovalEmailTemplate(params: {
  agentName: string;
  propertyTitle: string;
  isApproved: boolean;
  reason?: string;
  actionUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = params.isApproved
    ? `[Srichai Property] ประกาศทรัพย์ของคุณได้รับการอนุมัติแล้ว: ${params.propertyTitle}`
    : `[Srichai Property] ประกาศทรัพย์ต้องแก้ไขข้อมูล: ${params.propertyTitle}`;

  const title = params.isApproved
    ? 'ประกาศทรัพย์สินของคุณได้รับการอนุมัติและเผยแพร่แล้ว!'
    : 'ประกาศทรัพย์สินต้องได้รับการแก้ไขเพิ่มเติม';

  const details = [
    { label: 'ชื่อประกาศ', value: params.propertyTitle },
    { label: 'สถานะการตรวจสอบ', value: params.isApproved ? 'อนุมัติเรียบร้อย (Active)' : 'ต้องแก้ไข (Action Required)' },
    ...(params.reason ? [{ label: 'ข้อเสนอแนะจากเจ้าหน้าที่', value: params.reason }] : []),
  ];

  const html = renderMasterEmailTemplate({
    title,
    badge: params.isApproved ? 'อนุมัติแล้ว' : 'ต้องแก้ไข',
    badgeColor: params.isApproved ? '#16a34a' : '#ea580c',
    recipientName: params.agentName,
    leadText: params.isApproved
      ? 'ทีมงานได้ตรวจสอบและอนุมัติประกาศของคุณเรียบร้อยแล้ว ขณะนี้ประกาศได้ถูกเผยแพร่สู่สายตาผู้ค้นหาทั่วประเทศ'
      : 'ทีมงานได้ตรวจสอบประกาศแล้ว พบว่ามีข้อมูลบางส่วนที่ต้องได้รับการปรับปรุงก่อนจึงจะสามารถเผยแพร่ได้',
    details,
    ctaText: params.isApproved ? 'ดูประกาศบนเว็บไซต์' : 'แก้ไขประกาศทันที',
    ctaUrl: params.actionUrl,
  });

  const text = `${title}\nเรียน ${formatPoliteName(params.agentName)}\nประกาศ: ${params.propertyTitle}\nสถานะ: ${params.isApproved ? 'อนุมัติ' : 'ต้องแก้ไข'}\nลิงก์: ${params.actionUrl}`;

  return { subject, html, text };
}

/**
 * 4. เทมเพลต: ผลการตรวจสอบเอกสาร KYC ยืนยันตัวตนนายหน้า
 */
export function getKycStatusEmailTemplate(params: {
  agentName: string;
  isApproved: boolean;
  reason?: string;
  actionUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = params.isApproved
    ? `[Srichai Property] บัญชีนายหน้าของคุณผ่านการยืนยันตัวตน (Verified Pro) แล้ว`
    : `[Srichai Property] เอกสารยืนยันตัวตน KYC ต้องส่งใหม่`;

  const title = params.isApproved
    ? 'ยินดีด้วย! บัญชีของคุณผ่านการยืนยันตัวตนเรียบร้อยแล้ว'
    : 'เอกสารยืนยันตัวตน (KYC) ไม่ผ่านการอนุมัติ';

  const details = [
    { label: 'ชื่อผู้ลงทะเบียน', value: formatPoliteName(params.agentName) },
    { label: 'สถานะ KYC', value: params.isApproved ? 'ผ่านการตรวจสอบ (Verified)' : 'ไม่ผ่านการตรวจสอบ (Rejected)' },
    ...(params.reason ? [{ label: 'เหตุผล/สิ่งที่ต้องแนบเพิ่ม', value: params.reason }] : []),
  ];

  const html = renderMasterEmailTemplate({
    title,
    badge: params.isApproved ? 'KYC ผ่านแล้ว' : 'KYC ไม่ผ่าน',
    badgeColor: params.isApproved ? '#16a34a' : '#dc2626',
    recipientName: params.agentName,
    leadText: params.isApproved
      ? 'ทีมงานได้อนุมัติเอกสารยืนยันตัวตนของคุณเรียบร้อยแล้ว บัญชีของคุณได้รับตราสัญลักษณ์ Verified Pro Agent เพิ่มความน่าเชื่อถือ'
      : 'เอกสารยืนยันตัวตนที่คุณแนบมาไม่ผ่านเกณฑ์การตรวจสอบ กรุณาตรวจสอบเหตุผลและแนบเอกสารใหม่อีกครั้ง',
    details,
    ctaText: params.isApproved ? 'เข้าสู่หน้าแดชบอร์ดนายหน้า' : 'ส่งเอกสารยืนยันตัวตนใหม่',
    ctaUrl: params.actionUrl,
  });

  const text = `${title}\nเรียน ${formatPoliteName(params.agentName)}\nสถานะ: ${params.isApproved ? 'ผ่านการยืนยัน' : 'ไม่ผ่าน'}\nเข้าสู่ระบบ: ${params.actionUrl}`;

  return { subject, html, text };
}

/**
 * 5. เทมเพลต: การชำระเงินและอัปเกรดแพ็กเกจ (Payment & Package)
 */
export function getPaymentEmailTemplate(params: {
  userName: string;
  packageName: string;
  amount: string;
  isApproved: boolean;
  actionUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = params.isApproved
    ? `[Srichai Property] ยืนยันการอัปเกรดแพ็กเกจ ${params.packageName} เรียบร้อยแล้ว`
    : `[Srichai Property] แจ้งผลการตรวจสอบการชำระเงินแพ็กเกจ ${params.packageName}`;

  const title = params.isApproved
    ? 'การชำระเงินและอัปเกรดแพ็กเกจสำเร็จ!'
    : 'ไม่สามารถยืนยันการชำระเงินได้';

  const details = [
    { label: 'แพ็กเกจที่เลือก', value: params.packageName },
    { label: 'ยอดชำระ', value: `฿${params.amount}` },
    { label: 'สถานะ', value: params.isApproved ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธ (กรุณาแนบสลิปใหม่)' },
  ];

  const html = renderMasterEmailTemplate({
    title,
    badge: params.isApproved ? 'ชำระเงินสำเร็จ' : 'ชำระเงินไม่ผ่าน',
    badgeColor: params.isApproved ? '#16a34a' : '#dc2626',
    recipientName: params.userName,
    leadText: params.isApproved
      ? `ระบบได้เปิดใช้งานสิทธิพิเศษแพ็กเกจ ${params.packageName} ให้กับบัญชีของคุณเรียบร้อยแล้ว`
      : 'เจ้าหน้าที่ไม่สามารถยืนยันสลิปการโอนเงินได้ กรุณาตรวจสอบยอดเงินและส่งสลิปใหม่อีกครั้ง',
    details,
    ctaText: 'ดูสถานะแพ็กเกจของฉัน',
    ctaUrl: params.actionUrl,
  });

  const text = `${title}\nเรียน ${formatPoliteName(params.userName)}\nแพ็กเกจ: ${params.packageName}\nยอด: ${params.amount}\nดูรายละเอียด: ${params.actionUrl}`;

  return { subject, html, text };
}

/**
 * 6. เทมเพลตทั่วไป / การแจ้งเตือนระบบ (General Notification Template)
 */
export function getGeneralNotificationEmailTemplate(params: {
  recipientName: string;
  title: string;
  leadText: string;
  badge?: string;
  details?: { label: string; value: string }[];
  actionText?: string;
  actionUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = `[Srichai Property] ${params.title}`;

  const html = renderMasterEmailTemplate({
    title: params.title,
    badge: params.badge || 'แจ้งเตือนระบบ',
    recipientName: params.recipientName,
    leadText: params.leadText,
    details: params.details,
    ctaText: params.actionText,
    ctaUrl: params.actionUrl,
  });

  const text = `${params.title}\nเรียน ${formatPoliteName(params.recipientName)}\n${params.leadText}\n${params.actionUrl ? `ลิงก์: ${params.actionUrl}` : ''}`;

  return { subject, html, text };
}

