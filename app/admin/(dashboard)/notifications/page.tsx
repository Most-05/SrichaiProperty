import { Metadata } from 'next';
import NotificationCenterView from '@/components/notifications/NotificationCenterView';

export const metadata: Metadata = {
  title: 'การแจ้งเตือนผู้ดูแลระบบ | Srichai Admin Portal',
  description: 'ศูนย์การแจ้งเตือนแอดมิน ตรวจสอบสลิป ยืนยันตัวตน และงานที่ต้องดำเนินการ',
};

export default function AdminNotificationsPage() {
  return (
    <div className="py-4 sm:py-8">
      <NotificationCenterView
        roleTitle="การแจ้งเตือนผู้ดูแลระบบ (Admin Notifications)"
        roleSubtitle="ติดตามสลิปชำระเงินใหม่ เอกสาร KYC รายงานปัญหา และประกาศรอตรวจสอบ"
      />
    </div>
  );
}
