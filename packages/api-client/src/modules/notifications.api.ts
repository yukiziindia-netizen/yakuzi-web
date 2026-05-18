import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['order', 'payment', 'system', 'promotion', 'verification']).optional(),
  isRead: z.boolean().optional(),
  read: z.boolean().optional(),
  createdAt: z.string(),
});

export const NotificationListResponseSchema = z.object({
  data: z.array(NotificationSchema),
  total: z.number(),
  unreadCount: z.number(),
});

// ─── Types ──────────────────────────────────────────

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

// ─── API Functions ──────────────────────────────────

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
}): Promise<NotificationListResponse> {
  const { data: responseBody } = await api.get('/notifications', { params });
  
  // Robust extraction: data can be in responseBody.data or responseBody itself
  const rawData = responseBody?.data ?? responseBody;
  const notifications = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
  
  return {
    data: notifications,
    total: rawData?.total ?? notifications.length,
    unreadCount: rawData?.unreadCount ?? notifications.filter((n: any) => !n.isRead).length,
  };
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}
