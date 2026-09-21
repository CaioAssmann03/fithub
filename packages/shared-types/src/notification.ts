export type NotificationChannel = 'PUSH' | 'EMAIL' | 'WHATSAPP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

export interface Notification {
  id: string;
  channel: NotificationChannel;
  type: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  createdAt: string;
}
