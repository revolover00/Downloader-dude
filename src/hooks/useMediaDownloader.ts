import { useState, useCallback } from 'react';
import { DownloaderResponse, SpotifyResponse, DownloaderState, SpotifyTrack } from '../types';

export function useMediaDownloader() {
  const [state, setState] = useState<DownloaderState>({
    loading: false,
    error: null,
    data: null,
    spotifyData: null,
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
      spotifyData: null,
    });
  }, []);

  const downloadMedia = useCallback(async (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setState({
        loading: false,
        error: 'Please enter a media link first.',
        data: null,
        spotifyData: null,
      });
      return;
    }

    setState({ loading: true, error: null, data: null, spotifyData: null });

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
          spotifyData: null,
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        data: result as DownloaderResponse,
        spotifyData: null,
      });
    } catch (err: any) {
      console.error('[Download Request Failed]:', err);
      setState({
        loading: false,
        error: 'Failed to communicate with downloader server. Please check your network and try again.',
        data: null,
        spotifyData: null,
      });
    }
  }, []);

  const fetchSpotifyInfo = useCallback(async (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setState({
        loading: false,
        error: 'Please enter a Spotify link first.',
        data: null,
        spotifyData: null,
      });
      return;
    }

    setState({ loading: true, error: null, data: null, spotifyData: null });

    try {
      const response = await fetch('/api/spotify/playlist-info', {
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
          error: result.error || 'Failed to parse Spotify tracks. Double check the Spotify URL matches public content.',
          data: null,
          spotifyData: null,
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        data: null,
        spotifyData: result as SpotifyResponse,
      });
    } catch (err: any) {
      console.error('[Spotify Meta Retrieval Failed]:', err);
      setState({
        loading: false,
        error: 'Failed to communicate with Spotify scraper. Please verify your connection status.',
        data: null,
        spotifyData: null,
      });
    }
  }, []);

  const downloadSpotifyTracksAsZip = useCallback(async (tracks: SpotifyTrack[], playlistName: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/spotify/download-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracks, playlistName }),
      });

      if (!response.ok) {
        throw new Error('Failed to pack tracks on server side');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchorNode = document.createElement('a');
      anchorNode.href = downloadUrl;
      anchorNode.download = `${playlistName.replace(/[/\\?%*:|"<>]/g, '') || 'spotify_playlist'}.zip`;
      document.body.appendChild(anchorNode);
      anchorNode.click();
      anchorNode.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setState(prev => ({ ...prev, loading: false }));
    } catch (err: any) {
      console.error('[Spotify Zip Compilation Failed]:', err);
      setState(prev => ({ ...prev, loading: false, error: 'Could not bundle playlist songs into ZIP format.' }));
    }
  }, []);

  return {
    url,
    setUrl: handleUrlChange,
    loading: state.loading,
    error: state.error,
    data: state.data,
    spotifyData: state.spotifyData,
    downloadMedia,
    fetchSpotifyInfo,
    downloadSpotifyTracksAsZip,
    clearResult,
  };
}
