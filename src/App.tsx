import { useState } from 'react';
import { AlertTriangle, Info, ArrowRight, ArrowLeft, RefreshCw, Undo2 } from 'lucide-react';
import { useMediaDownloader } from './hooks/useMediaDownloader';
import { Header } from './components/Header';
import { SearchInput } from './components/SearchInput';
import { DownloadResult } from './components/DownloadResult';
import { Footer } from './components/Footer';
import { PlatformSelector } from './components/PlatformSelector';

export default function App() {
  const {
    url,
    setUrl,
    loading,
    error,
    data,
    downloadMedia,
    clearResult,
  } = useMediaDownloader();

  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);

  const getPlatformDetails = () => {
    switch (selectedPlatformId) {
      case 'instagram_reels':
        return {
          title: 'تحميل مقاطع إنستغرام ريلز وفيديو',
          desc: 'ألصق رابط فيديو إنستغرام أو مقطع Reels وسنقوم باستخراجه لك بجودة فائقة فورياً وبأفضل جودة ممكنة.',
          placeholder: 'أدخل رابط ريلز أو فيديو إنستغرام هنا (مثال: https://www.instagram.com/reel/...)'
        };
      case 'instagram_images':
        return {
          title: 'إنستغرام صور وبوستات',
          desc: 'ألصق أي منشور إنستغرام وسنقوم باستخراج كافة الصور وصنع صور فائقة الجودة من مقاطع الفيديو المشمولة تلقائياً.',
          placeholder: 'أدخل رابط صور أو بوستات إنستغرام هنا (سيتم فلترة وتوفير صور فقط!)'
        };
      case 'tiktok':
        return {
          title: 'تنزيل فيديوهات تيك توك',
          desc: 'حمّل أي فيديو تيك توك بدون العلامة المائية للشركة فورياً وبسرعة تدفق عالية.',
          placeholder: 'أدخل رابط فيديو تيك توك هنا (مثال: https://vm.tiktok.com/...)'
        };
      case 'youtube':
        return {
          title: 'تحميل يوتيوب وشورتس (Shorts)',
          desc: 'استخرج روابط تنزيل المقاطع الصوتية ومقاطع يوتيوب وشورتس المفضلة لديك بالصيغ المتاحة.',
          placeholder: 'أدخل رابط فيديو يوتيوب أو شورتس (مثال: https://youtube.com/shorts/...)'
        };
      case 'other':
      default:
        return {
          title: 'التحميل الذكي המאוחד - الموحد',
          desc: 'ألصق رابط المنشور من تويتر (X)، فيسبوك، سناب شات، ساوند كلاود وغيرهم للتحميل المباشر والسريع.',
          placeholder: 'أدخل رابط المنشور من أي منصة اجتماعية مدعومة هنا...'
        };
    }
  };

  const currentPlatform = getPlatformDetails();

  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatformId(platformId);
    // Clear input and current data when changing platforms
    setUrl('');
    clearResult();
  };

  const handleReset = () => {
    setSelectedPlatformId(null);
    setUrl('');
    clearResult();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Brand Navigation Bar */}
      <nav className="h-20 border-b border-slate-900 flex items-center justify-between px-6 md:px-10 bg-[#09090b] z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/30 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </button>
          <span 
            onClick={handleReset}
            className="text-lg md:text-xl font-extrabold tracking-tight text-white cursor-pointer select-none"
          >
            MediaSnap<span className="text-indigo-500 underline decoration-2 underline-offset-4">.pro</span>
          </span>
        </div>
        
        <div className="hidden sm:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <button 
            onClick={handleReset}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            الصفحة الرئيسية
          </button>
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
          
          {selectedPlatformId === null ? (
            <>
              {/* Onboarding Welcome Screen */}
              <Header />
              <PlatformSelector onSelect={handleSelectPlatform} />
            </>
          ) : (
            <div className="animate-fade-in w-full text-center">
              
              {/* Specialized Back Arrow to choose other social media */}
              <div className="flex justify-start mb-6 px-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>تغيير الخدمة / منصة أخرى</span>
                </button>
              </div>

              {/* Dynamic Header Information per service */}
              <header className="text-center py-4 md:py-8 max-w-3xl mx-auto px-4 mb-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-950/40 border border-indigo-500/20 rounded-full mb-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-indigo-300 tracking-wider uppercase">
                    وضع التحميل: {selectedPlatformId === 'instagram_images' ? 'فقط صور وبوستات' : 'متعدد الصيغ'}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4.5xl font-extrabold text-white mb-3 tracking-tight leading-none bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                  {currentPlatform.title}
                </h1>
                
                <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-semibold">
                  {currentPlatform.desc}
                </p>
              </header>

              {/* Dynamic Downloader Input with Service-Matched Placeholder */}
              <SearchInput
                url={url}
                setUrl={setUrl}
                loading={loading}
                placeholder={currentPlatform.placeholder}
                onSubmit={(u) => {
                  downloadMedia(u);
                }}
                onClear={() => {
                  setUrl('');
                  clearResult();
                }}
              />

              {/* Error State Presenter */}
              {error && (
                <div className="w-full max-w-2xl mx-auto px-4 mb-6">
                  <div className="flex items-start gap-3 p-4.5 bg-red-950/15 border border-red-500/25 rounded-2xl text-red-200 animate-fade-in shadow-xl text-right" dir="rtl">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-bold">فشل استخراج الوسائط:</span>{' '}
                      {error}
                      <p className="text-xs text-red-400/80 mt-1.5">
                        تأكد من أن الرابط صالح وعام، ولا ينتمي لحسابات خاصة أو مقفلة.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success States - Extracted Result details with targeted forceImagesOnly mode */}
              {data && (
                <DownloadResult 
                  data={data} 
                  selectedPlatformId={selectedPlatformId}
                />
              )}

              {/* If no interactions yet on this specialized downloader page, present clean tips */}
              {!data && !loading && (
                <div className="w-full max-w-xl mx-auto px-4 mt-6">
                  <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-slate-400 space-y-3 shadow-xl text-right" dir="rtl">
                    <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider justify-end">
                      <span>إرشادات التنزيل من هذه المنصة</span>
                      <Info className="w-4 h-4 text-indigo-400" />
                    </div>
                    
                    <ul className="text-xs space-y-2 leading-relaxed">
                      {selectedPlatformId === 'instagram_images' ? (
                        <>
                          <li className="flex items-start gap-2 justify-end">
                            <span>قم بنسخ رابط المنشور (الصورة أو الفيديو) من إنستغرام وإلصاقه في الحقل أعلاه.</span>
                            <span className="text-indigo-400 font-bold">&#8226;</span>
                          </li>
                          <li className="flex items-start gap-2 justify-end">
                            <span>إذا كان المنشور يحتوي على فيديو، فسيقوم محركنا تلقائيًا باستخراج الإطار الأول وتحميله لك كصورة JPG نظيفة بجودة ممتازة.</span>
                            <span className="text-indigo-400 font-bold">&#8226;</span>
                          </li>
                          <li className="flex items-start gap-2 justify-end">
                            <span>جميع العناصر ستظهر كـ "صور" فقط لمنع حدوث أي تشتيت ولتبسيط الحفظ.</span>
                            <span className="text-indigo-400 font-bold">&#8226;</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-2 justify-end">
                            <span>قم بنسخ الرابط مباشرة من تطبيق الهاتف أو المتصفح.</span>
                            <span className="text-indigo-400 font-bold">&#8226;</span>
                          </li>
                          <li className="flex items-start gap-2 justify-end">
                            <span>اضغط على زر "Fetch Links" بعد اللصق لبدء البحث المتقدم.</span>
                            <span className="text-indigo-400 font-bold">&#8226;</span>
                          </li>
                          <li className="flex items-start gap-2 justify-end">
                            <span>ستظهر خيارات التنزيل المباشر فور انتهاء الفحص الفني للرابط.</span>
                            <span className="text-indigo-400 font-bold">&#8226;</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Corporate aesthetic and terms footnote */}
      <Footer />
    </div>
  );
}
