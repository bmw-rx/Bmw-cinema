import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Users,
  BellRing,
  Send,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Mail,
  UserCheck,
  Calendar,
  Gift,
  ArrowRight,
  Trash2,
  Sparkles,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Smartphone,
  Check,
  Volume2,
  Film,
  Eye,
  Plus,
  Play,
  X,
  Video,
  Copy,
  Clock,
  Layers,
  Share2,
  Settings,
  Sliders,
  Repeat,
  Tv,
  VolumeX,
} from 'lucide-react';
import { UserProfileData } from '../services/auth';
import {
  AppNotification,
  getAllRegisteredUsers,
  fetchNotifications,
  sendPushNotification,
  deleteNotification,
  showBrowserNotification,
  showPhoneNotification,
  playNotificationSound,
  vibrateDevice,
  NOTIFICATION_SOUND_URL,
} from '../services/notifications';
import {
  getAdultEndpoint,
  saveAdultEndpoint,
  fetchAdultVideos,
  AdultVideoItem,
  addCustomAdultVideo,
  getCustomAdultVideos,
  deleteCustomAdultVideo,
} from '../services/adultService';

interface AdminPanelProps {
  onBackToHome: () => void;
  onNavigateToMovie?: (id: number) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToHome, onNavigateToMovie }) => {
  // Authentication gate: Password is strictly 3006
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bmw_admin_auth') === '3006';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'push' | 'logs' | 'endpoint'>('users');

  // Adult Endpoint state
  const [adultEndpoint, setAdultEndpoint] = useState('');
  const [savingEndpoint, setSavingEndpoint] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Custom Adult Videos & Views state
  const [customAdultVideos, setCustomAdultVideos] = useState<AdultVideoItem[]>([]);
  const [loadingCustomVideos, setLoadingCustomVideos] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);
  const [addStatus, setAddStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');
  const [newDuration, setNewDuration] = useState('10:00');
  const [newQuality, setNewQuality] = useState('1080p Full HD');
  const [previewVideo, setPreviewVideo] = useState<AdultVideoItem | null>(null);
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [previewSpeed, setPreviewSpeed] = useState<number>(1.0);
  const [previewLoop, setPreviewLoop] = useState<boolean>(false);
  const [previewFit, setVideoFit] = useState<'contain' | 'cover'>('contain');
  const [showPreviewSettings, setShowPreviewSettings] = useState<boolean>(false);

  // Users data
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'push_enabled' | 'vip'>('all');

  // Push notifications state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'general' | 'movie' | 'match' | 'reward' | 'urgent'>('movie');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [targetEmail, setTargetEmail] = useState('');
  const [linkUrl, setLinkUrl] = useState('/movies.html');
  const [sending, setSending] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Notifications history
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Verify PIN 3006
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === '3006') {
      setIsAuthenticated(true);
      sessionStorage.setItem('bmw_admin_auth', '3006');
      setAuthError('');
      setPasscode('');
    } else {
      setAuthError('Access Denied: Invalid Security PIN.');
      setPasscode('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bmw_admin_auth');
    setIsAuthenticated(false);
  };

  // Load registered users, notification history, custom adult videos, and adult endpoint once unlocked
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
      loadNotificationLogs();
      loadEndpoint();
      loadCustomAdultVideos();
    }
  }, [isAuthenticated]);

  const loadCustomAdultVideos = async () => {
    setLoadingCustomVideos(true);
    const list = await getCustomAdultVideos();
    setCustomAdultVideos(list);
    setLoadingCustomVideos(false);
  };

  const handleAddCustomVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim() || !newThumbnail.trim()) {
      setAddStatus({ success: false, message: 'Please provide both the video link and thumbnail link.' });
      return;
    }
    setAddingVideo(true);
    setAddStatus(null);
    try {
      const added = await addCustomAdultVideo({
        title: newTitle.trim() || 'Exclusive Feature',
        videoUrl: newVideoUrl.trim(),
        thumbnail: newThumbnail.trim(),
        duration: newDuration.trim() || '10:00',
        quality: newQuality.trim() || '1080p Full HD',
      });
      setCustomAdultVideos((prev) => [added, ...prev]);
      setAddStatus({ success: true, message: 'Video published successfully to Adult Cinema!' });
      setNewTitle('');
      setNewVideoUrl('');
      setNewThumbnail('');
      setNewDuration('10:00');
      setTimeout(() => setAddStatus(null), 5000);
    } catch (err: any) {
      setAddStatus({ success: false, message: err?.message || 'Failed to add video.' });
    } finally {
      setAddingVideo(false);
    }
  };

  const handleDeleteCustomVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    await deleteCustomAdultVideo(videoId);
    setCustomAdultVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  /**
   * Generates protected website player URL
   * NEVER shares the raw uploaded media / storage URL directly
   */
  const getWebsiteVideoShareUrl = (videoId: string) => {
    const origin = window.location.origin;
    return `${origin}/?page=adult&v=${encodeURIComponent(videoId)}`;
  };

  const handleCopyVideoLink = async (video: AdultVideoItem) => {
    try {
      const shareUrl = getWebsiteVideoShareUrl(video.id);
      await navigator.clipboard.writeText(shareUrl);
      setCopiedVideoId(video.id);
      setShareNotice(`Link ya video ya kushare imenakiliwa! Mtazamaji atapelekwa moja kwa moja kwenye video hii na video player yenye stream settings (link ya faili uliloupload haitotolewa).`);
      setTimeout(() => {
        setCopiedVideoId(null);
        setShareNotice(null);
      }, 4500);
    } catch (e) {
      // ignore
    }
  };

  const handleShareVideoDirect = async (video: AdultVideoItem) => {
    const shareUrl = getWebsiteVideoShareUrl(video.id);
    const shareData = {
      title: `${video.title} - BMW CINEMA`,
      text: `Tazama "${video.title}" kwenye BMW CINEMA:`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareNotice('Link ya video imeshirikiwa kwa mafanikio!');
        setTimeout(() => setShareNotice(null), 3000);
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    handleCopyVideoLink(video);
  };

  const loadEndpoint = async () => {
    const ep = await getAdultEndpoint();
    setAdultEndpoint(ep);
  };

  const handleSaveEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEndpoint(true);
    setEndpointStatus(null);
    let clean = adultEndpoint.trim();
    if (clean.includes('apis.davidcyril.name.ng')) {
      clean = clean.replace(/apis\.davidcyril\.name\.ng/g, 'apis.davidcyriltech.my.id');
      setAdultEndpoint(clean);
    }
    await saveAdultEndpoint(clean);
    setSavingEndpoint(false);
    setEndpointStatus('Endpoint saved and synchronized successfully!');
    setTimeout(() => setEndpointStatus(null), 4000);
  };

  const handleTestEndpoint = async () => {
    setTestingEndpoint(true);
    setTestResult(null);
    let clean = adultEndpoint.trim();
    if (clean.includes('apis.davidcyril.name.ng')) {
      clean = clean.replace(/apis\.davidcyril\.name\.ng/g, 'apis.davidcyriltech.my.id');
      setAdultEndpoint(clean);
    }
    await saveAdultEndpoint(clean);
    const res = await fetchAdultVideos();
    setTestingEndpoint(false);
    if (res.success) {
      setTestResult(`Success: Retrieved ${res.videos.length} videos from endpoint.`);
    } else {
      setTestResult(`Error: ${res.error || 'Failed to fetch'}`);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const data = await getAllRegisteredUsers();
    setUsers(data);
    setLoadingUsers(false);
  };

  const loadNotificationLogs = async () => {
    setLoadingLogs(true);
    const logs = await fetchNotifications(50);
    setNotifications(logs);
    setLoadingLogs(false);
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setPushStatus({ success: false, message: 'Please enter both title and message.' });
      return;
    }

    if (targetType === 'specific' && !targetEmail.trim()) {
      setPushStatus({ success: false, message: 'Please enter target user email.' });
      return;
    }

    setSending(true);
    setPushStatus(null);

    const result = await sendPushNotification({
      title,
      message,
      type: category,
      target: targetType,
      targetEmail: targetType === 'specific' ? targetEmail : undefined,
      linkUrl,
    });

    setSending(false);

    if (result.success) {
      setPushStatus({
        success: true,
        message: targetType === 'all'
          ? `Push Notification broadcasted successfully to all users!`
          : `Push Notification sent successfully to ${targetEmail}!`,
      });
      // Reset fields
      setTitle('');
      setMessage('');
      loadNotificationLogs();
    } else {
      setPushStatus({
        success: false,
        message: result.error || 'Failed to dispatch push notification.',
      });
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm('Delete this sent notification?')) {
      await deleteNotification(id);
      loadNotificationLogs();
    }
  };

  const handleSelectUserForPush = (userEmail: string) => {
    setTargetType('specific');
    setTargetEmail(userEmail);
    setActiveTab('push');
    setTitle(`Exclusive Update for BMW Member`);
    setMessage(`Hello! We have added special updates matching your preferences.`);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.referralCode || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'push_enabled') {
      return u.notificationsEnabled !== false;
    }
    if (filterType === 'vip') {
      return u.vipStatus && u.vipStatus !== 'free';
    }
    return true;
  });

  // Calculate statistics
  const totalUsers = users.length;
  const pushEnabledCount = users.filter((u) => u.notificationsEnabled !== false).length;
  const emailNotificationCount = users.filter((u) => u.emailNotificationsEnabled !== false).length;
  const vipCount = users.filter((u) => u.vipStatus && u.vipStatus !== 'free').length;

  // -------------------------------------------------------------
  // 1. PIN LOCK SCREEN IF NOT AUTHENTICATED
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#141416] border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden animate-fade-in">
          {/* Subtle backdrop glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#ff6b35]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-[#ff6b35]/15 border border-[#ff6b35]/30 flex items-center justify-center text-[#ff6b35] mx-auto mb-6 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-wider mb-2">
            BMW CINEMA ADMIN
          </h1>
          <p className="text-xs text-gray-400 mb-8 max-w-xs mx-auto">
            Restricted Management Console. Enter the 4-digit security passcode to access user accounts & push notifications.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  maxLength={10}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Enter Passcode..."
                  className="w-full pl-12 pr-4 py-3.5 bg-[#0d0d0d] border border-zinc-700 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] rounded-xl text-white text-center text-lg tracking-widest font-mono outline-none transition"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-xs font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#ff6b35]/20 cursor-pointer"
            >
              Unlock Admin Console
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs text-gray-500">
            <button
              onClick={onBackToHome}
              className="hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              ← Back to Cinema
            </button>
            <span className="font-mono">BMW-CINEMA-SECURE</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. UNLOCKED ADMIN COMMAND CENTER
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left">
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-red-600 flex items-center justify-center text-black font-black">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-wide">
                  BMW CINEMA ADMIN PANEL
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  AUTHENTICATED ADMIN
                </span>
              </div>
              <p className="text-xs text-gray-400">
                User Directory, Referral Stats & Real-time Push Notification Dispatcher
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadUsers();
              loadNotificationLogs();
            }}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white border border-zinc-700 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onBackToHome}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-200 font-semibold text-xs transition border border-zinc-700 cursor-pointer"
          >
            Go to Cinema
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-semibold text-xs border border-red-500/40 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-5 rounded-2xl bg-[#141416] border border-zinc-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-[#ff6b35]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalUsers}</div>
          <div className="text-[11px] text-gray-500 mt-1">Accounts registered in Firestore</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141416] border border-zinc-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Push Allowed</span>
            <BellRing className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{pushEnabledCount}</div>
          <div className="text-[11px] text-emerald-400/90 mt-1">
            {totalUsers > 0 ? Math.round((pushEnabledCount / totalUsers) * 100) : 100}% reachable by Web Push
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141416] border border-zinc-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Email Subscribers</span>
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{emailNotificationCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Users reachable via account emails</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141416] border border-zinc-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">VIP Members</span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{vipCount}</div>
          <div className="text-[11px] text-amber-400/90 mt-1">Silver, Gold & VIP Tier users</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#ff6b35] text-black shadow-md shadow-[#ff6b35]/20'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Users ({totalUsers})</span>
        </button>

        <button
          onClick={() => setActiveTab('push')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === 'push'
              ? 'bg-[#ff6b35] text-black shadow-md shadow-[#ff6b35]/20'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Dispatch Push Notification</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-[#ff6b35] text-black shadow-md shadow-[#ff6b35]/20'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>History & Logs ({notifications.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('endpoint');
            loadCustomAdultVideos();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === 'endpoint'
              ? 'bg-[#ff6b35] text-black shadow-md shadow-[#ff6b35]/20'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Adult Cinema Hub ({customAdultVideos.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: USERS DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user by email, name or referral code..."
                className="w-full pl-10 pr-4 py-2 bg-[#141416] border border-zinc-800 rounded-xl text-xs text-white placeholder-gray-500 focus:border-[#ff6b35] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800/60 text-gray-400 hover:text-white'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setFilterType('push_enabled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === 'push_enabled'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800/60 text-gray-400 hover:text-white'
                }`}
              >
                Push Enabled ({pushEnabledCount})
              </button>
              <button
                onClick={() => setFilterType('vip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === 'vip'
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-800/60 text-gray-400 hover:text-white'
                }`}
              >
                VIP ({vipCount})
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            {loadingUsers ? (
              <div className="py-16 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff6b35]" />
                <p className="text-xs">Loading registered users from Firestore...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-gray-400">No users found</p>
                <p className="text-xs text-gray-600 mt-1">Try another search term or register a new user in the auth page.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181b] text-gray-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Account Email</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4">Referral Info</th>
                      <th className="py-3 px-4">VIP Tier</th>
                      <th className="py-3 px-4">Notifications Allowed</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-zinc-800/30 transition">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs">
                              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-white">{user.displayName || 'BMW Member'}</div>
                              <div className="text-[10px] text-gray-500 font-mono">ID: {user.uid.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Mail className="w-3.5 h-3.5 text-[#ff6b35]" />
                            <span>{user.email}</span>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Referral */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[#ff6b35] font-semibold">{user.referralCode}</div>
                          <div className="text-[10px] text-gray-400">
                            {user.referralCount} invited • {user.referralPoints} pts
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.vipStatus === 'vip'
                                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                                : user.vipStatus === 'gold'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : user.vipStatus === 'silver'
                                ? 'bg-gray-300/20 text-gray-200 border border-gray-400/30'
                                : 'bg-zinc-800 text-gray-400'
                            }`}
                          >
                            {user.vipStatus || 'Free'}
                          </span>
                        </td>

                        {/* Notification Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Push Allowed</span>
                            </div>
                            <div className="text-[10px] text-blue-400/80">
                              Email Alerts: Active
                            </div>
                          </div>
                        </td>

                        {/* Action: Quick Push */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSelectUserForPush(user.email)}
                            className="px-3 py-1.5 rounded-lg bg-[#ff6b35]/20 hover:bg-[#ff6b35] text-[#ff6b35] hover:text-black font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Push Msg</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DISPATCH PUSH NOTIFICATION */}
      {/* ======================================================== */}
      {activeTab === 'push' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Push Form */}
          <div className="lg:col-span-7 bg-[#141416] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-[#ff6b35]/20 border border-[#ff6b35]/40 flex items-center justify-center text-[#ff6b35]">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create & Dispatch Notification</h3>
                <p className="text-xs text-gray-400">
                  Sends live alert to user devices and accounts registered on BMW Cinema.
                </p>
              </div>
            </div>

            {pushStatus && (
              <div
                className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-xs font-semibold ${
                  pushStatus.success
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}
              >
                {pushStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                )}
                <div>
                  <p>{pushStatus.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSendPush} className="space-y-5">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      targetType === 'all'
                        ? 'bg-[#ff6b35]/15 border-[#ff6b35] text-white'
                        : 'bg-[#0d0d0d] border-zinc-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#ff6b35]" />
                      <span>All Users (Broadcast)</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Send to all {totalUsers} registered members
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('specific')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      targetType === 'specific'
                        ? 'bg-[#ff6b35]/15 border-[#ff6b35] text-white'
                        : 'bg-[#0d0d0d] border-zinc-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#ff6b35]" />
                      <span>Specific User (By Email)</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Target user account email
                    </div>
                  </button>
                </div>
              </div>

              {/* Specific Email Input if selected */}
              {targetType === 'specific' && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Recipient User Email
                  </label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="e.g. sangabmw@gmail.com or select from users"
                    className="w-full px-4 py-2.5 bg-[#0d0d0d] border border-zinc-700 focus:border-[#ff6b35] rounded-xl text-xs text-white outline-none"
                    required
                  />
                  {users.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-500">Quick select:</span>
                      {users.slice(0, 3).map((u) => (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => setTargetEmail(u.email)}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-gray-300 font-mono"
                        >
                          {u.email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notification Category */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Notification Category
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'movie', label: 'Movie', icon: '🎬' },
                    { id: 'match', label: 'Match Kick', icon: '⚽' },
                    { id: 'reward', label: 'VIP Reward', icon: '🎁' },
                    { id: 'urgent', label: 'Urgent', icon: '⚡' },
                    { id: 'general', label: 'General', icon: '📢' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`py-2 px-2 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                        category === cat.id
                          ? 'bg-[#ff6b35] text-black border-[#ff6b35]'
                          : 'bg-[#0d0d0d] border-zinc-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div>{cat.icon}</div>
                      <div className="text-[10px] mt-0.5">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 🎬 New 4K Movie Added: Gladiator II"
                  className="w-full px-4 py-2.5 bg-[#0d0d0d] border border-zinc-700 focus:border-[#ff6b35] rounded-xl text-xs text-white outline-none"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write message to users... e.g. Watch the thrilling sequel in ultra HD now with fast direct downloads and multi-server streaming!"
                  className="w-full px-4 py-2.5 bg-[#0d0d0d] border border-zinc-700 focus:border-[#ff6b35] rounded-xl text-xs text-white outline-none resize-none"
                  required
                />
              </div>

              {/* Action Link */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Action Link URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="e.g. /movies.html or /football.html or /movie.html?id=550"
                  className="w-full px-4 py-2.5 bg-[#0d0d0d] border border-zinc-700 focus:border-[#ff6b35] rounded-xl text-xs text-white font-mono outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#ff6b35]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Pushing Notification...' : 'Push Notification Now'}</span>
              </button>
            </form>
          </div>

          {/* Real-time Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#141416] border border-zinc-800 rounded-3xl p-6 shadow-xl text-left">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#ff6b35]" />
                <span>Device Notification Preview</span>
              </h4>

              {/* iOS / Android Lock Screen Notification Card */}
              <div className="bg-[#000000]/90 border border-zinc-700 rounded-2xl p-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <div className="w-4 h-4 rounded bg-[#ff6b35] flex items-center justify-center text-black font-black text-[9px]">
                      B
                    </div>
                    <span>BMW CINEMA</span>
                  </div>
                  <span>now</span>
                </div>

                <div className="font-bold text-sm text-white mb-1">
                  {title || '🎬 Notification Title'}
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  {message || 'This is how your announcement or match alert will look to all users on mobile and desktop.'}
                </p>

                {linkUrl && (
                  <div className="text-[11px] text-[#ff6b35] font-semibold flex items-center gap-1">
                    <span>Tap to view {linkUrl}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Ringtone Sound Preview */}
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Volume2 className="w-4 h-4 text-[#ff6b35]" />
                    <span>Notification Ringtone Sound</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    Active MP3
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">
                  Custom high-fidelity notification ringtone played on user phones when receiving alerts.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playNotificationSound();
                      vibrateDevice([200, 100, 200]);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#ff6b35]" />
                    <span>Play Ringtone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateDevice([300, 150, 300]);
                      showPhoneNotification(title || '🎬 BMW CINEMA Alert', {
                        body: message || 'Test notification with custom ringtone.',
                      });
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#ff6b35]/20 hover:bg-[#ff6b35]/30 text-[#ff6b35] border border-[#ff6b35]/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Test Device Push</span>
                  </button>
                </div>
              </div>

              {/* In-app Toast Preview */}
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <h5 className="text-[11px] font-bold text-gray-400 mb-2">In-App Banner Notification Preview</h5>
                <div className="p-3 bg-zinc-800/60 border border-zinc-700 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#ff6b35]/20 text-[#ff6b35]">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{title || 'Preview Title'}</div>
                    <div className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                      {message || 'Message content...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: HISTORY & LOGS */}
      {/* ======================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#ff6b35]" />
              <span>Dispatched Notifications History</span>
            </h3>
            <button
              onClick={loadNotificationLogs}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-16 text-center text-gray-500 text-xs">
              Loading notification logs...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-xs">
              No notifications dispatched yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((item) => (
                <div key={item.id} className="p-4 hover:bg-zinc-800/30 transition flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-white">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-[#ff6b35]">
                        {item.type}
                      </span>
                      {item.target === 'specific' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400">
                          To: {item.targetEmail}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                          Broadcast (All)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 mb-2 leading-relaxed">{item.message}</p>

                    <div className="flex items-center gap-4 text-[10px] text-gray-500">
                      <span>Sent: {new Date(item.createdAt).toLocaleString()}</span>
                      {item.linkUrl && <span className="font-mono text-[#ff6b35]">Link: {item.linkUrl}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteLog(item.id)}
                    title="Delete log"
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ADULT VIDEO HUB & VIEW ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'endpoint' && (
        <div className="space-y-6">
          {shareNotice && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-semibold flex items-center gap-3 shadow-lg shadow-emerald-500/10 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <p>{shareNotice}</p>
                <p className="text-[10px] text-emerald-400/80 font-normal mt-0.5">
                  Link hii itamfungulia mtazamaji video hii kwenye BMW CINEMA moja kwa moja bila kufichua faili uliloweka.
                </p>
              </div>
            </div>
          )}

          {/* Header & Quick Stats */}
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#ff6b35]" />
                  <span>Adult Cinema Hub & View Analytics</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Upload custom videos with direct video links and thumbnails, monitor real-time views, and manage media feeds.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadCustomAdultVideos}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
                  title="Refresh video list and view counts"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomVideos ? 'animate-spin text-[#ff6b35]' : ''}`} />
                  <span>Refresh Views</span>
                </button>

                <a
                  href="adult.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6b35] hover:bg-[#ff8354] text-black text-xs font-bold transition shadow-md shadow-[#ff6b35]/20"
                >
                  <span>Open Adult Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#1c1c1f] border border-zinc-800/80">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Custom Videos</span>
                  <Video className="w-4 h-4 text-[#ff6b35]" />
                </div>
                <div className="text-2xl font-black text-white">{customAdultVideos.length}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Uploaded via link & thumbnail</div>
              </div>

              <div className="p-4 rounded-xl bg-[#1c1c1f] border border-zinc-800/80">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total Video Views</span>
                  <Eye className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {customAdultVideos
                    .reduce((acc, v) => acc + (typeof v.views === 'number' ? v.views : Number(v.views) || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400/90 mt-0.5">Recorded user views</div>
              </div>

              <div className="p-4 rounded-xl bg-[#1c1c1f] border border-zinc-800/80">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Stream Endpoint</span>
                  <Film className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-sm font-bold text-white truncate font-mono">
                  {adultEndpoint ? adultEndpoint : 'Default (/search/xnxx)'}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Automated video feed fallback</div>
              </div>
            </div>
          </div>

          {/* Form to Add New Adult Video */}
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#ff6b35]" />
                  <span>Upload Video (Video Link + Thumbnail)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Enter direct stream/download link and thumbnail URL. The video will be published with live views tracking.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddCustomVideo} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Video Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Exclusive HD Feature Movie"
                    className="w-full bg-[#1c1c1f] border border-zinc-700 focus:border-[#ff6b35] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500"
                    required
                  />
                </div>

                {/* Video Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Video Stream / Download Link (MP4 or Direct URL)
                  </label>
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://example.com/videos/exclusive_clip.mp4"
                    className="w-full bg-[#1c1c1f] border border-zinc-700 focus:border-[#ff6b35] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 font-mono"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Direct video URL (.mp4, .mkv, stream link). Users can stream and direct-download this file.
                  </p>
                </div>

                {/* Thumbnail Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Video Thumbnail Image URL
                  </label>
                  <input
                    type="url"
                    value={newThumbnail}
                    onChange={(e) => setNewThumbnail(e.target.value)}
                    placeholder="https://example.com/images/poster.jpg"
                    className="w-full bg-[#1c1c1f] border border-zinc-700 focus:border-[#ff6b35] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 font-mono"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Image preview URL (.jpg, .png, .webp).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="e.g. 12:45"
                      className="w-full bg-[#1c1c1f] border border-zinc-700 focus:border-[#ff6b35] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 font-mono"
                    />
                  </div>

                  {/* Quality */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Quality Tag
                    </label>
                    <select
                      value={newQuality}
                      onChange={(e) => setNewQuality(e.target.value)}
                      className="w-full bg-[#1c1c1f] border border-zinc-700 focus:border-[#ff6b35] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white"
                    >
                      <option value="1080p Full HD">1080p Full HD</option>
                      <option value="4K Ultra HD">4K Ultra HD</option>
                      <option value="720p HD">720p HD</option>
                      <option value="480p SD">480p SD</option>
                    </select>
                  </div>
                </div>

                {addStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${
                      addStatus.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border border-red-500/30 text-red-300'
                    }`}
                  >
                    {addStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{addStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={addingVideo}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff6b35]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingVideo ? 'Publishing Video...' : 'Publish Video to Adult Cinema'}</span>
                </button>
              </div>

              {/* Live Preview Card */}
              <div className="lg:col-span-4">
                <div className="border border-zinc-800 bg-[#0d0d0d] rounded-2xl p-4 space-y-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff6b35]" />
                    <span>Live Preview Card</span>
                  </span>

                  <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#141414]">
                    <div className="relative aspect-video w-full bg-[#1c1c1f] overflow-hidden flex items-center justify-center">
                      {newThumbnail ? (
                        <img
                          src={newThumbnail}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Film className="w-8 h-8 text-zinc-700" />
                      )}

                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#ff6b35] text-black flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </div>
                      </div>

                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-medium text-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#ff6b35]" />
                        {newDuration || '10:00'}
                      </span>

                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#ff6b35] text-[9px] font-extrabold text-black uppercase tracking-wider">
                        {newQuality || '1080p Full HD'}
                      </span>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="font-bold text-xs text-white truncate">
                        {newTitle || 'Video Title Preview'}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-[#ff6b35]" />
                          <span>0 views (New)</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#ff6b35]/20 text-[#ff6b35] font-bold uppercase text-[8px]">
                          Featured
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Section: Published Videos & View Analytics */}
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Published Videos & Views Tracker ({customAdultVideos.length})</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Real-time view count recorded each time a visitor plays the video on BMW CINEMA.
                </p>
              </div>

              <button
                type="button"
                onClick={loadCustomAdultVideos}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
            </div>

            {loadingCustomVideos ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                Loading videos and analytics...
              </div>
            ) : customAdultVideos.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs space-y-2">
                <Film className="w-8 h-8 text-zinc-700 mx-auto" />
                <div>No custom adult videos uploaded yet.</div>
                <div className="text-[11px] text-gray-600">
                  Use the form above to add a video using its direct link and thumbnail.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customAdultVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden group">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                          <Film className="w-8 h-8" />
                        </div>
                      )}

                      <div
                        onClick={() => setPreviewVideo(video)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#ff6b35] text-black flex items-center justify-center">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </div>
                      </div>

                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                        {video.duration || '10:00'}
                      </span>

                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#ff6b35] text-[9px] font-extrabold text-black uppercase">
                        {video.quality || '1080p'}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-white line-clamp-2" title={video.title}>
                          {video.title}
                        </h4>

                        {/* Views display badge */}
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold">
                            <Eye className="w-3.5 h-3.5" />
                            <span>
                              {typeof video.views === 'number'
                                ? video.views.toLocaleString()
                                : video.views || 0}{' '}
                              Views
                            </span>
                          </div>

                          <span className="text-[10px] text-gray-500 font-mono">
                            {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setPreviewVideo(video)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-[#ff6b35] hover:text-black text-gray-200 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>Test Stream</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareVideoDirect(video)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-[#ff6b35] hover:text-black text-gray-300 transition cursor-pointer"
                          title="Share BMW CINEMA player link (protects raw file URL)"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyVideoLink(video)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition cursor-pointer"
                          title="Copy BMW CINEMA viewer link (protects raw file URL)"
                        >
                          {copiedVideoId === video.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomVideo(video.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition cursor-pointer"
                          title="Delete video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Dynamic Stream API Endpoint Configuration */}
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-[#ff6b35]" />
                <span>Dynamic Stream API Endpoint (Optional Feed)</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Optional: Configure an external API endpoint to automatically populate additional videos alongside your custom videos.
              </p>
            </div>

            <form onSubmit={handleSaveEndpoint} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  API Endpoint (JSON Path or Full URL)
                </label>
                <input
                  type="text"
                  value={adultEndpoint}
                  onChange={(e) => setAdultEndpoint(e.target.value)}
                  placeholder="e.g. /search/xnxx or https://apis.davidcyriltech.my.id/search/xnxx"
                  className="w-full bg-[#1c1c1f] border border-zinc-700 focus:border-[#ff6b35] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 font-mono transition-colors"
                />
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-[11px] text-gray-500">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => setAdultEndpoint('/search/xnxx')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-[#ff6b35] border border-zinc-700 cursor-pointer transition"
                  >
                    /search/xnxx
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdultEndpoint('https://apis.davidcyriltech.my.id/search/xnxx')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-gray-300 border border-zinc-700 cursor-pointer transition"
                  >
                    https://apis.davidcyriltech.my.id/search/xnxx
                  </button>
                </div>
              </div>

              {endpointStatus && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{endpointStatus}</span>
                </div>
              )}

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 animate-fade-in ${
                    testResult.startsWith('Success')
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  <span>{testResult}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingEndpoint}
                  className="px-5 py-2.5 rounded-xl bg-[#ff6b35] hover:bg-[#ff8354] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#ff6b35]/20 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingEndpoint ? 'Saving...' : 'Save Endpoint'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestEndpoint}
                  disabled={testingEndpoint || !adultEndpoint.trim()}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-gray-200 hover:text-white font-semibold text-xs border border-zinc-700 transition cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingEndpoint ? 'animate-spin text-[#ff6b35]' : ''}`} />
                  <span>{testingEndpoint ? 'Testing Connection...' : 'Test Endpoint'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Test Player Modal for Admin */}
          {previewVideo && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4">
                <div className="flex items-center justify-between p-4 border-b border-[#242424]">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#ff6b35]" />
                    <h3 className="text-sm font-bold text-white truncate max-w-md">
                      {previewVideo.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setPreviewVideo(null)}
                    className="p-1.5 rounded-lg bg-[#222] hover:bg-[#333] text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-4">
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                    <video
                      src={previewVideo.downloadUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between p-4 bg-[#111] border-t border-[#222] gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold">
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {typeof previewVideo.views === 'number'
                          ? previewVideo.views.toLocaleString()
                          : previewVideo.views || 0}{' '}
                        Views Recorded
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {previewVideo.quality || '1080p Full HD'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyVideoLink(previewVideo)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
                      title="Copy protected video player link (never reveals uploaded file URL)"
                    >
                      {copiedVideoId === previewVideo.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Viewer Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareVideoDirect(previewVideo)}
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-[#ff6b35] hover:text-black text-gray-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
                      title="Share video link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={`/?page=adult&v=${encodeURIComponent(previewVideo.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ff6b35] hover:bg-[#ff8354] text-black text-xs font-bold transition cursor-pointer shadow-md shadow-[#ff6b35]/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Watch in Adult Cinema</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
