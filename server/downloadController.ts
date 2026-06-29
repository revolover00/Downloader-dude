import { Request, Response } from 'express';
import { processDownload, getPlatformReferer, isUrlAnImage } from './downloaderService';
import axios from 'axios';
import https from 'https';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

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
  const isInline = req.query.inline === 'true';
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
    
    // Build headers dynamically to mimic a high-fidelity browser request
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      'Connection': 'keep-alive',
    };

    const isYouTube = targetUrl.includes('googlevideo.com') || 
                      targetUrl.includes('youtube.com') || 
                      targetUrl.includes('youtu.be');

    const isInstagram = targetUrl.includes('cdninstagram.com') || targetUrl.includes('fbcdn.net') || targetUrl.includes('instagram.com');
    const isTikTok = targetUrl.includes('tiktokcdn.com') || targetUrl.includes('ttwstatic.com') || targetUrl.includes('tiktok.com');
    const isCDN = isInstagram || isTikTok;

    // Rule 1: CDNs often block requests that contain incorrect referers (hotlink protection).
    // To bypass this, we MUST pass their official platform referer (e.g. instagram.com for instagram media)
    // and matching Origin, mimicking requests coming directly from within their official apps/sites.
    // However, we MUST NOT send these headers for Cobalt's own tunnel URLs, as they do not have hotlink 
    // protection and strict self-referential Origin/Referer headers might be rejected with a 404 or 403.
    const isCobaltTunnel = targetUrl.includes('/tunnel');
    if (referer && !isCobaltTunnel) {
      headers['Referer'] = referer;
      try {
        const refUrl = new URL(referer);
        headers['Origin'] = refUrl.origin;
      } catch (e) {}
    }

    if (isYouTube) {
      headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
    }

    // Rule 2: Do NOT manually pass 'Accept-Encoding: gzip, deflate, br' with responseType: 'stream'.
    // If passed manually, Axios does not decompress the stream, sending raw compressed bytes
    // to the client or hanging/corrupting files. Let Axios handle stream decompression.

    // Rule 3: Only send Range headers for video and audio content. 
    // Image servers can reject Range headers with a 416 status or fail.
    // YouTube stream URLs (googlevideo.com) also can return 403 Forbidden if a manual Range header is sent,
    // as it conflicts with the URL signature or internal parameters.
    const isImage = mediaType === 'image' || isUrlAnImage(targetUrl, mediaType);
    
    const isHLS = targetUrl.includes('.m3u8');
    const isDASH = targetUrl.includes('.mpd');

    // Handle HLS (.m3u8) or DASH (.mpd) streams by merging segments using ffmpeg on-the-fly
    if ((isHLS || isDASH) && !isImage) {
      console.log(`[ProxyDownload] Detected stream (${isHLS ? 'HLS' : 'DASH'}). Merging via ffmpeg: ${targetUrl}`);
      
      const safeName = (fileName || 'video') + '.mp4';
      res.setHeader('Content-Type', 'video/mp4');
      if (!isInline) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"`);
      } else {
        res.setHeader('Content-Disposition', 'inline');
      }
      res.setHeader('Cache-Control', 'no-cache');

      // Use ffmpeg to download and merge HLS segments into a single MP4 stream
      // -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 for better stability
      const ffmpegArgs = [
        '-y',
        '-reconnect', '1',
        '-reconnect_at_eof', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '10',
        '-analyzeduration', '20000000',
        '-probesize', '20000000',
        '-protocol_whitelist', 'file,http,https,tcp,tls,crypto',
        '-user_agent', headers['User-Agent'],
        '-headers', Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n',
        '-i', targetUrl,
        '-c', 'copy',
        '-ignore_unknown',
        '-err_detect', 'ignore_err',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-metadata', `title=${fileName}`,
        '-f', 'mp4',
        'pipe:1'
      ];

      console.log(`[ProxyDownload] Spawning ffmpeg with args:`, ffmpegArgs.join(' '));
      const ffmpeg = spawn(ffmpegStatic || 'ffmpeg', ffmpegArgs);

      ffmpeg.stdout.pipe(res);

      ffmpeg.stderr.on('data', (data) => {
        // Log ffmpeg output for debugging if needed (mostly noisy)
        // console.log(`ffmpeg: ${data}`);
      });

      ffmpeg.on('error', (err) => {
        console.error('[ProxyDownload ffmpeg Error]:', err.message);
        if (!res.headersSent) {
          res.status(500).send('Failed to process video: ' + err.message);
        }
      });

      ffmpeg.on('close', (code) => {
        console.log(`[ProxyDownload ffmpeg] process exited with code ${code}`);
        if (code !== 0 && !res.headersSent) {
          // res.status(500).send('ffmpeg failed to process stream');
        }
        res.end();
      });

      req.on('close', () => {
        ffmpeg.kill('SIGKILL');
      });

      return;
    }

    // Configure HTTPS agent. We bypass SSL verification for non-YouTube CDNs to avoid certificate issues,
    // and configure IPv6/IPv4 selection for YouTube.
    let httpsAgent: any = new https.Agent({ rejectUnauthorized: false });

    if (isYouTube) {
      try {
        const urlObj = new URL(targetUrl);
        const ipParam = urlObj.searchParams.get('ip') || '';
        const isIPv6 = ipParam.includes(':') || ipParam.includes('%');
        
        console.log(`[ProxyDownload] YouTube/GoogleVideo IP detection: ip=${ipParam} | isIPv6=${isIPv6}`);
        
        httpsAgent = new https.Agent({
          family: isIPv6 ? 6 : 4,
          keepAlive: true,
          rejectUnauthorized: false
        });
      } catch (agentErr: any) {
        console.error('[ProxyDownload Agent Init Error]:', agentErr.message);
      }
    }

    console.log(`[ProxyDownload] Proxying request to: ${targetUrl} | CDN Mode: ${isCDN} | YouTube Mode: ${isYouTube} | Image Mode: ${isImage}`);
    console.log(`[ProxyDownload] Headers:`, JSON.stringify(headers, null, 2));

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      headers,
      httpsAgent,
      timeout: 30000,
      maxRedirects: 5,
    });

    console.log(`[ProxyDownload] Remote response status: ${response.status}`);
    console.log(`[ProxyDownload] Remote Content-Type: ${response.headers['content-type']}`);

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
    console.error('[ProxyDownload Error]:', error.message, '| URL:', targetUrl);
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
