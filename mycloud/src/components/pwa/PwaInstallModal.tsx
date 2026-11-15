import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  Download,
  Apple,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaInstallModal: React.FC = () => {
  const { showInstallModal, setShowInstallModal, isIOS, isAndroid, promptInstall, isStandalone } = usePwa();
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(isIOS ? 'ios' : 'android');

  if (!showInstallModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050806]/85 backdrop-blur-md animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#101210] border border-[#1c2820] rounded-3xl p-6 shadow-2xl relative text-[#f5f5f5] overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#2fd697] to-transparent opacity-60" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#13261e] border border-[#1b563f] flex items-center justify-center text-[#2fd697] shadow-lg shadow-[#2fd697]/10">
              <Smartphone className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f5f5f5] flex items-center gap-2">
                <span>Install MyCloud</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#13261e] text-[#2fd697] border border-[#1b563f]">
                  Web App
                </span>
              </h3>
              <p className="text-xs text-[#a0a6a3]">Fast, fullscreen native experience</p>
            </div>
          </div>

          <button
            onClick={() => setShowInstallModal(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#a0a6a3] hover:text-[#f5f5f5] hover:bg-[#13261e] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex p-1 rounded-xl bg-[#070a08] border border-[#1c2820] mb-5">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ios'
                ? 'bg-[#13261e] text-[#2fd697] border border-[#1b563f] shadow-sm'
                : 'text-[#8a948e] hover:text-[#f5f5f5]'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>Apple iOS (iPhone/iPad)</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'android'
                ? 'bg-[#13261e] text-[#2fd697] border border-[#1b563f] shadow-sm'
                : 'text-[#8a948e] hover:text-[#f5f5f5]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android / Chrome</span>
          </button>
        </div>

        {/* Tab 1: iOS Instructions */}
        {activeTab === 'ios' && (
          <div className="space-y-3.5 mb-6">
            <div className="p-3.5 rounded-2xl bg-[#0a0d0b] border border-[#1c2820] flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-[#13261e] text-[#2fd697] border border-[#1b563f] flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                1
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[#f5f5f5] mb-0.5">Open in Safari</p>
                <p className="text-[#a0a6a3]">
                  Make sure you are viewing this page in <strong className="text-[#f5f5f5]">Safari</strong> on your iPhone or iPad.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a0d0b] border border-[#1c2820] flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-[#13261e] text-[#2fd697] border border-[#1b563f] flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                2
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[#f5f5f5] mb-0.5 flex items-center gap-1.5">
                  <span>Tap the Share button</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1c2820] text-[#2fd697] font-mono text-[10px]">
                    [ ⎋ / Share ]
                  </span>
                </p>
                <p className="text-[#a0a6a3]">
                  Tap the square share icon with an arrow pointing up at the bottom of your Safari screen.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a0d0b] border border-[#1c2820] flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-[#13261e] text-[#2fd697] border border-[#1b563f] flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                3
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[#f5f5f5] mb-0.5 flex items-center gap-1.5">
                  <span>Select "Add to Home Screen"</span>
                  <PlusSquare className="w-3.5 h-3.5 text-[#2fd697]" />
                </p>
                <p className="text-[#a0a6a3]">
                  Scroll down the share sheet and tap <strong className="text-[#f5f5f5]">"Add to Home Screen"</strong>, then tap <strong className="text-[#2fd697]">"Add"</strong> in the top-right corner.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Instructions */}
        {activeTab === 'android' && (
          <div className="space-y-3.5 mb-6">
            <div className="p-3.5 rounded-2xl bg-[#0a0d0b] border border-[#1c2820] flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-[#13261e] text-[#2fd697] border border-[#1b563f] flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                1
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[#f5f5f5] mb-0.5">1-Click Install</p>
                <p className="text-[#a0a6a3]">
                  Tap the <strong className="text-[#2fd697]">"Install Now"</strong> button below to instantly trigger the native Android app installation prompt.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a0d0b] border border-[#1c2820] flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-[#13261e] text-[#2fd697] border border-[#1b563f] flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                2
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[#f5f5f5] mb-0.5">Or use Chrome Menu (⋮)</p>
                <p className="text-[#a0a6a3]">
                  If the prompt doesn't open automatically, tap the three dots <strong className="text-[#f5f5f5]">⋮</strong> in the top-right of Chrome, then select <strong className="text-[#2fd697]">"Install app"</strong> or <strong className="text-[#2fd697]">"Add to Home screen"</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="p-3.5 rounded-2xl bg-[#13261e]/50 border border-[#1b563f] mb-5">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#2fd697]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why install MyCloud?</span>
          </div>
          <ul className="text-[11px] text-[#a0a6a3] space-y-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#2fd697] shrink-0" />
              <span>Full screen standalone view without browser bars</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#2fd697] shrink-0" />
              <span>Quick 1-tap launch from your device's home screen</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#2fd697] shrink-0" />
              <span>Offline shell caching for fast loading speeds</span>
            </li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInstallModal(false)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-[#a0a6a3] hover:text-[#f5f5f5] hover:bg-[#13261e] transition-colors text-center"
          >
            Close
          </button>

          <button
            onClick={() => {
              promptInstall();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#2fd697] to-[#1eb57c] hover:from-[#28c287] hover:to-[#188f63] text-[#050806] shadow-lg shadow-[#2fd697]/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 stroke-[2.2]" />
            <span>Install Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallModal;
