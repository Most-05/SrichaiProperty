'use client';

/**
 * ==============================================================================
 * หน้าค้นหาอสังหาริมทรัพย์ (Search Page)
 * ==============================================================================
 * ปรับปรุงใหม่:
 * - ใช้ Lucide Icons สวยงาม เป็นมืออาชีพ ไม่ใช้ Emoji
 * - ตัวกรองที่จอดรถ (Parking) และสัตว์เลี้ยงเข้าได้ (Pet-Friendly)
 * - Quick Filter Pills ใต้ Search Bar (ปุ่มลัดคลิกเดียว)
 * - Active Filter Chips เหนือตารางผลลัพธ์ พร้อมปุ่มกดยกเลิกทีละตัว
 * ==============================================================================
 */

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SearchSidebar, { FilterState } from '@/components/customer/SearchSidebar';
import PropertyCard from '@/components/customer/PropertyCard';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  PawPrint, 
  Car, 
  Banknote, 
  Sparkles, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  SearchX,
  Waves,
  Dumbbell,
  ShieldCheck,
  Bed,
  Bath
} from 'lucide-react';

const DEFAULT_FILTERS: FilterState = {
  province: '',
  amphure: '',
  district: '',
  priceMin: '',
  priceMax: '',
  bedrooms: 'any',
  bathrooms: 'any',
  parking: 'any',
  areaMin: '',
  areaMax: '',
  isPremiumOnly: false,
  facilities: {
    petFriendly: false,
    pool: false,
    gym: false,
    parking: false,
    security: false,
  },
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const resultsRef = useRef<HTMLDivElement>(null);
  const { properties, favorites, toggleFavorite } = useApp();

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>(() => searchParams.get('tab') === 'rent' ? 'rent' : 'buy');
  const [propertyType, setPropertyType] = useState(() => searchParams.get('type') || 'all');

  const [filters, setFilters] = useState<FilterState>(() => ({
    province: searchParams.get('province') || '',
    amphure: searchParams.get('amphure') || '',
    district: searchParams.get('district') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    bedrooms: searchParams.get('bedrooms') || 'any',
    bathrooms: searchParams.get('bathrooms') || 'any',
    parking: searchParams.get('parking') || 'any',
    areaMin: searchParams.get('areaMin') || '',
    areaMax: searchParams.get('areaMax') || '',
    isPremiumOnly: searchParams.get('premium') === 'true',
    facilities: {
      petFriendly: searchParams.get('facilities')?.includes('petFriendly') || false,
      pool: searchParams.get('facilities')?.includes('pool') || false,
      gym: searchParams.get('facilities')?.includes('gym') || false,
      parking: searchParams.get('facilities')?.includes('parking') || false,
      security: searchParams.get('facilities')?.includes('security') || false,
    },
  }));

  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc'>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
    if (activeTab !== 'buy') params.set('tab', activeTab);
    if (propertyType !== 'all') params.set('type', propertyType);

    if (filters.priceMin) params.set('priceMin', filters.priceMin);
    if (filters.priceMax) params.set('priceMax', filters.priceMax);
    if (filters.bedrooms !== 'any') params.set('bedrooms', filters.bedrooms);
    if (filters.bathrooms !== 'any') params.set('bathrooms', filters.bathrooms);
    if (filters.parking !== 'any') params.set('parking', filters.parking);
    if (filters.areaMin) params.set('areaMin', filters.areaMin);
    if (filters.areaMax) params.set('areaMax', filters.areaMax);
    if (filters.province) params.set('province', filters.province);
    if (filters.amphure) params.set('amphure', filters.amphure);
    if (filters.district) params.set('district', filters.district);
    if (filters.isPremiumOnly) params.set('premium', 'true');

    const activeFacs = Object.entries(filters.facilities)
      .filter(([, active]) => active)
      .map(([k]) => k)
      .join(',');
    if (activeFacs) params.set('facilities', activeFacs);

    const newQuery = params.toString();
    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedSearchTerm, activeTab, propertyType, filters, pathname, router, searchParams]);

  const triggerSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDebouncedSearchTerm(searchTerm);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setPropertyType('all');
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const filteredProperties = properties.filter((prop) => {
    if (activeTab === 'rent' && prop.listingType !== 'rent') return false;
    if (activeTab === 'buy' && prop.listingType !== 'sale') return false;

    if (filters.isPremiumOnly && !prop.isPremium) return false;

    const s = debouncedSearchTerm.toLowerCase().trim();
    if (s && ![prop.title, prop.location, prop.amphureName, prop.provinceName, prop.districtName].some(f => (f || '').toLowerCase().includes(s))) {
      return false;
    }

    if (filters.province && prop.province_id !== parseInt(filters.province)) return false;
    if (filters.amphure && prop.amphure_id !== parseInt(filters.amphure)) return false;
    if (filters.district && prop.district_id !== parseInt(filters.district)) return false;

    const typeMap: Record<string, string> = { house: 'บ้าน', condo: 'คอนโด', townhome: 'ทาวน์โฮม', land: 'ที่ดิน' };
    if (propertyType !== 'all' && typeMap[propertyType] && !prop.type.includes(typeMap[propertyType]) && !(propertyType === 'land' && prop.type.toLowerCase().includes('land'))) {
      return false;
    }

    const price = parseInt(prop.price.replace(/[^\d]/g, '')) || 0;
    if (filters.priceMin && price < parseInt(filters.priceMin)) return false;
    if (filters.priceMax && price > parseInt(filters.priceMax)) return false;

    if (filters.bedrooms !== 'any' && (prop.bedrooms || 0) < parseInt(filters.bedrooms)) return false;
    if (filters.bathrooms !== 'any' && (prop.bathrooms || 0) < parseInt(filters.bathrooms)) return false;

    if (filters.parking !== 'any' && (prop.parking || 0) < parseInt(filters.parking)) return false;

    if (filters.areaMin && (prop.area || 0) < parseFloat(filters.areaMin)) return false;
    if (filters.areaMax && (prop.area || 0) > parseFloat(filters.areaMax)) return false;

    const desc = prop.description || '';
    const propAmenities = prop.amenities || [];
    const hasAmenity = (pattern: RegExp) => propAmenities.some(a => pattern.test(a)) || pattern.test(desc);

    if (filters.facilities.petFriendly && !hasAmenity(/สัตว์เลี้ยง|pet/i)) return false;
    if (filters.facilities.pool && !hasAmenity(/สระ|pool/i)) return false;
    if (filters.facilities.gym && !hasAmenity(/ฟิตเนส|ยิม|gym/i)) return false;
    if (filters.facilities.parking && !hasAmenity(/ที่จอดรถ|จอดรถ|parking/i) && (prop.parking || 0) <= 0) return false;
    if (filters.facilities.security && !hasAmenity(/รักษาความปลอดภัย|cctv|รปภ|security/i)) return false;

    return true;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'latest') return 0;
    const priceA = parseInt(a.price.replace(/[^\d]/g, '')) || 0;
    const priceB = parseInt(b.price.replace(/[^\d]/g, '')) || 0;
    return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
  });

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(sortedProperties.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProperties = sortedProperties.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

  // รายการ Active Filter Chips
  const activeChips: { id: string; label: string; icon?: React.ReactNode; onRemove: () => void }[] = [];

  if (debouncedSearchTerm) {
    activeChips.push({
      id: 'search',
      label: `"${debouncedSearchTerm}"`,
      icon: <Search className="w-3 h-3 text-slate-500" />,
      onRemove: () => { setSearchTerm(''); setDebouncedSearchTerm(''); },
    });
  }

  if (propertyType !== 'all') {
    const typeMap: Record<string, string> = { house: 'บ้านเดี่ยว', condo: 'คอนโด', townhome: 'ทาวน์โฮม', land: 'ที่ดิน' };
    activeChips.push({
      id: 'type',
      label: typeMap[propertyType] || propertyType,
      onRemove: () => setPropertyType('all'),
    });
  }

  if (filters.priceMin || filters.priceMax) {
    let label = 'งบ: ';
    if (filters.priceMin && filters.priceMax) {
      label += `฿${Number(filters.priceMin).toLocaleString()} - ฿${Number(filters.priceMax).toLocaleString()}`;
    } else if (filters.priceMin) {
      label += `>= ฿${Number(filters.priceMin).toLocaleString()}`;
    } else {
      label += `<= ฿${Number(filters.priceMax).toLocaleString()}`;
    }
    activeChips.push({
      id: 'price',
      label,
      icon: <Banknote className="w-3 h-3 text-emerald-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, priceMin: '', priceMax: '' })),
    });
  }

  if (filters.bedrooms !== 'any') {
    activeChips.push({
      id: 'bedrooms',
      label: `${filters.bedrooms}+ นอน`,
      icon: <Bed className="w-3 h-3 text-blue-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, bedrooms: 'any' })),
    });
  }

  if (filters.bathrooms !== 'any') {
    activeChips.push({
      id: 'bathrooms',
      label: `${filters.bathrooms}+ น้ำ`,
      icon: <Bath className="w-3 h-3 text-blue-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, bathrooms: 'any' })),
    });
  }

  if (filters.parking !== 'any') {
    activeChips.push({
      id: 'parking',
      label: `${filters.parking}+ จอดรถ`,
      icon: <Car className="w-3 h-3 text-blue-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, parking: 'any' })),
    });
  }

  if (filters.facilities.petFriendly) {
    activeChips.push({
      id: 'petFriendly',
      label: 'สัตว์เลี้ยงได้',
      icon: <PawPrint className="w-3 h-3 text-amber-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, facilities: { ...prev.facilities, petFriendly: false } })),
    });
  }

  if (filters.facilities.pool) {
    activeChips.push({
      id: 'pool',
      label: 'สระว่ายน้ำ',
      icon: <Waves className="w-3 h-3 text-cyan-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, facilities: { ...prev.facilities, pool: false } })),
    });
  }

  if (filters.facilities.gym) {
    activeChips.push({
      id: 'gym',
      label: 'ฟิตเนส',
      icon: <Dumbbell className="w-3 h-3 text-purple-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, facilities: { ...prev.facilities, gym: false } })),
    });
  }

  if (filters.facilities.parking) {
    activeChips.push({
      id: 'facParking',
      label: 'ที่จอดรถ',
      icon: <Car className="w-3 h-3 text-slate-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, facilities: { ...prev.facilities, parking: false } })),
    });
  }

  if (filters.facilities.security) {
    activeChips.push({
      id: 'security',
      label: 'รปภ./CCTV',
      icon: <ShieldCheck className="w-3 h-3 text-emerald-600" />,
      onRemove: () => setFilters(prev => ({ ...prev, facilities: { ...prev.facilities, security: false } })),
    });
  }

  if (filters.isPremiumOnly) {
    activeChips.push({
      id: 'premium',
      label: 'ทรัพย์พรีเมียม',
      icon: <Sparkles className="w-3 h-3 text-amber-500" />,
      onRemove: () => setFilters(prev => ({ ...prev, isPremiumOnly: false })),
    });
  }

  return (
    <div className="font-sans bg-slate-50 min-h-screen text-slate-800 antialiased text-sm pb-16">
      {/* Hero Header */}
      <header className="bg-slate-900 pt-10 sm:pt-14 pb-10 sm:pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50" />
        
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight drop-shadow-xs">
            ค้นหาบ้านที่ใช่ สำหรับคุณ
          </h1>
          <p className="text-slate-300 font-medium mb-6 text-xs sm:text-sm max-w-lg mx-auto drop-shadow-xs">
            ค้นพบอสังหาริมทรัพย์คุณภาพ พร้อมให้คุณเป็นเจ้าของหรือเช่าอยู่แล้ววันนี้
          </p>

          {/* แถบค้นหาหลัก */}
          <div className="bg-white p-2 sm:p-2.5 rounded-2xl md:rounded-full shadow-2xl border border-slate-200/20 max-w-4xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <div className="flex-1 flex bg-slate-50 rounded-xl md:rounded-full px-4 py-2 border border-slate-100 focus-within:border-blue-500 transition-colors items-center">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                placeholder="ระบุทำเล, โครงการ, รหัสไปรษณีย์..."
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800 text-xs font-bold placeholder-slate-400 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setDebouncedSearchTerm(''); }}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer rounded-full hover:bg-slate-200 transition"
                  aria-label="ล้างคำค้นหา"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="w-px bg-slate-200 hidden md:block h-6" />

            <div className="w-full md:w-32">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as 'buy' | 'rent')}
                className="w-full bg-transparent border-none py-2 px-3 text-xs font-bold text-slate-700 cursor-pointer outline-none focus:ring-0"
              >
                <option value="buy">ซื้อ (Buy)</option>
                <option value="rent">เช่า (Rent)</option>
              </select>
            </div>

            <div className="w-px bg-slate-200 hidden md:block h-6" />

            <div className="w-full md:w-40">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full bg-transparent border-none py-2 px-3 text-xs font-bold text-slate-700 cursor-pointer outline-none focus:ring-0"
              >
                <option value="all">ประเภททั้งหมด</option>
                <option value="house">บ้านเดี่ยว (House)</option>
                <option value="condo">คอนโดมิเนียม (Condo)</option>
                <option value="townhome">ทาวน์โฮม (Townhome)</option>
              </select>
            </div>

            <button
              onClick={() => triggerSearch()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl md:rounded-full transition-all text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              ค้นหา
            </button>
          </div>

          {/* Quick Filter Pills (ปุ่มลัดคลิกเดียว ใช้ Lucide Icons สวยงาม) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-2xl mx-auto text-xs">
            <span className="text-slate-400 font-medium text-[11px] mr-1 hidden sm:inline">ปุ่มลัด:</span>
            
            {/* 1. สัตว์เลี้ยงได้ */}
            <button
              type="button"
              onClick={() => setFilters(prev => ({
                ...prev,
                facilities: { ...prev.facilities, petFriendly: !prev.facilities.petFriendly }
              }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                filters.facilities.petFriendly 
                  ? 'bg-amber-400 text-slate-900 ring-2 ring-white/60 font-black' 
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20'
              }`}
            >
              <PawPrint className="w-3.5 h-3.5" />
              <span>สัตว์เลี้ยงได้</span>
            </button>

            {/* 2. ที่จอดรถ 2 คัน+ */}
            <button
              type="button"
              onClick={() => setFilters(prev => ({
                ...prev,
                parking: prev.parking === '2' ? 'any' : '2'
              }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                filters.parking === '2' 
                  ? 'bg-blue-400 text-slate-900 ring-2 ring-white/60 font-black' 
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>ที่จอดรถ 2 คัน+</span>
            </button>

            {/* 3. ผ่อนสบาย */}
            <button
              type="button"
              onClick={() => {
                const targetMax = activeTab === 'rent' ? '15000' : '3000000';
                setFilters(prev => ({
                  ...prev,
                  priceMin: '',
                  priceMax: prev.priceMax === targetMax ? '' : targetMax
                }));
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                filters.priceMax === (activeTab === 'rent' ? '15000' : '3000000')
                  ? 'bg-emerald-400 text-slate-900 ring-2 ring-white/60 font-black' 
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{activeTab === 'rent' ? 'ไม่เกิน 15,000/ด.' : 'ต่ำกว่า 3 ล้าน'}</span>
            </button>

            {/* 4. ทรัพย์พรีเมียม */}
            <button
              type="button"
              onClick={() => setFilters(prev => ({
                ...prev,
                isPremiumOnly: !prev.isPremiumOnly
              }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                filters.isPremiumOnly 
                  ? 'bg-amber-500 text-white ring-2 ring-white/60 font-black' 
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ทรัพย์พรีเมียม</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (ขยายพื้นที่ให้กว้างขึ้นและอ่านง่าย สบายตา) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar (กว้างขึ้น 4 ใน 12 ส่วน) */}
          <div className="lg:col-span-4 xl:col-span-4">
            <SearchSidebar
              filters={filters}
              setFilters={setFilters}
              activeTab={activeTab}
              isMobileDrawerOpen={isMobileDrawerOpen}
              setIsMobileDrawerOpen={setIsMobileDrawerOpen}
              handleClearFilters={handleClearFilters}
            />
          </div>

          {/* Results Column (8 ใน 12 ส่วน) */}
          <div ref={resultsRef} className="lg:col-span-8 xl:col-span-8 space-y-5">
            {/* Header + Sort */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">รายการอสังหาริมทรัพย์</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">พบ {sortedProperties.length} รายการที่ตรงกับเงื่อนไข</p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="lg:hidden flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  ตัวกรอง {activeChips.length > 0 && `(${activeChips.length})`}
                </button>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 font-medium whitespace-nowrap">เรียงตาม:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'latest' | 'price_asc' | 'price_desc')}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 cursor-pointer text-xs focus:ring-0 focus:border-slate-300 outline-none"
                  >
                    <option value="latest">ล่าสุด</option>
                    <option value="price_asc">ราคา: ต่ำ &rarr; สูง</option>
                    <option value="price_desc">ราคา: สูง &rarr; ต่ำ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeChips.length > 0 && (
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-2 text-xs shadow-xs">
                <span className="text-[11px] text-slate-400 font-medium">ตัวกรอง:</span>
                {activeChips.map((chip) => (
                  <span
                    key={chip.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    {chip.icon}
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      className="hover:text-slate-900 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-slate-200 cursor-pointer"
                      title="ยกเลิกตัวกรองนี้"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold ml-auto hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  ล้างทั้งหมด
                </button>
              </div>
            )}

            {/* Empty State หรือ Grid การ์ด */}
            {sortedProperties.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs space-y-4">
                <SearchX className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="font-extrabold text-slate-800 text-sm">ไม่พบอสังหาริมทรัพย์ที่ตรงกับเงื่อนไข</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  กรุณาลองปรับลดตัวกรอง หรือล้างตัวเลือกตัวกรองทั้งหมดแล้วลองค้นหาใหม่อีกครั้ง
                </p>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2 rounded-full text-xs shadow-sm transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  ล้างค่าตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {paginatedProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    prop={prop}
                    isFav={favorites.includes(prop.id)}
                    toggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-6 text-xs font-bold">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={validCurrentPage === 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
                  aria-label="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-bold transition cursor-pointer flex items-center justify-center ${
                      validCurrentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
                  aria-label="หน้าถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
