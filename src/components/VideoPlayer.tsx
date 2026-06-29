import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Play } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  index: number;
  thumbnail?: string | null;
}

export function VideoPlayer({ src, title = 'download', index, thumbnail }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameUrl] = useState<string | null>(thumbnail || null);
  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(true);

  // We proxy the video with inline=true to bypass CORS so canvas extraction of the frame succeeds
  const proxiedUrl = `/api/proxy-download?url=${encodeURIComponent(src)}&inline=true&type=video&format=mp4`;

  useEffect(() => {
    if (!isPlaying) {
      setLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    const handleLoadedMetadata = () => {
      setLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [src, isPlaying]);

  const downloadFrameAsImage = async () => {
    const video = videoRef.current;
    if (!video) return;

    setCapturing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${title}_frame_${index + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        }
      }
    } catch (err: any) {
      console.error('[VideoPlayer] Capture frame download failed:', err?.message || String(err));
    } finally {
      setCapturing(false);
    }
  };

  // Safe image helper
  const getSafeImageUrl = (url: string) => {
    if (!url) return '';
    const lowercase = url.toLowerCase();
    if (
      lowercase.includes('cdninstagram') ||
      lowercase.includes('fbcdn') ||
      lowercase.includes('tiktokcdn') ||
      lowercase.includes('byteoversea') ||
      lowercase.includes('ibyteimg') ||
      lowercase.includes('twimg') ||
      lowercase.includes('instagram') ||
      lowercase.includes('threads.net')
    ) {
      return `/api/proxy-download?url=${encodeURIComponent(url)}&inline=true&type=image&name=preview`;
    }
    return url;
  };

  if (!isPlaying) {
    return (
      <div 
        onClick={() => setIsPlaying(true)}
        className="w-full h-full min-h-[180px] md:min-h-[160px] relative group cursor-pointer bg-slate-950 overflow-hidden flex items-center justify-center rounded-xl border border-slate-800/60"
      >
        {frameUrl ? (
          <img 
            src={getSafeImageUrl(frameUrl)} 
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover absolute inset-0 opacity-70 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-900/40" />
        )}
        
        {/* Play Icon overlay */}
        <div className="relative z-10 w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
          <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
        </div>
        
        <div className="absolute bottom-1.5 right-2 bg-slate-900/80 backdrop-blur-sm text-[9px] text-slate-300 font-bold px-2 py-0.5 rounded-md border border-slate-700/50">
          اضغط للتشغيل والمشاهدة
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group min-h-[180px] md:min-h-[160px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        src={proxiedUrl}
        crossOrigin="anonymous"
        autoPlay
        controls
        playsInline
        className="w-full h-full object-contain max-h-48"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Capture Frame Buttons Overlay */}
      {!loading && (
        <button
          onClick={downloadFrameAsImage}
          disabled={capturing}
          title="حفظ اللقطة الحالية كصورة"
          className="absolute top-2 left-2 bg-slate-900/95 hover:bg-indigo-600 border border-slate-700/80 hover:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 transition-all duration-150 shadow-md group/btn z-10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {capturing ? (
            <Loader2 className="w-3 animate-spin text-slate-300" />
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-115 text-indigo-400 group-hover/btn:text-white" />
              <span className="text-[10px] font-black font-sans tracking-wide">حفظ كصورة</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
