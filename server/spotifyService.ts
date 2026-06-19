import { Request, Response } from 'express';
import axios from 'axios';
import { Readable } from 'stream';
import { ZipArchive } from 'archiver';
import ytdl from 'ytdl-plus';

export function getSpotifyEmbedUrl(url: string): string {
  const cleanUrl = url.split('?')[0];
  const match = cleanUrl.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  if (!match) return url;
  const [, type, id] = match;
  return `https://open.spotify.com/embed/${type}/${id}`;
}

// Cache the access token to avoid re-fetching on every request
let spotifyTokenCache: { token: string; expiresAt: number } | null = null;

async function getSpotifyAccessToken(): Promise<string> {
  const now = Date.now();
  if (spotifyTokenCache && spotifyTokenCache.expiresAt > now + 60_000) {
    return spotifyTokenCache.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in your .env file. ' +
      'Get them from https://developer.spotify.com/dashboard'
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 8000,
    }
  );

  const { access_token, expires_in } = tokenRes.data;
  spotifyTokenCache = { token: access_token, expiresAt: now + expires_in * 1000 };
  return access_token;
}

function parseSpotifyId(url: string): { type: 'track' | 'album' | 'playlist'; id: string } | null {
  const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return { type: match[1] as 'track' | 'album' | 'playlist', id: match[2] };
}

export async function spotifyPlaylistInfoController(req: Request, res: Response) {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid Spotify URL is required.' });
  }

  const parsed = parseSpotifyId(url.trim());
  if (!parsed) {
    return res.status(400).json({ error: 'Could not parse Spotify URL. Provide a track, album, or playlist link.' });
  }

  try {
    const token = await getSpotifyAccessToken();
    const apiBase = 'https://api.spotify.com/v1';
    const headers = { Authorization: `Bearer ${token}` };

    if (parsed.type === 'track') {
      const { data } = await axios.get(`${apiBase}/tracks/${parsed.id}`, { headers, timeout: 8000 });
      return res.json({
        success: true,
        platform: 'Spotify',
        title: data.name,
        thumbnail: data.album?.images?.[0]?.url || '',
        description: `${data.artists?.map((a: any) => a.name).join(', ')} · ${data.album?.name}`,
        tracks: [{
          name: data.name,
          artist: data.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          durationMs: data.duration_ms || 0,
          thumbnail: data.album?.images?.[0]?.url || '',
        }],
      });
    }

    if (parsed.type === 'album') {
      const { data: album } = await axios.get(`${apiBase}/albums/${parsed.id}`, { headers, timeout: 8000 });
      const albumThumb = album.images?.[0]?.url || '';
      const tracks = (album.tracks?.items || []).map((t: any) => ({
        name: t.name,
        artist: t.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
        durationMs: t.duration_ms || 0,
        thumbnail: albumThumb,
      }));
      return res.json({
        success: true,
        platform: 'Spotify',
        title: album.name,
        thumbnail: albumThumb,
        description: `${album.artists?.[0]?.name} · ${album.total_tracks} tracks`,
        tracks,
      });
    }

    // Playlist — paginate through all tracks (Spotify returns max 100 per page)
    const { data: playlist } = await axios.get(`${apiBase}/playlists/${parsed.id}`, { headers, timeout: 8000 });
    const playlistThumb = playlist.images?.[0]?.url || '';
    const allTracks: any[] = [];

    let tracksUrl: string | null = `${apiBase}/playlists/${parsed.id}/tracks?limit=100&fields=next,items(track(name,duration_ms,artists,album(images)))`;
    while (tracksUrl) {
      const { data: page } = await axios.get(tracksUrl, { headers, timeout: 10000 });
      for (const item of page.items || []) {
        if (!item.track || item.track.type === 'episode') continue;
        allTracks.push({
          name: item.track.name,
          artist: item.track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          durationMs: item.track.duration_ms || 0,
          thumbnail: item.track.album?.images?.[0]?.url || playlistThumb,
        });
      }
      tracksUrl = page.next || null;
    }

    return res.json({
      success: true,
      platform: 'Spotify',
      title: playlist.name,
      thumbnail: playlistThumb,
      description: `${playlist.owner?.display_name} · ${allTracks.length} tracks`,
      tracks: allTracks,
    });

  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) {
      spotifyTokenCache = null;
      return res.status(401).json({ error: 'Spotify auth failed. Check your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.' });
    }
    if (status === 404) {
      return res.status(404).json({ error: 'Spotify content not found. Make sure the link is to public content.' });
    }
    console.error('Spotify API error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to fetch Spotify data. Please try again.' });
  }
}

/**
 * Highly robust YouTube Search function that pulls search results via ytdl-plus
 */
export async function searchYouTube(query: string): Promise<{ id: string; title: string }[]> {
  console.log(`[YouTube Search] Querying via ytdl-plus: ${query}`);
  try {
    const results = await ytdl.search(query, { limit: 5 });
    const videos = results
      .filter(r => r.type === 'video' && r.id)
      .map(r => ({ id: r.id, title: r.title }));
    console.log(`[YouTube Search] Found ${videos.length} results.`);
    return videos;
  } catch (err: any) {
    console.error('[YouTube Search Failed]:', err.message);
    return [];
  }
}

async function getYtAudioStream(youtubeUrl: string): Promise<NodeJS.ReadableStream | null> {
  try {
    console.log(`[ytdl-plus] Extracting audio stream for: ${youtubeUrl}`);
    const { stream } = await ytdl.getStream(youtubeUrl, {
      quality: 'highestaudio',
      format: 'mp3',
    });
    // ytdl-plus returns a Web ReadableStream — convert to Node.js Readable for piping
    return Readable.fromWeb(stream as any);
  } catch (err: any) {
    console.error('[ytdl-plus stream error]:', err.message);
    return null;
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
    console.log(`Searching YouTube for track: ${query}`);
    const results = await searchYouTube(query);
    
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Track not found on YouTube.' });
    }

    const video = results[0];
    const ytUrl = `https://www.youtube.com/watch?v=${video.id}`;
    console.log(`Found YouTube match: ${video.title} (${video.id}), extracting audio source...`);

    const nodeStream = await getYtAudioStream(ytUrl);
    if (!nodeStream) {
      throw new Error('Could not extract audio stream. The video may be unavailable or region-locked.');
    }

    const safeFilename = `${trackName} - ${artistName}.mp3`;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);

    nodeStream.on('error', (err) => {
      console.error('[downloadTrack] Stream error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: 'Stream interrupted.' });
    });

    nodeStream.pipe(res);
  } catch (err: any) {
    console.error('Error during audio stream extraction:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Audio extraction failed: ${err.message || err}` });
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

    const archive = new ZipArchive({ zlib: { level: 5 } });
    archive.pipe(res);

    // Limit concurrency to respect memory limit guidelines on compute runtimes
    const batchSize = 3;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (track: any) => {
        try {
          const query = `${track.name} ${track.artist} audio`;
          const results = await searchYouTube(query);
          
          if (results && results.length > 0) {
            const videoId = results[0].id;
            const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            const nodeStream = await getYtAudioStream(ytUrl);
            if (nodeStream) {
              const chunks: Buffer[] = [];
              for await (const chunk of nodeStream as any) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              const buffer = Buffer.concat(chunks);
              const safeName = `${track.name.replace(/[/\\?%*:|"<>]/g, '')} - ${track.artist.replace(/[/\\?%*:|"<>]/g, '')}.mp3`;
              archive.append(buffer, { name: safeName });
            }
          }
        } catch (e: any) {
          console.error(`Error packing track: ${track.name}`, e?.message);
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
