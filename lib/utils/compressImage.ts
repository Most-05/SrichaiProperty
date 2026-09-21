/**
 * ==============================================================================
 * ฟังก์ชันช่วยบีบอัดรูปภาพฝั่ง Client ก่อนอัปโหลดขึ้นเซิร์ฟเวอร์ (Client-Side Image Compression)
 * /lib/utils/compressImage.ts
 * ==============================================================================
 * วัตถุประสงค์:
 * 1. ลดขนาดรูปถ่ายจากมือถือ/กล้องความละเอียดสูง (5MB - 15MB) ให้เหลือ ~150KB - 400KB
 * 2. แปลงเป็นฟอร์แมต .webp ที่มีประสิทธิภาพการบีบอัดสูงกว่า JPEG 25-35%
 * 3. ช่วยประหยัดแบนด์วิดท์เซิร์ฟเวอร์ 80-90% และผู้ใช้อัปโหลดได้เร็วขึ้นทันตาเห็น
 * 4. ทำงานบน Native HTML5 Canvas API ไม่ต้องพึ่งพาแพ็กเกจภายนอก (Zero Dependency)
 * ==============================================================================
 */

export interface CompressOptions {
  maxWidth?: number;       // ความกว้างสูงสุด (พิกเซล) ค่าเริ่มต้น 1600
  maxHeight?: number;      // ความสูงสูงสุด (พิกเซล) ค่าเริ่มต้น 1600
  quality?: number;        // คุณภาพการบีบอัด 0.1 - 1.0 ค่าเริ่มต้น 0.82
  targetMimeType?: string; // Mime type ปลายทาง ค่าเริ่มต้น 'image/webp'
}

export interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  width: number;
  height: number;
}

/**
 * แปลงขนาดหน่วยไบต์เป็นข้อความอ่านง่าย เช่น "340 KB", "2.1 MB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * บีบอัดไฟล์รูปภาพและแปลงเป็น WebP
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    targetMimeType = 'image/webp',
  } = options;

  // ตรวจสอบว่าเป็นรูปภาพหรือไม่
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      savedPercent: 0,
      width: 0,
      height: 0,
    };
  }

  // ยกเว้นไฟล์ GIF (เพื่อรักษา Animation) และ SVG (เป็นเวกเตอร์อยู่แล้ว)
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      savedPercent: 0,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // ปรับลดสเกลตามอัตราส่วนถ้าขนาดเกินที่กำหนด
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // วาดลง Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // กรณีเบราว์เซอร์ไม่รองรับ 2D context ส่งไฟล์เดิมกลับไป
        resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          savedPercent: 0,
          width: img.width,
          height: img.height,
        });
        return;
      }

      // ตั้งค่า Rendering Quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // แปลงเป็น Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file,
              originalSize: file.size,
              compressedSize: file.size,
              savedPercent: 0,
              width,
              height,
            });
            return;
          }

          // ถ้าขนาดที่บีบอัดแล้วใหญ่กว่าเดิม ให้ใช้ไฟล์เดิม
          if (blob.size >= file.size) {
            resolve({
              file,
              originalSize: file.size,
              compressedSize: file.size,
              savedPercent: 0,
              width,
              height,
            });
            return;
          }

          // ตั้งชื่อไฟล์ใหม่เป็นนามสกุล .webp
          const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const newExtension = targetMimeType === 'image/webp' ? '.webp' : '.jpg';
          const newFileName = `${originalNameWithoutExt}${newExtension}`;

          const compressedFile = new File([blob], newFileName, {
            type: targetMimeType,
            lastModified: Date.now(),
          });

          const savedPercent = Math.round(((file.size - blob.size) / file.size) * 100);

          resolve({
            file: compressedFile,
            originalSize: file.size,
            compressedSize: blob.size,
            savedPercent,
            width,
            height,
          });
        },
        targetMimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        savedPercent: 0,
        width: 0,
        height: 0,
      });
    };

    img.src = objectUrl;
  });
}
