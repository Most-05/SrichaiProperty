/**
 * สร้าง PromptPay EMVCo Payload สำหรับสร้าง QR Code พร้อมเพย์จริง
 * รองรับทั้งเบอร์โทรศัพท์ (10 หลัก) และเลขประจำตัวผู้เสียภาษี/บัตรประชาชน (13 หลัก)
 * พร้อมทั้งระบุจำนวนเงิน (THB) ตามมาตรฐาน EMVCo / BOT
 */

function formatTLV(id: string, value: string): string {
  const len = ('00' + value.length).slice(-2);
  return id + len + value;
}

function crc16CCITT(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  const cleanTarget = target.replace(/[^0-9]/g, '');

  let merchantSubtags = '';
  if (cleanTarget.length >= 13) {
    // เลขประจำตัวผู้เสียภาษี / บัตรประชาชน (13 หลัก)
    merchantSubtags = formatTLV('00', 'A000000677010112') + formatTLV('02', cleanTarget);
  } else {
    // เบอร์โทรศัพท์ (แปลง 08x เป็น 00668x)
    const formatted = '0066' + cleanTarget.replace(/^0/, '');
    merchantSubtags = formatTLV('00', 'A000000677010111') + formatTLV('01', formatted);
  }

  // 00: Payload Format Indicator (01)
  // 01: Point of Initiation Method (11: Static, 12: Dynamic with amount)
  const isDynamic = amount !== undefined && amount > 0;
  let payload =
    formatTLV('00', '01') +
    formatTLV('01', isDynamic ? '12' : '11') +
    formatTLV('29', merchantSubtags) +
    formatTLV('53', '764'); // THB currency code

  if (isDynamic && amount !== undefined) {
    payload += formatTLV('54', amount.toFixed(2));
  }

  payload += formatTLV('58', 'TH'); // Country code TH
  payload += '6304'; // Tag 63 with length 04 for CRC

  const crc = crc16CCITT(payload);
  return payload + crc;
}

export function getPromptPayQrUrl(target: string, amount?: number, size = 300): string {
  const payload = generatePromptPayPayload(target, amount);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}
