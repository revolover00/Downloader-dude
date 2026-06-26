import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  index: number;
}

export function VideoPlayer({ src, title = 'download', index }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(true);

  // We proxy the video with inline=true to bypass CORS so canvas extraction of the frame succeeds
  const proxiedUrl = `/api/proxy-download?url=${encodeURIComponent(src)}&inline=true&type=video&format=mp4`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setLoading(false);
      // Wait a moment for the first frame to render, then draw the poster
      setTimeout(captureFirstFrame, 800);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [src]);

  const captureFirstFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFrameUrl(dataUrl);
      }
    } catch (err: any) {
      console.warn('[VideoPlayer] Browser CORS or canvas taint blocked frame capture:', err?.message || String(err));
    }
  };

  const downloadFrameAsImage = async () => {
    const video = videoRef.current;
    if (!video) return;

    setCapturing(true);
    try {
      const originalTime = video.currentTime;
      
      // Seek to t=0.1 to get a clean frame in case t=0 is black
      video.currentTime = 0.1;

      // Wait brief moment for seek to complete
      await new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve(true);
        };
        video.addEventListener('seeked', onSeeked);
        setTimeout(resolve, 500); // Fail-safe
      });

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

      // Restore original time
      video.currentTime = originalTime;
    } catch (err: any) {
      console.error('[VideoPlayer] Capture frame download failed:', err?.message || String(err));
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="w-full h-full relative group">
      {/* Video Object with #t=0.1 to naturally force rendering frame 1 */}
      <video
        ref={videoRef}
        src={`${proxiedUrl}#t=0.1`}
        crossOrigin="anonymous"
        preload="metadata"
        controls
        playsInline
        poster={frameUrl || undefined}
        className="w-full h-full object-contain max-h-48"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Capture Frame Buttons Overlay */}
      {!loading && (
        <button
          onClick={downloadFrameAsImage}
          disabled={capturing}
          title="حفظ أول لقطة كصورة"
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
