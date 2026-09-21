import React from 'react';
import { AgentContact } from '@/types'; // กำหนดโครงสร้างข้อมูลบทสนทนาที่กำลังเปิดอยู่ (ข้อมูลผู้ติดต่อ, ประวัติแชท, สถานะกำลังพิมพ์)
// นำ shadcn UI Chat primitives มาใช้งานในหน้าแชทของ Agent
import { Message, MessageAvatar, MessageContent, MessageFooter } from '@/components/ui/message'; // ใช้แสดงแต่ละแถวข้อความแชท พร้อมรูปโปรไฟล์ กรอบข้อความ และเวลาที่ส่ง
import { Bubble, BubbleContent } from '@/components/ui/bubble'; // ใช้จัดสไตล์กรอบข้อความแชท (แยกแบบลูกค้ากับแบบเอเย่นต์)

interface Props {
  activeContact: AgentContact | null;
  selectedContactId: string;
  isTypingState: { [key: string]: boolean };
  newMessageText: string;
  setNewMessageText: (val: string) => void;
  handleSendMessage: (text?: string) => void;
  sendQuickAction: (actionType: 'location' | 'document' | 'callback') => void;
}

/**
 * ==============================================================================
 * CHAT ROOM COMPONENT (หน้าต่างห้องแชทฝั่ง Agent)
 * ==============================================================================
 */
export default function ChatRoom({
  activeContact,
  selectedContactId,
  isTypingState,
  newMessageText,
  setNewMessageText,
  handleSendMessage,
  sendQuickAction
}: Props) {
  // หากยังไม่ได้เลือกผู้ติดต่อ
  if (!activeContact) {
    return (
      <section className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden relative justify-center items-center h-full">
        <div className="text-slate-400 font-bold text-xs">กรุณาเลือกผู้ติดต่อเพื่อเริ่มแชท</div>
      </section>
    );
  }

  return (
    <section className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden relative h-full">
      {/* 1. Header ส่วนหัว แสดงชื่อผู้สนทนาและสถานะออนไลน์ */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm shrink-0">
        <div className="text-left flex items-center gap-3">
          <MessageAvatar fallback={activeContact.name.charAt(0)} />
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs md:text-sm">{activeContact.name}</h4>
            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> กำลังออนไลน์
            </span>
          </div>
        </div>
      </div>

      {/* 2. การ์ดแสดงอสังหาฯ ที่ลูกค้าสนใจ */}
      <div className="px-4 py-3 bg-[#f8fafc]/80 border-b flex items-center justify-between gap-4 shrink-0 text-left">
        <div>
          <span className="text-[9px] text-slate-400 font-bold block">ทรัพย์ที่สนใจ ({activeContact.propertyCode})</span>
          <h5 className="font-extrabold text-slate-800 text-[11px] truncate">{activeContact.propertyName}</h5>
        </div>
        <div className="text-right shrink-0">
          <strong className="text-blue-600 font-extrabold text-xs block">{activeContact.propertyPrice}</strong>
        </div>
      </div>

      {/* 3. รายการข้อความ (ใช้ shadcn UI Chat Message Primitives) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 min-h-[250px] flex flex-col justify-end">
        {activeContact.messages.map(m => {
          const isClient = m.sender === 'client';
          return (
            <Message key={m.id} align={isClient ? 'start' : 'end'}>
              {/* รูปโปรไฟล์ฝั่งลูกค้า */}
              {isClient && <MessageAvatar fallback={activeContact.name.charAt(0)} />}
              
              {/* บอลลูนข้อความ + เวลา */}
              <MessageContent>
                <Bubble variant={isClient ? 'secondary' : 'primary'}>
                  <BubbleContent>{m.content}</BubbleContent>
                </Bubble>
                <MessageFooter>{m.time}</MessageFooter>
              </MessageContent>
            </Message>
          );
        })}

        {/* แสดงสถานะเมื่อมีคนกำลังพิมพ์ */}
        {isTypingState[selectedContactId] && (
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold px-2 shrink-0">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
            </span>
            {activeContact.name} กำลังพิมพ์...
          </div>
        )}
      </div>

      {/* 4. ปุ่มลัด Quick Actions & ช่องพิมพ์ข้อความ */}
      <div className="p-4 border-t bg-white space-y-3 shrink-0">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => sendQuickAction('location')} className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-xl text-[10px] font-extrabold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ส่งพิกัดจุดนัดพบ
          </button>
          <button onClick={() => sendQuickAction('document')} className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-xl text-[10px] font-extrabold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ส่งไฟล์เอกสารบ้าน
          </button>
          <button onClick={() => sendQuickAction('callback')} className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-xl text-[10px] font-extrabold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            ขอเบอร์ติดต่อกลับ
          </button>
        </div>

        <div className="relative bg-[#f8fafc] border rounded-2xl p-1.5 flex items-center shadow-xs">
          <input 
            type="text" 
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            placeholder={`ตอบกลับ${activeContact.name.split(' ')[0]}... ข้อมูลบันทึกตามมาตรฐาน PDPA`}
            className="w-full bg-transparent border-none outline-none pl-3 pr-12 text-slate-800 placeholder-slate-400 font-semibold text-xs py-2"
          />
          <button 
            onClick={() => handleSendMessage()} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>ส่ง</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

