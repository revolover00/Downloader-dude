import { Request, Response } from 'express';
import { processDownload, getPlatformReferer } from './downloaderService';
import axios from 'axios';

export async function downloadMediaController(req: Request, res: Response): Promise<void> {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        success: false,
        error: 'A valid URL string is required.',
      });
      return;
    }

    const trimmedUrl = url.trim();
    if (trimmedUrl.length === 0) {
      res.status(400).json({
        success: false,
        error: 'URL cannot be empty.',
      });
      return;
    }

    const downloadResult = await processDownload(trimmedUrl);
    res.json(downloadResult);
  } catch (error: any) {
    console.error('[Download API Error]:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'An error occurred while parsing media from this URL. Please verify the link is accessible.',
    });
  }
}

// Map a known media type ('image' | 'video' | 'audio') + optional format hint
// to the correct file extension. This is the SOURCE OF TRUTH for the extension —
// it must never be overridden by guessing from the remote Content-Type header,
// because CDNs (especially Instagram's) often return generic/incorrect
// Content-Type values (e.g. application/octet-stream) for image URLs, which
// previously caused images to be saved as ".mp4".
function resolveExtension(type?: string, format?: string): string {
  const fmt = (format || '').toLowerCase().replace('.', '');

  if (type === 'image') {
    const validImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'bmp'];
    return validImageExts.includes(fmt) ? fmt : 'jpg';
  }
  if (type === 'audio') {
    const validAudioExts = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'opus'];
    return validAudioExts.includes(fmt) ? fmt : 'mp3';
  }
  if (type === 'video') {
    const validVideoExts = ['mp4', 'webm', 'mov', 'mkv', 'm4v'];
    return validVideoExts.includes(fmt) ? fmt : 'mp4';
  }
  // Unknown type: fall back to the format string if present, otherwise mp4
  return fmt || 'mp4';
}

export async function proxyDownloadController(req: Request, res: Response): Promise<void> {
  const targetUrl = req.query.url as string;
  const fileName = req.query.name as string || 'download';
  // The frontend already knows the real media type/format from the backend's
  // own extraction step — pass it through explicitly instead of re-detecting
  // it from response headers, which are unreliable for CDN-hosted media.
  const mediaType = req.query.type as string | undefined;
  const mediaFormat = req.query.format as string | undefined;

  if (!targetUrl) {
    res.status(400).send('URL query parameter is required.');
    return;
  }

  let remoteStream: any = null;

  const cleanup = () => {
    if (remoteStream && typeof remoteStream.destroy === 'function') {
      try {
        remoteStream.destroy();
      } catch (err: any) {
        console.error('[ProxyDownload Cleanup Error]:', err.message);
      }
    }
  };

  req.on('close', cleanup);
  res.on('error', (err: any) => {
    console.error('[ProxyDownload Response Stream Error]:', err.message);
    cleanup();
  });

  try {
    const referer = getPlatformReferer(targetUrl);
    console.log(`[ProxyDownload] Proxying request to: ${targetUrl} (Referer: ${referer})`);
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Range': 'bytes=0-',
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    const remoteContentType = String(response.headers['content-type'] || 'application/octet-stream');
    const contentLength = response.headers['content-length'] ? String(response.headers['content-length']) : undefined;

    // Determine the file extension AND the Content-Type we send back to the browser.
    // Priority order:
    // 1. Explicit type/format passed by the frontend (always correct — it comes
    //    from the same extraction step that classified the media in the first place).
    // 2. The remote Content-Type header (only used if the frontend didn't send
    //    type/format, e.g. for older cached links).
    // 3. Hard fallback to video/mp4 as an absolute last resort.
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      gif: 'image/gif', heic: 'image/heic', bmp: 'image/bmp',
      mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav',
      ogg: 'audio/ogg', opus: 'audio/opus',
      mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mkv: 'video/x-matroska', m4v: 'video/x-m4v',
    };

    let extension: string;
    let outgoingContentType: string;

    if (mediaType) {
      const ext = resolveExtension(mediaType, mediaFormat);
      extension = '.' + ext;
      outgoingContentType = mimeMap[ext] || remoteContentType;
    } else if (remoteContentType.includes('image')) {
      extension = '.jpg';
      outgoingContentType = remoteContentType;
    } else if (remoteContentType.includes('audio') || remoteContentType.includes('mpeg')) {
      extension = '.mp3';
      outgoingContentType = remoteContentType;
    } else if (remoteContentType.includes('gif')) {
      extension = '.gif';
      outgoingContentType = remoteContentType;
    } else if (remoteContentType.includes('zip')) {
      extension = '.zip';
      outgoingContentType = remoteContentType;
    } else {
      extension = '.mp4';
      outgoingContentType = remoteContentType;
    }

    const inline = req.query.inline === 'true';

    res.setHeader('Content-Type', outgoingContentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');

    let safeName = fileName;
    if (!safeName.toLowerCase().endsWith(extension)) {
      safeName += extension;
    }

    if (inline) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(safeName)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"`);
    }

    // Attach error event handler to readable stream to prevent crashing server process
    remoteStream = response.data;
    remoteStream.on('error', (streamErr: any) => {
      console.error('[ProxyDownload Dynamic Stream Error]:', streamErr.message);
      cleanup();
      if (!res.headersSent) {
        res.status(500).send('Streaming interrupted: ' + streamErr.message);
      }
    });

    remoteStream.pipe(res);
  } catch (error: any) {
    console.error('[ProxyDownload Error]:', error.message);
    cleanup();
    if (!res.headersSent) {
      if (error.response) {
        res.status(error.response.status).json({
          error: `فشل التحميل: ${error.response.status} ${error.response.statusText}`
        });
      } else if (error.code === 'ECONNABORTED') {
        res.status(504).json({ error: 'المهلة انتهت، الخادم بطيء جداً' });
      } else {
        res.status(500).send('Failed to stream remote media content: ' + error.message);
      }
    }
  }
}
