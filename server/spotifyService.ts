import { Request, Response } from 'express';
import ytdlPlus from 'ytdl-plus';
import archiver from 'archiver';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Readable } from 'stream';

const ytdl = ytdlPlus;

export function getSpotifyEmbedUrl(url: string): string {
  const cleanUrl = url.split('?')[0];
  const match = cleanUrl.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  if (!match) return url;
  const [, type, id] = match;
  return `https://open.spotify.com/embed/${type}/${id}`;
}

/**
 * Controller to extract tracks instantly from the Spotify URL via web scraping
 */
export async function spotifyPlaylistInfoController(req: Request, res: Response) {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid Spotify URL is required.' });
  }

  try {
    const embedUrl = getSpotifyEmbedUrl(url.trim());
    console.log(`Scraping Spotify Embed Page: ${embedUrl}`);
    
    const response = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Spotify Media';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    const description = $('meta[property="og:description"]').attr('content') || '';

    let parsedData = null;
    const rawInitialState = $('#initial-state').html() || $('#initial-state').text();
    if (rawInitialState) {
      try {
        const decoded = decodeURIComponent(rawInitialState.trim());
        parsedData = JSON.parse(decoded);
      } catch (e) {
        try {
          parsedData = JSON.parse(rawInitialState.trim());
        } catch (err) {}
      }
    }

    if (!parsedData) {
      const rawResource = $('#resource').html() || $('#resource').text();
      if (rawResource) {
        try {
          parsedData = JSON.parse(rawResource.trim());
        } catch (e) {}
      }
    }

    const tracks: any[] = [];
    
    function recurse(value: any) {
      if (!value || typeof value !== 'object') return;
      
      if (value.type === 'track' && typeof value.name === 'string') {
        const name = value.name;
        let artist = 'Unknown Artist';
        if (Array.isArray(value.artists)) {
          artist = value.artists.map((a: any) => a.name).join(', ');
        } else if (typeof value.artists === 'string') {
          artist = value.artists;
        } else if (typeof value.subtitle === 'string') {
          artist = value.subtitle;
        } else if (value.artists && typeof value.artists.name === 'string') {
          artist = value.artists.name;
        }
        
        const durationMs = value.duration_ms || value.duration || 0;
        const itemThumb = value.album?.images?.[0]?.url || value.coverUrl || thumbnail;

        if (!tracks.some(t => t.name.toLowerCase() === name.toLowerCase() && t.artist.toLowerCase() === artist.toLowerCase())) {
          tracks.push({ name, artist, durationMs, thumbnail: itemThumb });
        }
      }
      
      if (Array.isArray(value)) {
        for (const item of value) {
          recurse(item);
        }
      } else {
        for (const key of Object.keys(value)) {
          recurse(value[key]);
        }
      }
    }

    if (parsedData) {
      recurse(parsedData);
    }

    // Fallback scraping from UI list elements if empty
    if (tracks.length === 0) {
      $('li, [data-testid="track-row"], .track-row').each((_i, el) => {
        const trackTitle = $(el).find('[data-testid="track-title"], .track-name, h4, .title').text().trim();
        let trackArtist = $(el).find('[data-testid="track-artists"], .artist-name, p, .artist').text().trim();
        if (trackTitle) {
          if (!trackArtist) trackArtist = 'Unknown Artist';
          tracks.push({
            name: trackTitle,
            artist: trackArtist,
            durationMs: 0,
            thumbnail: thumbnail
          });
        }
      });
    }

    // Single track parsing fallback
    if (tracks.length === 0 && url.includes('/track/')) {
      let songArtist = 'Unknown Artist';
      if (description) {
        const descParts = description.split(' · ');
        if (descParts.length > 1) {
          songArtist = descParts[1];
        } else if (description.includes('by ')) {
          songArtist = description.split('by ')[1];
        }
      }
      tracks.push({
        name: title,
        artist: songArtist,
        durationMs: 0,
        thumbnail: thumbnail
      });
    }

    res.json({
      success: true,
      platform: 'Spotify',
      title,
      thumbnail,
      description,
      tracks
    });
  } catch (err: any) {
    console.error('Error fetching Spotify playlist meta:', err);
    res.status(500).json({ error: 'Failed to parse Spotify page. Please check the URL quality.' });
  }
}

/**
 * Controller to search YouTube and stream back a single high speed MP3 file
 */
export async function downloadTrackController(req: Request, res: Response) {
  const query = req.query.q as string;
  const trackName = req.query.name as string || 'Track';
  const artistName = req.query.artist as string || 'Artist';

  if (!query) {
    return res.status(400).json({ error: 'Search query parameter (q) is required.' });
  }

  try {
    console.log(`Searching YouTube for: ${query}`);
    const results = await ytdl.search(query, { limit: 1 });
    
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Track not found on YouTube.' });
    }

    const video = results[0];
    console.log(`Found YouTube match: ${video.title} (${video.id})`);

    const { stream } = await ytdl.getStream(video.id, {
      quality: 'highestaudio',
      format: 'mp3',
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(trackName)} - ${encodeURIComponent(artistName)}.mp3"`);
    
    const nodeStream = Readable.fromWeb(stream as any);
    nodeStream.pipe(res);
  } catch (err: any) {
    console.error('Error during audio stream extraction:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream extraction failed: ' + err.message });
    }
  }
}

/**
 * Controller to download a list of tracks and pack them inside a single ZIP (limiting concurrent load)
 */
export async function downloadSpotifyPlaylist(req: Request, res: Response) {
  const { tracks, playlistName } = req.body;

  if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
    return res.status(400).json({ error: 'Tracks array is required and cannot be empty.' });
  }

  try {
    const archiveName = playlistName ? `${playlistName.replace(/[/\\?%*:|"<>]/g, '')}` : 'playlist';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(archiveName)}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    // Concurrent limits to respect standard CPU / memory guidelines on cloud environments
    const batchSize = 3;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (track: any) => {
        try {
          const query = `${track.name} ${track.artist} audio`;
          const results = await ytdl.search(query, { limit: 1 });
          
          if (results && results.length > 0) {
            const { stream } = await ytdl.getStream(results[0].id, {
              quality: 'highestaudio',
              format: 'mp3'
            });

            const nodeStream = Readable.fromWeb(stream as any);
            const safeName = `${track.name.replace(/[/\\?%*:|"<>]/g, '')} - ${track.artist.replace(/[/\\?%*:|"<>]/g, '')}.mp3`;
            
            const chunks: any[] = [];
            for await (const chunk of nodeStream) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            archive.append(buffer, { name: safeName });
          }
        } catch (e) {
          console.error(`Error packing track: ${track.name}`, e);
        }
      }));
    }

    archive.finalize();
  } catch (err: any) {
    console.error('ZIP packaging error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to compile ZIP archive.' });
    }
  }
}
