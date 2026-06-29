import React, { useCallback, useRef, useState } from 'react';
import { ArrowRight, Clipboard, Link2, X, AlertCircle } from 'lucide-react';

interface SearchInputProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  onSubmit: (url: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchInput({ url, setUrl, loading, onSubmit, onClear, placeholder }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPasteTip, setShowPasteTip] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && url.trim()) {
      onSubmit(url);
    }
  };

  const handlePaste = useCallback(async () => {
    try {
      setShowPasteTip(false);
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
        }
      } else {
        setShowPasteTip(true);
        inputRef.current?.focus();
        setTimeout(() => setShowPasteTip(false), 5000);
      }
    } catch (err) {
      console.warn('Clipboard read access rejected or not supported. Focus and manual paste instead.', err);
      setShowPasteTip(true);
      inputRef.current?.focus();
      setTimeout(() => setShowPasteTip(false), 5000);
    }
  }, [setUrl]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4 mb-6">
      <div className="relative group rounded-2xl bg-slate-900/50 border border-slate-800 p-2 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shadow-2xl">
        <div className="flex items-center gap-2 pl-3">
          <Link2 className="text-slate-500 group-focus-within:text-indigo-400 w-5 h-5 flex-shrink-0 transition-colors" />
          
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            placeholder={placeholder || "Paste TikTok, Twitter, Instagram or YouTube URL here..."}
            className="w-full bg-transparent text-sm md:text-base text-slate-100 placeholder:text-slate-600 outline-none border-none py-2.5 md:py-3.5 text-right font-sans"
            dir="rtl"
            required
          />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {url && (
              <button
                type="button"
                onClick={onClear}
                disabled={loading}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <button
              type="button"
              onClick={handlePaste}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Paste</span>
            </button>
          </div>
        </div>
      </div>

      {showPasteTip && (
        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-indigo-950/25 border border-indigo-500/25 rounded-2xl text-indigo-300 text-xs font-mono shadow-md animate-fade-in">
          <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>Browser blocks clipboard reading inside frames. Use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-xs font-bold border border-slate-700">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-xs font-bold border border-slate-700">Cmd+V</kbd> to paste manually.</span>
        </div>
      )}

      <div className="mt-5 flex justify-center">
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="relative w-full sm:w-auto px-12 py-4 rounded-xl text-sm font-bold tracking-wider uppercase overflow-hidden transition-all group/btn bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800/80 disabled:hover:bg-slate-800/80 text-white disabled:text-slate-500 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-indigo-900/30"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
              <span>Fetching links...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5">
              <span>Fetch Links</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </div>
          )}
        </button>
      </div>
    </form>
  );
}
