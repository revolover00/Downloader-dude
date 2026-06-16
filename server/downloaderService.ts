import { downloadMedia } from 'mediasnap';
import { DownloadResult } from 'mediasnap/dist/types';

export interface AdaptedMediaItem {
  type: 'video' | 'audio' | 'image';
  url: string;
  quality: string | null;
  format: string | null;
  sizeMB?: number | null;
}

export interface DownloaderResponse {
  success: boolean;
  platform: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  duration: string | number | null;
  media: AdaptedMediaItem[];
  options: {
    url: string;
    quality: string;
    type: string;
  }[];
  error?: string;
}

export async function processDownload(url: string): Promise<DownloaderResponse> {
  if (!url) {
    throw new Error('URL is required');
  }

  // Validate URL structure basic check
  try {
    new URL(url);
  } catch (err) {
    throw new Error('Please enter a valid URL (starting with http:// or https://)');
  }

  // Explicitly check for Spotify and return the specific error message
  /* Removed Spotify exclusion to enable Spotify downloading */

  const result: DownloadResult = await downloadMedia(url);

  if (!result || !result.success) {
    throw new Error(result?.error || 'Unsupported platform or download failed. Please double check the URL and try again.');
  }

  const options = (result.media || []).map((item) => ({
    url: item.url,
    quality: item.quality || item.format || 'Default',
    type: item.type as 'video' | 'audio' | 'image' || 'video',
  }));

  // Clean or normalize platform casing
  let platformName = result.platform || 'Unknown';
  if (platformName && typeof platformName === 'string') {
    platformName = platformName.charAt(0).toUpperCase() + platformName.slice(1);
  }

  return {
    success: true,
    platform: platformName,
    title: result.title || 'Untitled Media',
    description: result.description,
    thumbnail: result.thumbnail,
    duration: result.duration,
    media: result.media || [],
    options,
  };
}
