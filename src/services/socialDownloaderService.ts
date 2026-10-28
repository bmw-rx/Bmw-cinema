/**
 * Social Media Media Resolution Engine
 * Handles silent background resolution for TikTok, Instagram, Facebook,
 * YouTube, X/Twitter, and other social media video downloads.
 */

export interface MediaDownloadOption {
  id: string;
  label: string;
  quality: string;
  url: string;
  type: 'video' | 'audio' | 'image';
  size?: string;
  ext?: string;
}

export interface SocialDownloadResult {
  success: boolean;
  platform: string;
  title: string;
  thumbnail: string;
  author?: string;
  duration?: string;
  downloads: MediaDownloadOption[];
  previewVideoUrl?: string;
  error?: string;
}

const PRIMARY_API = 'https://api.ikyyxd.my.id/download/all-in-one';
const DAVID_CYRIL_BASE = 'https://apis.davidcyriltech.my.id';
const DAVID_CYRIL_KEY = 'dc_live_StN6vUfPUWD51DmXqxBu6tj7snF9Ni4O';

/**
 * Detect social platform from URL
 */
export function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('douyin')) return 'TikTok';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'Instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) return 'Facebook';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'X (Twitter)';
  if (lower.includes('threads.net')) return 'Threads';
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) return 'Pinterest';
  if (lower.includes('snapchat.com')) return 'Snapchat';
  if (lower.includes('reddit.com')) return 'Reddit';
  return 'Social Media';
}

/**
 * Normalizes different API response formats into a standard SocialDownloadResult
 */
function normalizeApiResponse(data: any, originalUrl: string): SocialDownloadResult | null {
  if (!data) return null;

  // Extract root object
  const root = data.result || data.data || data;
  if (!root || typeof root !== 'object') return null;

  const platform = root.source || root.platform || detectPlatform(originalUrl);
  const title =
    root.title ||
    root.caption ||
    root.desc ||
    root.description ||
    root.name ||
    `${platform} Video`;

  const thumbnail =
    root.thumbnail ||
    root.thumb ||
    root.cover ||
    root.image ||
    root.poster ||
    root.preview ||
    root.avatar ||
    '';

  const author =
    (typeof root.author === 'string' ? root.author : root.author?.name || root.author?.nickname) ||
    root.creator ||
    root.user ||
    undefined;

  const duration = root.duration || root.time || undefined;

  const downloads: MediaDownloadOption[] = [];

  // Format 1: Medias array (standard all-in-one response)
  if (Array.isArray(root.medias)) {
    root.medias.forEach((m: any, idx: number) => {
      if (m.url) {
        downloads.push({
          id: `media_${idx}`,
          label: m.quality || m.resolution || (m.type === 'audio' ? 'MP3 Audio' : `Video Option ${idx + 1}`),
          quality: m.quality || m.resolution || (m.type === 'audio' ? 'Audio' : 'HD'),
          url: m.url,
          type: m.type === 'audio' ? 'audio' : m.type === 'image' ? 'image' : 'video',
          size: m.formattedSize || m.size || undefined,
          ext: m.extension || undefined,
        });
      }
    });
  }

  // Format 2: Direct download object (e.g. { hd, sd, audio, video })
  if (root.download && typeof root.download === 'object') {
    if (root.download.hd || root.download.high_quality) {
      downloads.push({
        id: 'dl_hd',
        label: 'Video HD (No Watermark)',
        quality: '1080p / 720p HD',
        url: root.download.hd || root.download.high_quality,
        type: 'video',
      });
    }
    if (root.download.sd || root.download.low_quality) {
      downloads.push({
        id: 'dl_sd',
        label: 'Video SD (Standard)',
        quality: '480p SD',
        url: root.download.sd || root.download.low_quality,
        type: 'video',
      });
    }
    if (root.download.audio || root.download.music || root.download.mp3) {
      downloads.push({
        id: 'dl_audio',
        label: 'Audio (MP3)',
        quality: 'Original Sound',
        url: root.download.audio || root.download.music || root.download.mp3,
        type: 'audio',
      });
    }
  }

  // Format 2b: TikWM direct format (hdplay, play, wmplay)
  if (root.hdplay || root.play) {
    if (root.hdplay && !downloads.some((d) => d.url === root.hdplay)) {
      downloads.push({
        id: 'dl_tik_hd',
        label: 'Video HD (Bila Watermark)',
        quality: '1080p / 720p HD',
        url: root.hdplay,
        type: 'video',
      });
    }
    if (root.play && !downloads.some((d) => d.url === root.play)) {
      downloads.push({
        id: 'dl_tik_sd',
        label: 'Video SD (Bila Watermark)',
        quality: 'Standard Quality',
        url: root.play,
        type: 'video',
      });
    }
  }

  // Format 3: direct video links in root
  if (root.video || root.video_url || root.download_url || root.url) {
    const mainUrl = root.video || root.video_url || root.download_url || root.url;
    if (typeof mainUrl === 'string' && mainUrl.startsWith('http')) {
      if (!downloads.some((d) => d.url === mainUrl)) {
        downloads.unshift({
          id: 'dl_primary',
          label: 'Direct Video Download',
          quality: 'Original HD',
          url: mainUrl,
          type: 'video',
        });
      }
    }
  }

  // Format 4: audio link
  const audioUrl = root.music || root.audio || root.music_url || root.music_info?.play;
  if (audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('http')) {
    if (!downloads.some((d) => d.url === audioUrl)) {
      downloads.push({
        id: 'dl_music',
        label: 'Download Audio (MP3)',
        quality: 'MP3 Audio',
        url: audioUrl,
        type: 'audio',
      });
    }
  }

  // Format 5: array of image slides (e.g. TikTok / Instagram photo carousel)
  if (Array.isArray(root.images)) {
    root.images.forEach((imgUrl: string, idx: number) => {
      if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
        downloads.push({
          id: `img_${idx}`,
          label: `Photo Slide ${idx + 1}`,
          quality: 'HD Image',
          url: imgUrl,
          type: 'image',
        });
      }
    });
  }

  // If no download URLs found at all, we can't show download options
  if (downloads.length === 0) {
    return null;
  }

  const previewVideoUrl = downloads.find((d) => d.type === 'video')?.url || undefined;

  return {
    success: true,
    platform,
    title: String(title),
    thumbnail: String(thumbnail || ''),
    author: author ? String(author) : undefined,
    duration: duration ? String(duration) : undefined,
    downloads,
    previewVideoUrl,
  };
}

/**
 * Primary Download Resolver
 * Attempts internal proxy first, then primary all-in-one API, with seamless fallback
 */
export async function resolveSocialMediaDownload(url: string): Promise<SocialDownloadResult> {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl) {
    return {
      success: false,
      platform: 'Unknown',
      title: '',
      thumbnail: '',
      downloads: [],
      error: 'Tafadhali weka link ya video unayotaka kupakua.',
    };
  }

  // Validate URL format
  try {
    new URL(cleanUrl);
  } catch (e) {
    return {
      success: false,
      platform: 'Unknown',
      title: '',
      thumbnail: '',
      downloads: [],
      error: 'Link uliyoweka siyo sahihi. Tafadhali weka link kamili inayoanza na https://',
    };
  }

  const platform = detectPlatform(cleanUrl);

  // Step 1: Query server-side proxy route (/api/downloader)
  try {
    const proxyRes = await fetch(`/api/downloader?url=${encodeURIComponent(cleanUrl)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });

    if (proxyRes.ok) {
      const text = await proxyRes.text();
      if (text && !text.trim().startsWith('<')) {
        try {
          const parsed = JSON.parse(text);
          const normalized = normalizeApiResponse(parsed, cleanUrl);
          if (normalized) {
            return normalized;
          }
        } catch (e) {
          // ignore parse error, try direct
        }
      }
    }
  } catch (e) {
    // Proxy not available or failed, continue to direct client request
  }

  // Step 2: Query the user's requested all-in-one API
  try {
    const primaryUrl = `${PRIMARY_API}?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(primaryUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });

    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        const parsed = JSON.parse(text);
        if (parsed.status !== false) {
          const normalized = normalizeApiResponse(parsed, cleanUrl);
          if (normalized) {
            return normalized;
          }
        }
      }
    }
  } catch (e) {
    // Primary failed, continue to fallback
  }

  // Step 3: Platform-specific fallbacks
  const fallbackEndpoints: string[] = [];

  if (platform === 'TikTok') {
    fallbackEndpoints.push(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
    fallbackEndpoints.push(`${DAVID_CYRIL_BASE}/download/tiktok?url=${encodeURIComponent(cleanUrl)}`);
    fallbackEndpoints.push(`${DAVID_CYRIL_BASE}/download/tiktokv2?url=${encodeURIComponent(cleanUrl)}`);
  } else if (platform === 'Instagram') {
    fallbackEndpoints.push(`${DAVID_CYRIL_BASE}/instagram?url=${encodeURIComponent(cleanUrl)}`);
  } else if (platform === 'Facebook') {
    fallbackEndpoints.push(`${DAVID_CYRIL_BASE}/facebook?url=${encodeURIComponent(cleanUrl)}`);
  }

  fallbackEndpoints.push(`${DAVID_CYRIL_BASE}/download/aio?url=${encodeURIComponent(cleanUrl)}`);
  fallbackEndpoints.push(`${DAVID_CYRIL_BASE}/download/aiov2?url=${encodeURIComponent(cleanUrl)}`);

  for (const endpoint of fallbackEndpoints) {
    try {
      const fbRes = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-API-Key': DAVID_CYRIL_KEY,
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (fbRes.ok) {
        const text = await fbRes.text();
        if (text && !text.trim().startsWith('<')) {
          const parsed = JSON.parse(text);
          if (parsed && (parsed.status === true || parsed.success === true || parsed.result || parsed.data)) {
            const normalized = normalizeApiResponse(parsed, cleanUrl);
            if (normalized) {
              return normalized;
            }
          }
        }
      }
    } catch (e) {
      // try next fallback
    }
  }

  return {
    success: false,
    platform,
    title: '',
    thumbnail: '',
    downloads: [],
    error: 'Imeshindwa kupata faili la video kutoka kwenye link hii. Tafadhali hakikisha akaunti na post ni ya wazi (Public) na ujaribu tena.',
  };
}
