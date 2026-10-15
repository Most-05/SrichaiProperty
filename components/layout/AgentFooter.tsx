/**
 * ==============================================================================
 * [SEARCH: AGENT_FOOTER] [UI: ฟุตเตอร์พอร์ทัลนายหน้า] [STYLE: AGENT_FOOTER_THEME]
 * ฟุตเตอร์สำหรับพอร์ทัลนายหน้าอสังหาริมทรัพย์ (Agent Portal Footer)
 * /components/layout/AgentFooter.tsx
 * ==============================================================================
 * แสดงลิขสิทธิ์ระบบและลิงก์ด่วนสำหรับฝั่งนายหน้า:
 * - หน้าหลักนายหน้า (/agent/home)
 * - ลงประกาศขายบ้าน (/agent/add-property)
 * - ข้อกำหนดและ PDPA นายหน้า (/agent/privacy, /agent/terms)
 * - ลิงก์กลับหน้าเว็บไซต์หลักของลูกค้า (/home)
 * ==============================================================================
 */

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export default function AgentFooter() {
  return (
    <footer className="bg-[#090D16] text-white py-8 border-t border-slate-800 text-[10px] text-slate-400 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
          <div className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center text-slate-950 font-black">S</div>
          <span className="font-bold text-white">Srichai Property Agents Platform</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 font-bold text-slate-300">
          <Link href="/agent/home" className="hover:text-amber-400 transition">หน้าหลักนายหน้า</Link>
          <Link href="/agent/add-property" className="hover:text-amber-400 transition">ลงประกาศขายบ้าน</Link>
          <Link href="/agent/privacy" className="hover:text-amber-400 transition text-amber-400/90">PDPA นายหน้า</Link>
          <Link href="/agent/terms" className="hover:text-amber-400 transition text-amber-400/90">ข้อกำหนดนายหน้า</Link>
          <Link href="/home" className="hover:text-amber-400 transition flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            หน้าเว็บไซต์หลัก
          </Link>
        </div>
      </div>
    </footer>
  );
}
