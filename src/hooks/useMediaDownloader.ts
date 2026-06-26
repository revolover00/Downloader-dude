import { useState, useCallback } from 'react';
import { DownloaderResponse, DownloaderState } from '../types';

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

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('[Download JSON Parse Error]:', parseErr, 'Response text:', responseText);
        setState({
          loading: false,
          error: `Server responded with an unexpected response format. Details: ${responseText.substring(0, 150)}`,
          data: null,
          spotifyData: null,
        });
        return;
      }

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
        error: `Failed to communicate with downloader server (${err.message || 'Network Error'}). Please check your connection and try again.`,
        data: null,
        spotifyData: null,
      });
    }
  }, []);

  return {
    url,
    setUrl: handleUrlChange,
    loading: state.loading,
    error: state.error,
    data: state.data,
    downloadMedia,
    clearResult,
  };
}
