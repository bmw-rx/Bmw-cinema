import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfileData } from './auth';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'movie' | 'match' | 'reward' | 'urgent';
  target: 'all' | 'specific';
  targetEmail?: string;
  linkUrl?: string;
  createdAt: string;
  sentBy?: string;
  readBy?: string[];
}

/**
 * Check if the browser supports Notification API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request browser notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Trigger local browser system notification if granted
 */
export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    } catch (err) {
      console.warn('Native browser notification dispatch error:', err);
    }
  }
}

/**
 * Update user's notification preferences in Firestore
 */
export async function updateUserNotificationPreferences(
  uid: string,
  preferences: { notificationsEnabled?: boolean; emailNotificationsEnabled?: boolean }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...preferences,
      lastUpdatedPreferences: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Error updating user notification preferences:', err);
    return false;
  }
}

/**
 * Fetch all registered users for Admin Panel
 */
export async function getAllRegisteredUsers(): Promise<UserProfileData[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const users: UserProfileData[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserProfileData;
      users.push({
        ...data,
        uid: data.uid || docSnap.id,
        email: data.email || 'No email provided',
        displayName: data.displayName || 'BMW Member',
        createdAt: data.createdAt || new Date().toISOString(),
        referralCode: data.referralCode || 'N/A',
        referralCount: data.referralCount || 0,
        referralPoints: data.referralPoints || 0,
        vipStatus: data.vipStatus || 'free',
        notificationsEnabled: data.notificationsEnabled ?? true,
        emailNotificationsEnabled: data.emailNotificationsEnabled ?? true,
      });
    });

    // Sort by createdAt descending (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return users;
  } catch (err) {
    console.error('Error fetching registered users for admin:', err);
    return [];
  }
}

/**
 * Fetch notifications from Firestore
 */
export async function fetchNotifications(max = 30): Promise<AppNotification[]> {
  try {
    const notifsCol = collection(db, 'notifications');
    const q = query(notifsCol, orderBy('createdAt', 'desc'), limit(max));
    const snapshot = await getDocs(q);

    const list: AppNotification[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        title: data.title || 'Announcement',
        message: data.message || '',
        type: data.type || 'general',
        target: data.target || 'all',
        targetEmail: data.targetEmail || '',
        linkUrl: data.linkUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        sentBy: data.sentBy || 'BMW Cinema Admin',
        readBy: data.readBy || [],
      });
    });
    return list;
  } catch (err) {
    console.error('Error fetching notifications:', err);
    // Return initial default announcements if empty or offline
    return [
      {
        id: 'welcome-bmw',
        title: '🎬 Welcome to BMW CINEMA!',
        message: 'Stream full 4K and HD movies, follow live football scores, and invite friends to earn VIP rewards.',
        type: 'movie',
        target: 'all',
        createdAt: new Date().toISOString(),
        sentBy: 'BMW Cinema Admin',
      },
    ];
  }
}

/**
 * Admin: Dispatch/Push a new notification to all users or specific email
 */
export async function sendPushNotification(notification: {
  title: string;
  message: string;
  type: 'general' | 'movie' | 'match' | 'reward' | 'urgent';
  target: 'all' | 'specific';
  targetEmail?: string;
  linkUrl?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notifRef = doc(db, 'notifications', notifId);

    const fullNotification: AppNotification = {
      id: notifId,
      title: notification.title.trim(),
      message: notification.message.trim(),
      type: notification.type,
      target: notification.target,
      targetEmail: notification.targetEmail?.trim().toLowerCase() || '',
      linkUrl: notification.linkUrl?.trim() || '',
      createdAt: new Date().toISOString(),
      sentBy: 'BMW Cinema Admin (Authorized PIN: 3006)',
      readBy: [],
    };

    await setDoc(notifRef, fullNotification);

    // Also trigger immediate browser notification preview if browser allows
    showBrowserNotification(fullNotification.title, {
      body: fullNotification.message,
    });

    return { success: true, id: notifId };
  } catch (err: any) {
    console.error('Error pushing notification:', err);
    return { success: false, error: err.message || 'Failed to dispatch push notification.' };
  }
}

/**
 * Admin: Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notifRef);
    return true;
  } catch (err) {
    console.error('Error deleting notification:', err);
    return false;
  }
}
