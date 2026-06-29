import { useState } from 'react';
import { ExternalLink, Video, Volume2, Image as ImageIcon, FileDown, CheckCircle, Copy, Play, Eye } from 'lucide-react';
import { DownloaderResponse } from '../types';
import { VideoPlayer } from './VideoPlayer';

interface DownloadResultProps {
  data: DownloaderResponse;
  selectedPlatformId?: string | null;
}

export function DownloadResult({ data, selectedPlatformId }: DownloadResultProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Helper to copy links
  const handleCopyLink = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Safe checks for the media items list
  const mediaItems = data.media || [];
  
  // Calculate counts
  const totalCount = mediaItems.length;
  const imageCount = mediaItems.filter(item => item.type === 'image').length;
  const videoCount = mediaItems.filter(item => item.type === 'video').length;
  const audioCount = mediaItems.filter(item => item.type === 'audio').length;

  // Filtered media list based on selected active tab
  const filteredMedia = mediaItems.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const getMediaBadgeLabel = (type: 'video' | 'audio' | 'image') => {
    switch (type) {
      case 'image':
        return { label: 'صورة', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'video':
        return { label: 'فيديو', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'audio':
        return { label: 'صوت', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    }
  };

  const getPlatformClass = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (p.includes('tiktok')) return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
    if (p.includes('instagram')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-200/30';
    if (p.includes('twitter') || p.includes('x')) return 'bg-slate-800 text-slate-300 border-slate-700';
    return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
  };

  // Determine beautiful label structure for media metrics
  const getSubtitlesArabic = () => {
    const parts: string[] = [];
    if (imageCount > 0) parts.push(`${imageCount} صور`);
    if (videoCount > 0) parts.push(`${videoCount} فيديو`);
    if (audioCount > 0) parts.push(`${audioCount} ملفات صوتية`);
    return parts.length > 0 ? parts.join(' • ') : 'محتوى مستخرج';
  };

  const getSafeImageUrl = (url: string, fallbackName: string = 'preview') => {
    if (!url) return '';
    const lowercase = url.toLowerCase();
    const isCDNDomain = 
      lowercase.includes('cdninstagram') ||
      lowercase.includes('fbcdn') ||
      lowercase.includes('tiktokcdn') ||
      lowercase.includes('byteoversea') ||
      lowercase.includes('ibyteimg') ||
      lowercase.includes('twimg') ||
      lowercase.includes('instagram') ||
      lowercase.includes('threads.net');
    
    if (isCDNDomain) {
      return `/api/proxy-download?url=${encodeURIComponent(url)}&inline=true&type=image&name=${encodeURIComponent(fallbackName)}`;
    }
    return url;
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-6 animate-fade-in mb-12" id="download-result-panel">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        
        {/* Result Header */}
        <div className="p-6 md:p-8 border-b border-slate-800/80 bg-slate-950/40 relative">
          
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            
            {/* Elegant Cover Thumbnail */}
            {data.thumbnail && !imageErrors[data.thumbnail] ? (
              <div className="relative w-36 h-36 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-700/60 bg-black/40 shadow-xl group">
                <img 
                  src={getSafeImageUrl(data.thumbnail, `${data.title || 'cover'}_thumbnail`)} 
                  alt={data.title || "Cover"} 
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => handleImageError(data.thumbnail!)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md text-[10px] font-mono px-2 py-0.5 rounded-md text-white font-bold">
                  {totalCount} {totalCount === 1 ? 'ملف' : 'ملفات'}
                </div>
              </div>
            ) : (
              <div className="relative w-36 h-36 flex-shrink-0 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2">
                <ImageIcon className="w-10 h-10 stroke-[1.2] text-slate-600" />
                <span className="text-[10px] font-mono">{totalCount} {totalCount === 1 ? 'ملف' : 'ملفات'}</span>
              </div>
            )}

            {/* Platform & Details Metadata */}
            <div className="flex-1 w-full flex flex-col items-center sm:items-start justify-center">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                <span className={`text-[10px] font-mono font-black tracking-widest px-3 py-1 border rounded-lg uppercase ${getPlatformClass(data.platform)}`}>
                  {data.platform}
                </span>
                {data.duration && (
                  <span className="text-[10px] font-mono bg-slate-950 border border-slate-800/80 text-slate-400 px-3 py-1 rounded-lg">
                    {data.duration}s
                  </span>
                )}
                <span className="text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-lg">
                  {getSubtitlesArabic()}
                </span>
              </div>
              
              <h3 className="text-base md:text-lg font-bold text-white line-clamp-2 leading-relaxed tracking-tight w-full">
                {data.title || 'محتوى مستخرج من ' + data.platform}
              </h3>
              
              {data.description && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 font-normal leading-relaxed w-full">
                  {data.description}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Filters Tabs UI (Only if more than 1 items are available of varying types) */}
        {totalCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-3.5 bg-slate-950/60 border-b border-slate-800/80 font-mono">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              الكل ({totalCount})
            </button>
            {imageCount > 0 && (
              <button
                onClick={() => setActiveTab('image')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'image' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                صور ({imageCount})
              </button>
            )}
            {videoCount > 0 && (
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'video' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                فيديو ({videoCount})
              </button>
            )}
            {audioCount > 0 && (
              <button
                onClick={() => setActiveTab('audio')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'audio' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                صوت ({audioCount})
              </button>
            )}
          </div>
        )}

        {/* Media Grid / Playback List */}
        <div className="p-6 md:p-8 space-y-6 bg-slate-900/40 min-h-[120px]">
          
          {filteredMedia.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredMedia.map((item, idx) => {
                const badgeInfo = getMediaBadgeLabel(item.type);
                const hasImgError = imageErrors[item.url];

                return (
                  <div 
                    key={idx} 
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-all duration-300 flex flex-col md:flex-row gap-5 items-stretch shadow-lg relative group overflow-hidden"
                  >
                    
                    {/* Media Preview Stage */}
                    <div className="w-full md:w-48 h-44 md:h-auto flex-shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center">
                      
                      {item.type === 'video' ? (
                        <VideoPlayer 
                          src={item.url} 
                          title={data.title || 'download'} 
                          index={idx} 
                          thumbnail={data.thumbnail}
                        />
                      ) : item.type === 'audio' ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-6 w-full text-slate-400">
                          <Volume2 className="w-12 h-12 text-cyan-400 animate-pulse" />
                          <span className="text-[10px] font-mono tracking-wider font-semibold">ملف صوتي مستخرج</span>
                          <audio src={item.url} controls className="w-full mt-2 h-7 rounded-sm" />
                        </div>
                      ) : (
                        // Image Renderer with Error checking fallback
                        !hasImgError ? (
                          <img 
                            src={getSafeImageUrl(item.url, `${data.title || 'media'}_${idx + 1}`)} 
                            alt={`مستند-${idx}`} 
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() => handleImageError(item.url)}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                            <ImageIcon className="w-8 h-8 opacity-40" />
                            <span className="text-[10px] font-mono">تعذر تحميل المعاينة</span>
                          </div>
                        )
                      )}

                      {/* absolute top floating type badge */}
                      <span className={`absolute top-2.5 right-2 step-badge text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 border rounded-md shadow-sm opacity-90 backdrop-blur-md ${badgeInfo.color}`}>
                        {badgeInfo.label}
                      </span>
                    </div>

                    {/* Controls details details */}
                    <div className="flex-1 flex flex-col justify-between py-1 gap-4">
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6366f1]">
                            {item.type}
                          </span>
                          <span className="text-slate-600">&#8226;</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Format: {item.format?.toUpperCase()}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-bold text-slate-200 font-mono">
                          {item.quality ? `الجودة: ${item.quality}` : 'جودة تلقائية'}
                        </h4>
                        
                        <p className="text-[11px] text-slate-500 mt-2 break-all overflow-hidden line-clamp-1">
                          {item.url}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        
                        <button
                          onClick={() => handleCopyLink(item.url, idx)}
                          className="flex-1 md:flex-initial px-4 py-2.5 text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-slate-200 rounded-xl cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5 group-hover:border-slate-700/80"
                        >
                          {copiedIndex === idx ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              تم النسخ!
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Copy className="w-3.5 h-3.5 opacity-70" />
                              نسخ الرابط
                            </span>
                          )}
                        </button>

                        <a
                          href={`/api/proxy-download?url=${encodeURIComponent(item.url)}&name=${encodeURIComponent(data.title || 'download')}_${idx + 1}&type=${encodeURIComponent(item.type)}&format=${encodeURIComponent(item.format || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 md:flex-initial px-5 py-2.5 text-xs font-bold bg-[#6366f1] hover:bg-[#5053df] text-white rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 active:scale-[0.98]"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>تحميل مباشر</span>
                        </a>

                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-slate-500 font-normal">
              لا توجد وسائط متاحة تنتمي لهذا النوع.
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
