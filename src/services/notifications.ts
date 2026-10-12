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
  onSnapshot,
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
 * Custom Notification Ringtone Sound URL provided by user
 */
export const NOTIFICATION_SOUND_URL =
  'https://cdn.imageurlgenerator.com/uploads/41782e2f-35c0-4b8e-81e7-5c627bee7b80.mp3';
export const NOTIFICATION_SOUND_FALLBACK = '/notification-sound.mp3';

let audioPlayer: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

/**
 * Preload and unlock audio context on mobile/desktop browsers
 */
export function unlockNotificationAudio() {
  if (typeof window === 'undefined') return;
  if (!audioPlayer) {
    audioPlayer = new Audio(NOTIFICATION_SOUND_URL);
    audioPlayer.preload = 'auto';
    audioPlayer.volume = 1.0;
    audioPlayer.onerror = () => {
      if (audioPlayer) audioPlayer.src = NOTIFICATION_SOUND_FALLBACK;
    };
  }

  // Attempt brief silent play/pause on user interaction to unlock autoplay on mobile devices
  const playPromise = audioPlayer.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isAudioUnlocked = true;
        // Pause and reset if this was just an unlock gesture
        audioPlayer?.pause();
        if (audioPlayer) audioPlayer.currentTime = 0;
      })
      .catch(() => {
        // Ignored; will try on next interaction
      });
  }
}

/**
 * Play the custom notification ringtone MP3
 */
export function playNotificationSound(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    try {
      if (!audioPlayer) {
        audioPlayer = new Audio(NOTIFICATION_SOUND_URL);
        audioPlayer.preload = 'auto';
        audioPlayer.volume = 1.0;
        audioPlayer.onerror = () => {
          if (audioPlayer) audioPlayer.src = NOTIFICATION_SOUND_FALLBACK;
        };
      }

      audioPlayer.currentTime = 0;
      audioPlayer.volume = 1.0;
      const playPromise = audioPlayer.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isAudioUnlocked = true;
            resolve(true);
          })
          .catch((err) => {
            console.warn('Audio playback waiting for user gesture or policy:', err);
            // Retry with local fallback
            try {
              const fallbackAudio = new Audio(NOTIFICATION_SOUND_FALLBACK);
              fallbackAudio.volume = 1.0;
              fallbackAudio.play().then(() => resolve(true)).catch(() => resolve(false));
            } catch {
              resolve(false);
            }
          });
      } else {
        resolve(true);
      }
    } catch (err) {
      console.warn('Could not initialize audio:', err);
      resolve(false);
    }
  });
}

/**
 * Trigger vibration pattern on mobile phones
 */
export function vibrateDevice(pattern: number[] = [250, 100, 250, 100, 300]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error
    }
  }
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
 * Request browser notification permission from user and unlock audio
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  // Unlock audio during this explicit user click gesture
  unlockNotificationAudio();

  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Play a quick chime to confirm audio is active on user's device
      playNotificationSound();
      vibrateDevice([200, 100, 200]);
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Trigger phone/system notification (optimized for mobile devices and PWA)
 */
export async function showPhoneNotification(title: string, options?: NotificationOptions) {
  // 1. Always play custom notification ringtone sound and trigger phone vibration
  playNotificationSound();
  vibrateDevice([250, 100, 250]);

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  // 2. On Mobile (Android / Chrome Mobile / PWA standalone), showNotification on ServiceWorker registration is required
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [250, 100, 250],
          sound: NOTIFICATION_SOUND_URL,
          tag: `bmw-${Date.now()}`,
          renotify: true,
          ...options,
        } as any);
        return;
      }
    } catch (err) {
      console.warn('Service worker showNotification failed, trying standard Notification:', err);
    }
  }

  // 3. Fallback to standard Window Notification
  try {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });
  } catch (err) {
    console.warn('Standard Notification constructor failed on this platform:', err);
  }
}

/**
 * Backwards compatibility alias
 */
export function showBrowserNotification(title: string, options?: NotificationOptions) {
  showPhoneNotification(title, options);
}

/**
 * Real-time Firestore subscription for instant push arrival on phones and devices
 */
export function subscribeToLiveNotifications(
  userEmail: string | null | undefined,
  onNewNotification: (notif: AppNotification) => void
): () => void {
  const notifsCol = collection(db, 'notifications');
  const q = query(notifsCol, orderBy('createdAt', 'desc'), limit(15));

  let isFirstLoad = true;
  const knownIds = new Set<string>();

  // Load previously seen IDs from localStorage
  try {
    const saved = localStorage.getItem('bmw_seen_notif_ids');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) arr.forEach((id: string) => knownIds.add(id));
    }
  } catch {
    // Ignore parse error
  }

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const notifId = change.doc.id;

          const notif: AppNotification = {
            id: notifId,
            title: data.title || 'BMW Cinema Update',
            message: data.message || '',
            type: data.type || 'general',
            target: data.target || 'all',
            targetEmail: data.targetEmail || '',
            linkUrl: data.linkUrl || '',
            createdAt: data.createdAt || new Date().toISOString(),
            sentBy: data.sentBy || 'BMW Cinema Official Admin',
            readBy: data.readBy || [],
          };

          // On initial load, record existing IDs without ringing to prevent loud startup noise
          if (isFirstLoad) {
            knownIds.add(notifId);
            return;
          }

          // If this is a newly pushed notification that we haven't seen:
          if (!knownIds.has(notifId)) {
            knownIds.add(notifId);

            // Save to seen storage
            try {
              localStorage.setItem('bmw_seen_notif_ids', JSON.stringify(Array.from(knownIds)));
            } catch {
              // Ignore
            }

            // Verify audience: 'all' or matches current user's email
            const matchesAudience =
              notif.target === 'all' ||
              (userEmail && notif.targetEmail?.toLowerCase() === userEmail.toLowerCase());

            if (matchesAudience) {
              // 1. Play the ringtone MP3 immediately!
              playNotificationSound();
              // 2. Vibrate phone
              vibrateDevice([300, 150, 300, 150, 300]);
              // 3. Trigger phone/system push
              showPhoneNotification(notif.title, {
                body: notif.message,
              });
              // 4. Trigger in-app UI callback (banner/toast)
              onNewNotification(notif);
            }
          }
        }
      });

      isFirstLoad = false;
    },
    (error) => {
      console.warn('Real-time notifications subscription error:', error);
    }
  );

  return unsubscribe;
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
      sentBy: 'BMW Cinema Official Admin',
      readBy: [],
    };

    await setDoc(notifRef, fullNotification);

    // Also trigger instant local test ringtone & preview for the admin
    playNotificationSound();
    vibrateDevice([200, 100, 200]);
    showPhoneNotification(fullNotification.title, {
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
