import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AdultVideoItem {
  id: string;
  title: string;
  thumbnail: string;
  downloadUrl: string;
  duration?: string;
  views?: string;
  quality?: string;
  previewUrl?: string;
}

const LOCAL_STORAGE_KEY = 'bmw_adult_endpoint';
const DEFAULT_API_BASE = 'https://apis.davidcyril.name.ng';
const API_KEY = 'dc_live_StN6vUfPUWD51DmXqxBu6tj7snF9Ni4O';

/**
 * Retrieve the configured endpoint from Firestore with local fallback
 */
export async function getAdultEndpoint(): Promise<string> {
  try {
    const docRef = doc(db, 'settings', 'media_config');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.adultEndpoint) {
      const ep = snap.data().adultEndpoint;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, ep);
      }
      return ep;
    }
  } catch (err) {
    // Firestore unavailable, use local storage fallback
  }

  if (typeof window !== 'undefined') {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
  }
  return '';
}

/**
 * Save the endpoint into Firestore and localStorage
 */
export async function saveAdultEndpoint(endpoint: string): Promise<boolean> {
  const cleanEp = endpoint.trim();
  try {
    const docRef = doc(db, 'settings', 'media_config');
    await setDoc(docRef, { adultEndpoint: cleanEp, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Failed to save endpoint to Firestore:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, cleanEp);
  }
  return true;
}

/**
 * Build target request URL from endpoint
 */
export function buildEndpointUrl(endpoint: string, query?: string): string {
  let url = endpoint.trim();
  if (!url) return '';

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    url = `${DEFAULT_API_BASE}${cleanPath}`;
  }

  if (query && query.trim()) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}q=${encodeURIComponent(query.trim())}`;
  }

  return url;
}

/**
 * Fetch video items from the configured endpoint
 */
export async function fetchAdultVideos(searchQuery?: string): Promise<{ success: boolean; videos: AdultVideoItem[]; error?: string }> {
  const endpoint = await getAdultEndpoint();
  if (!endpoint) {
    return { success: true, videos: [] };
  }

  const targetUrl = buildEndpointUrl(endpoint, searchQuery);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, videos: [], error: `Server response code: ${res.status}` };
    }

    const data = await res.json();
    let rawList: any[] = [];

    if (Array.isArray(data)) {
      rawList = data;
    } else if (Array.isArray(data.results)) {
      rawList = data.results;
    } else if (Array.isArray(data.result)) {
      rawList = data.result;
    } else if (Array.isArray(data.data)) {
      rawList = data.data;
    } else if (Array.isArray(data.videos)) {
      rawList = data.videos;
    } else if (data.url || data.download || data.downloadUrl) {
      rawList = [data];
    }

    const videos: AdultVideoItem[] = rawList
      .map((item: any, idx: number) => {
        const title = item.title || item.name || item.video_title || `Video #${idx + 1}`;
        const thumbnail =
          item.thumbnail ||
          item.thumb ||
          item.image ||
          item.poster ||
          item.cover ||
          item.preview_url ||
          '';
        const downloadUrl =
          item.download ||
          item.downloadUrl ||
          item.download_url ||
          item.url ||
          item.video ||
          item.videoUrl ||
          item.link ||
          item.media ||
          '';

        return {
          id: String(item.id || item._id || item.video_id || idx + 1),
          title: String(title),
          thumbnail: String(thumbnail),
          downloadUrl: String(downloadUrl),
          duration: item.duration || item.time || undefined,
          views: item.views || item.view_count || undefined,
          quality: item.quality || 'HD',
          previewUrl: item.preview || item.preview_url || downloadUrl,
        };
      })
      .filter((v) => v.thumbnail || v.downloadUrl);

    return { success: true, videos };
  } catch (err: any) {
    console.error('Failed to fetch videos from endpoint:', err);
    return { success: false, videos: [], error: err?.message || 'Network request failed' };
  }
}
