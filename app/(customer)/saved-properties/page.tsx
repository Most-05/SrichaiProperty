'use client';

// หน้ารายการอสังหาริมทรัพย์ที่ลูกค้ากดบันทึกเป็นรายการโปรด (หัวใจ)

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useApp } from '@/context/AppContext';

import { Search, MapPin, Bed, Bath, Maximize2, Calendar, Heart } from 'lucide-react';

interface SavedProperty {
  id: string;
  title: string;
  price: string;
  type: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  agentName: string;
  savedAt: string;
}

export default function SavedPropertiesPage() {
  const { toggleFavorite } = useApp();
  const [items, setItems] = useState<SavedProperty[]>([]); // รายการอสังหาฯ ที่บันทึกไว้ ดึงจาก API
  const [loading, setLoading] = useState(true);

  // ดึงรายการโปรดของผู้ใช้ปัจจุบันจากฐานข้อมูล
  const fetchSaved = () => {
    fetch('/api/user/saved-properties')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItems(data.savedProperties || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // โหลดรายการโปรดทันทีที่เปิดหน้า
  useEffect(() => {
    fetchSaved();
  }, []);

  // กดลบออกจากรายการโปรด: อัปเดต state ทันที (Optimistic UI) พร้อมยิง toggleFavorite ไปตัดออกจากฐานข้อมูลจริง
  const handleRemove = async (propertyId: string) => {
    try {
      toggleFavorite(propertyId);
      setItems(prev => prev.filter(i => i.id !== propertyId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="font-sans bg-slate-50 min-h-screen text-slate-800 antialiased overflow-x-hidden text-sm flex flex-col">
      {/* แบนเนอร์หัวข้อหน้า พร้อมจำนวนรายการโปรดทั้งหมด */}
      <div className="pt-6 sm:pt-8 pb-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-sm border border-rose-100 shrink-0">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">รายการอสังหาฯ ที่คุณถูกใจ</h1>
              <p className="text-slate-500 text-xs">รายการบ้านและคอนโดมิเนียมที่คุณกดบันทึกไว้อย่างปลอดภัย</p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-black bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full border border-rose-100">
            ทั้งหมด {items.length} รายการ
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        {loading ? (
          // สถานะกำลังโหลดข้อมูลจาก API
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold">กำลังโหลดรายการโปรดของคุณ...</p>
          </div>
        ) : items.length === 0 ? (
          // สถานะยังไม่มีรายการโปรด
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-md mx-auto my-12 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">ยังไม่มีรายการโปรด</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              คุณสามารถกดปุ่มหัวใจที่การ์ดอสังหาริมทรัพย์ที่คุณสนใจเพื่อบันทึกเก็บไว้ดูย้อนหลังได้ตลอดเวลา
            </p>
            <Link href="/search" className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs shadow-md transition">
              <Search className="w-3.5 h-3.5" /> ค้นหาอสังหาริมทรัพย์เลย
            </Link>
          </div>
        ) : (
          // แสดงกริดรายการอสังหาฯ ที่บันทึกไว้
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition">
                <div className="relative h-48 bg-slate-100">
                  <Image src={item.image} alt={item.title} width={400} height={250} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {/* ปุ่มหัวใจ กดเพื่อลบออกจากรายการโปรด */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-rose-500 shadow-md hover:bg-white transition cursor-pointer"
                    title="ลบออกจากรายการโปรด"
                  >
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md">
                    {item.type}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-left">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1 mb-1">{item.title}</h3>
                    <p className="text-blue-600 font-black text-base">{item.price}</p>
                    <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" /> {item.location}
                    </p>
                  </div>

                  {/* สเปกย่อ: ห้องนอน, ห้องน้ำ, พื้นที่ */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1"><Bed className="w-3.5 h-3.5 shrink-0" /> {item.bedrooms} นอน</span>
                    <span className="inline-flex items-center gap-1"><Bath className="w-3.5 h-3.5 shrink-0" /> {item.bathrooms} น้ำ</span>
                    <span className="inline-flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5 shrink-0" /> {item.area} ตร.ม.</span>
                  </div>

                  {/* ปุ่มลิงก์ไปดูรายละเอียด / จองนัดดูบ้าน */}
                  <div className="pt-2 flex gap-2">
                    <Link href={`/property/${item.id}`} className="flex-1 text-center py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold rounded-xl text-xs transition">
                      ดูรายละเอียด
                    </Link>
                    <Link href={`/book-appointment?propertyId=${item.id}`} className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" /> จองนัดดูบ้าน
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
