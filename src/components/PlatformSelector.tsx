import { motion } from 'motion/react';
import { Video, Image as ImageIcon, Film, Music, Compass, Share2, Youtube } from 'lucide-react';

export interface PlatformOption {
  id: string;
  name: string;
  subtitle: string;
  icon: any;
  colorClass: string;
  glowColor: string;
}

interface PlatformSelectorProps {
  onSelect: (platformId: string) => void;
}

export const PLATFORMS_LIST: PlatformOption[] = [
  {
    id: 'instagram_reels',
    name: 'إنستغرام ريلز وفيديو',
    subtitle: 'تنزيل مقاطع الريلز والمنشورات المرئية بصيغة MP4 عالية الجودة',
    icon: Film,
    colorClass: 'from-pink-500/20 to-rose-500/10 border-rose-500/30 text-rose-400 hover:border-rose-500/60',
    glowColor: 'bg-rose-500/10',
  },
  {
    id: 'instagram_images',
    name: 'إنستغرام صور وبوستات',
    subtitle: 'تحميل الصور فقط، واستخراج أول إطار من الفيديو كصورة JPG كاملة الوضوح',
    icon: ImageIcon,
    colorClass: 'from-blue-500/20 to-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60',
    glowColor: 'bg-indigo-500/10',
  },
  {
    id: 'tiktok',
    name: 'تيك توك',
    subtitle: 'تنزيل الفيديوهات بدون علامات مائية وبجودة أصلية فائقة السرعة',
    icon: Music,
    colorClass: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-500/60',
    glowColor: 'bg-cyan-500/10',
  },
  {
    id: 'youtube',
    name: 'يوتيوب وشورتس',
    subtitle: 'استخراج وتنزيل مقاطع Shorts الفورية وفيديوهات يوتيوب المتنوعة',
    icon: Youtube,
    colorClass: 'from-red-500/20 to-amber-500/10 border-red-500/30 text-red-500 hover:border-red-500/60',
    glowColor: 'bg-red-500/10',
  },
  {
    id: 'other',
    name: 'الشبكات الأخرى',
    subtitle: 'دعم ذكي لمنصات تويتر (X)، فيسبوك، سناب شات، ساوند كلاود وغيرهم',
    icon: Share2,
    colorClass: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400 hover:border-purple-500/60',
    glowColor: 'bg-purple-500/10',
  }
];

export function PlatformSelector({ onSelect }: PlatformSelectorProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-2 mb-10" id="platform-selection-board">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-black text-white/90 mb-2">
          اختر نوع المحتوى لبدء التحميل والتحويل السريع
        </h2>
        <p className="text-slate-400 text-xs md:text-sm">
          انقر فوق أي منصة أدناه للذهاب مباشرة إلى صفحة المعالجة الذكية للمحتوى الخاص بك.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORMS_LIST.map((platform, idx) => {
          const IconComponent = platform.icon;
          return (
            <motion.button
              key={platform.id}
              onClick={() => onSelect(platform.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-5 rounded-2xl bg-slate-900/60 border text-right transition-all duration-200 cursor-pointer flex gap-4 items-start relative overflow-hidden group ${platform.colorClass}`}
            >
              {/* Decorative Subtle glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-xl opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none ${platform.glowColor}`} />

              <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center flex-shrink-0 relative z-10">
                <IconComponent className="w-6 h-6 transition-transform group-hover:scale-110" />
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5 justify-start">
                  <span className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                    {platform.name}
                  </span>
                  {platform.id === 'instagram_images' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-sans tracking-wide">
                      جديد ومطور
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-semibold">
                  {platform.subtitle}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
