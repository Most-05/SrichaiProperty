import { Metadata } from 'next';
import NotificationCenterView from '@/components/notifications/NotificationCenterView';

export const metadata: Metadata = {
  title: 'การแจ้งเตือนนายหน้า | Srichai Agent Portal',
  description: 'ศูนย์การแจ้งเตือนงานนายหน้า นัดหมายลูกค้า และสถานะแพ็กเกจ',
};

export default function AgentNotificationsPage() {
  return (
    <div className="py-4 sm:py-8">
      <NotificationCenterView
        roleTitle="การแจ้งเตือนของนายหน้า (Agent Notifications)"
        roleSubtitle="ติดตามนัดหมายลูกค้า วันว่างเข้าชม ข้อความ และสถานะแพ็กเกจ Verified PRO"
      />
    </div>
  );
}
