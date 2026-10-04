import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Star, Phone, BadgeCheck, UserCheck, MapPin } from 'lucide-react';

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
  isPro?: boolean;
  experience?: string | null;
}

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between h-full group">
      {/* ส่วนข้อมูลด้านบน */}
      <div className="flex flex-col items-center text-center space-y-3">
        {/* รูปโปรไฟล์ */}
        <Link href={`/agents/${agent.id}`} className="relative block cursor-pointer">
          <div className="w-16 h-16 rounded-full border-2 border-slate-100 shadow-sm overflow-hidden bg-slate-100">
            <Image 
              src={agent.avatar} 
              alt={agent.name} 
              width={64} 
              height={64} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
              unoptimized
            />
          </div>
          {agent.isVerified && (
            <span 
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm flex items-center justify-center" 
              title="ยืนยันตัวตนแล้วโดย Srichai Property"
            >
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
        </Link>

        {/* ชื่อและตำแหน่ง */}
        <div className="w-full space-y-1">
          <Link href={`/agents/${agent.id}`} className="inline-block hover:text-blue-600 transition">
            <h3 className="font-extrabold text-slate-900 text-sm hover:underline cursor-pointer">
              {agent.name}
            </h3>
          </Link>

          {agent.isPro && (
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs">
                <BadgeCheck className="w-3 h-3 shrink-0" /> Verified PRO
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 font-medium truncate">{agent.role}</p>

          {agent.experience && agent.experience !== 'none' && agent.experience.trim() !== '' && (
            <p className="text-[10px] text-blue-600 font-bold">
              ประสบการณ์ {/^\d+$/.test(agent.experience.trim()) ? `${agent.experience.trim()} ปี` : agent.experience}
            </p>
          )}
        </div>

        {/* ตารางสถิติย่อ */}
        <div className="w-full bg-slate-50 rounded-xl grid grid-cols-2 text-center text-xs font-semibold border border-slate-100 p-2.5">
          <div className="border-r border-slate-200 pr-1">
            <p className="text-slate-400 text-[10px]">ทรัพย์ที่ดูแล</p>
            <p className="text-slate-900 font-extrabold mt-0.5">{agent.propertiesCount} ประกาศ</p>
          </div>
          <div className="pl-1">
            <p className="text-slate-400 text-[10px]">คะแนนรีวิว</p>
            <div className="text-slate-800 flex items-center justify-center gap-1 font-bold mt-0.5">
              {agent.reviewCount && agent.reviewCount > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="text-slate-900 font-extrabold">{agent.averageRating?.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({agent.reviewCount})</span>
                </>
              ) : (
                <span className="text-slate-400 text-[11px] font-normal">ยังไม่มีรีวิว</span>
              )}
            </div>
          </div>
        </div>

        {/* ข้อมูลทำเลและเบอร์ติดต่อ */}
        <div className="w-full text-left space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate text-[11px]"><strong>พื้นที่:</strong> {agent.location}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">เบอร์โทร:</span>
            <a href={`tel:${agent.phone}`} className="text-blue-600 hover:underline font-bold">
              {agent.phone}
            </a>
          </div>
        </div>
      </div>

      {/* ปุ่มกดดำเนินการ 2 ปุ่มที่สมดุลและใช้งานง่าย */}
      <div className="pt-4 grid grid-cols-2 gap-2">
        <Link 
          href={`/agents/${agent.id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer text-center"
          title={`ดูประวัติและผลงานของ ${agent.name}`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>ดูประวัติ</span>
        </Link>

        <a 
          href={`tel:${agent.phone}`}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer text-center"
          title={`โทรติดต่อ ${agent.name}`}
        >
          <Phone className="w-3.5 h-3.5 text-slate-600" />
          <span>โทรด่วน</span>
        </a>
      </div>
    </div>
  );
}
