import { Request, Response } from 'express';
import { processDownload } from './downloaderService';

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
