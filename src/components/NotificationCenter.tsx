import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  Film,
  Trophy,
  Gift,
  AlertTriangle,
  Info,
  Sparkles,
  ExternalLink,
  X,
  Volume2,
} from 'lucide-react';
import {
  AppNotification,
  fetchNotifications,
  requestNotificationPermission,
  getNotificationPermission,
} from '../services/notifications';

interface NotificationCenterProps {
  onNavigate?: (page: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bmw_read_notifs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
    loadNotifications();

    // Check for new notifications periodically (every 60s)
    const interval = setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    localStorage.setItem('bmw_read_notifs', JSON.stringify(Array.from(allIds)));
  };

  const markAsRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    localStorage.setItem('bmw_read_notifs', JSON.stringify(Array.from(next)));
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film className="w-4 h-4 text-[#ff6b35]" />;
      case 'match':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'reward':
        return <Gift className="w-4 h-4 text-amber-400" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors cursor-pointer"
        title="BMW Cinema Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black bg-gradient-to-r from-red-600 to-[#ff6b35] text-white rounded-full ring-2 ring-[#0d0d0d] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#141416] border border-zinc-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff6b35]" />
              <h3 className="text-sm font-bold text-white tracking-wide">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#ff6b35]/20 text-[#ff6b35] rounded-full border border-[#ff6b35]/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Permission Prompt Banner if not granted */}
          {permission !== 'granted' && (
            <div className="bg-gradient-to-r from-[#ff6b35]/15 to-transparent p-3 border-b border-zinc-800/80 flex items-center justify-between gap-2">
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Enable Push Alerts</p>
                <p className="text-[10px] text-gray-400">Receive new movie releases and match kicks.</p>
              </div>
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-lg bg-[#ff6b35] hover:bg-[#e55a2b] text-black font-bold text-[11px] uppercase tracking-wider transition cursor-pointer flex-shrink-0"
              >
                Allow
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-xs">
                No notifications right now
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-3.5 transition text-left cursor-pointer hover:bg-zinc-800/50 ${
                      isRead ? 'bg-transparent opacity-75' : 'bg-zinc-800/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/60 flex-shrink-0 mt-0.5">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className={`text-xs font-bold truncate ${isRead ? 'text-gray-300' : 'text-white'}`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-gray-500 flex-shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-3">
                          {item.message}
                        </p>

                        {item.linkUrl && (
                          <a
                            href={item.linkUrl}
                            onClick={(e) => {
                              if (onNavigate && item.linkUrl && !item.linkUrl.startsWith('http')) {
                                e.preventDefault();
                                setIsOpen(false);
                                const page = item.linkUrl.replace('/', '').replace('.html', '');
                                onNavigate(page || 'home');
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ff6b35] hover:underline"
                          >
                            <span>Open details</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#0d0d0d] border-t border-zinc-800 text-center">
            <span className="text-[10px] text-gray-500">
              BMW CINEMA Push Delivery System
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
