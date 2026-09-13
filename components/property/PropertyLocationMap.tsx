'use client';

/**
 * ==============================================================================
 * PropertyLocationMap — แผนที่แสดง/ปักหมุดตำแหน่งบ้าน (Leaflet + OpenStreetMap)
 * ==============================================================================
 * ใช้ทดแทน <iframe> OpenStreetMap embed เดิมที่พิกัดตายตัวทุกบ้านและกดปักหมุดไม่ได้จริง
 *
 * โหมดการใช้งาน 2 แบบ ผ่าน prop `editable`:
 * - false (ค่าเริ่มต้น) → แสดงหมุดอย่างเดียว ใช้ในหน้ารายละเอียดบ้านฝั่งลูกค้า
 * - true → คลิก/ลากบนแผนที่เพื่อย้ายหมุดได้ ใช้ตอนนายหน้าลงประกาศ/แก้ไขประกาศ
 *
 * ⚠️ ต้องเรียกใช้ผ่าน next/dynamic({ ssr: false }) เท่านั้น ห้าม import ตรงๆ
 * เพราะ Leaflet เข้าถึง window/document ตอนโหลดโมดูล ถ้าโดน server-render จะพัง
 * (Next.js server-render "use client" component รอบแรกด้วยเสมอ ไม่ได้ยกเว้นแค่เพราะมี 'use client')
 * ==============================================================================
 */

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // จำเป็นต่อการจัดวาง tile/marker ให้ถูกตำแหน่ง ถ้าลืม import แผนที่จะเพี้ยนทั้งหน้า

// พิกัดกลางเมืองหาดใหญ่ — ใช้เป็นค่าเริ่มต้นตอนยังไม่มีพิกัดจริง (โซนที่ประกาศส่วนใหญ่กระจุกตัวอยู่)
// ใช้ค่าเดียวกับ default เดิมใน api/properties/route.ts (7.0089, 100.4812) เพื่อให้สอดคล้องกัน
export const DEFAULT_LAT = 7.0089;
export const DEFAULT_LNG = 100.4812;

interface PropertyLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  /** ความสูงของกล่องแผนที่ (px) */
  height?: number;
  /** true = คลิกบนแผนที่เพื่อย้ายหมุดได้ (ใช้ตอนลงประกาศ/แก้ไขประกาศ) */
  editable?: boolean;
  /** เรียกกลับพร้อมพิกัดใหม่ทุกครั้งที่หมุดถูกย้าย (ใช้ร่วมกับ editable) */
  onChange?: (lat: number, lng: number) => void;
}

// 🔑 KEYWORD: คลิกบนแผนที่เพื่อย้ายหมุด
// ต้องแยกเป็น component ลูกเพราะ useMapEvents ใช้ได้เฉพาะภายใน MapContainer เท่านั้น
function ClickToMoveMarker({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function PropertyLocationMap({ latitude, longitude, height = 176, editable = false, onChange }: PropertyLocationMapProps) {
  const position: [number, number] = [latitude ?? DEFAULT_LAT, longitude ?? DEFAULT_LNG];

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ height, width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={position}
        draggable={editable}
        eventHandlers={
          editable && onChange
            ? {
                // 🔑 KEYWORD: ลากหมุดได้โดยตรง
                dragend: (e) => {
                  const latlng = e.target.getLatLng();
                  onChange(latlng.lat, latlng.lng);
                }
              }
            : undefined
        }
      />
      {editable && onChange && <ClickToMoveMarker onMove={onChange} />}
    </MapContainer>
  );
}
