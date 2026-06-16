import { useState, useCallback } from 'react';
import { DownloaderResponse, DownloaderState } from '../types';

export function useMediaDownloader() {
  const [state, setState] = useState<DownloaderState>({
    loading: false,
    error: null,
    data: null,
  });

  const [url, setUrl] = useState('');

  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
  }, []);

  const clearResult = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
    });
  }, []);

  const downloadMedia = useCallback(async (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setState({
        loading: false,
        error: 'Please enter a media link first.',
        data: null,
      });
      return;
    }

    setState({ loading: true, error: null, data: null });

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmed }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setState({
          loading: false,
          error: result.error || 'Server responded with an error. Please try a different link or check the source.',
          data: null,
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        data: result as DownloaderResponse,
      });
    } catch (err: any) {
      console.error('[Download Request Failed]:', err);
      setState({
        loading: false,
        error: 'Failed to communicate with downloader server. Please check your network and try again.',
        data: null,
      });
    }
  }, []);

  const downloadSpotifyPlaylist = useCallback(async (targetUrl: string) => {
    setState({ loading: true, error: null, data: null });
    try {
      const response = await fetch('/api/spotify/download-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      // Handle the zip response here... (simplified for now)
      setState({ loading: false, error: null, data: null });
    } catch (err: any) {
      setState({ loading: false, error: 'Spotify download failed.', data: null });
    }
  }, []);

  return {
    url,
    setUrl: handleUrlChange,
    loading: state.loading,
    error: state.error,
    data: state.data,
    downloadMedia,
    downloadSpotifyPlaylist,
    clearResult,
  };
}
