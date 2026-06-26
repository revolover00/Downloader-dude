import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, FileImage, Download, CheckCircle, Copy } from 'lucide-react';

interface VideoToImageCardProps {
  src: string;
  title?: string;
  index: number;
}

export function VideoToImageCard({ src, title = 'snap_image', index }: VideoToImageCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  // We proxy the video with inline=true to bypass CORS so canvas extraction of the frame succeeds
  const proxiedUrl = `/api/proxy-download?url=${encodeURIComponent(src)}&inline=true&type=video&format=mp4`;

  useEffect(() => {
    let active = true;
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (!active) return;
      // Seek slightly past 0 to avoid black start frames
      video.currentTime = 0.2;
    };

    const handleSeeked = () => {
      if (!active) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setImageUrl(dataUrl);
          setLoading(false);
          setError(false);
        }
      } catch (err: any) {
        console.warn('[VideoToImageCard] Canvas draw failed on seek:', err?.message || String(err));
      }
    };

    const handleErrorEvent = () => {
      if (!active) return;
      console.warn('[VideoToImageCard] Private proxy-download video load failed.');
    };

    // Add listeners natively
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleErrorEvent);

    // Initial load trigger
    video.load();

    // Fallback timer
    const fallbackTimer = setTimeout(() => {
      if (!active) return;
      if (!imageUrl) {
        if (video.readyState >= 2) {
          handleSeeked();
        } else {
          setError(true);
          setLoading(false);
        }
      }
    }, 4500);

    return () => {
      active = false;
      clearTimeout(fallbackTimer);
      if (video) {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleErrorEvent);
      }
    };
  }, [proxiedUrl]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${title}_photo_${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[VideoToImageCard] Download failed:', err);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (imageUrl) {
        await navigator.clipboard.writeText(src);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-850 hover:border-indigo-500/30 transition-all duration-300 flex flex-col md:flex-row gap-5 items-stretch shadow-lg relative group overflow-hidden">
      
      {/* 
        We physically place the video in the DOM but render it tiny and invisible.
        This ensures all browser layouts (Safari, Chrome, iOS) actually decode 
        the frames as part of layout rendering while staying hidden from sight.
      */}
      <video
        ref={videoRef}
        src={proxiedUrl}
        crossOrigin="anonymous"
        playsInline
        muted
        preload="auto"
        style={{
          position: 'absolute',
          width: '4px',
          height: '4px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -50,
          top: 0,
          left: 0,
        }}
      />

      {/* Visual Image Preview Stage */}
      <div className="w-full md:w-48 h-44 md:h-auto flex-shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center min-h-[140px]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`مستخرج إطار-${index}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
          />
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-4 text-center gap-2 text-slate-500">
            <FileImage className="w-8 h-8 opacity-40 text-red-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-slate-400">فشل استخراج الصورة بالخلفية</span>
            <button 
              onClick={() => {
                setError(false);
                setLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="text-[9px] text-indigo-400 underline hover:text-indigo-300 mt-1 cursor-pointer font-bold"
            >
              إعادة الكرّة والمحاولة
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-[10px] font-mono text-indigo-300 animate-pulse">جاري سحب أول لقطة فيديو...</span>
          </div>
        )}

        {/* Float absolute photo badge */}
        <span className="absolute top-2.5 right-2 text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 border rounded-md shadow-sm opacity-90 backdrop-blur-md bg-indigo-500/15 text-indigo-300 border-indigo-500/20">
          صورة مستخرجة (JPG)
        </span>
      </div>

      {/* Controls & Details */}
      <div className="flex-1 flex flex-col justify-between py-1 gap-4 text-right">
        <div>
          <div className="flex items-center gap-2 justify-end mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">
              IMAGE FROM VIDEO
            </span>
            <span className="text-slate-600">&#8226;</span>
            <span className="text-[10px] font-mono text-slate-400">
              Format: JPG
            </span>
          </div>
          
          <h4 className="text-sm font-bold text-slate-200 mt-1 leading-relaxed">
            لقطة الإطار الأول من الـ Reel / الفيديو
          </h4>
          
          <p className="text-[10px] text-slate-500 mt-2 break-all overflow-hidden line-clamp-1 select-all" dir="ltr">
            {src}
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 justify-end">
          <button
            onClick={handleCopyLink}
            className="flex-1 md:flex-initial px-4 py-2.5 text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-slate-200 rounded-xl cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                تم نسخ الرابط!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 opacity-70" />
                نسخ الرابط
              </span>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={!imageUrl || downloading}
            className="flex-1 md:flex-initial px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>تحميل الصورة JPG</span>
          </button>
        </div>
      </div>

    </div>
  );
}
