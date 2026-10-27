import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { NotificationDocument } from '../firebase/schema';

export const firebaseNotificationService = {
  /**
   * Fetch all notifications for the user
   */
  async getUserNotifications(userId: string): Promise<NotificationDocument[]> {
    if (!db || !userId) return [];

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as NotificationDocument);
    } catch (err) {
      console.error('[FirebaseNotificationService] Failed to load notifications:', err);
      return [];
    }
  },

  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    data: {
      title: string;
      message: string;
      type?: NotificationDocument['type'];
    }
  ): Promise<NotificationDocument> {
    if (!db || !userId) {
      throw new Error('Firestore uninitialized or user unauthenticated.');
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notifDoc: NotificationDocument = {
      id: notificationId,
      userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      read: false,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'notifications', notificationId), notifDoc);
    return notifDoc;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    if (!db || !notificationId || !userId) return false;

    const notifRef = doc(db, 'notifications', notificationId);
    const snap = await getDoc(notifRef);
    if (!snap.exists()) return false;

    if (snap.data()?.userId !== userId) {
      throw new Error('Unauthorized notification access.');
    }

    await updateDoc(notifRef, { read: true });
    return true;
  },

  /**
   * Mark all unread notifications as read using a batched write (Section 8 consistency)
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    if (!db || !userId) return false;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return true;

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { read: true });
      });

      await batch.commit();
      return true;
    } catch (err) {
      console.error('[FirebaseNotificationService] Error in markAllAsRead batch:', err);
      return false;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    if (!db || !notificationId || !userId) return false;

    const notifRef = doc(db, 'notifications', notificationId);
    const snap = await getDoc(notifRef);
    if (!snap.exists()) return false;

    if (snap.data()?.userId !== userId) {
      throw new Error('Unauthorized notification deletion.');
    }

    await deleteDoc(notifRef);
    return true;
  },
};
