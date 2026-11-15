import React from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaInstallBanner: React.FC = () => {
  const { showBanner, isStandalone, promptInstall, dismissBanner } = usePwa();

  if (!showBanner || isStandalone) return null;

  return (
    <aside
      aria-label="Install App Banner"
      className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 lg:hidden animate-slide-up"
    >
      <div className="bg-[#101210]/95 backdrop-blur-2xl border border-[#2fd697]/40 rounded-2xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3 text-[#f5f5f5]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#13261e] border border-[#1b563f] flex items-center justify-center text-[#2fd697] shrink-0 shadow-sm">
            <Smartphone className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#f5f5f5] flex items-center gap-1.5">
              <span>Install MyCloud</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#13261e] text-[#2fd697] border border-[#1b563f] font-mono">
                App
              </span>
            </h4>
            <p className="text-[11px] text-[#a0a6a3] truncate">
              Install for faster, full-screen access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={promptInstall}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2fd697] to-[#1eb57c] hover:from-[#28c287] hover:to-[#188f63] text-[#050806] text-xs font-bold shadow-md shadow-[#2fd697]/20 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>
          <button
            onClick={dismissBanner}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a948e] hover:text-[#f5f5f5] hover:bg-[#13261e] transition-colors"
            title="Dismiss"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default PwaInstallBanner;
