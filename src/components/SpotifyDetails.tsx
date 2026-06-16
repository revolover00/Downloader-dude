import { Music, FileDown, CheckCircle, Play, Sparkles, Loader2, Music4 } from 'lucide-react';
import { useState } from 'react';
import { SpotifyResponse, SpotifyTrack } from '../types';

interface SpotifyDetailsProps {
  data: SpotifyResponse;
  onDownloadZip: (tracks: SpotifyTrack[], playlistName: string) => Promise<void>;
  loading: boolean;
}

export function SpotifyDetails({ data, onDownloadZip, loading }: SpotifyDetailsProps) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [trackStatus, setTrackStatus] = useState<Record<number, 'idle' | 'downloading' | 'completed'>>({});

  const handleDownloadSingle = async (track: SpotifyTrack, index: number) => {
    setTrackStatus(prev => ({ ...prev, [index]: 'downloading' }));
    
    try {
      const searchQ = `${track.name} ${track.artist} audio`;
      const downloadUrl = `/api/spotify/download-track?q=${encodeURIComponent(searchQ)}&name=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artist)}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${track.name} - ${track.artist}.mp3`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTrackStatus(prev => ({ ...prev, [index]: 'completed' }));
    } catch (e) {
      console.error(e);
      setTrackStatus(prev => ({ ...prev, [index]: 'idle' }));
    }
  };

  const handleZipDownload = async () => {
    setDownloadingZip(true);
    try {
      await onDownloadZip(data.tracks, data.title);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-6 animate-fade-in mb-12" id="spotify-details-card">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        
        {/* Core Playlist/Track Metadata info */}
        <div className="p-6 md:p-8 border-b border-slate-800 bg-gradient-to-br from-emerald-950/20 via-slate-900/50 to-slate-900/90">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            
            {/* Thumbnail Cover */}
            {data.thumbnail ? (
              <div className="relative w-36 h-36 flex-shrink-0 rounded-2xl overflow-hidden border border-emerald-500/20 bg-black/40 shadow-xl group">
                <img 
                  src={data.thumbnail} 
                  alt="Playlist Cover" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-8 h-8 text-emerald-400 fill-emerald-400" />
                </div>
              </div>
            ) : (
              <div className="relative w-36 h-36 flex-shrink-0 bg-slate-950 border border-emerald-500/10 rounded-2xl flex items-center justify-center text-slate-700 shadow-xl">
                <Music className="w-12 h-12 stroke-[1.2] text-emerald-500" />
              </div>
            )}

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                <span className="text-[10px] font-mono font-black tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg uppercase">
                  Spotify Audio
                </span>
                <span className="text-xs font-mono bg-slate-950 border border-slate-850 text-slate-400 px-3 py-1 rounded-lg">
                  {data.tracks?.length || 0} Tracks Found
                </span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-2 tracking-tight">
                {data.title || 'Spotify Playlist'}
              </h2>
              
              {data.description && (
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-normal">
                  {data.description}
                </p>
              )}

              {/* Master Zip Downloader Action Button */}
              {data.tracks && data.tracks.length > 0 && (
                <div className="mt-5 flex justify-center sm:justify-start">
                  <button
                    onClick={handleZipDownload}
                    disabled={downloadingZip || loading}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-extrabold bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-950/40 active:scale-[0.98]"
                  >
                    {downloadingZip ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Compiling ZIP MP3s...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4" />
                        <span>Download Full Playlist ZIP (320kbps)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Individual Tracks Selector/Listing */}
        <div className="p-6 md:p-8 bg-slate-950/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 font-mono">
              Track List Directory
            </h3>
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Source matched via YouTube Audio
            </span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 overflow-x-hidden custom-scrollbar">
            {data.tracks && data.tracks.length > 0 ? (
              data.tracks.map((track, idx) => (
                <div 
                  key={idx}
                  className="group flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-900/60 hover:border-slate-800 hover:bg-slate-950 transition-all duration-150"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-xs text-slate-500 font-mono font-bold flex-shrink-0 group-hover:text-emerald-400 transition-colors">
                      {idx + 1}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                        {track.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5 font-medium flex items-center gap-1">
                        <Music4 className="w-3 h-3 text-slate-600" />
                        <span>{track.artist}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownloadSingle(track, idx)}
                      disabled={trackStatus[idx] === 'downloading'}
                      className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        trackStatus[idx] === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : trackStatus[idx] === 'downloading'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 active:scale-[0.97]'
                      }`}
                    >
                      {trackStatus[idx] === 'completed' ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Saved!</span>
                        </>
                      ) : trackStatus[idx] === 'downloading' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Download MP3</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                No songs extracted. Ensure the playlist matches public rights.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
