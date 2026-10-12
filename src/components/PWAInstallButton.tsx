import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, PlusSquare, Monitor, CheckCircle, Sparkles } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'banner' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return 'ios';
      if (/android/.test(ua)) return 'android';
    }
    return 'android';
  });
  const [installing, setInstalling] = useState(false);

  // If already running inside standalone PWA mode, suppress install banner
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInstallable) {
      setInstalling(true);
      const success = await install();
      setInstalling(false);
      if (success) return;
    }

    // If native prompt is not directly available (e.g. iOS, Safari, iframe, or event already consumed)
    setShowGuideModal(true);
  };

  // -------------------------------------------------------------
  // VARIANT: BANNER (Prominent card on Home View or Mobile Menu)
  // -------------------------------------------------------------
  if (variant === 'banner') {
    return (
      <>
        <div className={`relative overflow-hidden bg-gradient-to-r from-[#18181b] via-[#141416] to-[#0d0d0d] border border-[#ff6b35]/40 rounded-2xl p-4 sm:p-5 shadow-2xl ${className}`}>
          {/* Subtle neon glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#ff6b35]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e63946] flex items-center justify-center text-black flex-shrink-0 shadow-lg shadow-[#ff6b35]/30">
                <Smartphone className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-white tracking-wide">
                    BMW CINEMA APP
                  </h4>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    PWA Fast
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 max-w-lg leading-relaxed">
                  Stream in full 4K, save data offline, and receive live match notifications directly on your home screen!
                </p>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#ff6b35]/25 flex-shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{installing ? 'Installing...' : 'Install App'}</span>
            </button>
          </div>
        </div>

        {/* Modal Guide */}
        {showGuideModal && renderModal()}
      </>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: NAV BUTTON (Always visible in Navbar on all screens)
  // -------------------------------------------------------------
  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={installing}
        title="Install BMW CINEMA App on your device"
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-extrabold text-xs uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-[#ff6b35]/20 cursor-pointer shrink-0 ${className}`}
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden xs:inline sm:inline">Install App</span>
        <span className="xs:hidden sm:hidden">App</span>
      </button>

      {showGuideModal && renderModal()}
    </>
  );

  // -------------------------------------------------------------
  // INSTALLATION GUIDE MODAL FOR ALL PLATFORMS
  // -------------------------------------------------------------
  function renderModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in text-left">
        <div className="w-full max-w-md rounded-3xl bg-[#141416] border border-zinc-800 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={() => setShowGuideModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#e63946] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#ff6b35]/30">
              ▶
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-wide">
                Install BMW CINEMA
              </h3>
              <p className="text-xs text-gray-400">
                Official Progressive Web App (PWA)
              </p>
            </div>
          </div>

          {/* Device Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0d0d0d] rounded-xl border border-zinc-800 mb-5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('android')}
              className={`py-2 rounded-lg transition cursor-pointer text-center ${
                activeTab === 'android'
                  ? 'bg-[#ff6b35] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Android
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`py-2 rounded-lg transition cursor-pointer text-center ${
                activeTab === 'ios'
                  ? 'bg-[#ff6b35] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              iPhone / iPad
            </button>
            <button
              onClick={() => setActiveTab('pc')}
              className={`py-2 rounded-lg transition cursor-pointer text-center ${
                activeTab === 'pc'
                  ? 'bg-[#ff6b35] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              PC / Mac
            </button>
          </div>

          {/* Tab 1: Android */}
          {activeTab === 'android' && (
            <div className="space-y-3.5 bg-[#0d0d0d] p-4 rounded-2xl border border-zinc-800 mb-6 text-xs text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  Tap the browser menu <strong className="text-white">⋮ (three dots)</strong> in the top-right corner of Chrome.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Tap <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home Screen"</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  Confirm by tapping <strong className="text-[#ff6b35]">Install</strong>. BMW Cinema icon will appear on your phone screen!
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: iPhone / iPad */}
          {activeTab === 'ios' && (
            <div className="space-y-3.5 bg-[#0d0d0d] p-4 rounded-2xl border border-zinc-800 mb-6 text-xs text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  In Safari, tap the <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline text-[#ff6b35]" /> Share</strong> icon at the bottom.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Scroll down the options and select <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline text-[#ff6b35]" /> Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  Tap <strong className="text-[#ff6b35]">Add</strong> in the top-right corner to finish.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: PC / Mac */}
          {activeTab === 'pc' && (
            <div className="space-y-3.5 bg-[#0d0d0d] p-4 rounded-2xl border border-zinc-800 mb-6 text-xs text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  Look at the right side of your Chrome/Edge address bar for the <strong className="text-white inline-flex items-center gap-1"><Download className="w-3.5 h-3.5 inline text-[#ff6b35]" /> Install App</strong> icon.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Or click <strong className="text-white">Settings (⋮) → Save and share → Install BMW CINEMA</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  Enjoy fullscreen desktop movie streaming without browser tabs!
                </div>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="space-y-2">
            {isInstallable && (
              <button
                onClick={async () => {
                  setInstalling(true);
                  await install();
                  setInstalling(false);
                  setShowGuideModal(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#ff6b35]/20"
              >
                <Download className="w-4 h-4" />
                <span>Launch Direct Install</span>
              </button>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white font-semibold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
};
