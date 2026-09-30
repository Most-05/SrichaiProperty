import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Star, Phone, Home } from 'lucide-react';

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
            <Check className="w-2.5 h-2.5 stroke-[3]" />
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
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
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
          <Phone className="w-3.5 h-3.5" />
          <span>โทรติดต่อ</span>
        </a>
        <Link 
          href={`/search?agentId=${encodeURIComponent(agent.id)}`}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          title={`ดูประกาศทั้งหมดของ ${agent.name}`}
        >
          <Home className="w-3.5 h-3.5 text-slate-500" />
          <span>ดู {agent.propertiesCount} ประกาศ</span>
        </Link>
      </div>
    </div>
  );
}
