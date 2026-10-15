import { NextResponse } from 'next/server';
import { CURATED_LANDMARKS } from '@/lib/services/landmarkService';

interface GeocodeItem {
  id: string;
  name: string;
  display_name: string;
  lat: number;
  lng: number;
}

async function fetchOsm(queryStr: string): Promise<GeocodeItem[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=th&limit=5&accept-language=th&q=${encodeURIComponent(queryStr)}`,
      {
        headers: { 'User-Agent': 'SrichaiProperty/1.0 (contact@srichaiproperty.com)' },
        next: { revalidate: 3600 }
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((item) => ({
      id: String(item.place_id),
      name: item.name || item.display_name.split(',')[0],
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q')?.trim();

  if (!rawQ) {
    return NextResponse.json({ results: [] });
  }

  // 1. ตรวจสอบพิกัด ละติจูด, ลองจิจูด (เช่น 7.0089, 100.4812 หรือก๊อบมาจาก Google Maps)
  const coordMatch = rawQ.match(/(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return NextResponse.json({
        results: [
          {
            id: 'coord',
            name: `พิกัด ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            display_name: `ตำแหน่งพิกัด: ละติจูด ${lat.toFixed(6)}, ลองจิจูด ${lng.toFixed(6)}`,
            lat,
            lng
          }
        ]
      });
    }
  }

  // 2. ค้นหาข้อความแบบตรงไปตรงมาผ่าน OpenStreetMap
  let results = await fetchOsm(rawQ);
  if (results.length > 0) {
    return NextResponse.json({ results });
  }

  // 3. กรณีเป็นที่อยู่ยาวๆ จาก Google Maps หรือมีวงเล็บ / ตำบล / รหัสไปรษณีย์
  // เช่น "มหาวิทยาลัยสงขลานครินทร์ (วิทยาเขตหาดใหญ่ส่วนขยาย หมู่ที่ 6 อาคารอำนวยการ... 90110"
  if (rawQ.includes('(') || rawQ.includes('（') || rawQ.length > 30) {
    // ตัดเอาชื่อสถานที่หลักก่อนวงเล็บ
    const title = rawQ.split(/[\(（]/)[0].trim();
    // ดึงชื่ออำเภอ/จังหวัดถ้ามี
    const city = rawQ.includes('หาดใหญ่') ? 'หาดใหญ่' : '';
    const province = rawQ.includes('สงขลา') ? 'สงขลา' : '';
    const simplifiedQuery = [title, city, province].filter(Boolean).join(' ');

    if (simplifiedQuery && simplifiedQuery !== rawQ) {
      results = await fetchOsm(simplifiedQuery);
      if (results.length > 0) {
        return NextResponse.json({ results });
      }
    }
  }

  // 4. สำรอง: ค้นจากฐานข้อมูลแลนด์มาร์กหลักในระบบ
  const lowerQ = rawQ.toLowerCase();
  const matchedCurated = CURATED_LANDMARKS.filter((lm) => {
    return (
      lm.name.toLowerCase().includes(lowerQ) ||
      lowerQ.includes(lm.name.toLowerCase()) ||
      lm.aliases?.some((a) => lowerQ.includes(a.toLowerCase()) || a.toLowerCase().includes(lowerQ))
    );
  });

  if (matchedCurated.length > 0) {
    const curatedResults: GeocodeItem[] = matchedCurated.slice(0, 3).map((lm) => ({
      id: `curated-${lm.id}`,
      name: lm.name,
      display_name: `${lm.name} จ.${lm.province || 'สงขลา'} (${lm.description || 'สถานที่สำคัญ'})`,
      lat: lm.lat,
      lng: lm.lng
    }));
    return NextResponse.json({ results: curatedResults });
  }

  return NextResponse.json({ results: [] });
}
