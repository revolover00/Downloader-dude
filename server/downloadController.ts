import { Request, Response } from 'express';
import { processDownload } from './downloaderService';
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

export async function proxyDownloadController(req: Request, res: Response): Promise<void> {
  const targetUrl = req.query.url as string;
  const fileName = req.query.name as string || 'download';
  
  if (!targetUrl) {
    res.status(400).send('URL query parameter is required.');
    return;
  }

  try {
    console.log(`[ProxyDownload] Proxying request to: ${targetUrl}`);
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
      },
      timeout: 30000
    });

    const contentType = String(response.headers['content-type'] || 'application/octet-stream');
    const contentLength = response.headers['content-length'] ? String(response.headers['content-length']) : undefined;

    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // Set clean disposition filename to download directly
    const extension = contentType.includes('video') ? '.mp4' : contentType.includes('image') ? '.jpg' : '.mp4';
    let safeName = fileName;
    if (!safeName.endsWith(extension)) {
      safeName += extension;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"`);

    response.data.pipe(res);
  } catch (error: any) {
    console.error('[ProxyDownload Error]:', error.message);
    if (!res.headersSent) {
      res.status(500).send('Failed to stream remote media content: ' + error.message);
    }
  }
}
