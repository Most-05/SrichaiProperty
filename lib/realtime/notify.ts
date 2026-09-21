import { db } from '@/lib/db';
import { getPusher } from './pusher';
import { notificationChannelName } from './channels';

export interface NotifyInput {
  userId: string;
  title: string;
  content: string;
  type: string;
  linkUrl?: string | null;
}

export async function notifyUser({ userId, title, content, type, linkUrl }: NotifyInput) {
  const notification = await db.notifications.create({
    data: { user_id: userId, title, content, type, link_url: linkUrl ?? null, is_read: false }
  });

  await getPusher().trigger(notificationChannelName(userId), 'new-notification', {
    id: notification.id,
    title: notification.title,
    content: notification.content,
    isRead: false,
    type: notification.type,
    linkUrl: notification.link_url,
    createdAt: notification.created_at
  }).catch(err => console.error('Pusher trigger error (notification):', err));

  return notification;
}

export async function notifyUsers(userIds: string[], data: Omit<NotifyInput, 'userId'>) {
  return Promise.allSettled(userIds.map(userId => notifyUser({ userId, ...data })));
}
