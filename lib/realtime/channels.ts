const CHAT_CHANNEL_PREFIX = 'private-chat-';
const NOTIFICATION_CHANNEL_PREFIX = 'private-user-';

// Chat channels
export function chatChannelName(sessionId: string): string {
  return `${CHAT_CHANNEL_PREFIX}${sessionId}`;
}

export function parseChatSessionId(channelName: string): string | null {
  if (!channelName.startsWith(CHAT_CHANNEL_PREFIX)) return null;
  return channelName.slice(CHAT_CHANNEL_PREFIX.length);
}

// Notification channels
export function notificationChannelName(userId: string): string {
  return `${NOTIFICATION_CHANNEL_PREFIX}${userId}`;
}

export function parseNotificationUserId(channelName: string): string | null {
  if (!channelName.startsWith(NOTIFICATION_CHANNEL_PREFIX)) return null;
  return channelName.slice(NOTIFICATION_CHANNEL_PREFIX.length);
}
