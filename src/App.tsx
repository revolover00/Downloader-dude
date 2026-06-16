import { AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { useMediaDownloader } from './hooks/useMediaDownloader';
import { Header } from './components/Header';
import { SearchInput } from './components/SearchInput';
import { ResultDetails } from './components/ResultDetails';
import { Footer } from './components/Footer';

export default function App() {
  const {
    url,
    setUrl,
    loading,
    error,
    data,
    downloadMedia,
    downloadSpotifyPlaylist,
    clearResult,
  } = useMediaDownloader();

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Brand Navigation Bar */}
      <nav className="h-20 border-b border-slate-900 flex items-center justify-between px-6 md:px-10 bg-[#09090b] z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </div>
          <span className="text-lg md:text-xl font-extrabold tracking-tight text-white">
            MediaSnap<span className="text-indigo-500 underline decoration-2 underline-offset-4">.pro</span>
          </span>
        </div>
        
        <div className="hidden sm:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#" className="text-white hover:text-white transition-colors">Downloader</a>
          <span className="w-1 h-1 rounded-full bg-slate-800"></span>
          <span className="text-slate-500 select-none cursor-default">Engine Stable</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </nav>

      <div className="relative flex-grow flex flex-col justify-center items-center overflow-hidden">
        {/* Glow Effect Ambient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] sm:h-[400px] bg-indigo-900/10 blur-[90px] sm:blur-[120px] rounded-full pointer-events-none"></div>

        <main className="w-full flex-grow flex flex-col justify-center py-6 md:py-10 z-10 w-full max-w-4xl mx-auto px-4">
          
          {/* Header Branding */}
          <Header />

          {/* Dynamic Downloader Input */}
          <SearchInput
            url={url}
            setUrl={setUrl}
            loading={loading}
            onSubmit={(u) => {
              if (u.includes('spotify.com')) {
                downloadSpotifyPlaylist(u);
              } else {
                downloadMedia(u);
              }
            }}
            onClear={() => {
              setUrl('');
              clearResult();
            }}
          />

          {/* Error State Presenter */}
          {error && (
            <div className="w-full max-w-2xl mx-auto px-4 mb-6">
              <div className="flex items-start gap-3 p-4.5 bg-red-950/15 border border-red-500/25 rounded-2xl text-red-200 animate-fade-in shadow-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-bold">Error Extracting Media:</span>{' '}
                  {error}
                  <p className="text-xs text-red-400/80 mt-1.5">
                    Ensure the source link is valid, completely public, and doesn't belong to private posts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success States - Extracted Result details */}
          {data && <ResultDetails data={data} />}

          {/* If no interactions yet, present some clean tips */}
          {!data && !loading && (
            <div className="w-full max-w-xl mx-auto px-4 mt-8">
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-slate-400 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider font-mono">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Interactive Tips Guide</span>
                </div>
                
                <ul className="text-xs space-y-3 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-indigo-400 font-bold">&#8226;</span>
                    <span><strong>TikTok:</strong> Extract video links, photo carousels, slideshows and original audio records.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-indigo-400 font-bold">&#8226;</span>
                    <span><strong>YouTube &amp; Shorts:</strong> Extract direct high-speed video options simply by pasting the sharing link.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-indigo-400 font-bold">&#8226;</span>
                    <span><strong>Socials:</strong> Supports Threads, Snapchat, and Twitter (X) formats organically.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Corporate aesthetic and terms footnote */}
      <Footer />
    </div>
  );
}
