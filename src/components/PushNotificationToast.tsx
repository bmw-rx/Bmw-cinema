import React, { useEffect, useState } from 'react';
import { AppNotification, NOTIFICATION_SOUND_URL, playNotificationSound } from '../services/notifications';
import { Smartphone, Volume2, X, ExternalLink, Film, Trophy, Gift, AlertTriangle, Sparkles } from 'lucide-react';

interface PushNotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notification,
  onClose,
  onNavigate,
}) => {
  const [visible, setVisible] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      setIsPlayingAudio(true);
      const audioTimer = setTimeout(() => setIsPlayingAudio(false), 3000);

      // Auto dismiss after 9 seconds
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, 9000);

      return () => {
        clearTimeout(audioTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setVisible(false);
    }
  }, [notification]);

  if (!notification || !visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleReplayRingtone = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    playNotificationSound().finally(() => {
      setTimeout(() => setIsPlayingAudio(false), 2000);
    });
  };

  const handleAction = () => {
    if (notification.linkUrl && onNavigate) {
      const page = notification.linkUrl.replace('/', '').replace('.html', '');
      onNavigate(page || 'home');
    }
    handleDismiss();
  };

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'movie':
        return <Film className="w-4 h-4 text-[#ff6b35]" />;
      case 'match':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'reward':
        return <Gift className="w-4 h-4 text-amber-400" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#ff6b35]" />;
    }
  };

  return (
    <div
      role="alert"
      className="fixed top-3 sm:top-5 left-1/2 transform -translate-x-1/2 z-[100] w-[92%] sm:w-[460px] max-w-lg transition-all duration-300 ease-out animate-bounce-short"
    >
      <div className="relative overflow-hidden bg-[#18181b]/95 backdrop-blur-xl border border-[#ff6b35]/50 rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-black/80 text-left">
        {/* Neon accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff6b35] via-amber-400 to-[#ff6b35]" />

        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#ff6b35]/40 flex items-center justify-center shadow-md">
              {getTypeIcon()}
            </div>
            {/* Phone Push Indicator dot */}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ff6b35] border-2 border-[#18181b] animate-ping" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ff6b35]">
                BMW CINEMA
              </span>
              <span className="text-gray-500 text-[10px]">·</span>
              <span className="text-gray-400 text-[10px]">Just now</span>
              {isPlayingAudio && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded-full border border-amber-400/20 animate-pulse">
                  <Volume2 className="w-2.5 h-2.5" />
                  Ringing
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {notification.title}
            </h4>
            <p className="text-xs text-gray-300 line-clamp-2 mt-0.5 leading-snug">
              {notification.message}
            </p>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={handleAction}
                className="px-3 py-1 rounded-lg bg-[#ff6b35] hover:bg-[#e55a2b] text-black font-extrabold text-[11px] uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <span>View Now</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <button
                onClick={handleReplayRingtone}
                title="Replay notification sound"
                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3 h-3 text-[#ff6b35]" />
                <span className="hidden sm:inline">Ringtone</span>
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
