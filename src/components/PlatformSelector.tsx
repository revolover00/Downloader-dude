import { motion } from 'motion/react';

// Original colored brand SVGs for professional, high-fidelity appearance
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="instagram-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="100%" stopColor="#285AEB" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#instagram-grad)"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="url(#instagram-grad)"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="url(#instagram-grad)"></line>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" strokeWidth="2">
    <path d="M12 2v14a3 3 0 1 1-3-3" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 2v14a3 3 0 1 1-3-3" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 2v14a3 3 0 1 1-3-3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 2a5 5 0 0 0 5 5" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M12 2a5 5 0 0 0 5 5" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 2a5 5 0 0 0 5 5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FF0000">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.03 0 12 0 12s0 3.97.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.555a3.003 3.003 0 0 0 2.11-2.108C24 15.97 24 12 24 12s0-3.97-.502-5.837z" />
    <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF" />
  </svg>
);

const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FFFFFF">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FFFC00">
    <path 
      fill="#FFFC00" 
      d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12s5.373 12 12 12 12-5.373 12-12z" 
    />
    <path 
      fill="#FFFFFF" 
      stroke="#000000" 
      strokeWidth="1.2" 
      strokeLinejoin="round" 
      d="M12 6.5c-1.85 0-3.3 1.1-3.3 3 0 .47.11.9.31 1.28-.42.17-.71.55-.71 1.02 0 .61.47.96.96.96.17 0 .32-.04.46-.1.19.78.69 1.42 1.38 1.8-.41.36-.68.96-.68 1.47 0 .86.68 1.59 1.59 1.87-.13.16-.18.36-.18.52 0 .5.43.91.91.91.17 0 .35-.05.49-.13.51.41 1.14.59 1.74.59.6 0 1.23-.18 1.74-.59.14.08.32.13.49.13.48 0 .91-.41.91-.91 0-.16-.05-.36-.18-.52.91-.28 1.59-1.01 1.59-1.87 0-.51-.27-1.11-.68-1.47.69-.38 1.19-1.02 1.38-1.8.14.06.29.1.46.1.49 0 .96-.35.96-.96 0-.47-.29-.85-.71-1.02.2-.38.31-.81.31-1.28 0-1.9-1.45-3-3.3-3z" 
    />
  </svg>
);

const SoundCloudIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FF5500">
    <path d="M11.5 15.5h1.25V9.75c-.32-.23-.65-.45-1-.62c-.08-.05-.17-.11-.25-.16v6.53zm-1.75 0h1V10.1c-.08-.05-.16-.1-.24-.15c-.25-.15-.51-.31-.76-.44v6zM8 15.5h1V11c-.32-.2-.64-.42-.96-.61c-.01-.01-.03-.02-.04-.02v5.13zm-1.75 0h1v-4.59c-.27-.19-.55-.38-.82-.55c-.06-.04-.12-.08-.18-.12v5.26zm-1.75 0h1v-4.66c-.19-.13-.37-.28-.56-.41c-.14-.1-.29-.21-.44-.31v5.38zm-1.75 0h1v-4.62c-.11-.1-.23-.19-.34-.29c-.22-.19-.44-.36-.66-.51v5.42zm-1.25 0h.5v-4.21c-.08-.07-.15-.14-.23-.21c-.09-.08-.18-.17-.27-.25v4.67zM1 15.5h.25V12c-.05-.05-.1-.11-.15-.16c-.03-.03-.07-.07-.1-.1v3.76zM13.5 15.5H21a2.5 2.5 0 0 0 .5-4.95a3.5 3.5 0 0 0-6.95-.55a2.5 2.5 0 0 0-1.05 4.5z" />
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#E60023">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.41 7.63 11.14c-.1-.95-.19-2.4.04-3.43c.21-.92 1.34-5.69 1.34-5.69s-.34-.68-.34-1.68c0-1.58.91-2.75 2.05-2.75c.97 0 1.43.73 1.43 1.6c0 .97-.62 2.43-.94 3.78c-.27 1.13.56 2.05 1.68 2.05c2.01 0 3.56-2.12 3.56-5.18c0-2.71-1.95-4.6-4.72-4.6c-3.22 0-5.1 2.41-5.1 4.9c0 .97.37 2.02.84 2.59c.09.11.1.2.08.3c-.08.35-.27 1.11-.31 1.27c-.05.21-.17.25-.39.15c-1.44-.67-2.33-2.77-2.33-4.46c0-3.63 2.64-6.97 7.61-6.97c4 0 7.11 2.85 7.11 6.66c0 3.97-2.5 7.17-5.97 7.17c-1.17 0-2.26-.61-2.64-1.33c0 0-.58 2.2-.72 2.74c-.26 1-1 2.25-1.49 3.03C10.02 23.82 11 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z" />
  </svg>
);

export interface PlatformOption {
  id: string;
  name: string;
  subtitle: string;
  icon: any;
  colorClass: string;
}

interface PlatformSelectorProps {
  onSelect: (platformId: string) => void;
}

export const PLATFORMS_LIST: PlatformOption[] = [
  { id: 'instagram', name: 'إنستغرام', subtitle: 'الريلز، الفيديوهات، والصور', icon: InstagramIcon, colorClass: 'hover:border-pink-500/50 hover:text-pink-400' },
  { id: 'tiktok', name: 'تيك توك', subtitle: 'فيديوهات بدون علامات مائية', icon: TikTokIcon, colorClass: 'hover:border-cyan-500/50 hover:text-cyan-400' },
  { id: 'youtube', name: 'يوتيوب', subtitle: 'فيديوهات يوتيوب و Shorts', icon: YouTubeIcon, colorClass: 'hover:border-red-500/50 hover:text-red-500' },
  { id: 'twitter', name: 'تويتر (X)', subtitle: 'فيديوهات ومنشورات', icon: TwitterXIcon, colorClass: 'hover:border-slate-400/50 hover:text-slate-200' },
  { id: 'facebook', name: 'فيسبوك', subtitle: 'فيديوهات فيسبوك', icon: FacebookIcon, colorClass: 'hover:border-blue-500/50 hover:text-blue-400' },
  { id: 'snapchat', name: 'سناب شات', subtitle: 'مقاطع سناب شات', icon: SnapchatIcon, colorClass: 'hover:border-yellow-500/50 hover:text-yellow-400' },
  { id: 'soundcloud', name: 'ساوند كلاود', subtitle: 'مقاطع الصوت', icon: SoundCloudIcon, colorClass: 'hover:border-orange-500/50 hover:text-orange-400' },
  { id: 'pinterest', name: 'بينتريست', subtitle: 'الصور والفيديوهات', icon: PinterestIcon, colorClass: 'hover:border-red-600/50 hover:text-red-400' },
];

export function PlatformSelector({ onSelect }: PlatformSelectorProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 mb-16" id="platform-selection-board">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)] mb-4">
          اختر منصة التحميل
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm max-w-lg mx-auto">
          اختر المنصة التي تود تنزيل المحتوى منها، وسنبدأ المعالجة فوراً بجودة عالية.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {PLATFORMS_LIST.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <motion.button
              key={platform.id}
              onClick={() => onSelect(platform.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-white/5 text-right transition-all duration-300 group ${platform.colorClass}`}
              aria-label={`تنزيل من ${platform.name}`}
            >
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-white/5 flex items-center justify-center mb-4 transition-colors group-hover:bg-white/10">
                <IconComponent className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
                {platform.name}
              </h3>
              <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">
                {platform.subtitle}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
