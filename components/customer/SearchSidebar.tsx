'use client';

/**
 * ==============================================================================
 * หน้าจอแถบตัวกรองการค้นหาอสังหาริมทรัพย์ฝั่งซ้าย (Search Sidebar Component)
 * ==============================================================================
 * ปรับปรุงใหม่:
 * 1. ขยายความกว้างและระยะห่างให้อ่านง่าย สบายตา (High Readability)
 * 2. ช่อง Dropdown ทำเลที่ตั้ง (จังหวัด / อำเภอ / ตำบล) เป็น Searchable Combobox สามารถพิมพ์ค้นหาได้ทันที
 * 3. ใช้ Lucide Icons สวยงาม สะอาดตา ไม่ใช้ Emoji
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  SlidersHorizontal, 
  MapPin, 
  Banknote, 
  Bed, 
  Bath, 
  Car, 
  Maximize2, 
  Sparkles, 
  PawPrint, 
  Waves, 
  Dumbbell, 
  ShieldCheck, 
  RotateCcw, 
  X,
  ChevronDown,
  Check
} from 'lucide-react';

export interface FilterState {
  province: string;
  amphure: string;
  district: string;
  priceMin: string;
  priceMax: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  areaMin: string;
  areaMax: string;
  isPremiumOnly?: boolean;
  facilities: {
    petFriendly: boolean;
    pool: boolean;
    gym: boolean;
    parking: boolean;
    security: boolean;
  };
}

interface LocationItem {
  id: number;
  name_th: string;
  name_en: string;
}

interface SearchSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  activeTab?: 'buy' | 'rent';
  isMobileDrawerOpen?: boolean;
  setIsMobileDrawerOpen?: (val: boolean) => void;
  handleClearFilters: () => void;
}

const ROOM_OPTIONS = [
  { value: 'any', label: 'ไม่ระบุ' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4+', label: '4+' },
];

const PARKING_OPTIONS = [
  { value: 'any', label: 'ไม่ระบุ' },
  { value: '1', label: '1 คัน+' },
  { value: '2', label: '2 คัน+' },
  { value: '3', label: '3 คัน+' },
];

const BUY_PRICE_PRESETS = [
  { label: 'ทั้งหมด', min: '', max: '' },
  { label: '< 2 ล้าน', min: '', max: '2000000' },
  { label: '2-5 ล้าน', min: '2000000', max: '5000000' },
  { label: '5-10 ล้าน', min: '5000000', max: '10000000' },
  { label: '10 ล้าน+', min: '10000000', max: '' },
];

const RENT_PRICE_PRESETS = [
  { label: 'ทั้งหมด', min: '', max: '' },
  { label: '< 10,000', min: '', max: '10000' },
  { label: '10k-20k', min: '10000', max: '20000' },
  { label: '20k-40k', min: '20000', max: '40000' },
  { label: '40,000+', min: '40000', max: '' },
];

const FACILITIES_CONFIG = [
  { key: 'petFriendly', label: 'สัตว์เลี้ยงเข้าได้ (Pet-Friendly)', icon: PawPrint },
  { key: 'parking', label: 'ที่จอดรถส่วนกลาง', icon: Car },
  { key: 'pool', label: 'สระว่ายน้ำ', icon: Waves },
  { key: 'gym', label: 'ฟิตเนส / ยิม', icon: Dumbbell },
  { key: 'security', label: 'รปภ. 24 ชม. / CCTV', icon: ShieldCheck },
] as const;

/**
 * คอมโพเนนต์ Dropdown แบบพิมพ์ค้นหาได้ (Searchable Combobox)
 */
function SearchableLocationSelect({
  label,
  placeholder,
  items,
  selectedId,
  disabled = false,
  onSelect,
  onClear,
}: {
  label: string;
  placeholder: string;
  items: LocationItem[];
  selectedId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((it) => it.id.toString() === selectedId);
  const displayValue = isOpen ? searchQuery : (selectedItem ? selectedItem.name_th : '');

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name_th.toLowerCase().includes(q) ||
      (item.name_en && item.name_en.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="flex flex-col gap-1 relative text-xs" ref={containerRef}>
      <span className={`font-bold ${disabled ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
      
      <div className="relative">
        <div 
          onClick={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
              setSearchQuery(selectedItem ? selectedItem.name_th : '');
            }
          }}
          className={`flex items-center bg-slate-50 border rounded-xl px-3.5 py-2.5 transition-all ${
            disabled 
              ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-100/60' 
              : isOpen 
                ? 'border-blue-500 ring-3 ring-blue-100 bg-white shadow-xs' 
                : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <input
            type="text"
            disabled={disabled}
            value={displayValue}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true);
                setSearchQuery(selectedItem ? selectedItem.name_th : '');
              }
            }}
            placeholder={disabled ? '-- กรุณาเลือกตัวเลือกก่อนหน้า --' : placeholder}
            className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-0 placeholder-slate-400 cursor-text disabled:cursor-not-allowed"
          />
          
          {selectedId && !disabled ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setSearchQuery('');
                setIsOpen(false);
              }}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer ml-1 transition"
              title="ล้างตัวเลือก"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-1 transition-transform pointer-events-none ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
          )}
        </div>

        {/* Dropdown Popover List */}
        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto py-1.5 animate-in fade-in zoom-in-95 duration-150">
            {/* ตัวเลือก: ทั้งหมด / ไม่ระบุ */}
            <button
              type="button"
              onClick={() => {
                onClear();
                setSearchQuery('');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                !selectedId ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>-- ทั้งหมด ({label}) --</span>
              {!selectedId && <Check className="w-4 h-4 text-blue-600" />}
            </button>

            {filteredItems.length === 0 ? (
              <div className="px-4 py-4 text-center text-xs text-slate-400 font-medium">
                ไม่พบผลลัพธ์ &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id.toString() === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id.toString());
                      setSearchQuery('');
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-700 font-black' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.name_th}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchSidebar({
  filters,
  setFilters,
  activeTab = 'buy',
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  handleClearFilters,
}: SearchSidebarProps) {
  const [provincesList, setProvincesList] = useState<LocationItem[]>([]);
  const [amphuresList, setAmphuresList] = useState<LocationItem[]>([]);
  const [districtsList, setDistrictsList] = useState<LocationItem[]>([]);

  // 1. โหลดรายชื่อจังหวัดทั้งหมด
  useEffect(() => {
    async function loadProvinces() {
      try {
        const res = await fetch('/api/locations?type=provinces');
        const data = await res.json();
        if (Array.isArray(data)) setProvincesList(data);
      } catch (err) {
        console.error('Failed to load provinces:', err);
      }
    }
    loadProvinces();
  }, []);

  // 2. โหลดรายชื่ออำเภอเมื่อเลือกจังหวัด
  useEffect(() => {
    if (!filters.province) {
      return;
    }
    let active = true;
    async function loadAmphures() {
      try {
        const res = await fetch(`/api/locations?type=amphures&provinceId=${filters.province}`);
        const data = await res.json();
        if (active && Array.isArray(data)) setAmphuresList(data);
      } catch (err) {
        console.error('Failed to load amphures:', err);
      }
    }
    loadAmphures();
    return () => { active = false; };
  }, [filters.province]);

  // 3. โหลดรายชื่อตำบลเมื่อเลือกอำเภอ
  useEffect(() => {
    if (!filters.amphure) {
      return;
    }
    let active = true;
    async function loadDistricts() {
      try {
        const res = await fetch(`/api/locations?type=districts&amphureId=${filters.amphure}`);
        const data = await res.json();
        if (active && Array.isArray(data)) setDistrictsList(data);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    }
    loadDistricts();
    return () => { active = false; };
  }, [filters.amphure]);

  const updateFilter = <K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const onResetAll = () => {
    setAmphuresList([]);
    setDistrictsList([]);
    handleClearFilters();
  };

  const pricePresets = activeTab === 'rent' ? RENT_PRICE_PRESETS : BUY_PRICE_PRESETS;

  return (
    <>
      {/* Backdrop สำหรับ Mobile Drawer */}
      {isMobileDrawerOpen && setIsMobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity" 
          onClick={() => setIsMobileDrawerOpen(false)} 
        />
      )}
      
      {/* Sidebar Container (กว้างขึ้น อ่านง่ายขึ้น มีระยะห่างที่พอดี) */}
      <aside className={`bg-white p-6 rounded-t-3xl lg:rounded-2xl border border-slate-200/80 shadow-lg lg:shadow-xs space-y-7 lg:sticky lg:top-24
        fixed lg:relative inset-x-0 bottom-0 z-50 lg:z-auto transition-transform duration-300 ease-in-out lg:transform-none overflow-y-auto max-h-[88vh] lg:max-h-none lg:block
        ${isMobileDrawerOpen ? 'translate-y-0' : 'translate-y-full'} lg:translate-y-0
      `}>
        {/* ส่วนหัว Sidebar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h2 className="font-extrabold text-slate-900 text-sm">ตัวกรองละเอียด</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onResetAll}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:text-blue-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างค่า
            </button>
            {setIsMobileDrawerOpen && (
              <button 
                onClick={() => setIsMobileDrawerOpen(false)} 
                className="lg:hidden w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="ปิดเมนูค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 1. ทำเลที่ตั้ง (Dropdown พิมพ์ค้นหาได้) */}
        <div className="space-y-3.5 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">ทำเลที่ตั้ง</label>
          </div>
          
          <div className="space-y-3">
            {/* จังหวัด (พิมพ์ค้นหาได้) */}
            <SearchableLocationSelect
              label="จังหวัด"
              placeholder="พิมพ์เพื่อค้นหาจังหวัด..."
              items={provincesList}
              selectedId={filters.province}
              onSelect={(id) => {
                setFilters((prev) => ({ ...prev, province: id, amphure: '', district: '' }));
                setAmphuresList([]);
                setDistrictsList([]);
              }}
              onClear={() => {
                setFilters((prev) => ({ ...prev, province: '', amphure: '', district: '' }));
                setAmphuresList([]);
                setDistrictsList([]);
              }}
            />

            {/* อำเภอ (พิมพ์ค้นหาได้) */}
            <SearchableLocationSelect
              label="อำเภอ / เขต"
              placeholder="พิมพ์เพื่อค้นหาอำเภอ / เขต..."
              items={amphuresList}
              selectedId={filters.amphure}
              disabled={!filters.province}
              onSelect={(id) => {
                setFilters((prev) => ({ ...prev, amphure: id, district: '' }));
                setDistrictsList([]);
              }}
              onClear={() => {
                setFilters((prev) => ({ ...prev, amphure: '', district: '' }));
                setDistrictsList([]);
              }}
            />

            {/* ตำบล (พิมพ์ค้นหาได้) */}
            <SearchableLocationSelect
              label="ตำบล / แขวง"
              placeholder="พิมพ์เพื่อค้นหาตำบล / แขวง..."
              items={districtsList}
              selectedId={filters.district}
              disabled={!filters.amphure}
              onSelect={(id) => {
                updateFilter('district', id);
              }}
              onClear={() => {
                updateFilter('district', '');
              }}
            />
          </div>
        </div>

        {/* 2. ช่วงราคา */}
        <div className="space-y-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              ช่วงราคา ({activeTab === 'rent' ? 'บาท/เดือน' : 'บาท'})
            </label>
          </div>

          {/* ชิปช่วงราคายอดนิยม */}
          <div className="flex flex-wrap gap-2">
            {pricePresets.map((preset) => {
              const isActive = (preset.min === '' && preset.max === '' && !filters.priceMin && !filters.priceMax) ||
                (preset.min === filters.priceMin && preset.max === filters.priceMax);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, priceMin: preset.min, priceMax: preset.max }));
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* ช่องพิมพ์ตัวเลขราคา */}
          <div className="flex items-center gap-2.5 pt-1">
            <div className="relative flex-1">
              <input 
                type="number" 
                value={filters.priceMin}
                onChange={(e) => updateFilter('priceMin', e.target.value)}
                placeholder="ต่ำสุด" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <span className="text-slate-400 font-bold text-xs">-</span>
            <div className="relative flex-1">
              <input 
                type="number" 
                value={filters.priceMax}
                onChange={(e) => updateFilter('priceMax', e.target.value)}
                placeholder="สูงสุด" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. ห้องนอน */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">ห้องนอน</label>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {ROOM_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => updateFilter('bedrooms', item.value)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  filters.bedrooms === item.value 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. ห้องน้ำ */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Bath className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">ห้องน้ำ</label>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {ROOM_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => updateFilter('bathrooms', item.value)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  filters.bathrooms === item.value 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. ที่จอดรถ */}
        <div className="space-y-2.5 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">ที่จอดรถ</label>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {PARKING_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => updateFilter('parking', item.value)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  filters.parking === item.value 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. พื้นที่ใช้สอย */}
        <div className="space-y-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">พื้นที่ใช้สอย (ตร.ม.)</label>
          </div>
          <div className="flex items-center gap-2.5">
            <input 
              type="number" 
              value={filters.areaMin}
              onChange={(e) => updateFilter('areaMin', e.target.value)}
              placeholder="ต่ำสุด" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <span className="text-slate-400 font-bold text-xs">-</span>
            <input 
              type="number" 
              value={filters.areaMax}
              onChange={(e) => updateFilter('areaMax', e.target.value)}
              placeholder="สูงสุด" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        {/* 7. สิ่งอำนวยความสะดวกสำคัญ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">สิ่งอำนวยความสะดวก</label>
          </div>
          <div className="space-y-1.5 text-xs font-bold text-slate-600">
            {FACILITIES_CONFIG.map(({ key, label, icon: IconComponent }) => (
              <label 
                key={key} 
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <input 
                  type="checkbox" 
                  checked={Boolean(filters.facilities[key as keyof typeof filters.facilities])}
                  onChange={(e) => updateFilter('facilities', { ...filters.facilities, [key]: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <IconComponent className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                <span className="text-slate-700 text-xs font-semibold">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ปุ่มดูผลลัพธ์บน Mobile Drawer */}
        {setIsMobileDrawerOpen && (
          <div className="pt-3 lg:hidden">
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-md text-xs cursor-pointer transition"
            >
              ดูผลลัพธ์
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
