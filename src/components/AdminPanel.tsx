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
  const [activeTab, setActiveTab] = useState<'users' | 'push' | 'logs'>('users');

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

  // Load registered users and notification history once unlocked
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
      loadNotificationLogs();
    }
  }, [isAuthenticated]);

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
    </div>
  );
};
