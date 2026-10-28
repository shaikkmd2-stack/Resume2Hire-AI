import { NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS } from './mockData';
import { API_CONFIG } from './apiConfig';
import { auth } from '../firebase/config';
import { firebaseNotificationService } from './firebaseNotificationService';

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    if (API_CONFIG.isMockMode || !auth?.currentUser) {
      return [...INITIAL_NOTIFICATIONS];
    }

    try {
      const docs = await firebaseNotificationService.getUserNotifications(auth.currentUser.uid);
      if (docs.length === 0) {
        return [...INITIAL_NOTIFICATIONS];
      }
      return docs.map((docItem) => ({
        id: docItem.id,
        title: docItem.title,
        description: docItem.message,
        type: (docItem.type === 'alert' ? 'approval' : 'system') as NotificationItem['type'],
        timestamp: 'Recent',
        read: docItem.read,
      }));
    } catch (err) {
      console.warn('[NotificationService] Failed to load from Firestore:', err);
      return [...INITIAL_NOTIFICATIONS];
    }
  },

  async markAsRead(id: string): Promise<NotificationItem[]> {
    if (!API_CONFIG.isMockMode && auth?.currentUser) {
      try {
        await firebaseNotificationService.markAsRead(id, auth.currentUser.uid);
      } catch (err) {
        console.warn('[NotificationService] Failed to mark as read in Firestore:', err);
      }
    }

    const item = INITIAL_NOTIFICATIONS.find((n) => n.id === id);
    if (item) item.read = true;
    return [...INITIAL_NOTIFICATIONS];
  },

  async markAllAsRead(): Promise<NotificationItem[]> {
    if (!API_CONFIG.isMockMode && auth?.currentUser) {
      try {
        await firebaseNotificationService.markAllAsRead(auth.currentUser.uid);
      } catch (err) {
        console.warn('[NotificationService] Failed to mark all as read in Firestore:', err);
      }
    }

    INITIAL_NOTIFICATIONS.forEach((n) => (n.read = true));
    return [...INITIAL_NOTIFICATIONS];
  },
};
