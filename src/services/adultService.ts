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
  rawUrl?: string;
}

const LOCAL_STORAGE_KEY = 'bmw_adult_endpoint';
export const DEFAULT_API_BASE = 'https://apis.davidcyriltech.my.id';
export const DEFAULT_ADULT_ENDPOINT = '/search/xnxx';
const API_KEY = 'dc_live_StN6vUfPUWD51DmXqxBu6tj7snF9Ni4O';

/**
 * Sanitize and migrate old or malformed endpoint strings
 */
export function sanitizeEndpoint(endpoint: string): string {
  let ep = (endpoint || '').trim();
  if (!ep) return '';

  // Replace legacy suspended domain with active domain
  if (ep.includes('apis.davidcyril.name.ng')) {
    ep = ep.replace(/apis\.davidcyril\.name\.ng/g, 'apis.davidcyriltech.my.id');
  }

  return ep;
}

/**
 * Retrieve the configured endpoint from Firestore with local fallback
 */
export async function getAdultEndpoint(): Promise<string> {
  try {
    const docRef = doc(db, 'settings', 'media_config');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.adultEndpoint) {
      const ep = sanitizeEndpoint(snap.data().adultEndpoint);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, ep);
      }
      return ep;
    }
  } catch (err) {
    // Firestore unavailable, proceed to local storage fallback
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return sanitizeEndpoint(stored || '');
  }
  return '';
}

/**
 * Save the endpoint into Firestore and localStorage
 */
export async function saveAdultEndpoint(endpoint: string): Promise<boolean> {
  const cleanEp = sanitizeEndpoint(endpoint);
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
  let url = sanitizeEndpoint(endpoint);
  if (!url) {
    url = DEFAULT_ADULT_ENDPOINT;
  }

  // Handle absolute vs relative URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    url = `${DEFAULT_API_BASE}${cleanPath}`;
  }

  const trimmedQuery = (query || '').trim();

  // If a search query is provided, or if this endpoint is a search endpoint and needs a query parameter
  if (trimmedQuery) {
    const sep = url.includes('?') ? '&' : '?';
    const enc = encodeURIComponent(trimmedQuery);
    // Append both 'query' and 'q' to support different API endpoint signatures
    if (!url.includes('query=') && !url.includes('q=')) {
      url = `${url}${sep}query=${enc}&q=${enc}`;
    }
  } else {
    // If no query was given, but the endpoint is an XNXX or search endpoint that mandates a query
    if (
      (url.includes('/search') || url.includes('xnxx') || url.includes('xvideo')) &&
      !url.includes('query=') &&
      !url.includes('q=')
    ) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}query=hot&q=hot`;
    }
  }

  return url;
}

/**
 * Resolve detailed video metadata and direct stream download URL using the download endpoint
 */
export async function resolveVideoDetails(videoUrl: string): Promise<{
  downloadUrl?: string;
  thumbnail?: string;
  duration?: string;
  views?: string;
} | null> {
  if (!videoUrl) return null;

  try {
    const targetUrl = `https://apis.davidcyriltech.my.id/download/xnxx?url=${encodeURIComponent(videoUrl)}`;
    let res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        Accept: 'application/json, text/plain, */*',
      },
    });

    if (res.status === 429) {
      res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      });
    }

    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return null;
    }

    const data = JSON.parse(text);
    if (data && data.status && data.result) {
      const r = data.result;
      const download =
        typeof r.download === 'object' && r.download !== null
          ? r.download.high_quality || r.download.low_quality || ''
          : typeof r.download === 'string'
          ? r.download
          : '';

      return {
        downloadUrl: download,
        thumbnail: r.thumbnail || '',
        duration: r.duration || '',
        views: r.info || '',
      };
    }
  } catch (e) {
    // Fall through
  }
  return null;
}

/**
 * Fetch video items from the configured endpoint
 */
export async function fetchAdultVideos(
  searchQuery?: string
): Promise<{ success: boolean; videos: AdultVideoItem[]; error?: string }> {
  let endpoint = await getAdultEndpoint();
  if (!endpoint) {
    return { success: true, videos: [] };
  }

  const targetUrl = buildEndpointUrl(endpoint, searchQuery);

  try {
    let res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        Accept: 'application/json, text/plain, */*',
      },
    });

    // If API key is rate limited or quota exceeded, retry transparently without key
    if (res.status === 429) {
      res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      });
    }

    const rawText = await res.text();
    const trimmed = rawText.trim();

    if (!trimmed) {
      return { success: false, videos: [], error: 'Endpoint returned an empty response.' };
    }

    // Explicitly detect HTML response to prevent: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
    if (
      trimmed.startsWith('<') ||
      trimmed.toLowerCase().startsWith('<!doctype') ||
      trimmed.toLowerCase().startsWith('<html')
    ) {
      const match = trimmed.match(/<title[^>]*>([^<]+)<\/title>/i);
      const docTitle = match ? match[1].trim() : 'Webpage';
      return {
        success: false,
        videos: [],
        error: `The endpoint returned an HTML document ("${docTitle}") instead of JSON. Please verify that the endpoint points to a JSON API (e.g. /search/xnxx) rather than a webpage or documentation URL.`,
      };
    }

    let data: any;
    try {
      data = JSON.parse(trimmed);
    } catch (parseErr: any) {
      return {
        success: false,
        videos: [],
        error: 'The response could not be parsed as valid JSON. Please check the endpoint format.',
      };
    }

    // Check if the API returned an explicit failure message
    if (data.status === false || data.success === false) {
      return {
        success: false,
        videos: [],
        error: data.message || data.error || 'The endpoint returned an error status.',
      };
    }

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
    } else if (data.result && typeof data.result === 'object') {
      rawList = [data.result];
    } else if (data.url || data.download || data.downloadUrl) {
      rawList = [data];
    }

    if (rawList.length === 0) {
      return { success: true, videos: [] };
    }

    const initialVideos: AdultVideoItem[] = rawList.map((item: any, idx: number) => {
      const title = item.title || item.name || item.video_title || `Video #${idx + 1}`;
      const thumbnail =
        item.thumbnail ||
        item.thumb ||
        item.image ||
        item.poster ||
        item.cover ||
        item.preview_url ||
        '';

      let downloadUrl = '';
      if (typeof item.download === 'object' && item.download !== null) {
        downloadUrl = item.download.high_quality || item.download.low_quality || '';
      } else {
        downloadUrl =
          item.download ||
          item.downloadUrl ||
          item.download_url ||
          (item.url && item.url.endsWith('.mp4') ? item.url : '') ||
          item.video ||
          item.videoUrl ||
          item.link ||
          item.media ||
          '';
      }

      const rawUrl = item.url || item.link || item.page || '';

      return {
        id: String(item.id || item._id || item.video_id || `v-${idx + 1}`),
        title: String(title),
        thumbnail: String(thumbnail),
        downloadUrl: String(downloadUrl),
        duration: item.duration || item.time || undefined,
        views: item.views || item.view_count || item.info || undefined,
        quality: item.quality || 'HD',
        previewUrl: item.preview || item.preview_url || downloadUrl,
        rawUrl: rawUrl,
      };
    });

    // If search results returned items with page URLs (like /search/xnxx) without thumbnails or direct download links,
    // pre-fetch details for the top batch to provide real thumbnails and stream links
    const needsResolution = initialVideos.some((v) => !v.thumbnail && v.rawUrl);
    if (needsResolution && (targetUrl.includes('xnxx') || targetUrl.includes('search'))) {
      const batchToResolve = initialVideos.slice(0, 8);
      await Promise.allSettled(
        batchToResolve.map(async (v) => {
          if (!v.thumbnail && v.rawUrl) {
            const details = await resolveVideoDetails(v.rawUrl);
            if (details) {
              if (details.thumbnail) v.thumbnail = details.thumbnail;
              if (details.downloadUrl) v.downloadUrl = details.downloadUrl;
              if (details.duration) v.duration = details.duration;
              if (details.views) v.views = details.views;
            }
          }
        })
      );
    }

    return { success: true, videos: initialVideos };
  } catch (err: any) {
    console.error('Failed to fetch videos from endpoint:', err);
    return {
      success: false,
      videos: [],
      error: err?.message || 'Network request failed. Please check your internet connection or endpoint URL.',
    };
  }
}
