'use client';

import React, { useState, useMemo } from 'react';
import AgentCard, { Agent } from '@/components/customer/AgentCard';
import { Search, X, Users } from 'lucide-react';

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.agents)) {
          setAgents(data.agents);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // ดึงรายการทำเลที่มีนายหน้าจริงจากข้อมูลที่โหลดมา
  const locationOptions = useMemo(() => {
    const locSet = new Set<string>();
    agents.forEach((a) => {
      if (a.location) {
        // แยกตามเครื่องหมาย / หรือ , กรณีใส่หลายพื้นที่
        const parts = a.location.split(/[/,]/).map(s => s.trim()).filter(Boolean);
        if (parts.length > 0) {
          parts.forEach(p => locSet.add(p));
        } else {
          locSet.add(a.location.trim());
        }
      }
    });
    return Array.from(locSet).sort();
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return agents.filter(agent => {
      const matchesSearch = !term || 
        agent.name.toLowerCase().includes(term) ||
        agent.location.toLowerCase().includes(term) ||
        agent.role.toLowerCase().includes(term);
      const matchesLocation = selectedLocation === '' || agent.location.includes(selectedLocation);
      return matchesSearch && matchesLocation;
    });
  }, [agents, searchTerm, selectedLocation]);

  return (
    <div className="font-sans bg-slate-50 min-h-screen text-slate-800 antialiased overflow-x-hidden text-sm flex flex-col">
      <div className="bg-slate-900 py-12 relative overflow-hidden flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 text-center text-white space-y-3 relative z-10">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow">Srichai Property Network</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">ทำความรู้จักกับนายหน้ามืออาชีพของเรา</h1>
          <p className="text-slate-300 text-xs max-w-xl mx-auto font-light">ทีมงานคุณภาพที่ผ่านการยืนยันตัวตนแล้ว พร้อมให้คำปรึกษาและช่วยคุณค้นหาบ้านที่ตรงใจที่สุด</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 relative z-20 -mt-6 mb-8 w-full">
        <div className="bg-white p-2.5 rounded-2xl shadow-md flex flex-col md:flex-row gap-2 border border-slate-200">
          <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus-within:border-blue-500 transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อนายหน้า, ทำเลที่เชี่ยวชาญ, หรือประเภทอสังหาฯ..." 
              className="w-full bg-transparent border-none focus:ring-0 text-slate-800 font-medium text-xs outline-none" 
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select 
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="md:w-56 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 text-slate-700 font-medium text-xs cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกพื้นที่ให้บริการ ({locationOptions.length} ทำเล)</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-4 mb-16 flex-grow w-full">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-900">ตัวแทนนายหน้าทั้งหมด ({filteredAgents.length})</h2>
          {(searchTerm || selectedLocation) && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedLocation(''); }}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        {filteredAgents.length === 0 && !loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-8 space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">ไม่พบนายหน้าที่ตรงกับเงื่อนไข</h3>
            <p className="text-slate-500 text-xs">ลองค้นหาด้วยคำอื่น หรือเลือกดูทุกพื้นที่ให้บริการ</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedLocation(''); }}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              ดูนายหน้าทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

