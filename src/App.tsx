import { useState, useEffect } from 'react';
import { AlertTriangle, ArrowLeft, HelpCircle } from 'lucide-react';
import { useMediaDownloader } from './hooks/useMediaDownloader';
import { Header } from './components/Header';
import { DownloadResult } from './components/DownloadResult';
import { Footer } from './components/Footer';
import { PlatformSelector } from './components/PlatformSelector';
import { SearchInput } from './components/SearchInput';
import { InstructionsModal } from './components/InstructionsModal';
import { PLATFORM_DETAILS } from './constants/platformConfig';

export default function App() {
  const { url, setUrl, loading, error, data, downloadMedia, clearResult } = useMediaDownloader();
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('downloaderdude_instructions_seen');
    if (!hasSeen) {
      setShowInstructions(true);
      localStorage.setItem('downloaderdude_instructions_seen', 'true');
    }
  }, []);

  const currentPlatform = (PLATFORM_DETAILS as any)[selectedPlatformId || 'default'] || PLATFORM_DETAILS.default;

  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatformId(platformId);
    setUrl('');
    clearResult();
  };

  const handleReset = () => {
    setSelectedPlatformId(null);
    setUrl('');
    clearResult();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col font-sans">
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 z-20">
        <button onClick={handleReset} className="text-lg font-extrabold cursor-pointer">
          Downloader<span className="text-[var(--color-primary)]"> dude</span>
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowInstructions(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold cursor-pointer hover:bg-indigo-500/20 transition-all shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            طريقة الاستخدام
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {selectedPlatformId === null ? (
          <>
            <Header />
            <PlatformSelector onSelect={handleSelectPlatform} />
          </>
        ) : (
          <div className="animate-slide-up w-full max-w-2xl text-center">
            <button onClick={handleReset} className="mb-8 flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              <ArrowLeft className="w-4 h-4" /> تغيير المنصة
            </button>
            <h1 className="text-3xl font-extrabold mb-4">{currentPlatform.title}</h1>
            <p className="text-[var(--color-text-secondary)] mb-8">{currentPlatform.desc}</p>
            
            <SearchInput
              url={url}
              setUrl={setUrl}
              loading={loading}
              placeholder={currentPlatform.placeholder}
              onSubmit={downloadMedia}
              onClear={() => { setUrl(''); clearResult(); }}
            />

            {error && (
              <div className="mt-6 p-4 rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {data && <DownloadResult data={data} selectedPlatformId={selectedPlatformId} />}
          </div>
        )}
      </main>
      <Footer />
      <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />
    </div>
  );
}
