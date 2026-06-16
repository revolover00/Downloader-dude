import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="text-center py-8 md:py-12 max-w-3xl mx-auto px-4">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-950/40 border border-indigo-500/20 rounded-full mb-5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span className="text-[11px] font-mono font-medium text-indigo-300 tracking-wider uppercase">
          Engine PRO v2.1.0-stable
        </span>
      </div>
      
      <h1 className="text-4xl md:text-5.5xl font-extrabold text-white mb-4 tracking-tight leading-none bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
        Universal Media Downloader
      </h1>
      
      <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
        Paste a link from TikTok, YouTube, Twitter (X), Threads, or Instagram to extract direct, high-speed download links instantly.
      </p>

      {/* Supported Platforms ticker/badges */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-8 opacity-60">
        {['TikTok', 'YouTube', 'Twitter (X)', 'Threads', 'Instagram', 'Snapchat'].map((platform) => (
          <span 
            key={platform} 
            className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 select-none hover:text-slate-200 transition-colors"
          >
            {platform}
          </span>
        ))}
      </div>
    </header>
  );
}
