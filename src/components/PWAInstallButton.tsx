import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'banner' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already installed in standalone mode, do not show button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  // Chromium / Android / Desktop flow with beforeinstallprompt
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className={`bg-gradient-to-r from-[#ff6b35]/20 via-[#18181b] to-[#141416] border border-[#ff6b35]/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ff6b35]/20 border border-[#ff6b35]/40 flex items-center justify-center text-[#ff6b35] flex-shrink-0">
              <Download className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Install BMW CINEMA App</h4>
              <p className="text-xs text-gray-400">Stream faster, watch offline, and get match alerts directly on your home screen.</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={installing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-[#ff6b35]/20 flex-shrink-0 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            {installing ? 'Installing...' : 'Install App'}
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        disabled={installing}
        title="Install BMW CINEMA App on your device"
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-bold text-xs uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-[#ff6b35]/20 cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Install BMW Cinema on iPhone/iPad"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#ff6b35]/40 bg-[#ff6b35]/10 hover:bg-[#ff6b35]/20 text-[#ff6b35] font-semibold text-xs transition-colors cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#141416] border border-zinc-800 p-6 shadow-2xl relative text-left">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-[#ff6b35]/20 border border-[#ff6b35]/40 flex items-center justify-center text-[#ff6b35] mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Install BMW CINEMA on iOS</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Enjoy full-screen streaming, live scores, and instant notifications directly from your iPhone or iPad home screen:
              </p>

              <div className="space-y-3 bg-[#0d0d0d] p-3.5 rounded-xl border border-zinc-800 mb-5">
                <div className="flex items-start gap-3 text-xs text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    Tap the <strong className="text-white flex inline-flex items-center gap-1"><Share className="w-3 h-3 inline text-[#ff6b35]" /> Share</strong> icon in your Safari bottom toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Scroll down and tap <strong className="text-white flex inline-flex items-center gap-1"><PlusSquare className="w-3 h-3 inline text-[#ff6b35]" /> Add to Home Screen</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#ff6b35] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    Tap <strong className="text-white">Add</strong> in the top-right corner to finish.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#ff6b35] hover:bg-[#e55a2b] text-black font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers that don't trigger beforeinstallprompt yet or desktop
  return (
    <button
      onClick={() => {
        // Helpful tooltip / prompt
        alert('To install BMW CINEMA: Tap your browser menu (⋮ or share) and select "Install app" or "Add to Home Screen".');
      }}
      title="Install BMW CINEMA App"
      className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-gray-300 hover:text-white font-medium text-xs transition-colors cursor-pointer ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-[#ff6b35]" />
      <span>Install App</span>
    </button>
  );
};
