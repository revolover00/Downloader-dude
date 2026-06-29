import { instagramGetUrl } from 'instagram-url-direct';
import { downloadMedia as processViaEngine } from 'mediasnap';

interface InstagramMedia {
  url: string;
  type: 'image' | 'video';
  format: string;
  quality?: string;
}

// Wraps a promise with a hard timeout so a stalled extraction attempt
// can't block the fallback chain from proceeding.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * 7 method classification sequence to precisely identify Instagram media type (image or video)
 */
function detectInstagramMediaType(item: any): 'image' | 'video' {
  const url = (item.url || item.link || item.src || '').toLowerCase();
  const cleanUrl = url.split('?')[0];
  
  // 1. Detect from file extension (FIRST PRIORITY & MOST ACCURATE)
  const hasVideoExtension = cleanUrl.match(/\.(mp4|mov|avi|webm|mkv|3gp|m4v|ogv)(?:\/|$)/i) || 
                             cleanUrl.includes('.mp4') || 
                             url.includes('.mp4?');
                             
  const hasImageExtension = cleanUrl.match(/\.(jpg|jpeg|png|webp|heic|gif|tiff|bmp)(?:\/|$)/i) || 
                             cleanUrl.includes('.jpg') || 
                             cleanUrl.includes('.jpeg') || 
                             cleanUrl.includes('.png') || 
                             url.includes('.jpg?') || 
                             url.includes('.jpeg?') || 
                             url.includes('.png?');

  if (hasVideoExtension) {
    return 'video';
  }
  if (hasImageExtension) {
    return 'image';
  }

  // 2. Detect from 'type' property in data
  if (item.type) {
    const typeStr = String(item.type).toLowerCase();
    if (typeStr === 'image' || typeStr === 'photo' || typeStr === 'graphimage' || typeStr === 'picture') {
      return 'image';
    }
    if (typeStr === 'video' || typeStr === 'clip' || typeStr === 'graphvideo' || typeStr === 'reel') {
      return 'video';
    }
  }

  // 3. Detect from 'is_video' or 'is_image' flag
  if (item.is_video === true || item.is_video === 'true' || item.isVideo === true) {
    return 'video';
  }
  if (item.is_image === true || item.is_image === 'true' || item.isImage === true) {
    return 'image';
  }

  // 4. Detect from dimension tags features
  if (item.dimensions) {
    const dims = item.dimensions;
    // Reel vertical standards usually are video or checking aspect properties
    if (dims.width && dims.height) {
      const aspect = dims.width / dims.height;
      if (Math.abs(aspect - 0.5625) < 0.1 && dims.height > 1000) {
        // High likelihood of vertical Reel / Short video
        return 'video';
      }
    }
  }

  // 5. Detect from quality containing video resolution codes like 'p' or 'x'
  if (item.quality) {
    const q = String(item.quality).toLowerCase();
    if (q.match(/\d+p/) || (q.includes('x') && !q.includes('150x150') && !q.includes('640x640') && !q.includes('640xx640'))) {
      return 'video';
    }
  }

  // 6. Detect from duration value is set > 0
  if (item.duration !== undefined && item.duration !== null && Number(item.duration) > 0) {
    return 'video';
  }
  if (item.video_duration !== undefined && item.video_duration !== null && Number(item.video_duration) > 0) {
    return 'video';
  }

  // Absolute fallback: default to image unless URL has distinct video characteristics
  if (url.includes('video') || url.includes('.m3u8')) {
    return 'video';
  }
  return 'image';
}

export async function downloadInstagram(url: string): Promise<InstagramMedia[]> {
  try {
    console.log(`[downloadInstagram] Attempting download using instagram-url-direct for: ${url}`);
    
    const media: InstagramMedia[] = [];

    // Primary: try instagram-url-direct package
    try {
      const result = await withTimeout(instagramGetUrl(url, { retries: 3, delay: 500 }), 15000);
      if (result && result.media_details && result.media_details.length > 0) {
        console.log(`[downloadInstagram] Successfully extracted ${result.media_details.length} media items via instagram-url-direct`);
        for (const detail of result.media_details) {
          if (!detail.url) continue;
          let mediaUrl = detail.url.trim();
          if (mediaUrl.startsWith('//')) {
            mediaUrl = 'https:' + mediaUrl;
          } else if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
            mediaUrl = 'https://' + mediaUrl;
          }

          const isVideo = detail.type === 'video' || detail.type === 'Clip' || detail.type === 'video_url';
          media.push({
            url: mediaUrl,
            type: isVideo ? 'video' : 'image',
            format: isVideo ? 'mp4' : 'jpg',
            quality: isVideo ? '720p' : 'high'
          });
        }
      }
    } catch (downloaderErr: any) {
      console.warn(`[downloadInstagram] instagram-url-direct failed:`, downloaderErr.message);
    }

    // Fallback: Use secondary engine which wraps highly updated social parsing algorithms
    if (media.length === 0) {
      console.log(`[downloadInstagram] Falling back to secondary engine for url: ${url}`);
      const snapResult = await withTimeout(processViaEngine(url), 15000);
      if (snapResult && snapResult.success && snapResult.media && snapResult.media.length > 0) {
        console.log(`[downloadInstagram] Successfully extracted ${snapResult.media.length} media items via secondary engine fallback`);
        for (const item of snapResult.media) {
          const anyItem = item as any;
          let mediaUrl = anyItem.url || anyItem.link || anyItem.src;
          if (!mediaUrl || typeof mediaUrl !== 'string') continue;

          mediaUrl = mediaUrl.trim();
          if (mediaUrl.startsWith('//')) {
            mediaUrl = 'https:' + mediaUrl;
          } else if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
            mediaUrl = 'https://' + mediaUrl;
          }

          const mediaType = detectInstagramMediaType(anyItem);
          const isImage = mediaType === 'image';

          media.push({
            url: mediaUrl,
            type: mediaType,
            format: isImage ? 'jpg' : 'mp4',
            quality: anyItem.quality || (isImage ? 'high' : '720p')
          });
        }
      }
    }

    if (media.length === 0) {
      throw new Error('No media extracted from this post. Make sure it is public.');
    }

    return media;
    
  } catch (error: any) {
    console.error('Instagram download error:', error.message);
    throw new Error('فشل تحميل المحتوى من إنستغرام. تأكد من أن الحساب عام (Public) ومن صحة الرابط وحاول مرة أخرى.');
  }
}
