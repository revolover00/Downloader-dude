import axios from 'axios';
import * as cheerio from 'cheerio';

interface PinterestMedia {
  url: string;
  type: 'image' | 'video';
  format: string;
  quality?: string;
}

interface PinterestResult {
  media: PinterestMedia[];
  title?: string;
  description?: string;
  author?: string;
}

/**
 * Advanced Pinterest Scraper v2
 * Systematically extracts media from Story/Idea Pins, Carousels, and Standard Pins.
 */
export async function downloadPinterest(url: string): Promise<PinterestResult> {
  try {
    // Normalize URL
    let targetUrl = url.trim();
    if (targetUrl.includes('pin.it')) {
      console.log(`[pinterestService] Resolving short URL: ${targetUrl}`);
      const headRes = await axios.head(targetUrl, { maxRedirects: 5 });
      targetUrl = headRes.request.res.responseUrl || targetUrl;
    }

    console.log(`[pinterestService] Fetching Pinterest URL: ${targetUrl}`);
    
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 15000
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const media: PinterestMedia[] = [];
    
    // Metadata
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const author = $('meta[property="og:site_name"]').attr('content');

    // Extraction state
    const foundUrls = new Set<string>();

    // Helper to add media safely
    const addMedia = (url: string, type: 'image' | 'video', quality: string) => {
      if (!url || foundUrls.has(url)) return;
      foundUrls.add(url);
      
      const extension = url.split(/[#?]/)[0].split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : 'jpg');
      
      media.push({
        url,
        type,
        format: extension,
        quality
      });
    };

    // --- STRATEGY 1: JSON DATA EXTRACTION (Most reliable for multi-media) ---
    // We look for the main data script which contains the complete Pin object
    const dataScript = $('script#__PWS_DATA__, script[type="application/json"]').filter((i, el) => {
      const text = $(el).text();
      return text.includes('pin_carousel_items') || text.includes('story_pin_data') || text.includes('images');
    }).first();

    if (dataScript.length > 0) {
      try {
        const jsonData = JSON.parse(dataScript.text());
        console.log('[pinterestService] Parsing JSON metadata for media...');

        // Systematic deep search function
        const deepSearch = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;

          // 1. Idea/Story Pins (Multiple pages)
          if (obj.story_pin_data?.pages) {
            obj.story_pin_data.pages.forEach((page: any, i: number) => {
              const video = page.video?.video_list?.V_720P || page.video?.video_list?.V_HLSV3 || Object.values(page.video?.video_list || {})[0];
              const image = page.image?.images?.originals || page.image?.images?.['736x'] || Object.values(page.image?.images || {})[0];
              
              if (video?.url) addMedia(video.url, 'video', `صفحة ${i + 1} (فيديو)`);
              else if (image?.url) addMedia(image.url, 'image', `صفحة ${i + 1} (صورة)`);
            });
          }

          // 2. Carousel Pins
          if (Array.isArray(obj.pin_carousel_items)) {
            obj.pin_carousel_items.forEach((item: any, i: number) => {
              const image = item.images?.originals || item.images?.['736x'] || Object.values(item.images || {})[0];
              if (image?.url) addMedia(image.url, 'image', `صورة ${i + 1} (من ألبوم)`);
            });
          }

          // 3. Native Videos
          if (obj.videos?.video_list) {
            const v = obj.videos.video_list;
            const best = v.V_720P || v.V_HLSV3 || Object.values(v)[0];
            if (best?.url) addMedia(best.url, 'video', 'فيديو عالي الدقة');
          }

          // 4. Standard Images (Always check for originals)
          if (obj.images?.originals?.url) {
            addMedia(obj.images.originals.url, 'image', 'صورة عالية الجودة');
          }

          // Recurse
          for (const key in obj) {
            if (typeof obj[key] === 'object') deepSearch(obj[key]);
          }
        };

        deepSearch(jsonData);
      } catch (e) {
        console.error('[pinterestService] JSON parse error:', e);
      }
    }

    // --- STRATEGY 2: META TAG FALLBACK ---
    if (media.length === 0) {
      const ogVideo = $('meta[property="og:video"]').attr('content');
      if (ogVideo) addMedia(ogVideo, 'video', 'فيديو (Meta)');

      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) addMedia(ogImage, 'image', 'صورة (Meta)');
    }

    // --- STRATEGY 3: REGEX HARVESTING (Last resort for buried images) ---
    if (media.length === 0) {
      const imgRegex = /https:\/\/i\.pinimg\.com\/originals\/[a-f0-9\/]+\.(jpg|png|webp|gif)/g;
      const matches = html.match(imgRegex);
      if (matches) {
        matches.forEach((url: string, i: number) => addMedia(url, 'image', `صورة مستخرجة ${i + 1}`));
      }
    }

    if (media.length === 0) {
      throw new Error('لم نتمكن من العثور على أي وسائط في هذا الرابط. قد يكون المنشور خاصاً أو تم حذفه.');
    }

    console.log(`[pinterestService] Successfully extracted ${media.length} items.`);

    return {
      media,
      title: title?.replace(' | Pinterest', '').trim(),
      description: description?.trim(),
      author: author?.trim()
    };

  } catch (error: any) {
    console.error('[pinterestService] Failure:', error.message);
    throw new Error(error.message || 'فشل الاتصال بـ Pinterest. حاول مرة أخرى لاحقاً.');
  }
}
