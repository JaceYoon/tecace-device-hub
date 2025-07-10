import { api } from './index';

export interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  expiring_soon: number;
  overdue: number;
  returned?: number;
  total_assigned?: number;
}

export interface DeviceNotification {
  id: string;
  device_id: string;
  user_id: string;
  type: 'expiring_soon' | 'overdue' | 'returned' | 'return_request';
  message: string;
  sent_at: string;
  is_read: boolean;
  device_name?: string;
  device_type?: string;
  user_name?: string;
  user_email?: string;
  expiration_date?: string;
  days_until_expiry?: number;
}

export interface WebNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export const notificationService = {
  // Get notification statistics
  async getStats(): Promise<NotificationStats> {
    return await api.get<NotificationStats>('/notifications/stats');
  },

  // Get web notifications for header badge
  async getWebNotifications(): Promise<WebNotification[]> {
    return await api.get<WebNotification[]>('/notifications/web');
  },

  // Get all notifications (admin only)
  async getAllNotifications(): Promise<DeviceNotification[]> {
    return await api.get<DeviceNotification[]>('/notifications/all');
  },

  // Get user's notifications
  async getUserNotifications(): Promise<DeviceNotification[]> {
    return await api.get<DeviceNotification[]>('/notifications');
  },

  // Mark notification as read
  async markAsRead(id: string, type: 'device' | 'web'): Promise<void> {
    await api.patch<void>(`/notifications/${id}/read`, { type });
  },

  // Mark all notifications as read
  async markAllAsRead(all?: boolean): Promise<void> {
    const params = all ? '?all=true' : '';
    await api.patch<void>(`/notifications/read-all${params}`);
  },

  // Send return request for device (admin only)
  async sendReturnRequest(deviceId: string, message?: string): Promise<void> {
    await api.post<void>('/notifications/return-request', { deviceId, message });
  }
};