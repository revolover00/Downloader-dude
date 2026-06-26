import { downloadMedia } from 'mediasnap';
import { downloadInstagram } from './instagramService';
import axios from 'axios';

export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio';
  format: string;
  quality?: string;
}

export interface DownloaderResponse {
  success: boolean;
  platform: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  duration: string | number | null;
  media: MediaItem[];
  options: {
    url: string;
    quality: string;
    type: string;
  }[];
  error?: string;
}

// Wraps a promise with a hard timeout so that a hung extraction call
// (e.g. mediasnap or instagram-downloader stalling on a slow/blocked
// upstream request) can never leave a client request hanging forever.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`انتهت المهلة أثناء ${label}. حاول مرة أخرى.`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

// Helper functions for referer detection based on the target URL
export function getPlatformReferer(url: string): string {
  const domains: Record<string, string> = {
    'youtube.com': 'https://www.youtube.com/',
    'youtu.be': 'https://www.youtube.com/',
    'tiktok.com': 'https://www.tiktok.com/',
    'instagram.com': 'https://www.instagram.com/',
    'twitter.com': 'https://twitter.com/',
    'x.com': 'https://twitter.com/',
    'facebook.com': 'https://www.facebook.com/',
    'pinterest.com': 'https://www.pinterest.com/',
  };
  
  for (const [domain, referer] of Object.entries(domains)) {
    if (url.includes(domain)) return referer;
  }
  return url;
}

/**
 * Searches through up to 15 different properties to locate a cover/thumbnail,
 * falling back to elements inside the media array if needed.
 */
export function extractCover(data: any, mediaItems: MediaItem[]): string | null {
  const sources = [
    data.thumbnail,
    data.cover,
    data.picture,
    data.thumbnail_url,
    data.cover_url,
    data.poster,
    data.image,
    data.img,
    data.avatar,
    data.profile_picture,
    data.user?.avatar,
    data.user?.profile_picture,
    data.author?.avatar,
    data.channel?.thumbnail,
    data.video?.thumbnail,
    data.media?.[0]?.thumbnail
  ];

  for (const src of sources) {
    if (src && typeof src === 'string') {
      const trimmed = src.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
    }
  }

  // Fallback 1: use first image in mediaItems
  const firstImage = mediaItems.find(item => item.type === 'image');
  if (firstImage && firstImage.url) {
    return firstImage.url;
  }

  // Fallback 2: use first video in mediaItems
  const firstVideo = mediaItems.find(item => item.type === 'video');
  if (firstVideo && firstVideo.url) {
    return firstVideo.url;
  }

  return null;
}

function correctMediaTypeSync(url: string, reportedType: 'image' | 'video' | 'audio'): 'image' | 'video' | 'audio' {
  const lowercaseUrl = url.toLowerCase();
  const cleanUrl = lowercaseUrl.split('?')[0];

  // 1. Check for clear video files / extensions
  const hasVideoExtension = cleanUrl.match(/\.(mp4|mov|avi|webm|mkv|3gp|m4v|ogv)(?:\/|$)/) || 
                            cleanUrl.includes('.mp4') || 
                            lowercaseUrl.includes('.mp4?');
  if (hasVideoExtension) return 'video';

  // 2. Check for clear image files / extensions
  const hasImageExtension = cleanUrl.match(/\.(jpg|jpeg|png|webp|heic|gif|tiff|bmp)(?:\/|$)/) || 
                            cleanUrl.includes('.jpg') || 
                            cleanUrl.includes('.jpeg') || 
                            cleanUrl.includes('.png') ||
                            lowercaseUrl.includes('.jpg?') ||
                            lowercaseUrl.includes('.jpeg?') ||
                            lowercaseUrl.includes('.png?');
  if (hasImageExtension) return 'image';

  // 3. Instagram/Facebook CDN specific patterns
  if (lowercaseUrl.includes('cdninstagram.com') || lowercaseUrl.includes('fbcdn.net')) {
    if (lowercaseUrl.includes('/t50.')) {
      return 'video';
    }
    if (lowercaseUrl.includes('/t51.') || lowercaseUrl.includes('/t39.') || lowercaseUrl.includes('/t52.') || lowercaseUrl.includes('/t53.')) {
      return 'image';
    }
  }

  return reportedType;
}

async function detectUrlTypeFromHeaders(url: string): Promise<'image' | 'video' | 'audio' | null> {
  try {
    const referer = getPlatformReferer(url);
    const response = await axios({
      method: 'HEAD',
      url: url,
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 2000,
      validateStatus: () => true,
    });

    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    if (contentType) {
      if (contentType.includes('image')) return 'image';
      if (contentType.includes('video')) return 'video';
      if (contentType.includes('audio')) return 'audio';
    }

    // Try small range request if HEAD method is blocked or missing headers
    const getResponse = await axios({
      method: 'GET',
      url: url,
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Range': 'bytes=0-0',
      },
      timeout: 1500,
      validateStatus: () => true,
    });
    const getContentType = String(getResponse.headers['content-type'] || '').toLowerCase();
    if (getContentType) {
      if (getContentType.includes('image')) return 'image';
      if (getContentType.includes('video')) return 'video';
      if (getContentType.includes('audio')) return 'audio';
    }
  } catch (err: any) {
    console.warn(`[detectUrlTypeFromHeaders] Header detection skipped or failed: ${err.message}`);
  }
  return null;
}

export async function processDownload(url: string, platform?: string): Promise<DownloaderResponse> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('URL is required');
  }

  // Basic validation of URL structure
  try {
    new URL(trimmed);
  } catch (err) {
    throw new Error('Please enter a valid URL (starting with http:// or https://)');
  }

  // Treat Instagram posts with dedicated service
  if (trimmed.includes('instagram.com') || trimmed.includes('instagr.am')) {
    try {
      console.log(`[downloaderService] Processing Instagram URL: ${trimmed}`);
      const mediaList = await withTimeout(downloadInstagram(trimmed), 25000, 'استخراج بيانات إنستغرام');
      
      const mediaItemsInitial: MediaItem[] = mediaList.map(item => {
        const initialType = item.type === 'image' ? 'image' : 'video';
        const correctedType = correctMediaTypeSync(item.url, initialType);
        return {
          url: item.url,
          type: correctedType,
          format: item.format || (correctedType === 'image' ? 'jpg' : 'mp4'),
          quality: item.quality || 'high'
        };
      });

      // Asynchronous header validation to confirm exact types from direct CDN metadata (bulletproof)
      const mediaItems: MediaItem[] = await Promise.all(mediaItemsInitial.map(async (item) => {
        const headerType = await detectUrlTypeFromHeaders(item.url);
        const finalType = headerType || item.type;
        return {
          ...item,
          type: finalType,
          format: finalType === 'image' ? 'jpg' : (finalType === 'audio' ? 'mp3' : 'mp4')
        };
      }));

      // Find first image URL to set as thumbnail/cover if available, fallback to video
      const firstImage = mediaItems.find(m => m.type === 'image');
      const firstVideo = mediaItems.find(m => m.type === 'video');
      const thumbnail = firstImage ? firstImage.url : (firstVideo ? firstVideo.url : '');

      const options = mediaItems.map(item => ({
        url: item.url,
        quality: item.quality || 'Default',
        type: item.type
      }));

      return {
        success: true,
        platform: 'Instagram',
        title: 'Instagram Post',
        description: 'Multi-media post extracted from Instagram',
        thumbnail: thumbnail || null,
        duration: null,
        media: mediaItems,
        options
      };
    } catch (error: any) {
      console.error('[downloaderService] Instagram specific download error:', error);
      throw error;
    }
  }

  // Fallback for all other platforms using mediasnap
  try {
    console.log(`[downloaderService] Processing general URL: ${trimmed}`);
    const result = await withTimeout(downloadMedia(trimmed), 25000, 'استخراج بيانات الوسائط');

    if (!result || !result.success) {
      throw new Error(result?.error || 'Unsupported platform or downloading failed.');
    }

    const mediaInitial: MediaItem[] = (result.media || []).map((item: any) => {
      const initialType = (item.type || 'video') as 'image' | 'video' | 'audio';
      const correctedType = correctMediaTypeSync(item.url, initialType);
      return {
        url: item.url,
        type: correctedType,
        format: item.format || (correctedType === 'image' ? 'jpg' : correctedType === 'audio' ? 'mp3' : 'mp4'),
        quality: item.quality || 'high'
      };
    });

    // Confirm exact media types from CDN content-types
    const media: MediaItem[] = await Promise.all(mediaInitial.map(async (item) => {
      const headerType = await detectUrlTypeFromHeaders(item.url);
      const finalType = headerType || item.type;
      return {
        ...item,
        type: finalType,
        format: finalType === 'image' ? 'jpg' : (finalType === 'audio' ? 'mp3' : 'mp4')
      };
    }));

    const options = media.map(item => ({
      url: item.url,
      quality: item.quality || 'Default',
      type: item.type
    }));

    let platformName = result.platform || 'Unknown';
    if (platformName && typeof platformName === 'string') {
      platformName = platformName.charAt(0).toUpperCase() + platformName.slice(1);
    }

    // Try robust cover extraction from the returned media snap data
    const thumbnail = extractCover(result, media);

    return {
      success: true,
      platform: platformName,
      title: result.title || 'Untitled Media',
      description: result.description || null,
      thumbnail: thumbnail,
      duration: result.duration || null,
      media,
      options
    };

  } catch (error: any) {
    console.error('[downloaderService] General platform extraction failed:', error);
    throw new Error(error.message || 'فشل التحميل من المنصة المحددة.');
  }
}
