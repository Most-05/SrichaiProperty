'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, MapPin } from 'lucide-react';

// Leaflet icon fix
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export const DEFAULT_LAT = 7.0089;
export const DEFAULT_LNG = 100.4812;

interface PropertyLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  height?: number;
  editable?: boolean;
  onChange?: (lat: number, lng: number) => void;
}

// เลื่อนแผนที่ไปยังพิกัดเป้าหมาย
function FlyToLocation({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 16, { duration: 1 });
    }
  }, [target, map]);
  return null;
}

// คลิกบนแผนที่เพื่อย้ายหมุด
function ClickToMoveMarker({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function PropertyLocationMap({
  latitude,
  longitude,
  height = 240,
  editable = false,
  onChange
}: PropertyLocationMapProps) {
  const position: [number, number] = [latitude ?? DEFAULT_LAT, longitude ?? DEFAULT_LNG];

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; name: string; display_name: string; lat: number; lng: number }>>([]);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // ค้นหาสถานที่
  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const list = data.results || [];
      setResults(list);

      // ถ้าเจอผลลัพธ์แรก ให้บินไปจุดนั้นทันที
      if (list.length > 0) {
        selectLocation(list[0]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // เลือกสถานที่จากผลการค้นหา
  const selectLocation = (item: { lat: number; lng: number; name: string }) => {
    setFlyTarget([item.lat, item.lng]);
    if (onChange) onChange(item.lat, item.lng);
    setResults([]);
  };

  return (
    <div className="space-y-2">
      {/* ช่องค้นหาทำเล (แสดงเมื่ออยู่ในโหมดแก้ไข) */}
      {editable && (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearch();
                  }
                }}
                placeholder="ค้นหาสถานที่, ที่อยู่, วางพิกัด (เช่น 7.0089, 100.4812 หรือลิงก์ Google Maps)..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Search className="w-4 h-4 shrink-0" />}
              <span>ค้นหา</span>
            </button>
          </div>

          {/* รายการผลลัพธ์ (ถ้ามีมากกว่า 1 รายการ) */}
          {results.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-[1100] max-h-48 overflow-y-auto divide-y divide-slate-100">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectLocation(item)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs transition flex items-start gap-2"
                >
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.display_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* กล่องแผนที่ Leaflet */}
      <div className="relative rounded-2xl border border-slate-200 overflow-hidden shadow-xs" style={{ height }}>
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
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
                    dragend: (e) => {
                      const latlng = e.target.getLatLng();
                      onChange(latlng.lat, latlng.lng);
                    }
                  }
                : undefined
            }
          />
          {editable && onChange && <ClickToMoveMarker onMove={onChange} />}
          <FlyToLocation target={flyTarget} />
        </MapContainer>

        {/* ป้ายแสดงพิกัดปัจจุบัน */}
        {editable && (
          <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-[10px] font-bold text-slate-700 pointer-events-none flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
