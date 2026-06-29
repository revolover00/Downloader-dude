import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Share2, 
  Copy, 
  Smartphone, 
  HelpCircle,
  Play,
  CheckCircle,
  Compass
} from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlatformKey = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'snapchat' | 'other';

interface Step {
  num: number;
  title: string;
  desc: string;
  icon: any;
}

export function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  const [activeTab, setActiveTab] = useState<PlatformKey>('tiktok');

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const tabs = [
    { id: 'tiktok' as PlatformKey, label: 'تيك توك', color: 'hover:text-[#FE2C55]', activeBg: 'bg-[#FE2C55]/10 border-[#FE2C55] text-[#FE2C55]' },
    { id: 'instagram' as PlatformKey, label: 'إنستغرام', color: 'hover:text-[#E1306C]', activeBg: 'bg-[#E1306C]/10 border-[#E1306C] text-[#E1306C]' },
    { id: 'youtube' as PlatformKey, label: 'يوتيوب', color: 'hover:text-[#FF0000]', activeBg: 'bg-[#FF0000]/10 border-[#FF0000] text-[#FF0000]' },
    { id: 'twitter' as PlatformKey, label: 'تويتر (X)', color: 'hover:text-[#000000]', activeBg: 'bg-white/10 border-white text-white' },
    { id: 'snapchat' as PlatformKey, label: 'سناب شات', color: 'hover:text-[#FFFC00]', activeBg: 'bg-[#FFFC00]/10 border-[#FFFC00] text-[#FFFC00]' },
    { id: 'other' as PlatformKey, label: 'منصات أخرى', color: 'hover:text-[#5E6AD2]', activeBg: 'bg-[#5E6AD2]/10 border-[#5E6AD2] text-[#5E6AD2]' },
  ];

  const stepsData: Record<PlatformKey, Step[]> = {
    tiktok: [
      {
        num: 1,
        title: 'افتح تطبيق تيك توك',
        desc: 'تصفح التطبيق واذهب إلى مقطع الفيديو الذي ترغب في تحميله بجودة عالية.',
        icon: Smartphone,
      },
      {
        num: 2,
        title: 'اضغط على زر المشاركة',
        desc: 'انقر على أيقونة "المشاركة" (أيقونة السهم المنحني) المتواجدة أسفل يمين الشاشة.',
        icon: Share2,
      },
      {
        num: 3,
        title: 'انسخ رابط المقطع',
        desc: 'اضغط على خيار "نسخ الرابط" (Copy Link). سيظهر لك إشعار بأنه تم نسخ الرابط للذاكرة المؤقتة.',
        icon: Copy,
      }
    ],
    instagram: [
      {
        num: 1,
        title: 'افتح منشور إنستغرام',
        desc: 'اذهب إلى مقطع الريلز (Reels)، الفيديو، البوست المتعدد، أو الصورة التي تود حفظها.',
        icon: Smartphone,
      },
      {
        num: 2,
        title: 'انقر أيقونة المشاركة',
        desc: 'انقر على زر "المشاركة" (أيقونة الطائرة الورقية أسفل المنشور) أو النقاط الثلاث في الأعلى.',
        icon: Share2,
      },
      {
        num: 3,
        title: 'انسخ الرابط بنجاح',
        desc: 'اضغط على زر "نسخ الرابط" (Copy Link) لحفظه مباشرة في الحافظة.',
        icon: Copy,
      }
    ],
    youtube: [
      {
        num: 1,
        title: 'اختر المقطع المطلوب',
        desc: 'افتح مقطع الفيديو التقليدي أو مقاطع يوتيوب شورتس (Shorts) على التطبيق أو الموقع.',
        icon: Smartphone,
      },
      {
        num: 2,
        title: 'اضغط زر المشاركة',
        desc: 'اضغط على خيار "مشاركة" (Share) الموجود مباشرة أسفل مشغل الفيديو.',
        icon: Share2,
      },
      {
        num: 3,
        title: 'نسخ الرابط للمقطع',
        desc: 'اختر "نسخ الرابط" (Copy Link) للحصول على رابط الفيديو المباشر.',
        icon: Copy,
      }
    ],
    twitter: [
      {
        num: 1,
        title: 'ابحث عن التغريدة',
        desc: 'توجه إلى التغريدة التي تحتوي على الفيديو أو الصورة المتحركة التي تود تنزيلها.',
        icon: Smartphone,
      },
      {
        num: 2,
        title: 'انقر على زر مشاركة التغريدة',
        desc: 'اضغط على أيقونة "المشاركة" (السهم المتجه للأعلى) أسفل التغريدة.',
        icon: Share2,
      },
      {
        num: 3,
        title: 'اضغط نسخ الرابط',
        desc: 'اختر "نسخ الرابط" (Copy Link) من القائمة المنسدلة للخيارات.',
        icon: Copy,
      }
    ],
    snapchat: [
      {
        num: 1,
        title: 'افتح منصة الأضواء أو القصة',
        desc: 'اذهب إلى مقطع السناب الذي تريد تنزيله في تطبيق سناب شات.',
        icon: Smartphone,
      },
      {
        num: 2,
        title: 'اضغط أيقونة الإرسال والمشاركة',
        desc: 'اضغط على زر المشاركة/السهم لإرسال المقطع أو مشاركته خارج التطبيق.',
        icon: Share2,
      },
      {
        num: 3,
        title: 'اختر نسخ الرابط',
        desc: 'اضغط على خيار "نسخ الرابط" (Copy Link) ليتم نسخه فوراً.',
        icon: Copy,
      }
    ],
    other: [
      {
        num: 1,
        title: 'انسخ أي رابط منشور مدعوم',
        desc: 'سواء كان من فيسبوك، بينتريست، أو ساوند كلاود، اذهب للمنشور أو الملف الصوتي.',
        icon: Smartphone,
      },
      {
        num: 2,
        title: 'ابحث عن زر المشاركة أو الخيارات',
        desc: 'اضغط على النقاط الثلاث أو زر المشاركة المعتاد في تلك المنصة.',
        icon: Share2,
      },
      {
        num: 3,
        title: 'انسخ الرابط والصقه هنا',
        desc: 'انسخ الرابط (Copy Link) ثم عد لموقعنا لاستخراج روابط التحميل المباشرة بسرعة فائقة.',
        icon: Copy,
      }
    ]
  };

  const getPlatformBrandColor = (platform: PlatformKey) => {
    switch (platform) {
      case 'tiktok': return '#FE2C55';
      case 'instagram': return '#E1306C';
      case 'youtube': return '#FF0000';
      case 'twitter': return '#ffffff';
      case 'snapchat': return '#FFFC00';
      default: return '#5E6AD2';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-2xl bg-[var(--color-surface)] border border-white/10 rounded-[var(--radius-xl)] shadow-[0_24px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]/20">
                  <HelpCircle className="w-5 h-5 text-[var(--color-primary)] animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">طريقة نسخ روابط التحميل 💡</h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">دليل سريع وبسيط لاستخراج روابط الفيديوهات والصور من جميع المنصات</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selection Tabs */}
            <div className="px-6 py-3 bg-black/30 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      isActive 
                        ? tab.activeBg 
                        : `bg-white/5 border-transparent text-[var(--color-text-secondary)] ${tab.color} hover:bg-white/10`
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Instruction Steps Body */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              <div className="space-y-4">
                {stepsData[activeTab].map((step, index) => {
                  const IconComponent = step.icon;
                  const brandColor = getPlatformBrandColor(activeTab);

                  return (
                    <motion.div
                      key={step.num}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="flex gap-4 p-4 rounded-[var(--radius-lg)] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                    >
                      {/* Step Number Badge */}
                      <div className="flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border transition-all"
                          style={{
                            borderColor: `${brandColor}40`,
                            backgroundColor: `${brandColor}10`,
                            color: brandColor,
                            boxShadow: `0 0 15px ${brandColor}10`
                          }}
                        >
                          {step.num}
                        </div>
                      </div>

                      {/* Step Text Contents */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                          {step.desc}
                        </p>
                      </div>

                      {/* Step Decorative Icon */}
                      <div className="ml-auto self-center opacity-20 group-hover:opacity-40 transition-opacity">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* General tips banner */}
              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 flex items-start gap-3 mt-4">
                <Compass className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">نصيحة ذهبية للتحميل السريع ⚡</h4>
                  <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                    تأكد دائماً أن الحساب الذي تنسخ منه الرابط ليس حساباً خاصاً (Private)، حيث أن خوادم التحميل تستطيع فقط الوصول للمنشورات العامة المتاحة للجميع.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer action */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[10px] font-mono text-[var(--color-text-secondary)] tracking-wider">
                DOWNLOADER DUDE © {new Date().getFullYear()}
              </span>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/90 transition-all cursor-pointer shadow-[0_8px_20px_rgba(94,106,210,0.3)] active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                فهمت، لنبدأ التحميل الآن!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
