import { downloadMedia } from 'mediasnap';
import { downloadInstagram } from './instagramService';
import { downloadPinterest } from './pinterestService';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import tiktokDl from '@tobyg74/tiktok-api-dl';

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

export function isUrlAnImage(url: string | any, type?: string): boolean {
  if (typeof url !== 'string' || !url) return false;
  const lowerUrl = String(url).toLowerCase();
  
  console.log(`[isUrlAnImage] Debugging: url=${lowerUrl}, type=${type}`);

  // 1. Force true if explicit image type provided
  const lowerType = String(type || '').toLowerCase();
  if (['photo', 'image', 'picture', 'graphimage', 'jpg', 'png', 'webp'].includes(lowerType)) {
    console.log(`[isUrlAnImage] Match by type: ${lowerType}`);
    return true;
  }
  
  // 2. Extensions are the source of truth
  const imgExtensionRegex = /\.(jpg|jpeg|png|webp|gif|heic|bmp|tiff|jfif)(?:[?#:]|$)/i;
  if (imgExtensionRegex.test(lowerUrl)) {
    console.log(`[isUrlAnImage] Match by extension`);
    return true;
  }
  
  // 3. Platform specific image domains
  if (lowerUrl.includes('pbs.twimg.com') || 
      lowerUrl.includes('twimg.com') || 
      lowerUrl.includes('cdninstagram.com') || 
      lowerUrl.includes('pinimg.com') || 
      lowerUrl.includes('tiktokcdn.com')) {
    console.log(`[isUrlAnImage] Match by domain`);
    return true;
  }
  
  console.log(`[isUrlAnImage] Final result: false`);
  return false;
}

export function getPlatformReferer(url: string): string {
  const domains: Record<string, string> = {
    'youtube.com': 'https://www.youtube.com/',
    'youtu.be': 'https://www.youtube.com/',
    'googlevideo.com': 'https://www.youtube.com/',
    'tiktok.com': 'https://www.tiktok.com/',
    'tiktokcdn.com': 'https://www.tiktok.com/',
    'ttwstatic.com': 'https://www.tiktok.com/',
    'instagram.com': 'https://www.instagram.com/',
    'cdninstagram.com': 'https://www.instagram.com/',
    'fbcdn.net': 'https://www.instagram.com/',
    'twitter.com': 'https://twitter.com/',
    'x.com': 'https://twitter.com/',
    'facebook.com': 'https://www.facebook.com/',
    'pinterest.com': 'https://www.pinterest.com/',
    'snapchat.com': 'https://www.snapchat.com/',
    'sc-cdn.net': 'https://www.snapchat.com/',
  };
  
  for (const [domain, referer] of Object.entries(domains)) {
    if (url.includes(domain)) return referer;
  }
  return url;
}

function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function downloadViaCobalt(url: string, platform?: string): Promise<DownloaderResponse> {
  const id = getYoutubeId(url);
  const thumbnail = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  
  const COBALT_INSTANCES = [
    // Modern v10 base paths (highest speed and compatibility)
    'https://api.cobalt.blackcat.sweeux.org/',
    'https://cobaltapi.kittycat.boo/',
    'https://rue-cobalt.xenon.zone/',
    'https://cobaltapi.cjs.nz/',
    'https://cobalt.hot-leaf-juice.com/',
    'https://cobalt.ignis.space/',
    'https://cobalt.nightly.pw/',
    'https://cobalt.sh/',
    'https://api.cobalt.tools/',
    
    // Legacy / v7 compatibility paths as fallbacks
    'https://api.cobalt.blackcat.sweeux.org/api/json',
    'https://cobaltapi.kittycat.boo/api/json',
    'https://rue-cobalt.xenon.zone/api/json',
    'https://cobaltapi.cjs.nz/api/json',
    'https://cobalt.hot-leaf-juice.com/api/json',
    'https://cobalt.ignis.space/api/json',
    'https://cobalt.nightly.pw/api/json',
    'https://cobalt.sh/api/json',
    'https://api.cobalt.tools/api/json'
  ];

  let lastError: any = null;
  let fallbackAudioResult: any = null;

  const isYoutube = String(url).toLowerCase().includes('youtube.com') || String(url).toLowerCase().includes('youtu.be');

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  for (const instance of COBALT_INSTANCES) {
    try {
      console.log(`[downloaderService] Attempting Cobalt extraction for: ${url} using instance: ${instance}`);
      
      const promises: Promise<any>[] = [];

      if (isYoutube) {
        // For YouTube, request a safe, non-overlapped subset of qualities to prevent rate-limiting and empty fetch errors
        // 1. Default / Auto Video (Highest success rate)
        promises.push(
          axios.post(instance, { url }, { headers, timeout: 10000 })
            .then(res => ({
              success: true,
              type: 'video',
              quality: 'الجودة التلقائية الممتازة (Auto Quality)',
              data: res.data
            }))
            .catch((e: any) => {
              const errorMsg = e.response?.data?.error?.code || e.response?.data?.error || e.message;
              console.warn(`[downloaderService] Cobalt auto video failed for ${instance}:`, errorMsg);
              return null;
            })
        );

        // 2. FHD 1080p Quality
        promises.push(
          axios.post(instance, { url, videoQuality: '1080' }, { headers, timeout: 10000 })
            .then(res => ({
              success: true,
              type: 'video',
              quality: '1080p (فيديو عالي الدقة FHD)',
              data: res.data
            }))
            .catch((e: any) => {
              const errorMsg = e.response?.data?.error?.code || e.response?.data?.error || e.message;
              console.warn(`[downloaderService] Cobalt video 1080p failed for ${instance}:`, errorMsg);
              return null;
            })
        );

        // 3. HD 720p Quality
        promises.push(
          axios.post(instance, { url, videoQuality: '720' }, { headers, timeout: 10000 })
            .then(res => ({
              success: true,
              type: 'video',
              quality: '720p (فيديو دقة عالية HD)',
              data: res.data
            }))
            .catch((e: any) => {
              const errorMsg = e.response?.data?.error?.code || e.response?.data?.error || e.message;
              console.warn(`[downloaderService] Cobalt video 720p failed for ${instance}:`, errorMsg);
              return null;
            })
        );

        // 4. MP3 Audio format
        promises.push(
          axios.post(instance, { url, downloadMode: 'audio', audioFormat: 'mp3' }, { headers, timeout: 10000 })
            .then(res => ({
              success: true,
              type: 'audio',
              quality: 'صوت بجودة عالية (MP3)',
              data: res.data
            }))
            .catch((e: any) => {
              const errorMsg = e.response?.data?.error?.code || e.response?.data?.error || e.message;
              console.warn(`[downloaderService] Cobalt audio mp3 failed for ${instance}:`, errorMsg);
              return null;
            })
        );
      } else {
        // For non-YouTube platforms (Twitter, TikTok, Instagram, etc.):
        // We ONLY make ONE default request. Passing videoQuality parameter to image/photo/picker posts is invalid
        // and is the root cause of "error.api.fetch.empty" errors on Cobalt.
        promises.push(
          axios.post(instance, { url }, { headers, timeout: 12000 })
            .then(res => ({
              success: true,
              type: 'auto',
              quality: 'الدقة الأصلية الكاملة',
              data: res.data
            }))
            .catch((e: any) => {
              const errorMsg = e.response?.data?.error?.code || e.response?.data?.error || e.message;
              console.warn(`[downloaderService] Cobalt default extraction failed for ${instance}:`, errorMsg);
              return null;
            })
        );

        // Optional: Safe Audio extraction fallback (only for posts that aren't purely images)
        const isPureImage = String(url).toLowerCase().includes('twimg.com') || String(url).toLowerCase().includes('format=');
        if (!isPureImage) {
          promises.push(
            axios.post(instance, { url, downloadMode: 'audio', audioFormat: 'mp3' }, { headers, timeout: 12000 })
              .then(res => ({
                success: true,
                type: 'audio',
                quality: 'صوت المنشور (MP3)',
                data: res.data
              }))
              .catch(() => null) // Silently ignore audio-only failures for non-video social media posts
          );
        }
      }

      const allResults = await Promise.all(promises);
      
      const mediaItems: MediaItem[] = [];
      let title = 'YouTube Video';
      let duration: number | null = null;
      
      for (const res of allResults) {
        if (res && res.data) {
          // If Cobalt returns a picker (multiple images/photos/videos)
          if (Array.isArray(res.data.picker)) {
            console.log(`[downloaderService] Found picker array with ${res.data.picker.length} items`);
            for (let i = 0; i < res.data.picker.length; i++) {
              const item = res.data.picker[i];
              if (item && item.url) {
                const isPhoto = isUrlAnImage(item.url, item.type);
                console.log(`[downloaderService] Picker item type resolution for url: ${item.url}, type: ${item.type}, isPhoto: ${isPhoto}`);
                mediaItems.push({
                  url: item.url,
                  type: isPhoto ? 'image' : 'video',
                  format: isPhoto ? 'jpg' : 'mp4',
                  quality: isPhoto ? `صورة عالية الدقة ${i + 1}` : `فيديو مدمج ${i + 1}`
                });
              }
            }
          }
          // If Cobalt returns a single URL
          else if (res.data.url) {
            if (res.data.filename && title === 'YouTube Video') {
              title = res.data.filename.replace(/\.[^/.]+$/, ''); 
            }
            if (res.data.duration && !duration) {
              duration = res.data.duration;
            }
            
            const isImg = res.data.status === 'image' || 
                          res.data.type === 'image' || 
                          res.data.type === 'photo' ||
                          isUrlAnImage(res.data.url, res.data.type || res.data.status);
            
            console.log(`[downloaderService] Cobalt response type resolution: status=${res.data.status}, type=${res.data.type}, url=${res.data.url}, isImg=${isImg}`);
            
            let resolvedType: 'image' | 'video' | 'audio' = 'video';
            if (isImg) {
              resolvedType = 'image';
            } else if (res.type === 'audio') {
              resolvedType = 'audio';
            } else if (res.type === 'video') {
              // Verify if it's really a video link
              const isImgVideo = isUrlAnImage(res.data.url);
              console.log(`[downloaderService] Type video resolution for url: ${res.data.url}, isImg: ${isImgVideo}`);
              if (isImgVideo) {
                resolvedType = 'image';
              } else {
                resolvedType = 'video';
              }
            } else {
              // For 'auto' type or unknown, try to detect image first
              const isImgAuto = isUrlAnImage(res.data.url);
              console.log(`[downloaderService] Type auto resolution for url: ${res.data.url}, isImg: ${isImgAuto}`);
              if (isImgAuto) {
                resolvedType = 'image';
              } else {
                resolvedType = 'video';
              }
            }

            let format = isImg ? 'jpg' : 'mp4';
            if (resolvedType === 'audio') {
              if (res.quality && res.quality.includes('WAV')) format = 'wav';
              else if (res.quality && res.quality.includes('Opus')) format = 'opus';
              else format = 'mp3';
            }

            mediaItems.push({
              url: res.data.url,
              type: resolvedType,
              format,
              quality: isImg ? 'صورة عالية الجودة' : res.quality
            });
          }
        }
      }
      
      // Deduplicate by URL so we don't display duplicate download options
      const uniqueMediaItems: MediaItem[] = [];
      const seenUrls = new Set<string>();
      for (const item of mediaItems) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          uniqueMediaItems.push(item);
        }
      }

      if (thumbnail && !uniqueMediaItems.some(item => item.url === thumbnail)) {
        uniqueMediaItems.push({
          url: thumbnail,
          type: 'image',
          format: 'jpg',
          quality: 'صورة الغلاف (Thumbnail)'
        });
      }

      const hasVideo = uniqueMediaItems.some(item => item.type === 'video');
      const hasAudio = uniqueMediaItems.some(item => item.type === 'audio');
      const hasImages = uniqueMediaItems.some(item => item.type === 'image');

      if (uniqueMediaItems.length > 0) {
        if (hasVideo) {
          return {
            success: true,
            platform: platform || 'YouTube',
            title,
            description: 'تم الاستخراج بنجاح بجميع الجودات المتوفرة عبر نظام الاحتياطي الثنائي (Double-Tunnel)',
            thumbnail,
            duration,
            media: uniqueMediaItems,
            options: uniqueMediaItems.map(item => ({
              url: item.url,
              quality: item.quality || 'Default',
              type: item.type
            }))
          };
        } else if (hasImages) {
          return {
            success: true,
            platform: platform || 'Twitter',
            title: title === 'YouTube Video' ? 'منشور صور / وسائط متعددة' : title,
            description: 'تم استخراج الصور بنجاح بأعلى جودة متوفرة',
            thumbnail: thumbnail || uniqueMediaItems[0].url,
            duration: null,
            media: uniqueMediaItems,
            options: uniqueMediaItems.map(item => ({
              url: item.url,
              quality: item.quality || 'صورة عالية الجودة',
              type: item.type
            }))
          };
        } else if (hasAudio) {
          if (!fallbackAudioResult) {
            fallbackAudioResult = {
              success: true,
              platform: platform || 'YouTube',
              title,
              description: 'تم استخراج الصوت بنجاح بجميع الصيغ المتوفرة (فشل جلب الفيديو من هذا الخادم وجاري البحث في خوادم بديلة)',
              thumbnail,
              duration,
              media: uniqueMediaItems,
              options: uniqueMediaItems.map(item => ({
                url: item.url,
                quality: item.quality || 'Default',
                type: item.type
              }))
            };
          }
          console.warn(`[downloaderService] Cobalt instance ${instance} only returned audio. Continuing loop to search for video or images...`);
        }
      } else {
        throw new Error('لم يتم العثور على وسائط قابلة للتحميل عبر هذه النسخة من Cobalt');
      }
    } catch (err: any) {
      console.warn(`[downloaderService] Cobalt instance ${instance} failed:`, err.message);
      lastError = err;
    }
  }

  // If we finished the loop and have no video but found audio fallback, return that!
  if (fallbackAudioResult) {
    console.log('[downloaderService] No Cobalt instance could extract video, returning fallback audio-only result.');
    fallbackAudioResult.description = 'تم استخراج الصوت بنجاح (تعذر جلب الفيديو من جميع الخوادم حالياً بسبب قيود جغرافية من يوتيوب)';
    return fallbackAudioResult;
  }
  
  throw new Error('Cobalt service error: ' + (lastError?.message || 'جميع خوادم Cobalt الاحتياطية غير متوفرة حالياً'));
}

// Wraps a promise with a hard timeout so that a hung extraction call
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`انتهت المهلة أثناء ${label}. حاول مرة أخرى.`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

async function scrapeSnapchat(url: string): Promise<{ mediaItems: MediaItem[], thumbnail: string | null }> {
  try {
    console.log(`[downloaderService] Manual scraping Snapchat: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const mediaItems: MediaItem[] = [];

    // Search for mp4 links in script tags
    $('script').each((i, el) => {
      const text = $(el).text();
      if (text.includes('.mp4')) {
        // Look for URLs ending in .mp4 with optional query params
        // We handle escaped characters like \u0026 (&)
        const matches = text.match(/https?:\/\/[^"']+\.mp4[^"']*/g);
        if (matches) {
          matches.forEach(m => {
            let cleanUrl = m.replace(/\\u0026/g, '&').replace(/\\/g, '');
            // Some URLs might be double quoted or have extra chars at the end
            cleanUrl = cleanUrl.split('"')[0].split("'")[0];
            
            if (!mediaItems.find(item => item.url === cleanUrl)) {
              mediaItems.push({
                url: cleanUrl,
                type: 'video',
                format: 'mp4',
                quality: 'جودة أصلية (MP4)'
              });
            }
          });
        }
      }
    });

    // Also check for meta tags (og:video)
    const ogVideo = $('meta[property="og:video"]').attr('content');
    if (ogVideo && !mediaItems.find(item => item.url === ogVideo)) {
      mediaItems.push({
        url: ogVideo,
        type: 'video',
        format: 'mp4',
        quality: 'جودة عالية (MP4)'
      });
    }

    const thumbnail = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || null;

    return { mediaItems, thumbnail };
  } catch (err: any) {
    console.error(`[downloaderService] Snapchat scraping failed:`, err.message);
    return { mediaItems: [], thumbnail: null };
  }
}

function getTwitterTweetId(url: string): string | null {
  // Regex to match Tweet IDs from Twitter or X URLs
  const match = url.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i);
  if (match) return match[1];
  
  // Also fallback for paths without username if someone passes status/123
  const fallbackMatch = url.match(/\/status\/(\d+)/i);
  if (fallbackMatch) return fallbackMatch[1];
  
  return null;
}

async function scrapeTwitterViaFx(url: string): Promise<{ mediaItems: MediaItem[], title: string, description: string } | null> {
  try {
    const tweetId = getTwitterTweetId(url);
    if (!tweetId) {
      console.log(`[downloaderService] FxTwitter: Could not extract tweet ID from URL: ${url}`);
      return null;
    }

    console.log(`[downloaderService] Fetching Twitter/X media from api.fxtwitter.com for Tweet ID: ${tweetId}`);
    const response = await axios.get(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.status !== 200 || !response.data) {
      console.warn(`[downloaderService] FxTwitter API returned status ${response.status}`);
      return null;
    }

    // FxTwitter usually returns { code: 200, message: "OK", tweet: { ... } }
    const data = response.data.tweet || response.data;
    const mediaItems: MediaItem[] = [];

    // 1. Process mediaList if present
    if (Array.isArray(data.media?.mediaList) && data.media.mediaList.length > 0) {
      data.media.mediaList.forEach((item: any, index: number) => {
        if (item && item.url) {
          // Robust detection: if it's a photo, or if URL is known image domain
          const isPhoto = item.type === 'photo' || 
                          item.type === 'image' || 
                          isUrlAnImage(item.url, item.type);
          
          console.log(`[downloaderService] FxTwitter item ${index} detected as photo: ${isPhoto}, type: ${item.type}, url: ${item.url}`);
          
          mediaItems.push({
            url: item.url,
            type: isPhoto ? 'image' : 'video',
            format: isPhoto ? 'jpg' : 'mp4',
            quality: isPhoto 
              ? `صورة عالية الجودة (${index + 1})` 
              : `فيديو عالي الدقة (MP4)`
          });
        }
      });
    } 
    // 2. Fallback to media_urls if mediaList is empty
    else if (Array.isArray(data.media?.all) && data.media.all.length > 0) {
      data.media.all.forEach((mediaUrl: string, index: number) => {
        if (mediaUrl) {
          const isPhoto = isUrlAnImage(mediaUrl, 'photo');
          mediaItems.push({
            url: mediaUrl,
            type: isPhoto ? 'image' : 'video',
            format: isPhoto ? 'jpg' : 'mp4',
            quality: isPhoto ? `صورة عالية الجودة (${index + 1})` : `فيديو عالي الدقة`
          });
        }
      });
    }

    if (mediaItems.length === 0) {
      console.warn(`[downloaderService] FxTwitter: No media found in API response for Tweet ID: ${tweetId}`);
      return null;
    }

    const title = data.user_name ? `تغريدة من ${data.user_name} (@${data.user_screen_name || ''})` : 'Twitter Video';
    const description = data.text || 'وسائط مستخرجة بنجاح من منصة إكس (تويتر)';

    return {
      mediaItems,
      title,
      description
    };
  } catch (err: any) {
    console.warn(`[downloaderService] scrapeTwitterViaFx failed: ${err.message}`);
    return null;
  }
}

export async function downloadTikTok(url: string): Promise<DownloaderResponse> {
  console.log(`[downloaderService] Dedicated TikTok download started for: ${url}`);
  
  const COBALT_INSTANCES = [
    // Modern v10 base paths (highest speed and compatibility)
    'https://api.cobalt.blackcat.sweeux.org/',
    'https://cobaltapi.kittycat.boo/',
    'https://rue-cobalt.xenon.zone/',
    'https://cobaltapi.cjs.nz/',
    'https://cobalt.hot-leaf-juice.com/',
    'https://cobalt.ignis.space/',
    'https://cobalt.nightly.pw/',
    'https://cobalt.sh/',
    'https://api.cobalt.tools/',
    
    // Legacy / v7 compatibility paths as fallbacks
    'https://api.cobalt.blackcat.sweeux.org/api/json',
    'https://cobaltapi.kittycat.boo/api/json',
    'https://rue-cobalt.xenon.zone/api/json',
    'https://cobaltapi.cjs.nz/api/json',
    'https://cobalt.hot-leaf-juice.com/api/json',
    'https://cobalt.ignis.space/api/json',
    'https://cobalt.nightly.pw/api/json',
    'https://cobalt.sh/api/json',
    'https://api.cobalt.tools/api/json'
  ];

  // 1. Try Cobalt Instances first
  for (const instance of COBALT_INSTANCES) {
    try {
      console.log(`[downloaderService] Trying Cobalt (TikTok): ${instance}`);
      const response = await axios.post(instance, {
        url,
        videoQuality: '1080'
      }, {
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        timeout: 8000
      });

      if (response.data && response.data.url) {
        return {
          success: true,
          platform: 'TikTok',
          title: response.data.filename || 'TikTok Video',
          description: 'تم الاستخراج بنجاح بدون علامة مائية عبر نظام Cobalt',
          thumbnail: null,
          duration: null,
          media: [{
            url: response.data.url,
            type: 'video',
            format: 'mp4',
            quality: 'بدون علامة مائية (HD)'
          }],
          options: [{
            url: response.data.url,
            quality: 'بدون علامة مائية (HD)',
            type: 'video'
          }]
        };
      }
    } catch (e: any) {
      console.warn(`[downloaderService] Cobalt instance ${instance} failed for TikTok:`, e.message);
    }
  }

  // 2. Try TikWM API directly
  try {
    console.log(`[downloaderService] Trying TikWM API for TikTok: ${url}`);
    const tikwmRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (tikwmRes.data && tikwmRes.data.code === 0 && tikwmRes.data.data) {
      const d = tikwmRes.data.data;
      const media: MediaItem[] = [];
      
      // Handle Slideshow/Images
      if (d.images && Array.isArray(d.images)) {
        console.log(`[downloaderService] TikTok Slideshow detected: ${d.images.length} images`);
        d.images.forEach((img: string, index: number) => {
          media.push({
            url: img.startsWith('http') ? img : `https://www.tikwm.com${img}`,
            type: 'image',
            format: 'jpg',
            quality: `صورة ${index + 1}`
          });
        });
      }

      if (d.hdplay) media.push({ url: `https://www.tikwm.com${d.hdplay}`, type: 'video', format: 'mp4', quality: 'عالي الدقة (HD No Watermark)' });
      if (d.play) media.push({ url: `https://www.tikwm.com${d.play}`, type: 'video', format: 'mp4', quality: 'دقة متوسطة (No Watermark)' });
      if (d.music) media.push({ url: `https://www.tikwm.com${d.music}`, type: 'audio', format: 'mp3', quality: 'صوت فقط (Original Audio)' });

      const coverUrl = d.cover ? (d.cover.startsWith('http') ? d.cover : `https://www.tikwm.com${d.cover}`) : null;
      if (coverUrl) {
        media.push({
          url: coverUrl,
          type: 'image',
          format: 'jpg',
          quality: 'صورة الغلاف (Thumbnail)'
        });
      }

      if (media.length > 0) {
        const authorInfo = d.author ? ` | بواسطة: ${d.author.nickname || d.author.unique_id}` : '';
        const statsInfo = d.play_count ? ` | مشاهدات: ${d.play_count}` : '';
        
        return {
          success: true,
          platform: 'TikTok',
          title: (d.title || 'TikTok Media') + authorInfo,
          description: (d.images ? `تم استخراج ${d.images.length} صورة من الألبوم بنجاح` : 'تم الاستخراج بنجاح بدون علامة مائية عبر نظام TikWM') + statsInfo,
          thumbnail: coverUrl,
          duration: d.duration,
          media,
          options: media.map(m => ({ url: m.url, quality: m.quality || 'Default', type: m.type }))
        };
      }
    }
  } catch (e: any) {
    console.warn(`[downloaderService] TikWM API failed:`, e.message);
  }

  // 3. Try @tobyg74/tiktok-api-dl with multiple versions
  const versions: ("v1" | "v2" | "v3")[] = ["v1", "v2", "v3"];
  for (const v of versions) {
    try {
      console.log(`[downloaderService] Trying @tobyg74/tiktok-api-dl (${v}) for TikTok: ${url}`);
      const dlRes = await tiktokDl.Downloader(url, { version: v });
      if (dlRes.status === 'success' && dlRes.result) {
        const res = dlRes.result as any;
        const media: MediaItem[] = [];

        if (res.type === 'image' && res.images && Array.isArray(res.images)) {
          res.images.forEach((img: string, index: number) => {
            media.push({
              url: img,
              type: 'image',
              format: 'jpg',
              quality: `صورة ${index + 1}`
            });
          });
        } else if (res.video || (res as any).videoHD || (res as any).nowatermark) {
          const videoUrl = res.video || (res as any).videoHD || (res as any).nowatermark;
          if (videoUrl) {
            media.push({
              url: videoUrl,
              type: 'video',
              format: 'mp4',
              quality: 'بدون علامة مائية (HQ)'
            });
          }
        }

        if (res.music || (res as any).audio) {
          media.push({
            url: res.music || (res as any).audio,
            type: 'audio',
            format: 'mp3',
            quality: 'صوت فقط'
          });
        }

        const coverUrl = res.cover || (res as any).thumbnail || (res.author?.avatar) || null;
        if (coverUrl) {
          media.push({
            url: coverUrl,
            type: 'image',
            format: 'jpg',
            quality: 'صورة الغلاف (Thumbnail)'
          });
        }

        if (media.length > 0) {
          const authorName = res.author?.nickname || res.author?.unique_id || '';
          const authorInfo = authorName ? ` | بواسطة: ${authorName}` : '';

          return {
            success: true,
            platform: 'TikTok',
            title: (res.description || res.title || 'TikTok Media') + authorInfo,
            description: res.type === 'image' ? `تم استخراج ${res.images.length} صورة من الألبوم عبر نظام API-DL (${v})` : `تم الاستخراج بنجاح عبر نظام API-DL (${v})`,
            thumbnail: coverUrl,
            duration: null,
            media,
            options: media.map(m => ({ url: m.url, quality: m.quality || 'Default', type: m.type }))
          };
        }
      }
    } catch (e: any) {
      console.warn(`[downloaderService] @tobyg74/tiktok-api-dl (${v}) failed:`, e.message);
    }
  }

  // 4. Try Lovetik API
  try {
    console.log(`[downloaderService] Trying Lovetik API for TikTok: ${url}`);
    const lovetikRes = await axios.post('https://lovetik.com/api/ajax/search', new URLSearchParams({ query: url }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    if (lovetikRes.data && lovetikRes.data.status === 'ok' && lovetikRes.data.links) {
      const links = lovetikRes.data.links;
      const media: MediaItem[] = [];
      
      Object.values(links).forEach((link: any) => {
        if (link.a && link.q) {
          media.push({
            url: link.a,
            type: link.q.includes('Audio') ? 'audio' : 'video',
            format: link.q.includes('Audio') ? 'mp3' : 'mp4',
            quality: link.q
          });
        }
      });

      if (media.length > 0) {
        const coverUrl = lovetikRes.data.cover || null;
        if (coverUrl) {
          media.push({
            url: coverUrl,
            type: 'image',
            format: 'jpg',
            quality: 'صورة الغلاف (Thumbnail)'
          });
        }

        return {
          success: true,
          platform: 'TikTok',
          title: lovetikRes.data.title || 'TikTok Video',
          description: 'تم الاستخراج بنجاح بدون علامة مائية عبر نظام Lovetik',
          thumbnail: coverUrl,
          duration: null,
          media,
          options: media.map(m => ({ url: m.url, quality: m.quality || 'Default', type: m.type }))
        };
      }
    }
  } catch (e: any) {
    console.warn(`[downloaderService] Lovetik API failed:`, e.message);
  }

  // 4. Final Fallback to system engine/yt-dlp (might have watermark)
  console.log(`[downloaderService] All specialized TikTok downloaders failed. Falling back to general extractors.`);
  const fallback = await downloadMedia(url);
  if (fallback && fallback.success && fallback.media && fallback.media.length > 0) {
    const thumb = fallback.thumbnail || (fallback as any).cover || null;
    const media = fallback.media.map(m => {
      const isImg = isUrlAnImage(m.url, m.type);
      return { 
        url: m.url, 
        type: (isImg ? 'image' : m.type) as any, 
        format: isImg ? 'jpg' : (m.format || 'mp4'), 
        quality: m.quality || 'Default' 
      };
    });
    
    if (thumb) {
      media.push({
        url: thumb,
        type: 'image',
        format: 'jpg',
        quality: 'صورة الغلاف (Thumbnail)'
      });
    }

    return {
      success: true,
      platform: 'TikTok',
      title: fallback.title || 'TikTok Video',
      description: 'تم الاستخراج عبر نظام الاحتياطي (قد تحتوي بعض الفيديوهات على علامة مائية)',
      thumbnail: thumb,
      duration: fallback.duration || null,
      media,
      options: media.map(m => ({ url: m.url, quality: m.quality || 'Default', type: m.type }))
    };
  }

  throw new Error('تعذر استخراج فيديو تيك توك. يرجى التأكد من أن الفيديو عام وغير محظور في منطقتك.');
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
    throw new Error('الرجاء إدخال رابط صحيح (يبدأ بـ http:// أو https://)');
  }

  // Route TikTok links to specialized TikTok logic
  const isTikTok = trimmed.includes('tiktok.com') || trimmed.includes('tiktokcdn.com') || trimmed.includes('ttwstatic.com') || trimmed.includes('vm.tiktok.com') || trimmed.includes('vt.tiktok.com');
  if (isTikTok) {
    try {
      return await downloadTikTok(trimmed);
    } catch (tikErr: any) {
      console.warn('[downloaderService] Specialized downloadTikTok failed, continuing to general extractor...', tikErr.message);
    }
  }

  // Route Instagram links directly to the specialized instagramService first, with multi-stage fallback
  const isInstagram = trimmed.includes('instagram.com') || trimmed.includes('ddinstagram.com') || trimmed.includes('instagr.am');
  if (isInstagram) {
    try {
      console.log(`[downloaderService] Routing Instagram URL to downloadInstagram: ${trimmed}`);
      const instagramMedia = await downloadInstagram(trimmed);
      
      const mediaItems: MediaItem[] = instagramMedia.map(item => ({
        url: item.url,
        type: item.type,
        format: item.format,
        quality: item.quality || (item.type === 'video' ? 'فيديو متكامل (صوت + فيديو)' : 'صورة عالية الدقة')
      }));

      if (mediaItems.length > 0) {
        return {
          success: true,
          platform: 'Instagram',
          title: 'Instagram Post',
          description: 'تم استخراج منشور إنستغرام بنجاح بالدقة الكاملة والفيديو مدمج مع الصوت',
          thumbnail: mediaItems.find(m => m.type === 'image')?.url || mediaItems[0].url,
          duration: null,
          media: mediaItems,
          options: mediaItems.map(item => ({
            url: item.url,
            quality: item.quality || 'Default',
            type: item.type
          }))
        };
      }
    } catch (instErr: any) {
      console.warn('[downloaderService] Specialized downloadInstagram failed, trying direct cloud downloader...', instErr.message);
    }

    try {
      console.log(`[downloaderService] Trying direct cloud downloader for Instagram fallback: ${trimmed}`);
      return await downloadViaCobalt(trimmed, 'Instagram');
    } catch (cobaltErr: any) {
      console.warn('[downloaderService] Direct cloud downloader fallback for Instagram failed, falling back to general yt-dlp...', cobaltErr.message);
    }
  }

  // Route YouTube links directly to Cobalt for instant success and bypass
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    try {
      return await downloadViaCobalt(trimmed, platform);
    } catch (cobaltErr: any) {
      console.warn('[downloaderService] Direct cloud downloader failed for YouTube, trying yt-dlp as last resort...', cobaltErr.message);
    }
  }

  // Route Facebook links directly to Cobalt for high-quality videos with merged audio and video
  const isFacebook = trimmed.includes('facebook.com') || trimmed.includes('fb.watch') || trimmed.includes('fb.gg') || trimmed.includes('facebook.co');
  if (isFacebook) {
    try {
      console.log(`[downloaderService] Routing Facebook URL to Cobalt: ${trimmed}`);
      return await downloadViaCobalt(trimmed, 'Facebook');
    } catch (cobaltErr: any) {
      console.warn('[downloaderService] Direct cloud downloader failed for Facebook, trying yt-dlp as last resort...', cobaltErr.message);
    }
  }

  // Route Twitter (X) links directly to FxTwitter with Cobalt as fallback
  const isTwitter = trimmed.includes('twitter.com') || trimmed.includes('x.com');
  if (isTwitter) {
    try {
      console.log(`[downloaderService] Routing Twitter/X URL to FxTwitter: ${trimmed}`);
      const fxResult = await scrapeTwitterViaFx(trimmed);
      if (fxResult && fxResult.mediaItems.length > 0) {
        console.log(`[downloaderService] FxTwitter successfully extracted ${fxResult.mediaItems.length} media items`);
        return {
          success: true,
          platform: 'Twitter',
          title: fxResult.title,
          description: fxResult.description,
          thumbnail: fxResult.mediaItems.find(item => item.type === 'image')?.url || fxResult.mediaItems[0].url,
          duration: null,
          media: fxResult.mediaItems,
          options: fxResult.mediaItems.map(item => ({
            url: item.url,
            quality: item.quality || (item.type === 'image' ? 'صورة عالية الجودة' : 'فيديو عالي الدقة'),
            type: item.type
          }))
        };
      }
    } catch (fxErr: any) {
      console.warn('[downloaderService] FxTwitter scraper failed, trying Cobalt...', fxErr.message);
    }

    try {
      console.log(`[downloaderService] Routing Twitter/X URL to Cobalt: ${trimmed}`);
      return await downloadViaCobalt(trimmed, 'Twitter');
    } catch (cobaltErr: any) {
      console.warn('[downloaderService] Direct cloud downloader failed for Twitter (X), trying yt-dlp as last resort...', cobaltErr.message);
    }
  }

  // Route Snapchat links to specialized scraper + yt-dlp combination
  const isSnapchat = trimmed.includes('snapchat.com') || trimmed.includes('sc-cdn.net');
  if (isSnapchat) {
    try {
      let finalUrl = trimmed;
      // Resolve short URLs for better scraping
      if (trimmed.includes('snapchat.com/t/')) {
        console.log(`[downloaderService] Resolving Snapchat short URL: ${trimmed}`);
        const headResponse = await axios.get(trimmed, { 
          maxRedirects: 5, 
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } 
        });
        finalUrl = headResponse.request.res.responseUrl || trimmed;
      }

      console.log(`[downloaderService] Routing Snapchat URL to specialized logic: ${finalUrl}`);
      const { mediaItems: snapMedia, thumbnail: snapThumbnail } = await scrapeSnapchat(finalUrl);
      
      if (snapMedia.length > 0) {
        return {
          success: true,
          platform: 'Snapchat',
          title: 'Snapchat Video',
          description: 'تم استخراج الفيديو بنجاح بدقة MP4 المباشرة (عبر نظام Scraper الاحترافي)',
          thumbnail: snapThumbnail,
          duration: null,
          media: snapMedia,
          options: snapMedia.map(item => ({
            url: item.url,
            quality: item.quality || 'Default',
            type: item.type
          }))
        };
      }
    } catch (snapErr: any) {
      console.warn('[downloaderService] Specialized scrapeSnapchat failed, continuing to yt-dlp...', snapErr.message);
    }
  }

  // Route Pinterest links directly to specialized scraper for high-quality images and multi-image posts
  const isPinterest = trimmed.includes('pinterest.com') || trimmed.includes('pin.it');
  if (isPinterest) {
    try {
      console.log(`[downloaderService] Routing Pinterest URL to downloadPinterest: ${trimmed}`);
      const pinterestResult = await downloadPinterest(trimmed);
      
      const mediaItems: MediaItem[] = pinterestResult.media.map(item => ({
        url: item.url,
        type: item.type,
        format: item.format,
        quality: item.quality || (item.type === 'video' ? 'فيديو بنترست عالي الدقة' : 'صورة عالية الدقة')
      }));

      if (mediaItems.length > 0) {
        return {
          success: true,
          platform: 'Pinterest',
          title: pinterestResult.title || 'Pinterest Post',
          description: pinterestResult.description || `تم استخراج ${mediaItems.length} عنصر من منشور بنترست بنجاح`,
          thumbnail: mediaItems.find(m => m.type === 'image')?.url || mediaItems[0].url,
          duration: null,
          media: mediaItems,
          options: mediaItems.map(item => ({
            url: item.url,
            quality: item.quality || 'Default',
            type: item.type
          }))
        };
      }
    } catch (pinErr: any) {
      console.warn('[downloaderService] Specialized downloadPinterest failed, trying Cobalt...', pinErr.message);
    }

    try {
      console.log(`[downloaderService] Routing Pinterest URL to Cobalt: ${trimmed}`);
      return await downloadViaCobalt(trimmed, 'Pinterest');
    } catch (cobaltErr: any) {
      console.warn('[downloaderService] Direct cloud downloader failed for Pinterest, trying yt-dlp as last resort...', cobaltErr.message);
    }
  }

  try {
    const platformReferer = getPlatformReferer(trimmed);
    console.log(`[downloaderService] Attempting to extract via yt-dlp: ${trimmed} | Referer: ${platformReferer}`);
    
    let youtubedlFn: any;
    try {
      const ytdlModule = await import('youtube-dl-exec');
      youtubedlFn = ytdlModule.default || (ytdlModule as any);
    } catch (err: any) {
      console.error('[downloaderService] Cannot load youtube-dl-exec dynamically:', err.message);
      throw new Error('yt-dlp features are not supported in this serverless environment. Dynamic load failed.');
    }

    const output: any = await withTimeout(
      youtubedlFn(trimmed, {
        dumpJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        noPlaylist: true,
        geoBypass: true,
        format: 'bestvideo+bestaudio/best',
        addHeader: [`referer:${platformReferer}`, 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36']
      }),
      45000,
      'جلب بيانات الوسائط (yt-dlp)'
    );

    const mediaItems: MediaItem[] = [];

    // Force Image Detection for yt-dlp output
    const forceIsImage = isUrlAnImage(output.url || output.webpage_url || trimmed);

    // If yt-dlp outputs a single direct url, it represents the fully merged audio/video stream
    if (output.url) {
      const isImg = forceIsImage || isUrlAnImage(output.url);
      const isVideo = !isImg && (output.vcodec !== 'none' || output.width || output.height);
      mediaItems.push({
        url: output.url,
        type: isImg ? 'image' : (isVideo ? 'video' : 'audio'),
        format: isImg ? 'jpg' : (output.ext || 'mp4'),
        quality: isImg ? 'صورة عالية الجودة' : (isVideo ? 'فيديو متكامل (صوت + فيديو)' : 'صوت فقط (بجودة عالية)')
      });
    }

    // Process all formats
    if (output.formats && Array.isArray(output.formats)) {
      // Sort formats by quality / filesize
      output.formats.forEach((f: any) => {
        if (!f.url) return;
        
        // Skip internal manifest placeholders that aren't real URLs
        if (f.url.startsWith('manifest') && !f.url.includes('://')) return;
        
        const isVideo = f.vcodec !== 'none' && f.vcodec !== undefined;
        const isAudio = f.acodec !== 'none' && f.acodec !== undefined;
        
        if (!isVideo && !isAudio) return;
        
        let type: 'video' | 'audio' | 'image' = 'video';
        let quality = f.format_note || f.resolution || 'Default';
        
        if (isVideo && isAudio) {
          type = 'video';
          quality += ' (فيديو + صوت متكامل)';
        } else if (isVideo && !isAudio) {
          type = 'video';
          quality += ' (فيديو فقط - بدون صوت)';
        } else if (!isVideo && isAudio) {
          type = 'audio';
          quality = `${f.abr || f.tbr || ''}kbps (صوت فقط)`.trim();
        }

        // Avoid pushing duplicates with the exact same URL
        if (!mediaItems.find(m => m.url === f.url)) {
          mediaItems.push({
            url: f.url,
            type,
            format: f.ext || 'mp4',
            quality
          });
        }
      });
    }

    if (output.thumbnail && !mediaItems.find(m => m.url === output.thumbnail)) {
      mediaItems.push({
        url: output.thumbnail,
        type: 'image',
        format: 'jpg',
        quality: 'صورة الغلاف (Thumbnail)'
      });
    }

    if (mediaItems.length === 0) {
      throw new Error('لم يتم العثور على وسائط قابلة للتحميل في هذا الرابط.');
    }

    const options = mediaItems.map(item => ({
      url: item.url,
      quality: item.quality || 'Default',
      type: item.type
    }));

    return {
      success: true,
      platform: output.extractor_key || platform || 'Unknown',
      title: output.title || null,
      description: output.description || null,
      thumbnail: output.thumbnail || null,
      duration: output.duration_string || output.duration || null,
      media: mediaItems.reverse(), // Best qualities usually at the end of yt-dlp format list
      options: options.reverse()
    };
  } catch (err: any) {
    console.error('[downloaderService] yt-dlp error:', err.message);
    
    // Attempt cloud downloader fallback first
    try {
      console.log('[downloaderService] yt-dlp failed or blocked. Attempting fallback to direct cloud downloader...');
      return await downloadViaCobalt(trimmed, platform);
    } catch (cobaltErr: any) {
      console.warn('[downloaderService] Fallback cloud downloader failed:', cobaltErr.message);
    }

    if (err.message.includes('Video unavailable') || err.message.includes('private')) {
      throw new Error('هذا الفيديو غير متوفر أو خاص.');
    }

    // Attempt fallback to secondary library engine for generic links if everything else totally fails
    try {
      console.log('[downloaderService] Falling back to secondary library engine...');
      const fallbackResult = await withTimeout(
        downloadMedia(trimmed),
        25000,
        'جلب البيانات (احتياطي)'
      );

      if (fallbackResult && fallbackResult.success && fallbackResult.media && fallbackResult.media.length > 0) {
        
        const mediaItems = fallbackResult.media.map(item => ({
          url: item.url,
          type: item.type as 'image' | 'video' | 'audio',
          format: item.format || 'mp4',
          quality: item.quality || 'Default'
        }));

        return {
          success: true,
          platform: fallbackResult.platform || platform || 'Unknown',
          title: fallbackResult.title || 'Untitled',
          description: fallbackResult.description || null,
          thumbnail: fallbackResult.thumbnail || (fallbackResult as any).cover || (fallbackResult as any).image || null,
          duration: fallbackResult.duration || null,
          media: mediaItems,
          options: mediaItems.map(item => ({
            url: item.url,
            quality: item.quality || 'Default',
            type: item.type
          }))
        };
      }
    } catch (fallbackErr: any) {
      console.warn('[downloaderService] Fallback secondary library engine failed:', fallbackErr.message);
    }
    
    throw new Error('فشل استخراج الوسائط. قد يكون الرابط غير مدعوم أو أن المنصة تمنع الوصول. (' + err.message.split('\n')[0].substring(0, 50) + ')');
  }
}
