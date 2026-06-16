export interface AdaptedMediaItem {
  type: 'video' | 'audio' | 'image';
  url: string;
  quality: string | null;
  format: string | null;
  sizeMB?: number | null;
}

export interface DownloaderOption {
  url: string;
  quality: string;
  type: 'video' | 'audio' | 'image';
}

export interface DownloaderResponse {
  success: boolean;
  platform: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  duration: string | number | null;
  media: AdaptedMediaItem[];
  options: DownloaderOption[];
  error?: string;
}

export interface SpotifyTrack {
  name: string;
  artist: string;
  durationMs: number;
  thumbnail?: string;
  downloadStatus?: 'idle' | 'downloading' | 'completed' | 'failed';
}

export interface SpotifyResponse {
  success: boolean;
  platform: 'Spotify';
  title: string;
  thumbnail: string;
  description: string;
  tracks: SpotifyTrack[];
}

export interface DownloaderState {
  loading: boolean;
  error: string | null;
  data: DownloaderResponse | null;
  spotifyData: SpotifyResponse | null;
}
