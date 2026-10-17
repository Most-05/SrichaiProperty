'use client';

/**
 * ==============================================================================
 * [SEARCH: CUSTOMER_AGENTS_PAGE] [UI: หน้ารวมตัวแทนนายหน้าสำหรับลูกค้า]
 * หน้ารวมและค้นหาตัวแทนนายหน้ามืออาชีพ (Agents Directory Page)
 * /app/(customer)/agents/page.tsx
 * ==============================================================================
 * ออกแบบตามแบบที่ 1 (Smart Cascading Filter):
 * 1. Dropdown 1: เลือกจังหวัด (เฉพาะจังหวัดที่มีนายหน้าจริง พร้อมระบุจำนวนคน เช่น สงขลา (5 ท่าน))
 * 2. Dropdown 2: เลือกอำเภอ/โซน (กรองตามจังหวัดที่เลือก เช่น หาดใหญ่ (4 ท่าน), เมืองสงขลา (1 ท่าน))
 * 3. ช่องค้นหาอิสระ (พิมพ์ชื่อ, นามสกุล, ทำเล, หรือความเชี่ยวชาญ)
 * 4. ชิปทำเลยอดนิยมคลิกเดียว (Quick Filter Chips)
 * 5. ป้ายแสดงตัวกรองที่เลือก (Active Filter Tags) พร้อมปุ่มกดล้างตัวกรอง
 * ==============================================================================
 */

import React, { useState, useMemo, useEffect } from 'react';
import AgentCard, { Agent } from '@/components/customer/AgentCard';
import { 
  Search, 
  X, 
  Users, 
  MapPin, 
  RotateCcw,
  BadgeCheck,
  Sparkles
} from 'lucide-react';

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedAmphure, setSelectedAmphure] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลตัวแทนนายหน้าจาก API
  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.agents)) {
          setAgents(data.agents);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching agents:', err);
        setLoading(false);
      });
  }, []);

  // 1. สรุปรายชื่อจังหวัดที่มีนายหน้าจริง พร้อมจำนวนคน
  const provinceOptions = useMemo(() => {
    const provMap = new Map<string, number>();
    agents.forEach((a) => {
      const p = (a.province || 'สงขลา').trim();
      provMap.set(p, (provMap.get(p) || 0) + 1);
    });

    return Array.from(provMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'));
  }, [agents]);

  // 2. สรุปรายชื่ออำเภอ/โซน โดยสัมพันธ์กับจังหวัดที่เลือก (Cascading)
  const amphureOptions = useMemo(() => {
    const amphureMap = new Map<string, number>();
    agents.forEach((a) => {
      const agentProvince = (a.province || 'สงขลา').trim();
      // หากเลือกจังหวัด ให้กรองเฉพาะนายหน้าที่อยู่ในจังหวัดนั้น
      if (!selectedProvince || agentProvince === selectedProvince) {
        const amphureName = (a.amphure || a.location?.split(/[/,]/)[0]?.trim() || 'หาดใหญ่').trim();
        amphureMap.set(amphureName, (amphureMap.get(amphureName) || 0) + 1);
      }
    });

    return Array.from(amphureMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'));
  }, [agents, selectedProvince]);

  // เมื่อเปลี่ยนจังหวัด หากอำเภอที่เคยเลือกไม่อยู่ในจังหวัดใหม่ ให้รีเซ็ตอำเภอ
  const handleProvinceChange = (prov: string) => {
    setSelectedProvince(prov);
    if (!prov) {
      return;
    }
    // ตรวจสอบว่าอำเภอที่เลือกยังคงอยู่ในจังหวัดนี้หรือไม่
    const validInProvince = agents.some(
      (a) => (a.province || 'สงขลา').trim() === prov && (a.amphure || '').trim() === selectedAmphure
    );
    if (!validInProvince) {
      setSelectedAmphure('');
    }
  };

  // 3. กรองนายหน้าตามเงื่อนไขทั้งหมด (Search, จังหวัด, อำเภอ)
  const filteredAgents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return agents.filter((agent) => {
      const agentProvince = (agent.province || 'สงขลา').trim();
      const agentAmphure = (agent.amphure || agent.location?.split(/[/,]/)[0]?.trim() || 'หาดใหญ่').trim();

      // ตรวจสอบคำค้นหาอิสระ
      const matchesSearch =
        !term ||
        agent.name.toLowerCase().includes(term) ||
        agent.location.toLowerCase().includes(term) ||
        agent.role.toLowerCase().includes(term) ||
        agentProvince.toLowerCase().includes(term) ||
        agentAmphure.toLowerCase().includes(term);

      // ตรวจสอบจังหวัด
      const matchesProvince = !selectedProvince || agentProvince === selectedProvince;

      // ตรวจสอบอำเภอ
      const matchesAmphure = !selectedAmphure || agentAmphure === selectedAmphure || agent.location.includes(selectedAmphure);

      return matchesSearch && matchesProvince && matchesAmphure;
    });
  }, [agents, searchTerm, selectedProvince, selectedAmphure]);

  // ฟังก์ชันล้างตัวกรองทั้งหมด
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedProvince('');
    setSelectedAmphure('');
  };

  const hasActiveFilters = Boolean(searchTerm || selectedProvince || selectedAmphure);

  return (
    <div className="font-sans bg-slate-50 min-h-screen text-slate-800 antialiased overflow-x-hidden text-sm flex flex-col">
      {/* Hero Header */}
      <div className="bg-slate-900 py-12 relative overflow-hidden flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 text-center text-white space-y-3 relative z-10">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow inline-flex items-center gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5" />
            Srichai Property Verified Agents
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ทำความรู้จักกับนายหน้ามืออาชีพของเรา
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto font-light leading-relaxed">
            ทีมงานคุณภาพที่ผ่านการยืนยันตัวตน (KYC) พร้อมให้คำปรึกษา แนะนำสินเชื่อ และช่วยคุณค้นหาอสังหาริมทรัพย์ที่ตรงใจที่สุด
          </p>
        </div>
      </div>

      {/* Search & Smart Cascading Filter Bar */}
      <div className="max-w-5xl mx-auto px-4 relative z-20 -mt-6 mb-8 w-full">
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-md border border-slate-200/90 space-y-3">
          {/* แถวด้านบน: ช่องค้นหา + 2 Dropdown (จัดวางด้วย Flexbox สวยงาม ไม่แตก) */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
            {/* 1. ช่องค้นหาข้อความ */}
            <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-2xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อนายหน้า, ทำเล, หรือความเชี่ยวชาญ..."
                className="w-full bg-transparent border-none focus:ring-0 text-slate-800 font-medium text-xs outline-none placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="ล้างข้อความ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Dropdown เลือกจังหวัด */}
            <div className="w-full sm:w-48 md:w-56 shrink-0">
              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="">ทุกจังหวัด ({agents.length} ท่าน)</option>
                {provinceOptions.map((prov) => (
                  <option key={prov.name} value={prov.name}>
                    {prov.name} ({prov.count} ท่าน)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Dropdown เลือกอำเภอ/โซน (Cascading ตามจังหวัด) */}
            <div className="w-full sm:w-48 md:w-56 shrink-0">
              <select
                value={selectedAmphure}
                onChange={(e) => setSelectedAmphure(e.target.value)}
                className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="">
                  {selectedProvince ? `ทุกอำเภอใน${selectedProvince}` : `ทุกอำเภอ/โซน`}
                </option>
                {amphureOptions.map((amp) => (
                  <option key={amp.name} value={amp.name}>
                    {amp.name} ({amp.count} ท่าน)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* แถวล่าง: Quick Chips ทำเลยอดนิยม (คลิกเดียวสลับอำเภอ) */}
          {amphureOptions.length > 0 && (
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-400 font-bold shrink-0 flex items-center gap-1 mr-1">
                <MapPin className="w-3 h-3 text-slate-400" /> ทำเลยอดนิยม:
              </span>
              <button
                type="button"
                onClick={() => setSelectedAmphure('')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedAmphure === ''
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              {amphureOptions.map((amp) => {
                const isActive = selectedAmphure === amp.name;
                return (
                  <button
                    key={amp.name}
                    type="button"
                    onClick={() => setSelectedAmphure(isActive ? '' : amp.name)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{amp.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {amp.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* แถบแสดงสถานะตัวกรองที่เลือกใช้งาน (Active Filter Pills) */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
            <span className="text-[11px] text-slate-500 font-bold">ตัวกรองที่เลือก:</span>
            
            {selectedProvince && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-2xs">
                <span>จังหวัด: {selectedProvince}</span>
                <button 
                  type="button" 
                  onClick={() => handleProvinceChange('')}
                  className="hover:text-blue-900 cursor-pointer ml-0.5"
                  title="ลบตัวกรองจังหวัด"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedAmphure && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-2xs">
                <span>อำเภอ: {selectedAmphure}</span>
                <button 
                  type="button" 
                  onClick={() => setSelectedAmphure('')}
                  className="hover:text-blue-900 cursor-pointer ml-0.5"
                  title="ลบตัวกรองอำเภอ"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs">
                <span>ค้นหา: &quot;{searchTerm}&quot;</span>
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')}
                  className="hover:text-slate-900 cursor-pointer ml-0.5"
                  title="ล้างคำค้นหา"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs text-red-600 hover:text-red-700 font-bold ml-auto flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3" />
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* สถานะกำลังโหลดข้อมูล */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">กำลังโหลดรายชื่อตัวแทนนายหน้า...</span>
        </div>
      )}

      {/* Main Agent List */}
      <main className="max-w-6xl mx-auto px-4 py-2 mb-16 flex-grow w-full">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              ตัวแทนนายหน้าที่ตรงกับเงื่อนไข ({filteredAgents.length} ท่าน)
            </h2>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              ดูนายหน้าทั้งหมด
            </button>
          )}
        </div>

        {/* กรณีค้นหาแล้วไม่พบนายหน้า */}
        {filteredAgents.length === 0 && !loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-8 space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">ไม่พบนายหน้าที่ตรงกับเงื่อนไข</h3>
            <p className="text-slate-500 text-xs">
              ลองเปลี่ยนอำเภอ หรือเลือกดูทุกพื้นที่ให้บริการของจังหวัดเพื่อพบนายหน้าในบริเวณใกล้เคียง
            </p>
            <button
              onClick={handleClearAllFilters}
              className="mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างตัวกรองเพื่อดูนายหน้าทั้งหมด
            </button>
          </div>
        ) : (
          /* Grid แสดงการ์ดนายหน้า */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
