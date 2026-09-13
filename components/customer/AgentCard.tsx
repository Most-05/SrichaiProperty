import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  propertiesCount: number;
  rating: string;
  averageRating?: number;
  reviewCount?: number;
  location: string;
  phone: string;
  email: string;
  isVerified: boolean;
}

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-md transition">
      <div className="relative">
        <Image 
          src={agent.avatar} 
          width={64} 
          height={64} 
          className="w-16 h-16 rounded-full border shadow-sm object-cover" 
          alt={agent.name} 
          unoptimized
        />
        {agent.isVerified && <span className="absolute bottom-0 right-0 bg-blue-500 text-white text-[9px] font-bold p-0.5 rounded-full border border-white">✓</span>}
      </div>

      <div>
        <h3 className="font-extrabold text-slate-900 text-sm">{agent.name}</h3>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{agent.role}</p>
      </div>

      <div className="w-full bg-slate-50 p-2.5 rounded-xl grid grid-cols-2 text-center text-xs font-semibold border border-slate-100">
        <div className="border-r border-slate-200">
          <p className="text-slate-400 text-[10px]">อสังหาริมทรัพย์</p>
          <p className="text-slate-850 font-bold">{agent.propertiesCount} ประกาศ</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px]">คะแนนรีวิว</p>
          <div className="text-slate-800 flex items-center justify-center gap-1 font-bold mt-0.5">
            {agent.reviewCount && agent.reviewCount > 0 ? (
              <>
                <span className="text-amber-500 text-xs">⭐</span>
                <span className="text-slate-900 font-extrabold">{agent.averageRating?.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400 font-normal">({agent.reviewCount})</span>
              </>
            ) : (
              <span className="text-slate-400 text-[11px] font-normal">ยังไม่มีรีวิว</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full text-left space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
        <p><strong>พื้นที่:</strong> {agent.location}</p>
        <p>
          <strong>เบอร์โทร:</strong>{' '}
          <a href={`tel:${agent.phone}`} className="text-blue-600 hover:underline font-bold">
            {agent.phone}
          </a>
        </p>
        <p>
          <strong>อีเมล:</strong>{' '}
          <a href={`mailto:${agent.email}`} className="text-blue-600 hover:underline">
            {agent.email}
          </a>
        </p>
      </div>

      {/* ปุ่มติดต่อสื่อสาร:
          1. ปุ่มโทรติดต่อด่วน (กดโทรออกได้ทันทีบนมือถือ/แท็บเล็ต)
          2. ปุ่มดูประกาศบ้านทั้งหมดที่นายหน้าคนนี้เป็นผู้ดูแล */}
      <div className="w-full flex gap-2 pt-1">
        <a 
          href={`tel:${agent.phone}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          title={`โทรติดต่อ ${agent.name}`}
        >
          📞 โทรติดต่อ
        </a>
        <Link 
          href={`/search?q=${encodeURIComponent(agent.name)}`}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          title={`ดูประกาศของ ${agent.name}`}
        >
          🏠 ดู {agent.propertiesCount} ประกาศ
        </Link>
      </div>
    </div>
  );
}
