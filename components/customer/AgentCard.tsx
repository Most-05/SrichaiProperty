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
        {agent.isVerified && (
          <span className="absolute bottom-0 right-0 bg-blue-600 text-white p-0.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
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
                <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
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

      {/* ปุ่มติดต่อสื่อสาร */}
      <div className="w-full flex gap-2 pt-1">
        <a 
          href={`tel:${agent.phone}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          title={`โทรติดต่อ ${agent.name}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>โทรติดต่อ</span>
        </a>
        <Link 
          href={`/search?q=${encodeURIComponent(agent.name)}`}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          title={`ดูประกาศของ ${agent.name}`}
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>ดู {agent.propertiesCount} ประกาศ</span>
        </Link>
      </div>
    </div>
  );
}
