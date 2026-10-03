import { Metadata } from 'next';
import NotificationCenterView from '@/components/notifications/NotificationCenterView';

export const metadata: Metadata = {
  title: 'การแจ้งเตือนของฉัน | Srichai Property',
  description: 'ศูนย์การแจ้งเตือนและติดตามสถานะสำหรับลูกค้า',
};

export default function CustomerNotificationsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-4 sm:py-8">
      <NotificationCenterView
        roleTitle="การแจ้งเตือนของฉัน"
        roleSubtitle="ติดตามสถานะนัดหมายดูบ้าน ข้อความ และความคืบหน้าต่างๆ"
      />
    </div>
  );
}
