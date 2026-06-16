import { ExternalLink, Video, Volume2, Image, FileDown, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { DownloaderResponse, DownloaderOption } from '../types';

interface ResultDetailsProps {
  data: DownloaderResponse;
}

export function ResultDetails({ data }: ResultDetailsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyLink = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch (err) {
      console.error('Could not copy link to clipboard:', err);
    }
  };

  const getMediaIcon = (type: 'video' | 'audio' | 'image') => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-emerald-400" />;
      case 'audio':
        return <Volume2 className="w-4 h-4 text-cyan-400" />;
      case 'image':
        return <Image className="w-4 h-4 text-fuchsia-400" />;
    }
  };

  const getPlatformClass = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (p.includes('tiktok')) return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
    if (p.includes('instagram')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    if (p.includes('twitter') || p.includes('x')) return 'bg-gray-800 text-gray-300 border-gray-700';
    if (p.includes('spotify')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-4 animate-fade-in mb-12">
      <div className="bg-slate-900/85 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        
        {/* Core Media Meta */}
        <div className="p-6 md:p-8 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            
            {/* Thumbnail */}
            {data.thumbnail ? (
              <div className="relative w-full sm:w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-800 bg-black/45 shadow-inner">
                <img 
                  src={data.thumbnail} 
                  alt="Media Thumbnail" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative w-full sm:w-32 h-32 flex-shrink-0 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-center text-slate-600">
                <Video className="w-10 h-10 stroke-[1.2]" />
              </div>
            )}

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[10px] font-mono font-black tracking-widest px-3 py-1 border rounded-lg uppercase ${getPlatformClass(data.platform)}`}>
                  {data.platform}
                </span>
                {data.duration && (
                  <span className="text-xs font-mono bg-slate-950 border border-slate-850 text-slate-400 px-3 py-1 rounded-lg">
                    Duration: {data.duration}s
                  </span>
                )}
              </div>
              
              <h2 className="text-lg md:text-xl font-extrabold text-white line-clamp-2 leading-snug">
                {data.title || 'Extracted Media'}
              </h2>
              
              {data.description && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 font-normal leading-relaxed">
                  {data.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Links / Options List */}
        <div className="p-6 md:p-8 bg-slate-900/40">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-5 font-mono">
            Available Downloads ({data.options?.length || 0})
          </h3>

          <div className="space-y-3.5">
            {data.options && data.options.length > 0 ? (
              data.options.map((option, idx) => (
                <div 
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      {getMediaIcon(option.type)}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-slate-500 font-bold">
                        {option.type}
                      </div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {option.quality}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
                    <button
                      onClick={() => handleCopyLink(option.url, idx)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <span className="flex items-center justify-center gap-1.5 text-indigo-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Copied!
                        </span>
                      ) : (
                        'Copy URL'
                      )}
                    </button>

                    <a
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-950/20 active:scale-[0.98]"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-slate-500">
                No direct downloads extracted. Check manual visit links or retry.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
