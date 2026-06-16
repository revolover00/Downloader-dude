import { Shield, Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full text-center py-10 border-t border-slate-850 mt-auto bg-[#09090b] z-10">
      <div className="max-w-2xl mx-auto px-4 space-y-5">
        
        {/* Security / Privacy details */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>No Registration Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-600" />
            <span>Fully Private Sessions</span>
          </div>
        </div>

        <p className="text-[11px] md:text-xs text-slate-600 max-w-lg mx-auto leading-relaxed font-sans">
          Disclaimer: This system is designed for archiving public media files for offline viewings, educational purposes and personal convenience. Respect original author copyrights and avoid commercial redistribution.
        </p>

        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono pt-2">
          &copy; {new Date().getFullYear()} MediaSnap Pro &bull; Stable Engine 100% Online
        </div>
      </div>
    </footer>
  );
}
