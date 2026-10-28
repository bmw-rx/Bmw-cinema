import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface PremiumAppItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
  version?: string;
  category?: string;
  size?: string;
  badge?: string;
  downloadsCount?: number;
  createdAt: string;
}

const LOCAL_STORAGE_APPS_KEY = 'bmw_premium_apps_cache';

// High-quality starter catalog if Firestore is empty
const DEFAULT_PREMIUM_APPS: PremiumAppItem[] = [
  {
    id: 'app_bmw_cinema_pro',
    name: 'BMW Cinema Ultra HD Mod',
    icon: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&auto=format&fit=crop&q=80',
    description: 'All 4K streams unlocked, ad-free cinema experience, fast offline downloader and background playback enabled.',
    downloadUrl: 'https://archive.org/download/sample-apk/sample.apk',
    version: 'v4.5.2 Pro',
    category: 'Entertainment',
    size: '18.4 MB',
    badge: 'EXCLUSIVE VIP',
    downloadsCount: 1420,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app_netplay_mod',
    name: 'StreamCast Pro Plus',
    icon: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&auto=format&fit=crop&q=80',
    description: 'Premium streaming hub with unlimited live football broadcasts, cinema series, and multilingual subs.',
    downloadUrl: 'https://archive.org/download/sample-apk/sample.apk',
    version: 'v3.1.0 Mod',
    category: 'Video Players',
    size: '22.8 MB',
    badge: 'MOD UNLOCKED',
    downloadsCount: 890,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app_audio_pulse',
    name: 'SoundWave Hi-Fi Premium',
    icon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    description: 'Lossless audio streaming, zero commercial ads, offline playlist downloads, and studio equalizer.',
    downloadUrl: 'https://archive.org/download/sample-apk/sample.apk',
    version: 'v8.9.1 Pro',
    category: 'Music & Audio',
    size: '34.2 MB',
    badge: 'NO ADS',
    downloadsCount: 654,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Fetch all premium apps from Firestore with local cache & fallback
 */
export async function getPremiumApps(): Promise<PremiumAppItem[]> {
  try {
    const colRef = collection(db, 'premium_apps');
    const snap = await getDocs(colRef);
    const list: PremiumAppItem[] = [];

    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        name: data.name || 'Untitled App',
        icon: data.icon || '',
        description: data.description || '',
        downloadUrl: data.downloadUrl || '',
        version: data.version || 'v1.0.0',
        category: data.category || 'General',
        size: data.size || '15 MB',
        badge: data.badge || 'PREMIUM',
        downloadsCount: typeof data.downloadsCount === 'number' ? data.downloadsCount : 0,
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });

    if (list.length > 0) {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(list));
      }
      return list;
    }
  } catch (err) {
    console.warn('Firestore premium_apps fetch failed, using fallback:', err);
  }

  // Fallback to local storage or starter catalog
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return DEFAULT_PREMIUM_APPS;
}

/**
 * Add a new Premium App
 */
export async function addPremiumApp(params: {
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
  version?: string;
  category?: string;
  size?: string;
  badge?: string;
}): Promise<PremiumAppItem> {
  const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const item: PremiumAppItem = {
    id: appId,
    name: params.name.trim(),
    icon: params.icon.trim(),
    description: params.description.trim(),
    downloadUrl: params.downloadUrl.trim(),
    version: params.version?.trim() || 'v1.0.0',
    category: params.category?.trim() || 'Tools',
    size: params.size?.trim() || '20 MB',
    badge: params.badge?.trim() || 'PREMIUM',
    downloadsCount: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'premium_apps', appId);
    await setDoc(docRef, item);
  } catch (err) {
    console.error('Failed to save premium app to Firestore:', err);
  }

  // Update local cache
  if (typeof window !== 'undefined') {
    try {
      const cached = await getPremiumApps();
      const updated = [item, ...cached.filter((a) => a.id !== appId)];
      localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  }

  return item;
}

/**
 * Delete a Premium App by ID
 */
export async function deletePremiumApp(appId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'premium_apps', appId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete app from Firestore:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
      if (stored) {
        const parsed: PremiumAppItem[] = JSON.parse(stored);
        const filtered = parsed.filter((a) => a.id !== appId);
        localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      // ignore
    }
  }

  return true;
}

/**
 * Increment download counter for an app
 */
export async function incrementAppDownload(appId: string): Promise<void> {
  try {
    const docRef = doc(db, 'premium_apps', appId);
    await updateDoc(docRef, {
      downloadsCount: increment(1),
    });
  } catch (err) {
    console.warn('Failed to increment app downloads in Firestore:', err);
  }
}
