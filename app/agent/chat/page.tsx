'use client';

/**
 * ==============================================================================
 * ไฟล์: app/agent/chat/page.tsx
 * ==============================================================================
 * 
 * [หน้าที่ของไฟล์นี้]
 * เป็น Container Component (Smart Component) สำหรับหน้าระบบแชทฝั่งนายหน้า (Agent Chat Page)
 * ที่ Route: /agent/chat หรือ /agent/chat?sessionId={id}
 * 
 * [ความแตกต่างจากฝั่งลูกค้า app/(customer)/chat/page.tsx]
 * 1. กำหนด prop role="agent" ส่งให้ SharedChatView เพื่อเปลี่ยนหัวข้อเป็น "กล่องข้อความเอเย่นต์"
 * 2. แปลง sender ของข้อความที่ตัวเองส่งเป็น 'agent' เพื่อให้บอลลูนจัดวางชิดขวาอย่างถูกต้อง
 * 3. มีระบบ "ข้อความตอบกลับด่วน" (Quick Reply Templates):
 *    - ดึงเทมเพลตจากตาราง quick_reply_templates ผ่าน API: /api/agent/quick-replies
 *    - แปลงเทมเพลตเป็นปุ่มลัด (Quick Actions) ด้านล่างกล่องแชท เพื่อให้นายหน้ากดส่งข้อความสำเร็จรูปได้ในคลิกเดียว
 *    - รองรับการเพิ่มและลบเทมเพลตข้อความ
 * 4. ใช้ API ชุดเดียวกัน (/api/chat/*) เพราะระบบ Backend จะตรวจสอบจาก Session ว่าผู้ใช้เป็น Agent 
 *    แล้วกรองเฉพาะห้องแชทที่ตัวเองเป็นผู้ดูแล (agent_id = user.id) ให้อัตโนมัติ
 * ==============================================================================
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

// นำเข้า Hook สำหรับซิงก์ข้อมูลแชทแบบเรียลไทม์ผ่าน Pusher WebSocket
import { useChatRealtime } from '@/hooks/useChatRealtime';

// ตัวช่วยสำหรับบอกระบบ In-App Notification ทราบว่ากำลังเปิดดูห้องแชทใดอยู่ (เพื่อระงับการแจ้งเตือนของห้องนั้น)
import { setActiveChatSession } from '@/lib/realtime/activeChatSession';

// นำเข้า Shared Presentation Component กลางและ Types ที่เกี่ยวข้อง
import SharedChatView, { SharedChatSession, OutgoingChatPayload } from '@/components/common/SharedChatView';
import { toast } from '@/components/ui/toast';

// ==============================================================================
// 1. โครงสร้างประเภทข้อมูล (TypeScript Interfaces)
// ==============================================================================

/**
 * โครงสร้างข้อมูลข้อความแชทแต่ละรายการในห้องสนทนา (ChatMessage)
 */
interface ChatMessage {
  id: string | number;           // รหัสประจำตัวข้อความ (UUID หรือ Auto-generated ID)
  sender: 'user' | 'other';      // ผู้ส่ง ('user' = เราส่งเอง, 'other' = ลูกค้าส่งมา)
  text: string;                  // เนื้อหาข้อความตัวหนังสือ
  time: string;                  // เวลาที่ส่งข้อความ (จัดรูปแบบแล้ว เช่น "10:15")
  fileUrl?: string | null;       // ลิงก์รูปภาพหรือไฟล์เอกสารแนบ (ถ้ามี)
  latitude?: number | null;      // ละติจูดพิกัดสถานที่ GPS (ถ้ามี)
  longitude?: number | null;     // ลองจิจูดพิกัดสถานที่ GPS (ถ้ามี)
  isRead?: boolean;              // สถานะเปิดอ่านแล้วหรือไม่ (true = อ่านแล้ว, false = ยังไม่อ่าน)
}

/**
 * โครงสร้างข้อมูลห้องแชท (ChatSession)
 * แสดงรายการลูกค้าที่ติดต่อสอบถามเข้ามาหานายหน้าคนนี้
 */
interface ChatSession {
  id: string;                    // รหัสประจำห้องแชท (UUID ของตาราง chat_sessions)
  name: string;                  // ชื่อคู่สนทนา (ชื่อลูกค้าผู้สอบถาม)
  avatar: string;                // URL รูปโปรไฟล์ของลูกค้า
  lastMessage: string;           // ตัวอย่างข้อความล่าสุดสำหรับแสดงพรีวิวในรายการ
  time: string;                  // เวลาของข้อความล่าสุด
  unreadCount?: number;          // จำนวนข้อความที่ยังไม่ได้เปิดอ่านในห้องนี้
  hasMoreMessages?: boolean;     // ธงบอกว่ายังมีข้อความเก่าให้โหลดเพิ่มได้อีกหรือไม่ (Cursor Pagination)
  propertyTitle: string;         // ชื่อหัวข้อประกาศอสังหาริมทรัพย์ที่ลูกค้าสนใจ
  propertyPrice: string;         // ราคาของอสังหาริมทรัพย์
  messages: ChatMessage[];       // รายการข้อความทั้งหมดในห้องนี้
}

/**
 * โครงสร้างข้อมูลเทมเพลตข้อความตอบกลับด่วนของนายหน้า (Quick Reply Template)
 * แมปกับตาราง quick_reply_templates ในฐานข้อมูล PostgreSQL
 */
interface QuickReplyTemplate {
  id: string;                    // รหัสเทมเพลต (UUID)
  title: string;                 // ชื่อหัวข้อเทมเพลต (เช่น "ขอพิกัดเพิ่มเติม", "นัดหมายเข้าชม")
  content: string;               // เนื้อหาข้อความเต็มที่จะส่งออกไปเมื่อกดปุ่ม
}

// ==============================================================================
// 2. คอมโพเนนต์หลักฝั่งนายหน้า (Agent Chat Content)
// ==============================================================================
// หน้าแชทฝั่งนายหน้า ใช้ API ชุดเดียวกับฝั่งลูกค้า (/api/chat/*)
// เนื่องจาก API แยกห้องแชทตาม customer_id / agent_id ของผู้ใช้ที่ล็อกอินอยู่อัตโนมัติ
function AgentChatContent() {
  // สถานะการเข้าสู่ระบบของนายหน้า (NextAuth Session)
  const { data: sessionData, status } = useSession();
  const currentUserId = (sessionData?.user as { id?: string } | undefined)?.id;
  
  // ดึงค่า sessionId จาก URL Query Parameter (เช่น /agent/chat?sessionId=xxx)
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get('sessionId');

  // State สำหรับเก็บข้อมูลห้องแชท และห้องที่กำลังเลือกเปิดดูอยู่
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSessionId);
  const [syncedSessionId, setSyncedSessionId] = useState<string | null>(initialSessionId);

  // สถานะกำลังโหลดข้อมูลครั้งแรก
  const [loading, setLoading] = useState(true);

  // State สำหรับเก็บรายการเทมเพลตตอบกลับด่วนของนายหน้า
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>([]);

  // ----------------------------------------------------------------------------
  // 3. ฟังก์ชันดึงข้อมูลจาก API (Data Fetching Functions)
  // ----------------------------------------------------------------------------

  // ดึงรายการห้องแชททั้งหมดของนายหน้าคนนี้จากฐานข้อมูลจริง (GET /api/chat/sessions)
  const fetchChatData = useCallback(() => {
    fetch('/api/chat/sessions')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
          if (data.sessions.length > 0) {
            // เลือกห้องตาม URL query parameter หรือเลือกห้องแรกตามลำดับ
            const matched = data.sessions.find((s: ChatSession) => s.id === initialSessionId);
            setSelectedSessionId(prev => prev || (matched ? matched.id : data.sessions[0].id));
          }
        }
      })
      .catch(err => console.error('Error fetching chat sessions:', err))
      .finally(() => setLoading(false));
  }, [initialSessionId]);

  // ดึงเทมเพลตข้อความตอบกลับด่วนของนายหน้าคนนี้จากฐานข้อมูลจริง (GET /api/agent/quick-replies)
  const fetchTemplates = useCallback(() => {
    fetch('/api/agent/quick-replies')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
      })
      .catch(err => console.error('Error fetching quick-reply templates:', err));
  }, []);

  // ----------------------------------------------------------------------------
  // 4. Side Effects & Pusher Real-time Listener
  // ----------------------------------------------------------------------------

  // เข้าหน้ามาแล้วต้องล็อกอินสำเร็จก่อน ถึงจะเริ่มโหลดข้อมูลห้องแชทและเทมเพลต
  useEffect(() => {
    if (status === 'authenticated') {
      fetchChatData();
      fetchTemplates();
    }
  }, [status, fetchChatData, fetchTemplates]);

  // ซิงก์ sessionId หาก URL มีการเปลี่ยนพารามิเตอร์ขณะเปิดหน้านี้อยู่ (เช่น กดดูแชทจากการแจ้งเตือน)
  if (initialSessionId && initialSessionId !== syncedSessionId) {
    setSyncedSessionId(initialSessionId);
    setSelectedSessionId(initialSessionId);
  }

  // เชื่อมต่อ Pusher และ subscribe channel ของห้องแชทที่กำลังเปิดอยู่ (ยืนยันสิทธิ์ผ่าน /api/pusher/auth
  // ด้วย NextAuth session cookie โดยอัตโนมัติ ไม่ต้องขอ JWT token เองแบบ Socket.io เดิม)
  // บอกกระดิ่งแจ้งเตือนว่าตอนนี้เปิดห้องไหนอยู่ → จะได้ไม่เด้ง toast ของห้องนี้ (ออกจากหน้าแชท = ล้างค่า)
  useEffect(() => {
    setActiveChatSession(selectedSessionId);
    return () => setActiveChatSession(null);
  }, [selectedSessionId]);

  // ข้อความใหม่เข้าห้องที่เปิดอยู่ → ทำเครื่องหมายอ่านแล้วก่อน แล้วค่อยโหลดรายการใหม่
  // เดิมเรียกแค่ fetchChatData (อ่านแล้วถูกตั้งเฉพาะตอนกดเปิดห้อง) → ห้องที่เปิดค้างอยู่ขึ้น "ยังไม่อ่าน 1" ค้าง (BUG-19)
  const handleNewMessage = useCallback(() => {
    if (!selectedSessionId) { fetchChatData(); return; }
    fetch('/api/chat/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selectedSessionId })
    })
      .catch(err => console.error('Mark read failed:', err))
      .finally(() => fetchChatData());
  }, [selectedSessionId, fetchChatData]);

  // เรียกใช้ Hook จัดการ WebSocket Real-time สำหรับห้องสนทนา
  const { isTyping, connectionError, sendTyping } = useChatRealtime({
    enabled: status === 'authenticated',
    sessionId: selectedSessionId,
    currentUserId,
    onNewMessage: handleNewMessage,
    onMessagesRead: fetchChatData
  });

  // ----------------------------------------------------------------------------
  // 5. ฟังก์ชันจัดการการกระทำในแชท (Chat Actions & Event Handlers)
  // ----------------------------------------------------------------------------

  // เปิดห้องแชท -> ส่งคำขอไปอัปเดตว่าอ่านข้อความทั้งหมดในห้องนั้นแล้ว (is_read = true)
  const handleOpenSession = useCallback((sessionId: string) => {
    fetch('/api/chat/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
      // อัปเดต State ให้ตัวเลข unreadCount เป็น 0 ทันทีบน UI
      .then(() => setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadCount: 0 } : s)))
      .catch(err => console.error('Mark read failed:', err));
  }, []);

  // กดปุ่ม "โหลดข้อความเก่ากว่านี้" -> ดึงประวัติข้อความช่วงก่อนหน้ามาต่อด้านบน (Cursor Pagination)
  const handleLoadOlderMessages = useCallback(async (sessionId: string, oldestMessageId: string | number) => {
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${sessionId}&before=${oldestMessageId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(prev => prev.map(s => s.id === sessionId
          ? { ...s, messages: [...data.messages, ...s.messages], hasMoreMessages: data.hasMore }
          : s));
      }
    } catch (err) {
      console.error('Load older messages failed:', err);
    }
  }, []);

  // ลบข้อความเดียว (DELETE /api/chat/messages)
  const handleDeleteMessage = useCallback(async (messageId: string | number) => {
    const res = await fetch(`/api/chat/messages?messageId=${messageId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.success) {
      setSessions(prev => prev.map(s => ({ ...s, messages: s.messages.filter(m => m.id !== messageId) })));
      toast.success('ลบข้อความเรียบร้อยแล้ว');
    } else {
      toast.error(data.error || 'ไม่สามารถลบข้อความได้');
    }
  }, []);

  // ลบห้องแชททั้งหมด (DELETE /api/chat/sessions)
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/chat/sessions?sessionId=${sessionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.success) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSelectedSessionId(prev => (prev === sessionId ? null : prev));
      toast.success('ลบห้องแชทเรียบร้อยแล้ว');
    } else {
      toast.error(data.error || 'ไม่สามารถลบห้องแชทได้');
    }
  }, []);

  // ----------------------------------------------------------------------------
  // 6. ฟังก์ชันส่งข้อความและจัดการเทมเพลต (Send Message & Quick Reply)
  // ----------------------------------------------------------------------------

  // ส่งข้อความใหม่ (รองรับทั้งข้อความตัวหนังสือ ไฟล์แนบ และพิกัดแผนที่)
  const handleSendMessage = async (payload: OutgoingChatPayload) => {
    if (!selectedSessionId) return;

    try {
      // 1) บันทึกข้อความลงฐานข้อมูล PostgreSQL ผ่าน API
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          content: payload.text,
          fileUrl: payload.fileUrl,
          latitude: payload.latitude,
          longitude: payload.longitude
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // 2) บันทึกสำเร็จ -> API ยิง event ผ่าน Pusher ให้อีกฝ่ายเห็นทันทีอยู่แล้ว (ดู /api/chat/messages)
        // 3) โหลดรายการห้องแชทใหม่ เพื่ออัปเดตข้อความล่าสุดฝั่งเราด้วย
        fetchChatData();
      } else {
        console.error('Error sending message:', data.error);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // ถามข้อมูลแล้วบันทึกเป็นเทมเพลตข้อความตอบกลับด่วนอันใหม่ลงฐานข้อมูล (POST /api/agent/quick-replies)
  const handleAddTemplate = async () => {
    const title = prompt('กรุณาระบุชื่อหัวข้อเทมเพลต (เช่น "แจ้งเลื่อนนัดหมาย")');
    if (!title?.trim()) return;
    const content = prompt('กรุณาระบุข้อความที่ต้องการบันทึกเป็นเทมเพลต');
    if (!content?.trim()) return;

    try {
      const res = await fetch('/api/agent/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchTemplates();
        toast.success('เพิ่มเทมเพลตข้อความสำเร็จ');
      } else {
        toast.error(data.error || 'เพิ่มเทมเพลตไม่สำเร็จ');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดขณะเพิ่มเทมเพลต');
    }
  };

  // ให้เลือกลบเทมเพลตข้อความตอบกลับด่วนออกจากฐานข้อมูล (DELETE /api/agent/quick-replies)
  const handleDeleteTemplate = async () => {
    if (templates.length === 0) return;
    const list = templates.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
    const answer = prompt(`กรุณาระบุหมายเลขเทมเพลตที่ต้องการลบ:\n${list}`);
    const idx = Number(answer) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= templates.length) return;

    try {
      const res = await fetch(`/api/agent/quick-replies?id=${templates[idx].id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchTemplates();
        toast.success('ลบเทมเพลตเรียบร้อยแล้ว');
      } else {
        toast.error(data.error || 'ลบเทมเพลตไม่สำเร็จ');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดขณะลบเทมเพลต');
    }
  };

  // ----------------------------------------------------------------------------
  // 7. การแปลงข้อมูลและเตรียม UI Component (Data Formatting for UI)
  // ----------------------------------------------------------------------------

  // แปลงข้อมูลห้องแชทให้อยู่ในฟอร์แมตที่คอมโพเนนต์กลาง SharedChatView ใช้งานได้
  const sharedSessions: SharedChatSession[] = sessions.map(s => ({
    id: s.id,
    name: s.name,
    avatar: s.avatar,
    lastMessage: s.lastMessage,
    time: s.time,
    unreadCount: s.unreadCount,
    hasMoreMessages: s.hasMoreMessages,
    propertyTitle: s.propertyTitle,
    propertyPrice: s.propertyPrice,
    messages: s.messages.map(m => ({
      id: m.id,
      // API ส่งคืน 'user' เมื่อเป็นข้อความของผู้ส่ง ในหน้านี้เราคือนายหน้า จึงแปลงเป็น 'agent'
      sender: m.sender === 'user' ? 'agent' : 'other',
      text: m.text,
      time: m.time,
      fileUrl: m.fileUrl,
      latitude: m.latitude,
      longitude: m.longitude,
      isRead: m.isRead
    }))
  }));

  // สร้างรายการปุ่มลัด (Quick Actions) จากเทมเพลตใน DB พร้อมปุ่มเพิ่ม/ลบ
  const quickActions = [
    ...templates.map(t => ({
      label: t.title,
      action: () => handleSendMessage({ text: t.content })
    })),
    { label: 'เพิ่มเทมเพลตข้อความ', action: handleAddTemplate },
    ...(templates.length > 0 ? [{ label: 'ลบเทมเพลตข้อความ', action: handleDeleteTemplate }] : [])
  ];

  // แสดง Spinner โหลดหน้าจอขณะกำลังดึงข้อมูลครั้งแรก
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 8. แสดงผล UI หน้าระบบสนทนา (Render View)
  // ----------------------------------------------------------------------------
  return (
    <SharedChatView
      role="agent"
      sessions={sharedSessions}
      selectedSessionId={selectedSessionId}
      onSelectSession={setSelectedSessionId}
      onSendMessage={handleSendMessage}
      onDeleteMessage={handleDeleteMessage}
      onDeleteSession={handleDeleteSession}
      onOpenSession={handleOpenSession}
      onTyping={sendTyping}
      onLoadOlderMessages={handleLoadOlderMessages}
      isTyping={isTyping}
      connectionError={connectionError}
      quickActions={quickActions}
    />
  );
}

// Export หน้าหลักของ Agent Chat พร้อม Suspense รองรับการใช้ useSearchParams ตามมาตรฐาน Next.js
export default function AgentChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xs text-slate-500">กำลังโหลดระบบสนทนา...</div>}>
      <AgentChatContent />
    </Suspense>
  );
}
