import instagramDownloader from 'instagram-downloader';
import { downloadMedia as processViaMediaSnap } from 'mediasnap';

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
    console.log(`[downloadInstagram] Attempting download using instagram-downloader for: ${url}`);
    
    let rawMedia: any[] = [];

    // Tries instagram-downloader package first
    try {
      const result: any = await withTimeout(instagramDownloader(url), 12000);
      if (result && result.media_list && result.media_list.length > 0) {
        rawMedia = result.media_list;
      }
    } catch (downloaderErr: any) {
      console.warn(`[downloadInstagram] instagram-downloader failed:`, downloaderErr.message);
    }

    // Fallback: Use mediasnap which wraps SnapSave's highly updated social parsing algorithms
    if (rawMedia.length === 0) {
      console.log(`[downloadInstagram] Falling back to mediasnap for url: ${url}`);
      const snapResult = await withTimeout(processViaMediaSnap(url), 15000);
      if (snapResult && snapResult.success && snapResult.media && snapResult.media.length > 0) {
        rawMedia = snapResult.media;
      }
    }

    if (rawMedia.length === 0) {
      throw new Error('No media extracted from this post. Make sure it is public.');
    }

    // Process and filter media
    const media: InstagramMedia[] = [];

    for (const item of rawMedia) {
      let mediaUrl = item.url || item.link || item.src;
      if (!mediaUrl || typeof mediaUrl !== 'string') continue;

      // Ensure URL starts with valid protocol
      mediaUrl = mediaUrl.trim();
      if (mediaUrl.startsWith('//')) {
        mediaUrl = 'https:' + mediaUrl;
      } else if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
        mediaUrl = 'https://' + mediaUrl;
      }

      const mediaType = detectInstagramMediaType(item);
      const isImage = mediaType === 'image';

      media.push({
        url: mediaUrl,
        type: mediaType,
        format: isImage ? 'jpg' : 'mp4',
        quality: item.quality || (isImage ? 'high' : '720p')
      });
    }

    if (media.length === 0) {
      throw new Error('No valid media elements could be found in the response.');
    }

    return media;
    
  } catch (error: any) {
    console.error('Instagram download error:', error.message);
    throw new Error('فشل تحميل المحتوى من إنستغرام. تأكد من أن الحساب عام (Public) ومن صحة الرابط وحاول مرة أخرى.');
  }
}
