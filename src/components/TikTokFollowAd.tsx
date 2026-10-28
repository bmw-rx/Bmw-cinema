import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles, Check } from 'lucide-react';

const TIKTOK_PROFILE_URL = 'https://www.tiktok.com/@gifthub68?_r=1&_t=ZS-9AwK1GA6Bgi';
const TIKTOK_HANDLE = '@gifthub68';
const STORAGE_KEY = 'bmw_tiktok_ad_dismissed';

export const TikTokFollowAd: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed === 'true') {
        return;
      }
    } catch (e) {
      // sessionStorage not accessible
    }

    // Show after exactly 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      // ignore
    }
  };

  const handleFollowClick = () => {
    setHasInteracted(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      // ignore
    }
    // Auto-hide after 3 seconds following click
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Follow us on TikTok"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96 animate-slide-up"
    >
      <div className="relative rounded-2xl bg-[#0f0f13]/95 backdrop-blur-xl border border-zinc-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(37,244,238,0.15)] p-4 sm:p-5 overflow-hidden transition-all">
        {/* Subtle decorative glowing accents (TikTok Cyan & Crimson) */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#25F4EE]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#FE2C55]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top bar with close button */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* TikTok Icon with Authentic Styling */}
            <div className="w-11 h-11 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner relative group">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* TikTok stylized musical note SVG with dual-tone shadow */}
                <path
                  d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.317 0 .62.052.903.147V9.432a6.335 6.335 0 0 0-.903-.065 6.336 6.336 0 0 0-6.335 6.335 6.336 6.336 0 0 0 6.335 6.335 6.336 6.336 0 0 0 6.335-6.335V8.594a8.163 8.163 0 0 0 4.96 1.666V6.815a4.79 4.79 0 0 1-1.2-.129z"
                  fill="#FE2C55"
                  transform="translate(0.6, 0.6)"
                  opacity="0.85"
                />
                <path
                  d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.317 0 .62.052.903.147V9.432a6.335 6.335 0 0 0-.903-.065 6.336 6.336 0 0 0-6.335 6.335 6.336 6.336 0 0 0 6.335 6.335 6.336 6.336 0 0 0 6.335-6.335V8.594a8.163 8.163 0 0 0 4.96 1.666V6.815a4.79 4.79 0 0 1-1.2-.129z"
                  fill="#25F4EE"
                  transform="translate(-0.6, -0.6)"
                  opacity="0.85"
                />
                <path
                  d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.317 0 .62.052.903.147V9.432a6.335 6.335 0 0 0-.903-.065 6.336 6.336 0 0 0-6.335 6.335 6.336 6.336 0 0 0 6.335 6.335 6.336 6.336 0 0 0 6.335-6.335V8.594a8.163 8.163 0 0 0 4.96 1.666V6.815a4.79 4.79 0 0 1-1.2-.129z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#25F4EE] bg-[#25F4EE]/10 border border-[#25F4EE]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  TikTok
                </span>
                <span className="text-[11px] text-gray-400 font-medium">BMW CINEMA</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 tracking-tight flex items-center gap-1">
                Tufuate TikTok <span className="text-[#FE2C55] font-extrabold">{TIKTOK_HANDLE}</span>
              </h4>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            title="Funga (Dismiss)"
            aria-label="Funga tangazo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <p className="relative mt-2 text-xs text-gray-300 leading-relaxed font-normal">
          Pata vipande vya kusisimua, taarifa za movies mpya na mikato mikali moja kwa moja kwenye TikTok!
        </p>

        {/* Actions */}
        <div className="relative mt-3.5 flex items-center gap-2">
          <a
            href={TIKTOK_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleFollowClick}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FE2C55] to-[#ff476d] hover:from-[#e01f46] hover:to-[#FE2C55] text-white font-extrabold text-xs tracking-wide shadow-lg shadow-[#FE2C55]/25 hover:shadow-[#FE2C55]/40 transition-all cursor-pointer"
          >
            {hasInteracted ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Asante! Imefunguliwa</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Follow {TIKTOK_HANDLE}</span>
              </>
            )}
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-2.5 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-zinc-800/80 transition-colors font-medium cursor-pointer"
          >
            Baadaye
          </button>
        </div>
      </div>
    </div>
  );
};
